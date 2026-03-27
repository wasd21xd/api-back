const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const livePosts = () => db.posts.filter(p => !p.deletedAt);

router.get('/', (req, res) => {
  const posts = livePosts();
  res.json({ posts, total: posts.length });
});

router.get('/:id', (req, res) => {
  const post = db.posts.find(p => p.id === req.params.id && !p.deletedAt);
  if (!post) return res.status(404).json({ error: 'Пост не найден' });
  res.json(post);
});

router.post('/', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Заголовок и текст обязательны' });
  const newPost = { id: Date.now().toString(), title, content, authorEmail: req.user.email, createdAt: new Date().toISOString(), deletedAt: null };
  db.posts.push(newPost);
  res.status(201).json({ message: 'Пост создан!', post: newPost });
});

router.put('/:id', (req, res) => {
  const idx = db.posts.findIndex(p => p.id === req.params.id && !p.deletedAt);
  if (idx === -1) return res.status(404).json({ error: 'Пост не найден' });
  if (db.posts[idx].authorEmail !== req.user.email) return res.status(403).json({ error: 'Нельзя редактировать чужой пост' });
  const { title, content } = req.body;
  db.posts[idx] = { ...db.posts[idx], title: title || db.posts[idx].title, content: content || db.posts[idx].content, updatedAt: new Date().toISOString() };
  res.json({ message: 'Пост обновлён!', post: db.posts[idx] });
});

router.delete('/:id', (req, res) => {
  const idx = db.posts.findIndex(p => p.id === req.params.id && !p.deletedAt);
  if (idx === -1) return res.status(404).json({ error: 'Пост не найден' });
  if (db.posts[idx].authorEmail !== req.user.email) return res.status(403).json({ error: 'Нельзя удалить чужой пост' });
  db.posts[idx].deletedAt = new Date().toISOString();
  res.json({ message: 'Пост удалён!' });
});

module.exports = router;
