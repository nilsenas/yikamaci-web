const express = require('express');
const sqlite3 = require('sqlite3').verbose(); 
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- VERİTABANI OLUŞTURMA (SQLITE) ---
// Bu kod klasöründe otomatik olarak 'arac_yikama.db' dosyası oluşturacak.
const db = new sqlite3.Database('./arac_yikama.db', (err) => {
  if (err) console.error("Veritabanı hatası:", err.message);
  else console.log('✅ Veritabanı dosyasına (SQLite) bağlandı.');
});

// Tabloyu Oluştur
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS istasyonlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT, il TEXT, ilce TEXT, lat REAL, lon REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// İstasyonları getir (Filtreli veya Tümü)
app.get('/api/istasyonlar', (req, res) => {
    let sql = "SELECT * FROM istasyonlar";
    let params = [];

    // Eğer arama kutusundan 'il' bilgisi geldiyse sorguyu değiştir
    if (req.query.il) {
        sql += " WHERE il LIKE ?";
        params.push('%' + req.query.il + '%'); // İçinde geçenleri bulur
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

app.post('/api/istasyonlar', (req, res) => {
  const { ad, il, ilce, lat, lon } = req.body;
  const sql = `INSERT INTO istasyonlar (ad, il, ilce, lat, lon) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [ad, il, ilce, lat, lon], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ id: this.lastID, ad, il, ilce, lat, lon });
  });
});

app.delete('/api/istasyonlar/:id', (req, res) => {
  if (req.body.sifre !== "370634") return res.status(403).json({ message: "Hatalı şifre" });
  db.run(`DELETE FROM istasyonlar WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).send('Hata');
    res.json({ message: "Silindi" });
  });
});

app.listen(port, () => {
  console.log(`-----------------------------------------------`);
  console.log(`✅ Sunucu Hazır: http://localhost:${port}`);
  console.log(`📁 Veriler 'arac_yikama.db' dosyasına yazılacak.`);
  console.log(`-----------------------------------------------`);
});