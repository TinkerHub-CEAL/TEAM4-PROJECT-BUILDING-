const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all waiting tokens
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT * FROM tokens 
            WHERE status IN ("waiting", "serving") 
            ORDER BY 
                CASE 
                    WHEN type = 'emergency' THEN 1 
                    WHEN type = 'disabled' THEN 2 
                    ELSE 3 
                END, 
                timestamp ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user history
router.get('/history/:userId', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM tokens WHERE userId = ? ORDER BY timestamp DESC', [req.params.userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Book a token
router.post('/book', async (req, res) => {
    const { id, number, deptId, sector, type, name, phone, userId, timestamp } = req.body;
    try {
        await pool.execute(
            'INSERT INTO tokens (id, number, deptId, sector, type, name, phone, userId, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "waiting")',
            [id, number, deptId, sector, type, name, phone, userId, timestamp]
        );
        res.status(201).json({ id, number, status: 'waiting' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update token status (Serving/Done/Cancel)
router.patch('/:id/status', async (req, res) => {
    const { status, counter } = req.body;
    try {
        if (status === 'serving') {
            await pool.execute('UPDATE tokens SET status = ?, counter = ? WHERE id = ?', [status, counter, req.params.id]);
        } else {
            await pool.execute('UPDATE tokens SET status = ? WHERE id = ?', [status, req.params.id]);
        }
        res.json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reschedule: Move to the back of the queue (update timestamp)
router.post('/reschedule/:id', async (req, res) => {
    try {
        await pool.execute('UPDATE tokens SET timestamp = ?, status = "waiting", counter = NULL WHERE id = ?', [Date.now(), req.params.id]);
        res.json({ message: 'Token rescheduled' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete/Cancel
router.delete('/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM tokens WHERE id = ?', [req.params.id]);
        res.json({ message: 'Token deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
