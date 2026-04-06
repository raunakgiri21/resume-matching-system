/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AiService } from '../ai/ai.service';
import { PlacementsService } from '../placements/placements.service';
import axios from 'axios';
const pdfParse = require('pdf-parse');

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private supabase: SupabaseService,
    private aiService: AiService,
    private placementsService: PlacementsService,
  ) {}

  async matchOne(registrationId: string) {
    const registration = await this.getRegistrationOrFail(registrationId);
    if (registration.status === 'matched')
      return { message: 'Already matched' };
    await this.processRegistration(registration);
    await this.recomputeRanks(registration.placement_id);
    return { message: 'Matching complete' };
  }

  async matchAll(placementId: string) {
    await this.placementsService.findOneOrFail(placementId);
    const { data: registrations, error } = await this.supabase.db
      .from('registrations')
      .select(
        'id, placement_id, student_id, status, users(id, name, resume_url), placements(id, company_name, role_title, job_description, required_skills)',
      )
      .eq('placement_id', placementId)
      .eq('status', 'registered');
    if (error) throw new BadRequestException(error.message);
    if (!registrations?.length)
      return { message: 'No pending registrations', processed: 0 };

    let processed = 0;
    for (const reg of registrations) {
      try {
        await this.processRegistration(reg);
        processed++;
      } catch (err) {
        this.logger.error(`Failed ${reg.id}: ${err.message}`);
      }
    }
    await this.recomputeRanks(placementId);
    return {
      message: 'Matching complete',
      processed,
      total: registrations.length,
    };
  }

  async getRankedResults(placementId: string) {
    const { data, error } = await this.supabase.db
      .from('match_results')
      .select(
        'id, score, rank, matching_skills, missing_skills, strengths, admin_summary, processed_at, registrations(id, users(id, name, email, branch, graduation_year, resume_url))',
      )
      .eq('placement_id', placementId)
      .order('rank', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getStudentResult(placementId: string, studentId: string) {
    const { data: registration } = await this.supabase.db
      .from('registrations')
      .select('id, placements(company_name, role_title)')
      .eq('placement_id', placementId)
      .eq('student_id', studentId)
      .single();
    if (!registration)
      throw new NotFoundException('Not registered for this placement');

    const { data, error } = await this.supabase.db
      .from('match_results')
      .select(
        'score, rank, matching_skills, missing_skills, strengths, feedback, processed_at',
      )
      .eq('registration_id', registration.id)
      .single();
    if (error || !data)
      throw new NotFoundException(
        'Results not yet generated. Check back soon.',
      );

    const { count } = await this.supabase.db
      .from('match_results')
      .select('id', { count: 'exact', head: true })
      .eq('placement_id', placementId);

    return {
      ...data,
      company_name: registration.placements?.[0]?.company_name,
      role_title: registration.placements?.[0]?.role_title,
      total_matched: count,
    };
  }

  private async processRegistration(registration: any) {
    const user = registration.users;
    const placement = registration.placements;
    if (!user?.resume_url)
      throw new BadRequestException(`No resume for ${user?.name}`);

    const resumeText = await this.extractTextFromUrl(user.resume_url);
    const result = await this.aiService.matchResumeToJD(
      resumeText,
      placement.job_description,
      placement.company_name,
      placement.role_title,
      placement.required_skills,
    );

    const { error } = await this.supabase.db.from('match_results').upsert(
      {
        registration_id: registration.id,
        placement_id: registration.placement_id,
        student_id: registration.student_id,
        score: result.score,
        matching_skills: result.matching_skills,
        missing_skills: result.missing_skills,
        strengths: result.strengths,
        feedback: result.feedback,
        admin_summary: result.admin_summary,
        processed_at: new Date().toISOString(),
      },
      { onConflict: 'registration_id' },
    );

    if (error) throw new BadRequestException(error.message);
    await this.supabase.db
      .from('registrations')
      .update({ status: 'matched' })
      .eq('id', registration.id);
    this.logger.log(`Matched: ${user.name} → score ${result.score}`);
  }

  private async recomputeRanks(placementId: string) {
    const { data: results } = await this.supabase.db
      .from('match_results')
      .select('id, score')
      .eq('placement_id', placementId)
      .order('score', { ascending: false });
    if (!results?.length) return;
    for (let i = 0; i < results.length; i++) {
      await this.supabase.db
        .from('match_results')
        .update({ rank: i + 1 })
        .eq('id', results[i].id);
    }
  }

  private async extractTextFromUrl(url: string): Promise<string> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const parsed = await pdfParse(buffer);

    const text = parsed.text?.trim();
    if (!text) throw new BadRequestException('Could not extract text from PDF');

    return text;
  }

  private async getRegistrationOrFail(registrationId: string) {
    const { data, error } = await this.supabase.db
      .from('registrations')
      .select(
        'id, placement_id, student_id, status, users(id, name, resume_url), placements(id, company_name, role_title, job_description, required_skills), match_results(score, rank, feedback)',
      )
      .eq('id', registrationId)
      .single();
    if (error || !data) throw new NotFoundException('Registration not found');
    return data;
  }
}
