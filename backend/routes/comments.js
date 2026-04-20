const express = require('express');
const router = express.Router();
const pool = require('../data/db');
const { authMiddleware } = require('../middleware/auth');

// Получить все комментарии поста
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT id, post_id, author_email, content, created_at, updated_at
       FROM comments
       WHERE post_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    // Получить общее количество комментариев
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM comments WHERE post_id = $1 AND deleted_at IS NULL`,
      [postId]
    );

    res.json({
      comments: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Ошибка получения комментариев:', err.message);
    res.status(500).json({ error: 'Не удалось получить комментарии' });
  }
});

// Добавить комментарий к посту
router.post('/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const author_email = req.user.email;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Содержание комментария не может быть пустым' });
    }

    // Проверить, что пост существует
    const postCheck = await pool.query(
      `SELECT id FROM posts WHERE id = $1 AND deleted_at IS NULL`,
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Пост не найден' });
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, author_email, content)
       VALUES ($1, $2, $3)
       RETURNING id, post_id, author_email, content, created_at, updated_at`,
      [postId, author_email, content.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка создания комментария:', err.message);
    res.status(500).json({ error: 'Не удалось создать комментарий' });
  }
});

// Обновить комментарий
router.put('/:postId/:commentId', authMiddleware, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const user_email = req.user.email;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Содержание комментария не может быть пустым' });
    }

    // Проверить, что комментарий принадлежит пользователю
    const comment = await pool.query(
      `SELECT author_email FROM comments WHERE id = $1 AND post_id = $2 AND deleted_at IS NULL`,
      [commentId, postId]
    );

    if (comment.rows.length === 0) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }

    if (comment.rows[0].author_email !== user_email) {
      return res.status(403).json({ error: 'Вы не можете редактировать чужие комментарии' });
    }

    const result = await pool.query(
      `UPDATE comments
       SET content = $1, updated_at = NOW()
       WHERE id = $2 AND post_id = $3
       RETURNING id, post_id, author_email, content, created_at, updated_at`,
      [content.trim(), commentId, postId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка обновления комментария:', err.message);
    res.status(500).json({ error: 'Не удалось обновить комментарий' });
  }
});

// Удалить комментарий (мягкое удаление)
router.delete('/:postId/:commentId', authMiddleware, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const user_email = req.user.email;

    // Проверить, что комментарий принадлежит пользователю
    const comment = await pool.query(
      `SELECT author_email FROM comments WHERE id = $1 AND post_id = $2 AND deleted_at IS NULL`,
      [commentId, postId]
    );

    if (comment.rows.length === 0) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }

    if (comment.rows[0].author_email !== user_email) {
      return res.status(403).json({ error: 'Вы не можете удалять чужие комментарии' });
    }

    // Мягкое удаление
    await pool.query(
      `UPDATE comments SET deleted_at = NOW() WHERE id = $1 AND post_id = $2`,
      [commentId, postId]
    );

    res.json({ success: true, message: 'Комментарий удален' });
  } catch (err) {
    console.error('Ошибка удаления комментария:', err.message);
    res.status(500).json({ error: 'Не удалось удалить комментарий' });
  }
});

module.exports = router;
