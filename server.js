const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); 
app.use(express.static(__dirname)); 

// Veritabanı Bağlantısı
const db = new sqlite3.Database('./arac_yikama.db', (err) => {
    if (err) console.error(err.message);
    else console.log('✅ Veritabanı dosyasına (SQLite) bağlandı.');
});

// Tabloyu Oluştur
db.run(`CREATE TABLE IF NOT EXISTS istasyonlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT,
    lat REAL,
    lon REAL,
    il TEXT,
    ilce TEXT
)`);

// 1. LİSTELEME VE ARAMA (GET)
app.get('/api/istasyonlar', (req, res) => {
    let sql = "SELECT * FROM istasyonlar ORDER BY id DESC";
    let params = [];

    if (req.query.il) {
        sql = "SELECT * FROM istasyonlar WHERE il LIKE ? ORDER BY id DESC";
        params.push('%' + req.query.il + '%');
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

// 2. YENİ EKLEME (POST) - SADE HALİ
app.post('/api/ekle', (req, res) => {
    // Frontend'den gelen verileri al
    const { ad, lat, lon, il, ilce } = req.body;
    
    // Eğer il bilgisi gelmediyse "Bilinmiyor" yaz
    const kayitIl = il || "Bilinmiyor";
    const kayitIlce = ilce || "";

    const sql = "INSERT INTO istasyonlar (ad, lat, lon, il, ilce) VALUES (?,?,?,?,?)";
    db.run(sql, [ad, lat, lon, kayitIl, kayitIlce], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Kayıt başarıyla eklendi!", id: this.lastID });
    });
});

// 3. SİLME (DELETE)
app.delete('/api/sil/:id', (req, res) => {
    const sql = "DELETE FROM istasyonlar WHERE id = ?";
    db.run(sql, req.params.id, function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Silindi", rows: this.changes });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});