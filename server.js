const express = require("express");
const cors = require("cors");

const app = express();

// ==========================
// MIDDLEWARE
// ==========================
app.use(cors());
app.use(express.json());

// ==========================
// ROOT (HEALTH CHECK)
// ==========================
app.get("/", (req, res) => {
  res.send("API Gadai aktif 🚀");
});

// ==========================
// UTIL
// ==========================
function bulatkan(n){
  return Math.floor(Math.round(n) / 100) * 100;
}

function hitungHari(t1, t2){
  let h = Math.ceil((t2 - t1) / (1000 * 60 * 60 * 24));
  return h === 0 ? 1 : h;
}

// ==========================
// API HITUNG
// ==========================
app.post("/hitung", (req, res) => {
  try {
    console.log("REQUEST:", req.body); // debug

    const { tglPinjam, tglBayar, pinjaman } = req.body;

    const t1 = new Date(tglPinjam);
    const t2 = new Date(tglBayar);
    const pinjam = Number(pinjaman);

    // VALIDASI
    if (!tglPinjam || !tglBayar || isNaN(pinjam)) {
      return res.status(400).json({ error: "Input tidak valid" });
    }

    if (isNaN(t1.getTime()) || isNaN(t2.getTime())) {
      return res.status(400).json({ error: "Format tanggal tidak valid" });
    }

    if (pinjam <= 0) {
      return res.status(400).json({ error: "Pinjaman harus lebih dari 0" });
    }

    if (t1 > t2) {
      return res.status(400).json({ error: "Tanggal tidak valid" });
    }

    let hari = hitungHari(t1, t2);

    let bungaTotal = 0;
    let dendaTotal = 0;

    let rincian = [];
    let rincianDenda = [];

    let hariJasa = Math.min(hari, 90);
    let sisa = hariJasa;
    let no = 1;

    // ==========================
    // HITUNG JASA
    // ==========================
    while(sisa > 0){
      let periode = sisa >= 30 ? 30 : sisa;
      let persen = periode <= 10 ? 1 : (periode <= 20 ? 2 : 3);

      let bunga = bulatkan((persen/100) * pinjam);
      bungaTotal += bunga;

      rincian.push({
        jasa: no,
        hari: periode,
        persen,
        bunga
      });

      sisa -= periode;
      no++;
    }

    // ==========================
    // HITUNG DENDA
    // ==========================
    if(hari > 90){
      let sisaDenda = hari - 90;
      let noDenda = 1;

      while(sisaDenda > 0){
        let periode = sisaDenda >= 30 ? 30 : sisaDenda;
        let dasar = periode <= 10 ? 1 : (periode <= 20 ? 2 : 3);
        let persen = dasar + noDenda;

        let denda = bulatkan((persen/100) * pinjam);
        dendaTotal += denda;

        rincianDenda.push({
          denda: noDenda,
          hari: periode,
          persen,
          nominal: denda
        });

        sisaDenda -= periode;
        noDenda++;
      }
    }

    let totalJasa = bungaTotal + dendaTotal;
    let totalBayar = bulatkan(pinjam + totalJasa);

    return res.json({
      hari,
      pinjaman: pinjam,
      totalJasa,
      totalBayar,
      rincian,
      rincianDenda
    });

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// GLOBAL ERROR HANDLER
// ==========================
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

// ==========================
// START SERVER (FIX RAILWAY)
// ==========================
const PORT = process.env.PORT || 3000;

// 🔥 INI YANG PENTING (binding fix)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server jalan di port ${PORT}`);
});