/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface MatchResult {
  score: number;
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  feedback: string;
  admin_summary: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  constructor(private config: ConfigService) {}

  async matchResumeToJD(
    resumeText: string,
    jobDescription: string,
    companyName: string,
    roleTitle: string,
    requiredSkills?: string,
  ): Promise<MatchResult> {
    const prompt = this.buildPrompt(
      resumeText,
      jobDescription,
      companyName,
      roleTitle,
      requiredSkills,
    );
    try {
      return await this.callGemini(prompt);
    } catch (err) {
      this.logger.warn(`Gemini failed: ${err.message}. Trying Groq...`);
      try {
        return await this.callGroq(prompt);
      } catch (fallbackErr) {
        throw new ServiceUnavailableException(
          'AI service unavailable. Try again later.',
        );
      }
    }
  }

  private async callGemini(prompt: string): Promise<MatchResult> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const model = this.config.get<string>(
      'GEMINI_MODEL',
      'gemini-2.0-flash-lite',
    );
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    });
    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('Empty response from Gemini');
    return this.parseAIResponse(raw);
  }

  private async callGroq(prompt: string): Promise<MatchResult> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      },
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    const raw = response.data?.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty response from Groq');
    return this.parseAIResponse(raw);
  }

  private buildPrompt(
    resumeText: string,
    jobDescription: string,
    companyName: string,
    roleTitle: string,
    requiredSkills?: string,
  ): string {
    return `
You are an expert technical recruiter. Analyze the resume against the job description and return ONLY valid JSON — no markdown, no explanation.

COMPANY: ${companyName}
ROLE: ${roleTitle}
${requiredSkills ? `REQUIRED SKILLS: ${requiredSkills}` : ''}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Return this exact JSON:
{
  "score": <integer 0-100>,
  "matching_skills": [<skills candidate has that match>],
  "missing_skills": [<important skills candidate lacks>],
  "strengths": [<2-3 strongest points for this role>],
  "feedback": "<2-3 sentence personalised feedback for student, encouraging tone>",
  "admin_summary": "<one sentence summary for recruiter>"
}

Scoring: 85-100 excellent, 70-84 good, 50-69 partial, 0-49 poor fit. Only return the JSON.`.trim();
  }

  private parseAIResponse(raw: string): MatchResult {
    const cleaned = raw
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .trim();
    try {
      const parsed = JSON.parse(cleaned);
      return {
        score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
        matching_skills: Array.isArray(parsed.matching_skills)
          ? parsed.matching_skills
          : [],
        missing_skills: Array.isArray(parsed.missing_skills)
          ? parsed.missing_skills
          : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        feedback: parsed.feedback || '',
        admin_summary: parsed.admin_summary || '',
      };
    } catch {
      this.logger.error('Failed to parse AI response:', raw);
      throw new Error('AI returned invalid JSON');
    }
  }
}
