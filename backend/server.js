const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const tokenRoutes = require('./routes/tokens');

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT) || 5000;

console.log('Parsed PORT:', PORT);

app.use(cors());
app.use(express.json());

process.on('uncaughtException', (err) => {
    console.error('Server Uncaught Exception:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);

app.get('/', (req, res) => {
    res.send('Digital Queue API is running on Port ' + PORT);
});

// 404 Handler for API
app.use((req, res) => {
    res.status(404).json({ error: "Route not found on Digital Queue Server", path: req.path });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
