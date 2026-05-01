import { z } from 'zod';

// Loosely-structured resume JSON. The resume parser (07-resume-parser) is the
// upstream producer; this is the contract the editor reads/writes.

export const ResumeContactSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(40).optional(),
  zipCode: z.string().regex(/^\d{5}$/).optional(),
});

export const ResumeExperienceSchema = z.object({
  title: z.string().min(1).max(200),
  employer: z.string().min(1).max(200),
  city: z.string().max(80).optional(),
  startDate: z.string().optional(), // YYYY-MM
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  bullets: z.array(z.string().min(1).max(500)).max(20).default([]),
});

export const ResumeEducationSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.string().max(120).optional(),
  field: z.string().max(120).optional(),
  year: z.string().max(8).optional(),
});

export const CertificationSchema = z.object({
  certId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  issuer: z.string().max(200).optional(),
  issuedAt: z.string().optional(), // YYYY-MM-DD
  expiresAt: z.string().optional(),
});
export const CertificationsArraySchema = z.array(CertificationSchema);

export const ResumeLanguageSchema = z.object({
  name: z.string().min(1).max(60),
  level: z.enum(['basic', 'conversational', 'fluent', 'native']).optional(),
});

export const ResumeSchema = z.object({
  contact: ResumeContactSchema.optional(),
  experience: z.array(ResumeExperienceSchema).max(40).default([]),
  education: z.array(ResumeEducationSchema).max(20).default([]),
  certifications: CertificationsArraySchema.default([]),
  languages: z.array(ResumeLanguageSchema).max(10).default([]),
  skills: z.array(z.string().min(1).max(60)).max(40).default([]),
});

export type Resume = z.infer<typeof ResumeSchema>;
export type ResumeExperience = z.infer<typeof ResumeExperienceSchema>;
export type ResumeEducation = z.infer<typeof ResumeEducationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type ResumeLanguage = z.infer<typeof ResumeLanguageSchema>;
