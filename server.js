const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public-static')));

const db = new sqlite3.Database('./ecosafar.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    points INTEGER DEFAULT 0,
    totalWeight INTEGER DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    date TEXT,
    weight INTEGER,
    points INTEGER,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
});

// simple login (demo; in production add hashing + JWT)
app.post('/api/login', (req,res) => {
  const {username,password} = req.body;
  db.get('SELECT id,username,points,totalWeight FROM users WHERE username = ? AND password = ?',[username,password], (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(401).json({error:'Invalid credentials'});
    res.json({user: row});
  });
});

app.post('/api/register',(req,res)=>{
  const {username,password} = req.body;
  db.run('INSERT INTO users (username,password) VALUES (?,?)',[username,password], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({id:this.lastID});
  });
});

// called by microcontroller/RPi after RFID+weight reading
app.post('/api/dispose',(req,res)=>{
  const {username,weight} = req.body;
  if(!username || typeof weight !== 'number') return res.status(400).json({error:'username and weight required'});
  const points = Math.round(weight / 10);
  const date = new Date().toISOString().slice(0,10);
  db.get('SELECT id FROM users WHERE username = ?', [username], (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'User not found'});
    db.run('INSERT INTO history (userId,date,weight,points) VALUES (?,?,?,?)',[row.id,date,weight,points]);
    db.run('UPDATE users SET points = points + ?, totalWeight = totalWeight + ? WHERE id = ?',[points,weight,row.id]);
    res.json({ok:true,added:{weight,points}});
  });
});

app.get('/api/user/:username',(req,res)=>{
  const username = req.params.username;
  db.get('SELECT id,username,points,totalWeight FROM users WHERE username = ?', [username], (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'User not found'});
    db.all('SELECT date,weight,points FROM history WHERE userId = ? ORDER BY id DESC LIMIT 100',[row.id], (err,rows)=>{
      if(err) return res.status(500).json({error:err.message});
      res.json({user:row,history:rows});
    });
  });
});

app.get('/api/residents',(req,res)=>{
  db.all('SELECT username,totalWeight,points FROM users',[],(err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

app.post('/api/alerts',(req,res)=>{
  const {message} = req.body;
  db.run('INSERT INTO alerts (message) VALUES (?)',[message], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({id:this.lastID});
  });
});

app.get('/api/alerts',(req,res)=>{
  db.all('SELECT id,message,createdAt FROM alerts ORDER BY id DESC LIMIT 50',[],(err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

// any unknown route -> serve static site index (so React or static files work)
app.get('*',(req,res) => {
  res.sendFile(path.join(__dirname,'..','public-static','index.html'));
});

app.listen(PORT, ()=>console.log(`EcoSafar server running on ${PORT}`));
