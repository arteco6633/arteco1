-- Расширяем список допустимых статусов для таблицы orders,
-- чтобы поддержать канбан CRM: new, processing, pending, delivered, completed, cancelled,
-- а также совместимость со старыми значениями paid/shipped.

DO $$
BEGIN
  -- Удаляем старое ограничение, если оно существует
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_status_check' AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
  END IF;

  -- Добавляем новое ограничение с расширенным списком значений
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN (
      'new',         -- Новая заявка
      'processing',  -- В работе
      'pending',     -- Ожидает (например, оплаты/подтверждения)
      'delivered',   -- Доставлен
      'completed',   -- Завершен
      'cancelled',   -- Отменен
      -- Нижние два — для обратной совместимости, если уже встречались
      'paid',        -- Оплачен
      'shipped'      -- Отправлен
    ));
END $$;


