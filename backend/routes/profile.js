const express = require('express');
const router = express.Router();
const pool = require('../data/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Получить все устройства пользователя
router.get('/devices', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, device_name, browser, os, ip_address, last_seen, created_at 
       FROM devices 
       WHERE user_email = $1 
       ORDER BY last_seen DESC`,
      [req.user.email]
    );

    res.json({ devices: rows });
  } catch (err) {
    console.error('Error fetching devices:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить устройство
router.delete('/devices/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM devices WHERE id = $1 AND user_email = $2',
      [req.params.id, req.user.email]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Устройство не найдено' });

    await pool.query('DELETE FROM devices WHERE id = $1', [req.params.id]);
    res.json({ message: 'Устройство удалено' });
  } catch (err) {
    console.error('Error deleting device:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Выйти со всех устройств (удалить все устройства)
router.post('/logout-all-devices', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM devices WHERE user_email = $1',
      [req.user.email]
    );

    res.json({ message: 'Выход со всех устройств выполнен' });
  } catch (err) {
    console.error('Error logging out all devices:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить информацию профиля
router.get('/me', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT email FROM users WHERE email = $1',
      [req.user.email]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Пользователь не найден' });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
