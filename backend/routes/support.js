const express = require('express');
const router = express.Router();
const pool = require('../data/db');
const { authMiddleware: verifyToken } = require('../middleware/auth');

pool.query(`
  CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Ошибка создания таблицы support_tickets:', err.message));

router.post('/', verifyToken, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Сообщение не может быть пустым' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO support_tickets (user_email, message) VALUES ($1, $2) RETURNING *',
      [req.user.email, message.trim()]
    );
    res.status(201).json({ ticket: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM support_tickets WHERE user_email = $1 ORDER BY created_at DESC',
      [req.user.email]
    );
    res.json({ tickets: rows });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/admin/all', verifyToken, async (req, res) => {
  if (req.user.email !== process.env.ADMIN_EMAIL)
    return res.status(403).json({ error: 'Нет доступа' });
  try {
    const { rows } = await pool.query('SELECT * FROM support_tickets ORDER BY created_at DESC');
    res.json({ tickets: rows });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.patch('/admin/:id', verifyToken, async (req, res) => {
  if (req.user.email !== process.env.ADMIN_EMAIL)
    return res.status(403).json({ error: 'Нет доступа' });
  const { status } = req.body;
  if (!['open', 'closed'].includes(status)) return res.status(400).json({ error: 'Неверный статус' });
  try {
    const { rows } = await pool.query(
      'UPDATE support_tickets SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Тикет не найден' });
    res.json({ ticket: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
