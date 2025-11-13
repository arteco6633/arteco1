-- Таблица для логов платежей
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider TEXT NOT NULL, -- 'tbank', 'yandex_pay', etc.
  event TEXT NOT NULL, -- 'CONFIRMED', 'REJECTED', 'CANCELED', etc.
  order_id TEXT, -- ID заказа
  payment_id TEXT, -- ID платежа от провайдера
  payload JSONB -- Полный payload от провайдера
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_payment_logs_provider ON public.payment_logs(provider);
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON public.payment_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event ON public.payment_logs(event);

-- RLS политики
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Разрешаем чтение и запись для анонимных пользователей (для API)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payment_logs' 
    AND policyname = 'Allow all for anon'
  ) THEN
    CREATE POLICY "Allow all for anon" ON public.payment_logs
      FOR ALL TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Комментарии
COMMENT ON TABLE public.payment_logs IS 'Логи платежей от различных провайдеров';
COMMENT ON COLUMN public.payment_logs.provider IS 'Провайдер платежей (tbank, yandex_pay, etc.)';
COMMENT ON COLUMN public.payment_logs.event IS 'Тип события (CONFIRMED, REJECTED, CANCELED, etc.)';
COMMENT ON COLUMN public.payment_logs.payload IS 'Полный payload от провайдера в формате JSONB';

