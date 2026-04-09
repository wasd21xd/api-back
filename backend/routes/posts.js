const express = require('express');
const router = express.Router();
const pool = require('../data/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Переименовываем поля под camelCase как ожидает фронтенд
const mapPost = (row) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  authorEmail: row.author_email,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM posts WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    const posts = rows.map(mapPost);
    res.json({ posts, total: posts.length });
  } catch (err) {
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
    res.json(mapPost(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Заголовок и текст обязательны' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO posts (title, content, author_email) VALUES ($1, $2, $3) RETURNING *',
      [title, content, req.user.email]
    );
    res.status(201).json({ message: 'Пост создан!', post: mapPost(rows[0]) });
  } catch (err) {
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

    const { title, content } = req.body;
    const { rows: updated } = await pool.query(
      'UPDATE posts SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title || rows[0].title, content || rows[0].content, req.params.id]
    );
    res.json({ message: 'Пост обновлён!', post: mapPost(updated[0]) });
  } catch (err) {
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

module.exports = router;
