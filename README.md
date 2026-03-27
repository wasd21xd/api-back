# API Backend Study

Монорепо: Express бэкенд + React фронтенд на Vite.

## Структура

```
api-backend-study/
├── package.json          ← корневой (запуск обоих сразу)
├── .gitignore
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── data/db.js
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js
│       └── posts.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── index.css
        ├── App.jsx
        ├── api.js
        ├── pages/
        └── components/
```

## Запуск

```bash
# Установить все зависимости
npm run install:all

# Запустить оба проекта одновременно
npm run dev
```

- Бэкенд: http://localhost:3000
- Фронтенд: http://localhost:5173

## API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /auth/register | Регистрация |
| POST | /auth/login | Вход, возвращает JWT |
| GET | /posts | Все посты (🔒) |
| POST | /posts | Создать пост (🔒) |
| PUT | /posts/:id | Редактировать (🔒 владелец) |
| DELETE | /posts/:id | Удалить (🔒 владелец) |

🔒 — требует заголовок `Authorization: Bearer <token>`
