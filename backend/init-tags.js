require('dotenv').config();
const pool = require('./data/db');

const initTags = async () => {
  try {
    console.log('Создание таблицы tags...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Таблица tags создана');

    console.log('Создание таблицы post_tags...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
    `);
    console.log('✅ Таблица post_tags создана');

    console.log('Создание индексов...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);`);
    console.log('✅ Индексы созданы');

    console.log('Добавление предустановленных тегов...');
    await pool.query(`
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
    `);
    console.log('✅ Теги добавлены');

    console.log('\n✨ Инициализация завершена успешно!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  }
};

initTags();
