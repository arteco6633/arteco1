-- Создание таблицы для заявок на обратный звонок
-- Выполните этот SQL в Supabase SQL Editor

-- Создаем таблицу callback_requests
CREATE TABLE IF NOT EXISTS callback_requests (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  comment TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  notes TEXT
);

-- Создаем индекс для быстрого поиска по статусу и дате
CREATE INDEX IF NOT EXISTS idx_callback_requests_status ON callback_requests(status);
CREATE INDEX IF NOT EXISTS idx_callback_requests_created_at ON callback_requests(created_at DESC);

-- Добавляем комментарии к таблице и полям
COMMENT ON TABLE callback_requests IS 'Заявки на обратный звонок от пользователей сайта';
COMMENT ON COLUMN callback_requests.name IS 'Имя клиента';
COMMENT ON COLUMN callback_requests.phone IS 'Телефон для связи';
COMMENT ON COLUMN callback_requests.comment IS 'Комментарий или дополнительные пожелания клиента';
COMMENT ON COLUMN callback_requests.status IS 'Статус заявки: new (новая), contacted (связались), completed (завершена), cancelled (отменена)';
COMMENT ON COLUMN callback_requests.created_at IS 'Дата и время создания заявки';
COMMENT ON COLUMN callback_requests.updated_at IS 'Дата и время последнего обновления';
COMMENT ON COLUMN callback_requests.contacted_at IS 'Дата и время первого контакта с клиентом';
COMMENT ON COLUMN callback_requests.notes IS 'Заметки менеджера о работе с заявкой';

-- Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_callback_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_callback_requests_updated_at ON callback_requests;
CREATE TRIGGER trigger_update_callback_requests_updated_at
  BEFORE UPDATE ON callback_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_callback_requests_updated_at();



