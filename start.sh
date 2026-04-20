#!/bin/bash
# 🚀 Быстрый старт проекта

echo "=========================================="
echo "  🚀 Запуск приложения"
echo "=========================================="

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Проверка Node.js
echo -e "${BLUE}1️⃣ Проверка Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установите Node.js 16+"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}\n"

# 2. Проверка PostgreSQL
echo -e "${BLUE}2️⃣ Проверка PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL cli не найден, но это может быть в порядке"
else
    echo -e "${GREEN}✅ PostgreSQL найден${NC}"
fi
echo ""

# 3. Установка зависимостей
echo -e "${BLUE}3️⃣ Установка зависимостей...${NC}"
npm run install:all
echo -e "${GREEN}✅ Зависимости установлены${NC}\n"

# 4. Запуск
echo -e "${BLUE}4️⃣ Запуск приложения...${NC}"
echo -e "${GREEN}Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}Backend:  http://localhost:3000${NC}"
echo ""

npm run dev
