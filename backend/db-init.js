const pool = require('./data/db');

const initializeDatabase = async () => {
  try {
    console.log('🔄 Инициализация БД...');

    // Создание таблицы тегов
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  ✅ Таблица tags готова');

    // Создание связывающей таблицы
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
    `);
    console.log('  ✅ Таблица post_tags готова');

    // Создание индексов для быстрого поиска
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);`);
    console.log('  ✅ Индексы созданы');

    // Вставка предустановленных тегов
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
    console.log('  ✅ Теги инициализированы');

    // Создание таблицы для отслеживания устройств
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        device_name VARCHAR(255),
        browser VARCHAR(100),
        os VARCHAR(100),
        ip_address VARCHAR(45),
        last_seen TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  ✅ Таблица devices готова');

    // Индекс для быстрого поиска устройств по пользователю
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_devices_user_email ON devices(user_email);`);
    console.log('  ✅ Индекс для devices создан');

    // Создание таблицы для комментариев
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    console.log('  ✅ Таблица comments готова');

    // Индексы для комментариев
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comments_author_email ON comments(author_email);`);
    console.log('  ✅ Индексы для comments созданы');

    // Создание таблицы для реакций
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        reaction_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(post_id, user_email, reaction_type)
      );
    `);
    console.log('  ✅ Таблица reactions готова');

    // Индексы для реакций
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reactions_user_email ON reactions(user_email);`);
    console.log('  ✅ Индексы для reactions созданы');

    console.log('✨ БД готова к использованию\n');
  } catch (err) {
    console.error('❌ Ошибка инициализации БД:', err.message);
    throw err;
  }
};

module.exports = initializeDatabase;
