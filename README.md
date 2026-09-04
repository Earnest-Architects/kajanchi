# Kajanchi Virtual Tour

Repo ini adalah satu tur virtual 360° yang berdiri sendiri (root repo =
root situs). Kalau di-deploy ke GitHub Pages, situsnya langsung tampil
di `index.html` tanpa perlu subfolder.

## Struktur folder

```
/assets              gambar denah & panorama
/brand                logo Earnest Architects (dipakai index.html)
/favicon              semua file icon situs (favicon, apple-touch-icon)
/lib                 library Pannellum (jangan diedit)
/css
  style.css          tampilan tur utama
  vr.css             tampilan overlay halaman VR (vr.html)
  pitch-finder.css   tampilan halaman pitch-finder
  denah-finder.css   tampilan halaman denah-finder
/js
  content.js         <-- SATU-SATUNYA FILE YANG PERLU DIEDIT
  state.js           logika internal (jangan diedit)
  hotspots.js         logika internal (jangan diedit)
  viewer.js          logika internal (jangan diedit)
  vr.js              logika halaman VR, pakai data dari content.js juga
  floorplan.js       logika internal (jangan diedit)
  pitch-finder.js    logika halaman pitch-finder (jangan diedit)
  denah-finder.js    logika halaman denah-finder (jangan diedit)
index.html           halaman tur utama
vr.html              versi VR headset dari tur yang sama (tombol VR di index.html)
pitch-finder.html    halaman khusus cari koordinat pitch/yaw (di dalam gambar 360)
denah-finder.html    halaman khusus cari koordinat titik pada denah (x%, y%)
site.webmanifest     metadata PWA (ikon home-screen), path ikonnya ada di /favicon
```

Semua path CSS/JS/gambar di file HTML ditulis **relatif** (bukan
diawali `/`), jadi repo ini tetap jalan normal baik di-host di root
domain (`namamu.github.io`) maupun di subpath project
(`namamu.github.io/nama-repo/`).

## Cara menambah / mengedit konten

Semua konten (lantai, titik pada denah, gambar 360, panah navigasi
di dalam gambar 360) ada di **`js/content.js`**. Tidak perlu buka
file lain untuk mengubah tur:

- **Tambah lantai baru** → tambah 1 objek baru di array `floors`.
- **Tambah gambar 360 baru** → tambah 1 objek baru di array `views`,
  taruh file panoramanya di `assets/`.
- **Tambah titik pada denah** → tambah objek di `points` milik lantai
  terkait (`{ target, x, y }`).
- **Tambah panah navigasi di dalam gambar 360** → tambah objek di
  `pitchPoints` milik view terkait (`{ pitch, yaw, target }`).
- **Menghapus** salah satu di atas → cukup hapus objeknya dari array;
  tampilan (denah & panah navigasi) otomatis ikut hilang.

## Cara mencari nilai pitch & yaw

1. Buka `pitch-finder.html` di browser (lewat server lokal, lihat di
   bawah — bukan dibuka langsung dari file explorer).
2. Pilih gambar 360 yang mau dicari titiknya di dropdown **"Gambar 360"**.
3. Pilih tujuan panah (**"Target"**) yang diinginkan.
4. Klik posisi yang diinginkan di dalam gambar → nilai pitch & yaw
   muncul, klik **"+ Tambah ke daftar"**.
5. Ulangi untuk titik lain, lalu klik **"Copy sebagai kode pitchPoints"**
   → tempel hasilnya langsung ke `pitchPoints` di `js/content.js`.

Halaman ini tidak menyimpan apa pun ke server — murni alat bantu
membaca koordinat, hasilnya harus ditempel manual ke `content.js`.

## Cara mencari nilai x% & y% pada denah

1. Buka `denah-finder.html` di browser.
2. Pilih lantai di dropdown **"Lantai"**.
3. Pilih tujuan titik (**"Target"** — view 360 yang dituju titik ini).
4. Klik posisi yang diinginkan pada gambar denah → nilai x% dan y%
   muncul, klik **"+ Tambah ke daftar"**.
5. Ulangi untuk titik lain, lalu klik **"Copy sebagai kode points"**
   → tempel hasilnya langsung ke `points` milik lantai terkait di
   `js/content.js`.

Container gambar di halaman ini memakai style yang sama persis
dengan yang dipakai saat tur berjalan, jadi persentase yang
dihasilkan pasti cocok dengan posisi titik yang akan tampil nanti.

## Menjalankan secara lokal

Karena semua kode JS memakai ES Modules (`import`/`export`), halaman
harus dibuka lewat server (bukan `file://`). Contoh dengan Python:

```
python3 -m http.server 8000
```

lalu buka:
- `http://localhost:8000/` untuk tur utama
- `http://localhost:8000/pitch-finder.html` untuk cari pitch/yaw gambar 360
- `http://localhost:8000/denah-finder.html` untuk cari x%/y% pada denah

(Catatan: ini hanya perlu untuk pratinjau di komputer sendiri. Kalau
filenya sudah diupload ke hosting/domain asli, semua halaman ini
otomatis berjalan normal tanpa perlu server lokal.)

## Yang dihapus dari versi sebelumnya

- Fitur komentar (panel komentar, pin komentar, modal isi komentar)
  dihapus sepenuhnya.
- Editor hotspot berbasis Firestore (`?edit=1`, tombol mode edit,
  penyimpanan realtime) dihapus — digantikan alur manual: cari
  koordinat lewat `pitch-finder.html`, lalu tempel ke `content.js`.
- `core/firebase.js`, `core/comments.js`, `core/editor.js` tidak lagi
  dipakai — tidak ada lagi ketergantungan ke Firebase.
