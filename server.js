const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // Konumdan il bulmak için

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); 
app.use(express.static(__dirname)); // Ana dizindeki dosyaları sun

// Veritabanı Bağlantısı
const db = new sqlite3.Database('./arac_yikama.db', (err) => {
    if (err) console.error(err.message);
    else console.log('✅ Veritabanı dosyasına (SQLite) bağlandı.');
});

// Tabloyu Oluştur (Yoksa)
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
    let sql = "SELECT * FROM istasyonlar ORDER BY id DESC"; // En yeniler üstte
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

// 2. YENİ EKLEME (POST) - OTOMATİK İL BULMA DAHİL
app.post('/api/ekle', async (req, res) => {
    const { ad, lat, lon } = req.body;
    
    // OpenStreetMap'ten İl/İlçe Bul
    let il = "Bilinmiyor";
    let ilce = "";

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        const response = await axios.get(url);
        if(response.data && response.data.address) {
            il = response.data.address.province || response.data.address.city || "Bilinmiyor";
            ilce = response.data.address.town || response.data.address.district || "";
        }
    } catch (error) {
        console.log("Konum bulunamadı:", error.message);
    }

    const sql = "INSERT INTO istasyonlar (ad, lat, lon, il, ilce) VALUES (?,?,?,?,?)";
    db.run(sql, [ad, lat, lon, il, ilce], function(err) {
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

// Ana Sayfayı Aç
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});