export interface Exam {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
}

export interface ExamCourseSummary {
  id: number;
  code: string;
  name: string;
}

export interface ExamListItem {
  id: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  course: ExamCourseSummary;
  questionCount: number;
  attemptCount: number;
  isLocked: boolean;
}

export interface ExamInput {
  courseId: number;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
}
