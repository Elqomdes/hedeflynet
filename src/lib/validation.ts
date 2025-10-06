import { z } from 'zod';

export const ClassCreateSchema = z.object({
  name: z.string().trim().min(1, 'Sınıf adı gereklidir').max(100, 'Sınıf adı 100 karakterden uzun olamaz'),
  description: z.string().trim().max(500, 'Açıklama 500 karakterden uzun olamaz').optional().or(z.literal('').transform(() => undefined)),
  coTeacherIds: z.array(z.string()).max(3, 'Maksimum 3 yardımcı öğretmen seçebilirsiniz').optional(),
  studentIds: z.array(z.string()).optional(),
});

export const StudentCreateSchema = z.object({
  username: z.string().trim().min(3).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).optional(),
});

export const AssignmentAllowLateSchema = z.object({
  policy: z.enum(['no', 'untilClose', 'always']),
  penaltyPercent: z.number().min(0).max(100).optional(),
}).strict();

export const AssignmentCreateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  type: z.enum(['class', 'individual']),
  classId: z.string().optional(),
  studentId: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  dueDate: z.union([z.string(), z.date()]),
  maxGrade: z.number().min(1).max(100).optional(),
  publishAt: z.union([z.string(), z.date()]).optional(),
  closeAt: z.union([z.string(), z.date()]).optional(),
  allowLate: AssignmentAllowLateSchema.optional(),
  maxAttempts: z.number().min(1).optional(),
  tags: z.array(z.string()).optional(),
  rubricId: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.type === 'class' && !val.classId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Sınıf ödevi için sınıf seçilmelidir', path: ['classId'] });
  }
  if (val.type === 'individual' && !val.studentId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bireysel ödev için öğrenci seçilmelidir', path: ['studentId'] });
  }
});


