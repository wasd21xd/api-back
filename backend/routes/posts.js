const express = require('express');
const router = express.Router();
const pool = require('../data/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);


const mapPost = (row, tags = []) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  authorEmail: row.author_email,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
  tags: tags,
});

router.get('/', async (req, res) => {
  try {
    const { tags, sortBy = 'newest' } = req.query;
    let query = 'SELECT DISTINCT p.* FROM posts p';
    let values = [];
    let whereConditions = ['p.deleted_at IS NULL'];

    // Если есть фильтр по тегам
    if (tags) {
      const tagNames = Array.isArray(tags) ? tags : [tags];
      query += ` LEFT JOIN post_tags pt ON p.id = pt.post_id LEFT JOIN tags t ON pt.tag_id = t.id`;
      whereConditions.push(`t.name = ANY($${values.length + 1}::text[])`);
      values.push(tagNames);
    }

    query += ' WHERE ' + whereConditions.join(' AND ');

    // Сортировка
    switch(sortBy) {
      case 'oldest':
        query += ' ORDER BY p.created_at ASC';
        break;
      case 'updated':
        query += ' ORDER BY p.updated_at DESC';
        break;
      default: // newest
        query += ' ORDER BY p.created_at DESC';
    }

    const { rows } = await pool.query(query, values);
    
    // Получаем теги для каждого поста
    const posts = await Promise.all(rows.map(async (post) => {
      const { rows: tagRows } = await pool.query(
        'SELECT t.id, t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1',
        [post.id]
      );
      return mapPost(post, tagRows);
    }));

    res.json({ posts, total: posts.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM posts WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Пост не найден' });
    
    // Получаем теги поста
    const { rows: tagRows } = await pool.query(
      'SELECT t.id, t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1',
      [req.params.id]
    );
    
    res.json(mapPost(rows[0], tagRows));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/', async (req, res) => {
  const { title, content, tagIds = [] } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Заголовок и текст обязательны' });
  
  try {
    // Создаём пост
    const { rows } = await pool.query(
      'INSERT INTO posts (title, content, author_email) VALUES ($1, $2, $3) RETURNING *',
      [title, content, req.user.email]
    );
    const post = rows[0];

    // Добавляем теги если они переданы
    let tags = [];
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        try {
          await pool.query(
            'INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)',
            [post.id, tagId]
          );
        } catch (e) {
          // Пропускаем дубликаты
        }
      }
      
      // Получаем теги
      const { rows: tagRows } = await pool.query(
        'SELECT t.id, t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1',
        [post.id]
      );
      tags = tagRows;
    }

    res.status(201).json({ message: 'Пост создан!', post: mapPost(post, tags) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM posts WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Пост не найден' });
    if (rows[0].author_email !== req.user.email)
      return res.status(403).json({ error: 'Нельзя редактировать чужой пост' });

    const { title, content, tagIds = [] } = req.body;
    const { rows: updated } = await pool.query(
      'UPDATE posts SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title || rows[0].title, content || rows[0].content, req.params.id]
    );
    
    // Обновляем теги
    await pool.query('DELETE FROM post_tags WHERE post_id = $1', [req.params.id]);
    
    let tags = [];
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        try {
          await pool.query(
            'INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)',
            [req.params.id, tagId]
          );
        } catch (e) {
          // Пропускаем дубликаты
        }
      }
      
      // Получаем теги
      const { rows: tagRows } = await pool.query(
        'SELECT t.id, t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1',
        [req.params.id]
      );
      tags = tagRows;
    }

    res.json({ message: 'Пост обновлён!', post: mapPost(updated[0], tags) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM posts WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Пост не найден' });
    if (rows[0].author_email !== req.user.email)
      return res.status(403).json({ error: 'Нельзя удалить чужой пост' });

    await pool.query('UPDATE posts SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ message: 'Пост удалён!' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== Теги ====================

// Получить все теги
router.get('/tags/list', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM tags ORDER BY name ASC');
    res.json({ tags: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
