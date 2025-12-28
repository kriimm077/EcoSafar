// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./ecosafar.db');

// Serve static files like logo.png
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ROUTE: User Dashboard
app.get('/', (req, res) => {
  // Get the last inserted user
  db.get("SELECT rowid, username, points, totalWeight FROM users ORDER BY rowid DESC LIMIT 1", [], (err, user) => {
    if(err){
      console.error(err);
      return res.send("Database error");
    }

    if(!user){
      return res.send("No users found in the database");
    }

    // Calculate redeem value
    const money = ((user.totalWeight || 0)/100*10).toFixed(2);

    // Example transaction history (replace with real table if you have one)
    const history = [
      { weight: 200, ecoPoints: 20 },
      { weight: 150, ecoPoints: 15 },
      { weight: 300, ecoPoints: 30 }
    ];

    res.render('dashboard', {
      username: user.username,
      uid: `UID-${user.rowid}`,
      points: user.points,
      totalWeight: user.totalWeight,
      money,
      history
    });
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
