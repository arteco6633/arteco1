-- Добавление поля video_url в таблицу promo_blocks
-- Выполните этот SQL в Supabase SQL Editor

-- Проверяем, существует ли уже поле video_url
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'promo_blocks' 
        AND column_name = 'video_url'
    ) THEN
        -- Добавляем поле video_url
        ALTER TABLE promo_blocks 
        ADD COLUMN video_url TEXT;
        
        RAISE NOTICE 'Поле video_url успешно добавлено в таблицу promo_blocks';
    ELSE
        RAISE NOTICE 'Поле video_url уже существует в таблице promo_blocks';
    END IF;
END $$;

-- Добавляем комментарий к полю
COMMENT ON COLUMN promo_blocks.video_url IS 'URL видео для промо-баннера (опционально). Если указано, видео будет автоматически воспроизводиться вместо изображения.';




