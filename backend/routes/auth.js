const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.execute('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?', [email, password]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Signup
router.post('/signup', async (req, res) => {
    const { id, name, email, password } = req.body;
    try {
        await pool.execute('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [id, name, email, password, 'user']);
        res.status(201).json({ id, name, email, role: 'user' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
