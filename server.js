const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET_KEY = "software_engineering_2025"; // Секретный ключ для токенов

app.use(cors());
app.use(express.json());

// Настройка подключения к базе данных
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'unidb',
    password: 'Amirhan10', 
    port: 5432,
});

// --- АУТЕНТИФИКАЦИЯ ---

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    const { fullname, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            'INSERT INTO users (fullname, email, password_hash) VALUES ($1, $2, $3) RETURNING id, fullname, email',
            [fullname, email, hashedPassword]
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        res.status(400).json({ error: "Пользователь с таким Email уже существует" });
    }
});

// Вход в систему
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: "Пользователь не найден" });

        const validPassword = await bcrypt.compare(password, userResult.rows[0].password_hash);
        if (!validPassword) return res.status(401).json({ error: "Неверный пароль" });

        const token = jwt.sign({ id: userResult.rows[0].id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: userResult.rows[0].id, fullname: userResult.rows[0].fullname, email } });
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// --- УНИВЕРСИТЕТЫ ---

// Получение списка вузов
app.get('/api/universities', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM universities ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Добавление в избранное
app.post('/api/favorites', async (req, res) => {
    const { user_id, uni_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO favorites (user_id, uni_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [user_id, uni_id]
        );
        res.status(201).json({ message: "Добавлено!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log("Сервер запущен: http://localhost:3000"));