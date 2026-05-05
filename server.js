const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

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
// API
// ==========================
app.post("/hitung", (req, res) => {
  try {
    const { tglPinjam, tglBayar, pinjaman } = req.body;

    const t1 = new Date(tglPinjam);
    const t2 = new Date(tglBayar);
    const pinjam = Number(pinjaman);

    if (!tglPinjam || !tglBayar || isNaN(pinjam)) {
      return res.status(400).json({ error: "Input tidak valid" });
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

    res.json({
      hari,
      pinjaman: pinjam,
      totalJasa,
      totalBayar,
      rincian,
      rincianDenda
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server jalan di port", PORT);
});