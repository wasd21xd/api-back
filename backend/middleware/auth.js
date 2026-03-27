const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Токен не предоставлен' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    return res.status(401).json({ error: 'Токен недействителен' });
  }
}

module.exports = { authMiddleware, SECRET_KEY };
