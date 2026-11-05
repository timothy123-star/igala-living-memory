import { z } from "zod";

export const CreateEducationalContentSchema = z.strictObject({
  prompt: z.string().trim().min(1).max(2_000)
});

export type CreateEducationalContentInput = z.infer<
  typeof CreateEducationalContentSchema
>;

export const GeneratedLessonSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  learningObjectives: z.array(z.string().trim().min(1).max(300)).min(1).max(5),
  explanation: z.string().trim().min(1).max(4_000),
  proverbActivities: z.array(z.strictObject({
    igala: z.string().trim().min(1),
    interpretation: z.string().trim().min(1),
    activity: z.string().trim().min(1).max(1_000)
  })).min(1).max(5),
  vocabularyExercises: z.array(z.strictObject({
    term: z.string().trim().min(1),
    prompt: z.string().trim().min(1),
    answer: z.string().trim().min(1)
  })).max(5),
  comprehensionQuestions: z.array(z.strictObject({
    question: z.string().trim().min(1),
    answer: z.string().trim().min(1)
  })).min(1).max(5),
  quizQuestions: z.array(z.strictObject({
    question: z.string().trim().min(1),
    answer: z.string().trim().min(1)
  })).min(1).max(5),
  evidenceStatement: z.string().trim().min(1).max(500)
});

export type GeneratedLesson = z.infer<typeof GeneratedLessonSchema>;
