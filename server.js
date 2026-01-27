const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database.db');

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'gianni_secret_123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Initialisation BDD
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        is_public INTEGER DEFAULT 0,
        bonte INTEGER DEFAULT 50, humour INTEGER DEFAULT 50,
        sociabilite INTEGER DEFAULT 50, confiance INTEGER DEFAULT 50,
        respect INTEGER DEFAULT 50, dopamine INTEGER DEFAULT 50
    )`);

    // Admin par défaut : Gianni / Exp22
    db.get("SELECT * FROM users WHERE username = 'Gianni'", (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync('Exp22', 10);
            db.run("INSERT INTO users (username, password, role, is_public) VALUES (?, ?, 'admin', 1)", ['Gianni', hash]);
        }
    });
});

// Auth Middlewares
const auth = (req, res, next) => req.session.user ? next() : res.status(401).send('Non autorisé');
const admin = (req, res, next) => (req.session.user && req.session.user.role === 'admin') ? next() : res.status(403).send('Interdit');

// Routes API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (!user || !bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'Identifiants invalides' });
        req.session.user = user;
        res.json({ role: user.role });
    });
});

app.get('/api/me', auth, (req, res) => {
    db.get("SELECT * FROM users WHERE id = ?", [req.session.user.id], (err, row) => res.json(row));
});

app.post('/api/me/visibility', auth, (req, res) => {
    db.run("UPDATE users SET is_public = ? WHERE id = ?", [req.body.public ? 1 : 0, req.session.user.id], () => res.json({ success: true }));
});

app.get('/api/public-users', auth, (req, res) => {
    db.all("SELECT username, bonte, humour, sociabilite, confiance, respect, dopamine FROM users WHERE is_public = 1 AND id != ?", [req.session.user.id], (err, rows) => res.json(rows));
});

// Admin
app.get('/api/admin/users', admin, (req, res) => {
    db.all("SELECT * FROM users", (err, rows) => res.json(rows));
});

app.post('/api/admin/create', admin, (req, res) => {
    const hash = bcrypt.hashSync(req.body.password, 10);
    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')", [req.body.username, hash], (err) => {
        if (err) return res.status(400).json({ error: 'Erreur création' });
        res.json({ success: true });
    });
});

app.post('/api/admin/update-stats', admin, (req, res) => {
    const { id, bonte, humour, sociabilite, confiance, respect, dopamine } = req.body;
    db.run("UPDATE users SET bonte=?, humour=?, sociabilite=?, confiance=?, respect=?, dopamine=? WHERE id=?", 
        [bonte, humour, sociabilite, confiance, respect, dopamine, id], () => res.json({ success: true }));
});

app.delete('/api/admin/delete/:id', admin, (req, res) => {
    db.run("DELETE FROM users WHERE id = ? AND username != 'Gianni'", [req.params.id], () => res.json({ success: true }));
});

// Démarrage (Correction Port Bot-Hosting)
const PORT = process.env.P_SERVER_PORT || process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Serveur prêt sur le port ${PORT}`));
