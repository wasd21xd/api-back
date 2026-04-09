# ✦ Posts App

Fullstack приложение: лента постов с авторизацией, системой техподдержки и реалтайм-чатом через WebSocket.

---

## Стек

| Слой | Технологии |
|------|------------|
| Бэкенд | Node.js, Express, PostgreSQL, Socket.io, JWT |
| Фронтенд | React, Vite, React Router |

---

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone https://github.com/wasd21xd/api-back.git
cd api-back
```

### 2. Установить зависимости

```bash
npm run install:all
```

### 3. Создать базу данных

```sql
CREATE DATABASE posts_app;
```

Таблицы создаются автоматически при первом запуске.

### 4. Настроить окружение

Создать файл `backend/.env`:

```env
PORT=3000
JWT_SECRET=your_secret_key

DB_HOST=localhost
DB_PORT=5432
DB_NAME=posts_app
DB_USER=your_db_user
DB_PASSWORD=your_db_password

ADMIN_EMAIL=your@email.com
```

Создать файл `frontend/.env`:

```env
VITE_ADMIN_EMAIL=your@email.com
```

### 5. Запустить

```bash
npm run dev
```

- Бэкенд: [http://localhost:3000](http://localhost:3000)
- Фронтенд: [http://localhost:5173](http://localhost:5173)

---

## Функциональность

**Авторизация**
- Регистрация и вход по email + пароль
- JWT-токены, автоматический редирект при истечении

**Лента постов**
- Создание, редактирование и удаление постов
- Редактировать/удалять можно только свои посты

**Техподдержка**
- Пользователь отправляет обращение
- Реалтайм-чат с поддержкой по каждому тикету через WebSocket
- История сообщений сохраняется в БД

**Админ-панель** *(только для ADMIN_EMAIL)*
- Список всех тикетов с авторефрешем — новые тикеты появляются мгновенно
- Фильтрация по статусу: открытые / закрытые
- Чат с пользователем прямо внутри панели
- Закрытие и переоткрытие тикетов

---

## API

### Авторизация

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/auth/register` | Регистрация |
| `POST` | `/auth/login` | Вход, возвращает JWT |

### Посты

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/posts` | Все посты 🔒 |
| `POST` | `/posts` | Создать пост 🔒 |
| `PUT` | `/posts/:id` | Редактировать 🔒 |
| `DELETE` | `/posts/:id` | Удалить 🔒 |

### Поддержка

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/support` | Создать тикет 🔒 |
| `GET` | `/support` | Мои тикеты 🔒 |
| `GET` | `/support/:id/messages` | Сообщения тикета 🔒 |
| `GET` | `/support/admin/all` | Все тикеты 🔒 👑 |
| `PATCH` | `/support/admin/:id` | Изменить статус 🔒 👑 |

🔒 — требует `Authorization: Bearer <token>`  
👑 — только для администратора

### WebSocket события

| Событие | Направление | Описание |
|---------|-------------|----------|
| `join_ticket` | клиент → сервер | Войти в комнату тикета |
| `leave_ticket` | клиент → сервер | Покинуть комнату |
| `send_message` | клиент → сервер | Отправить сообщение |
| `new_message` | сервер → клиент | Новое сообщение в тикете |
| `ticket_updated` | сервер → клиент | Обновление списка тикетов |

---

## Структура проекта

```
api-back/
├── backend/
│   ├── data/
│   │   └── db.js              # Подключение к PostgreSQL
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── routes/
│   │   ├── auth.js            # Регистрация и вход
│   │   ├── posts.js           # CRUD постов
│   │   └── support.js         # Тикеты и сообщения
│   ├── server.js              # Точка входа, Socket.io
│   └── .env                   # Переменные окружения
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── AuthPage.jsx   # Страница входа/регистрации
│       │   ├── FeedPage.jsx   # Лента постов
│       │   ├── SupportPage.jsx # Техподдержка
│       │   └── AdminPage.jsx  # Админ-панель
│       ├── components/
│       │   ├── PostCard.jsx
│       │   └── PostModal.jsx
│       ├── api.js             # Axios + интерцепторы
│       └── App.jsx            # Роутинг
│
└── package.json               # Корневой (запуск обоих серверов)
```
