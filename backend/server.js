require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('./middleware/auth');
const pool = require('./data/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const supportRoutes = require('./routes/support');

app.use('/auth', authRoutes);
app.use('/posts', postsRoutes);
app.use('/support', supportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Сервер работает! 🚀' });
});

// Создать таблицу сообщений чата
pool.query(`
  CREATE TABLE IF NOT EXISTS ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Ошибка создания таблицы ticket_messages:', err.message));

// WebSocket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Нет токена'));
  try {
    socket.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    next(new Error('Неверный токен'));
  }
});

io.on('connection', (socket) => {
  // Войти в комнату тикета
  socket.on('join_ticket', (ticketId) => {
    socket.join(`ticket_${ticketId}`);
  });

  // Покинуть комнату
  socket.on('leave_ticket', (ticketId) => {
    socket.leave(`ticket_${ticketId}`);
  });

  // Отправить сообщение
  socket.on('send_message', async ({ ticketId, message }) => {
    if (!message || !message.trim()) return;
    try {
      const { rows } = await pool.query(
        'INSERT INTO ticket_messages (ticket_id, sender_email, message) VALUES ($1, $2, $3) RETURNING *',
        [ticketId, socket.user.email, message.trim()]
      );
      io.to(`ticket_${ticketId}`).emit('new_message', rows[0]);

      // Уведомить админ-панель о новом тикет-активности
      io.emit('ticket_updated');
    } catch (err) {
      console.error('Ошибка сохранения сообщения:', err.message);
    }
  });
});

// Экспортируем io чтобы использовать в роутах
app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
