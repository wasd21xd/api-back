# API Backend Study

Монорепо: Express бэкенд + React фронтенд на Vite.

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
