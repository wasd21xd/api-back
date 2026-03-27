// ============================================
// server.js — главный файл нашего приложения
// ============================================

require('dotenv').config();
const express = require('express');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());


const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');

app.use('/auth', authRoutes);
app.use('/posts', postsRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Сервер работает! 🚀' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
