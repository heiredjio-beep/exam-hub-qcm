CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_unique UNIQUE(email),
  CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'STUDENT'))
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  CONSTRAINT courses_code_unique UNIQUE(code)
);

CREATE TABLE exams (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT exams_course_fk FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
  CONSTRAINT exams_window_check CHECK (ends_at > starts_at)
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL,
  statement TEXT NOT NULL,
  points INTEGER NOT NULL,
  position INTEGER NOT NULL,
  CONSTRAINT questions_exam_fk FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  CONSTRAINT questions_points_check CHECK (points > 0)
);

CREATE TABLE choices (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT choices_question_fk FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX one_correct_choice_per_question
  ON choices (question_id)
  WHERE is_correct = TRUE;

CREATE TABLE attempts (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  score INTEGER,
  max_score INTEGER,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT attempts_unique_per_student UNIQUE(exam_id, student_id),
  CONSTRAINT attempts_exam_fk FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE RESTRICT,
  CONSTRAINT attempts_student_fk FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  choice_id INTEGER,
  CONSTRAINT answers_unique_per_question UNIQUE(attempt_id, question_id),
  CONSTRAINT answers_attempt_fk FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  CONSTRAINT answers_question_fk FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  CONSTRAINT answers_choice_fk FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE SET NULL
);

CREATE INDEX idx_exams_course_id ON exams(course_id);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_choices_question_id ON choices(question_id);
CREATE INDEX idx_attempts_student_id ON attempts(student_id);