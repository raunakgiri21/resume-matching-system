/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePlacementDto, UpdatePlacementDto } from './placements.dto';

@Injectable()
export class PlacementsService {
  constructor(private supabase: SupabaseService) {}

  async create(adminId: string, dto: CreatePlacementDto) {
    const { data, error } = await this.supabase.db
      .from('placements')
      .insert({ ...dto, created_by: adminId, status: 'open' })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async update(placementId: string, adminId: string, dto: UpdatePlacementDto) {
    const placement = await this.findOneOrFail(placementId);
    if (placement.created_by !== adminId)
      throw new ForbiddenException('You did not create this placement');
    const { data, error } = await this.supabase.db
      .from('placements')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', placementId)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async remove(placementId: string, adminId: string) {
    const placement = await this.findOneOrFail(placementId);
    if (placement.created_by !== adminId)
      throw new ForbiddenException('You did not create this placement');
    await this.supabase.db.from('placements').delete().eq('id', placementId);
    return { message: 'Placement deleted successfully' };
  }

  async findAll() {
    const { data, error } = await this.supabase.db
      .from('placements')
      .select(
        'id, company_name, role_title, ctc_lpa, location, required_skills, eligibility_criteria, last_date, status, created_at',
      )
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findOne(placementId: string) {
    return this.findOneOrFail(placementId);
  }

  async registerStudent(placementId: string, studentId: string) {
    const placement = await this.findOneOrFail(placementId);
    if (placement.status !== 'open')
      throw new BadRequestException('This placement is closed');

    const { data: existing } = await this.supabase.db
      .from('registrations')
      .select('id')
      .eq('placement_id', placementId)
      .eq('student_id', studentId)
      .single();
    if (existing) throw new BadRequestException('Already registered');

    const { data: student } = await this.supabase.db
      .from('users')
      .select('resume_url')
      .eq('id', studentId)
      .single();
    if (!student?.resume_url)
      throw new BadRequestException('Upload your resume before registering');

    const { data, error } = await this.supabase.db
      .from('registrations')
      .insert({
        placement_id: placementId,
        student_id: studentId,
        status: 'registered',
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return { message: 'Registered successfully', data };
  }

  async getStudentRegistrations(studentId: string) {
    const { data, error } = await this.supabase.db
      .from('registrations')
      .select(
        'id, status, registered_at, placements(id, company_name, role_title, ctc_lpa, location, status), match_results(score, rank, matching_skills, missing_skills, feedback, processed_at)',
      )
      .eq('student_id', studentId)
      .order('registered_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getPlacementRegistrations(placementId: string) {
    const { data, error } = await this.supabase.db
      .from('registrations')
      .select(
        'id, status, registered_at, users(id, name, email, branch, graduation_year), match_results(score, rank, matching_skills, missing_skills, feedback, processed_at)',
      )
      .eq('placement_id', placementId)
      .order('registered_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findOneOrFail(placementId: string) {
    const { data, error } = await this.supabase.db
      .from('placements')
      .select('*')
      .eq('id', placementId)
      .single();
    if (error || !data) throw new NotFoundException('Placement not found');
    return data;
  }
}
