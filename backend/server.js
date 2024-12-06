const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 5000;
const SECRET = 'your_jwt_secret_key'; // Change this to a strong secret key

app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'yourpassword',
    database: 'library'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Middleware for authentication and authorization
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

const authorize = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

// Routes
// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = results[0];
        const isPasswordValid = password === user.password; // Use bcrypt for hashed passwords
        if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1h' });
        res.json({ token, role: user.role });
    });
});

// Check Book Availability
app.get('/books/:id/availability', authenticate, (req, res) => {
    const { id } = req.params;
    db.query('SELECT available FROM books WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Book not found' });
        res.json({ available: results[0].available });
    });
});

// Issue Book
app.post('/transactions/issue', authenticate, authorize(['Admin', 'User']), (req, res) => {
    const { book_id, user_id, issue_date, return_date, remarks } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (new Date(issue_date) < new Date(today)) {
        return res.status(400).json({ error: 'Issue date cannot be in the past' });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });

        db.query('UPDATE books SET available = FALSE WHERE id = ?', [book_id], err => {
            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

            db.query(
                'INSERT INTO transactions (book_id, user_id, issue_date, return_date, remarks, fine) VALUES (?, ?, ?, ?, ?, 0)',
                [book_id, user_id, issue_date, return_date, remarks],
                (err, results) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                        res.json({ message: 'Book issued successfully', transaction_id: results.insertId });
                    });
                }
            );
        });
    });
});

// Return Book
app.post('/transactions/return', authenticate, authorize(['Admin', 'User']), (req, res) => {
    const { transaction_id, actual_return_date } = req.body;

    db.query(
        'SELECT return_date FROM transactions WHERE id = ?',
        [transaction_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ message: 'Transaction not found' });

            const { return_date } = results[0];
            const fine = new Date(actual_return_date) > new Date(return_date)
                ? Math.ceil((new Date(actual_return_date) - new Date(return_date)) / (1000 * 60 * 60 * 24)) * 10
                : 0;

            db.beginTransaction(err => {
                if (err) return res.status(500).json({ error: err.message });

                db.query(
                    'UPDATE transactions SET actual_return_date = ?, fine = ? WHERE id = ?',
                    [actual_return_date, fine, transaction_id],
                    err => {
                        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

                        db.query(
                            'UPDATE books SET available = TRUE WHERE id = (SELECT book_id FROM transactions WHERE id = ?)',
                            [transaction_id],
                            err => {
                                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                                    res.json({ message: 'Book returned successfully', fine });
                                });
                            }
                        );
                    }
                );
            });
        }
    );
});
