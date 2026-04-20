-- Создание таблицы тегов
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Создание таблицы связи между постами и тегами (many-to-many)
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Индекс для быстрого поиска постов по тегам
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);

-- Вставка предустановленных тегов
INSERT INTO tags (name) VALUES 
  ('ИТ'),
  ('Технологии'),
  ('Веб-разработка'),
  ('Мобильное'),
  ('Базы данных'),
  ('DevOps'),
  ('Дизайн'),
  ('Маркетинг'),
  ('Бизнес'),
  ('Другое')
ON CONFLICT DO NOTHING;
