-- Создание структуры для квиза "Kitchen Matchmaker"
-- Выполните этот SQL в Supabase SQL Editor

-- Таблица для квизов
CREATE TABLE IF NOT EXISTS kitchen_quizzes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'Kitchen Matchmaker',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица для вопросов квиза
CREATE TABLE IF NOT EXISTS kitchen_quiz_steps (
  id BIGSERIAL PRIMARY KEY,
  quiz_id BIGINT REFERENCES kitchen_quizzes(id) ON DELETE CASCADE DEFAULT 1,
  step_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('choice', 'input', 'textarea')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, step_number)
);

-- Таблица для вариантов ответов (для вопросов типа choice)
CREATE TABLE IF NOT EXISTS kitchen_quiz_options (
  id BIGSERIAL PRIMARY KEY,
  step_id BIGINT REFERENCES kitchen_quiz_steps(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  image_url TEXT,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица для заявок из квиза
CREATE TABLE IF NOT EXISTS kitchen_quiz_submissions (
  id BIGSERIAL PRIMARY KEY,
  quiz_id BIGINT REFERENCES kitchen_quizzes(id) DEFAULT 1,
  answers JSONB NOT NULL, -- Все ответы пользователя
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  city VARCHAR(255),
  comment TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_kitchen_quiz_steps_quiz_id ON kitchen_quiz_steps(quiz_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_quiz_steps_step_number ON kitchen_quiz_steps(quiz_id, step_number);
CREATE INDEX IF NOT EXISTS idx_kitchen_quiz_options_step_id ON kitchen_quiz_options(step_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_quiz_submissions_status ON kitchen_quiz_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_quiz_submissions_created_at ON kitchen_quiz_submissions(created_at DESC);

-- Создаем дефолтный квиз
INSERT INTO kitchen_quizzes (id, name, is_active) 
VALUES (1, 'Kitchen Matchmaker', true)
ON CONFLICT DO NOTHING;

-- Создаем триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_kitchen_quiz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kitchen_quiz_updated_at
  BEFORE UPDATE ON kitchen_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_kitchen_quiz_updated_at();

CREATE TRIGGER trigger_update_kitchen_quiz_steps_updated_at
  BEFORE UPDATE ON kitchen_quiz_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_kitchen_quiz_updated_at();

CREATE TRIGGER trigger_update_kitchen_quiz_options_updated_at
  BEFORE UPDATE ON kitchen_quiz_options
  FOR EACH ROW
  EXECUTE FUNCTION update_kitchen_quiz_updated_at();

CREATE TRIGGER trigger_update_kitchen_quiz_submissions_updated_at
  BEFORE UPDATE ON kitchen_quiz_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_kitchen_quiz_updated_at();

-- Комментарии к таблицам
COMMENT ON TABLE kitchen_quizzes IS 'Квизы для подбора кухни';
COMMENT ON TABLE kitchen_quiz_steps IS 'Шаги/вопросы квиза';
COMMENT ON TABLE kitchen_quiz_options IS 'Варианты ответов для вопросов квиза';
COMMENT ON TABLE kitchen_quiz_submissions IS 'Заявки пользователей из квиза';

