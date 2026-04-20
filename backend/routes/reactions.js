const express = require('express');
const router = express.Router();
const pool = require('../data/db');
const { authMiddleware } = require('../middleware/auth');

// Допустимые типы реакций (эмодзи)
const VALID_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

// Получить все реакции поста с подсчетом
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    // Получить количество реакций по типам
    const result = await pool.query(
      `SELECT reaction_type, COUNT(*) as count
       FROM reactions
       WHERE post_id = $1
       GROUP BY reaction_type
       ORDER BY count DESC`,
      [postId]
    );

    const reactions = {};
    result.rows.forEach(row => {
      reactions[row.reaction_type] = parseInt(row.count);
    });

    res.json(reactions);
  } catch (err) {
    console.error('Ошибка получения реакций:', err.message);
    res.status(500).json({ error: 'Не удалось получить реакции' });
  }
});

// Получить реакцию текущего пользователя на пост
router.get('/:postId/user', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const user_email = req.user.email;

    const result = await pool.query(
      `SELECT reaction_type FROM reactions
       WHERE post_id = $1 AND user_email = $2`,
      [postId, user_email]
    );

    res.json({
      userReactions: result.rows.map(row => row.reaction_type)
    });
  } catch (err) {
    console.error('Ошибка получения реакций пользователя:', err.message);
    res.status(500).json({ error: 'Не удалось получить реакции' });
  }
});

// Добавить/переключить реакцию
router.post('/:postId/:reactionType', authMiddleware, async (req, res) => {
  try {
    const { postId, reactionType } = req.params;
    const user_email = req.user.email;

    // Валидация типа реакции
    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({ 
        error: `Недопустимая реакция. Допустимые: ${VALID_REACTIONS.join(', ')}` 
      });
    }

    // Проверить, что пост существует
    const postCheck = await pool.query(
      `SELECT id FROM posts WHERE id = $1 AND deleted_at IS NULL`,
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Пост не найден' });
    }

    // Проверить, существует ли уже реакция
    const existingReaction = await pool.query(
      `SELECT id FROM reactions
       WHERE post_id = $1 AND user_email = $2 AND reaction_type = $3`,
      [postId, user_email, reactionType]
    );

    if (existingReaction.rows.length > 0) {
      // Удалить реакцию (переключение)
      await pool.query(
        `DELETE FROM reactions
         WHERE post_id = $1 AND user_email = $2 AND reaction_type = $3`,
        [postId, user_email, reactionType]
      );
      return res.json({ success: true, action: 'removed', reactionType });
    }

    // Добавить новую реакцию
    await pool.query(
      `INSERT INTO reactions (post_id, user_email, reaction_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_email, reaction_type) DO NOTHING`,
      [postId, user_email, reactionType]
    );

    res.status(201).json({ success: true, action: 'added', reactionType });
  } catch (err) {
    console.error('Ошибка добавления реакции:', err.message);
    res.status(500).json({ error: 'Не удалось добавить реакцию' });
  }
});

// Удалить реакцию пользователя
router.delete('/:postId/:reactionType', authMiddleware, async (req, res) => {
  try {
    const { postId, reactionType } = req.params;
    const user_email = req.user.email;

    const result = await pool.query(
      `DELETE FROM reactions
       WHERE post_id = $1 AND user_email = $2 AND reaction_type = $3`,
      [postId, user_email, reactionType]
    );

    res.json({ success: true, message: 'Реакция удалена' });
  } catch (err) {
    console.error('Ошибка удаления реакции:', err.message);
    res.status(500).json({ error: 'Не удалось удалить реакцию' });
  }
});

module.exports = router;
