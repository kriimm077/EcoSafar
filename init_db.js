const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ecosafar.db');

db.serialize(()=>{
  db.run("INSERT OR IGNORE INTO users (username,password,points,totalWeight) VALUES ('user01','pass123',195,2100)");
  db.run("INSERT OR IGNORE INTO users (username,password,points,totalWeight) VALUES ('user02','pass123',60,850)");
  db.run("INSERT OR IGNORE INTO users (username,password,points,totalWeight) VALUES ('user03','pass123',120,1200)");
});
console.log('Seed complete');
