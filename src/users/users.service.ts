/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabase.db
      .from('users')
      .select(
        'id, name, email, role, phone, branch, graduation_year, skills, linkedin_url, resume_url, resume_filename, created_at',
      )
      .eq('id', userId)
      .single();
    if (error || !data) throw new NotFoundException('User not found');
    return data;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { data, error } = await this.supabase.db
      .from('users')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select(
        'id, name, email, role, phone, branch, graduation_year, skills, linkedin_url',
      )
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async uploadResume(userId: string, file: Express.Multer.File) {
    const fileName = `${userId}-${Date.now()}.pdf`;
    const filePath = `resumes/${fileName}`;

    const { error: uploadError } = await this.supabase.db.storage
      .from('resumes')
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (uploadError) throw new BadRequestException(uploadError.message);

    const { data: urlData } = this.supabase.db.storage
      .from('resumes')
      .getPublicUrl(filePath);

    const { data, error } = await this.supabase.db
      .from('users')
      .update({
        resume_url: urlData.publicUrl,
        resume_filename: file.originalname,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, name, resume_url, resume_filename')
      .single();
    if (error) throw new BadRequestException(error.message);
    return { message: 'Resume uploaded successfully', data };
  }

  async deleteResume(userId: string) {
    const { data: user } = await this.supabase.db
      .from('users')
      .select('resume_url')
      .eq('id', userId)
      .single();
    if (!user?.resume_url) throw new NotFoundException('No resume found');

    const url = new URL(user.resume_url);
    const filePath = url.pathname.split('/resumes/')[1];
    await this.supabase.db.storage
      .from('resumes')
      .remove([`resumes/${filePath}`]);
    await this.supabase.db
      .from('users')
      .update({ resume_url: null, resume_filename: null })
      .eq('id', userId);
    return { message: 'Resume deleted successfully' };
  }

  async getAllStudents() {
    const { data, error } = await this.supabase.db
      .from('users')
      .select(
        'id, name, email, branch, graduation_year, skills, resume_url, created_at',
      )
      .eq('role', 'student')
      .order('name');
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
