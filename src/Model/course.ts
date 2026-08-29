export interface Course {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export interface CourseWithExamCount extends Course {
  examCount: number;
}

export interface CourseInput {
  code: string;
  name: string;
  description?: string | null;
}