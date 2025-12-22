const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public-static')));

/* ---------------- DATABASE ---------------- */
const db = new sqlite3.Database('./ecosafar.db', (err) => {
  if (err) console.error('Database error:', err.message);
  else console.log('Connected to EcoSafar DB');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      points INTEGER DEFAULT 0,
      totalWeight REAL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      date TEXT,
      weight REAL,
      points INTEGER,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* Default Admin */
  db.run(
    `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
    ['admin', 'admin123']
  );
});

/* ---------------- AUTH ---------------- */

// LOGIN
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  db.get(
    `SELECT id, username, points, totalWeight 
     FROM users 
     WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: 'Invalid credentials' });
      res.json({ user: row });
    }
  );
});

// REGISTER
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, password],
    function (err) {
      if (err) return res.status(409).json({ error: 'User already exists' });
      res.json({ id: this.lastID });
    }
  );
});

/* ---------------- RFID / DISPOSAL ---------------- */

app.post('/api/dispose', (req, res) => {
  const { username, weight } = req.body;

  if (!username || typeof weight !== 'number')
    return res.status(400).json({ error: 'Username and numeric weight required' });

  const points = Math.max(1, Math.round(weight / 10));
  const date = new Date().toISOString().slice(0, 10);

  db.get(
    `SELECT id FROM users WHERE username = ?`,
    [username],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });

      db.run(
        `INSERT INTO history (userId, date, weight, points)
         VALUES (?, ?, ?, ?)`,
        [user.id, date, weight, points]
      );

      db.run(
        `UPDATE users
         SET points = points + ?, totalWeight = totalWeight + ?
         WHERE id = ?`,
        [points, weight, user.id]
      );

      res.json({
        success: true,
        added: { weight, points }
      });
    }
  );
});

/* ---------------- USER DATA ---------------- */

app.get('/api/user/:username', (req, res) => {
  const { username } = req.params;

  db.get(
    `SELECT id, username, points, totalWeight
     FROM users WHERE username = ?`,
    [username],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });

      db.all(
        `SELECT date, weight, points
         FROM history
         WHERE userId = ?
         ORDER BY id DESC`,
        [user.id],
        (err, history) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ user, history });
        }
      );
    }
  );
});

// ALL RESIDENTS (ADMIN)
app.get('/api/residents', (req, res) => {
  db.all(
    `SELECT username, totalWeight, points FROM users`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* ---------------- ALERTS ---------------- */

app.post('/api/alerts', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  db.run(
    `INSERT INTO alerts (message) VALUES (?)`,
    [message],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/alerts', (req, res) => {
  db.all(
    `SELECT id, message, createdAt
     FROM alerts
     ORDER BY id DESC
     LIMIT 50`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* ---------------- FALLBACK ---------------- */
app.get('*', (req, res) => {
  res.sendFile(
    path.join(__dirname, '..', 'public-static', 'index.html')
  );
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`✅ EcoSafar server running on http://localhost:${PORT}`);
});
