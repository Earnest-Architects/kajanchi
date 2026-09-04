/**
 * ============================================================
 *  content.js — SATU-SATUNYA FILE YANG PERLU DIEDIT
 * ============================================================
 * Semua konten tur ada di sini: daftar lantai (denah), daftar
 * gambar 360 (views), titik pada denah, dan panah navigasi
 * (pitch point) di dalam tiap gambar 360.
 *
 * Tidak perlu menyentuh file JS lain untuk:
 *   - menambah / menghapus lantai
 *   - menambah / menghapus gambar 360 (view)
 *   - menambah / menghapus titik pada denah
 *   - menambah / menghapus pitch point di dalam gambar 360
 * Cukup tambah atau hapus objeknya di array yang bersangkutan,
 * tampilan (denah, panah navigasi) otomatis menyesuaikan.
 *
 * CARA MENCARI NILAI PITCH & YAW:
 *   Buka pitch-finder.html, pilih gambar 360 yang mau dicari
 *   titiknya, lalu klik posisi yang diinginkan di dalam gambar.
 *   Nilai pitch & yaw akan muncul dan bisa langsung disalin ke
 *   dalam "pitchPoints" di bawah.
 *
 * NAMA PROJECT (projectName):
 *   Dipakai otomatis oleh js/viewer.js untuk:
 *     - Judul tab browser  -> "(projectName) Virtual Tour | Earnest Architects"
 *     - Judul besar di layar -> "(projectName) Virtual Tour"
 *   Ganti nilainya di sini saja, tidak perlu edit file JS lain.
 * ============================================================
 */

export const projectName = "Kajanchi";

/* ============================================================
   1) DENAH (FLOORPLAN)
   ------------------------------------------------------------
   Setiap objek di array ini = 1 lantai.
   - image  : path gambar denah lantai tsb.
   - points : titik-titik pada denah yang bisa diklik untuk
              berpindah ke sebuah VIEW 360.
       target : harus sama persis dengan salah satu "id" di
                array `views` di bagian bawah file ini.
       x, y   : posisi titik pada gambar denah, dalam PERSEN (%)
                dihitung dari kiri (x) dan dari atas (y).
       label  : opsional. Kalau tidak diisi, otomatis memakai
                "title" dari view tujuannya.

   Tambah lantai baru = tambah 1 objek baru di array `floors`.
   Hapus lantai = hapus objeknya dari array ini.
============================================================ */
export const floors = [
  {
    id: "floor1",
    label: "1F",
    name: "1階",
    image: "assets/floorplan.jpg",
    points: [
  { target: "view1", x: 72.2, y: 83 },
  { target: "view2", x: 47.4, y: 33 },
  { target: "view3", x: 64, y: 24.5 },
  { target: "view4", x: 39, y: 22.7 },
  { target: "view5", x: 36.1, y: 15.1 },
  { target: "view6", x: 67.8, y: 15.9 },
  { target: "view8", x: 52.8, y: 97.8 },
],
  },
];

/* ============================================================
   2) GAMBAR 360 (VIEWS)
   ------------------------------------------------------------
   Setiap objek di array ini = 1 gambar panorama 360.
   - id         : pengenal unik. Dipakai sebagai "target" di atas
                  dan di pitchPoints view lain.
   - title      : judul yang tampil di layar & dipakai otomatis
                  sebagai label titik/pitch point yang menuju ke
                  view ini kalau label tidak diisi manual.
   - image      : path file gambar panorama.
   - yawOffset  : opsional, arah hadap awal saat view ini dibuka
                  (derajat, 0-360).
   - pitchPoints: panah navigasi yang menempel DI DALAM gambar
                  360 ini, menuju view lain.
       pitch  : sudut atas/bawah (ambil dari pitch-finder.html)
       yaw    : sudut kiri/kanan (ambil dari pitch-finder.html)
       target : id view tujuan saat panah diklik
       label  : opsional, teks yang tampil di panah. Kalau
                dikosongkan, otomatis pakai title dari view target.

   Tambah gambar 360 baru = tambah 1 objek baru di array `views`,
   lalu taruh file panoramanya di folder assets/.
   Hapus view = hapus objeknya dari array ini (jangan lupa hapus
   juga pitchPoints/titik denah lain yang masih menunjuk ke id-nya).
============================================================ */
export const views = [
  {
    id: "view1",
    title: "Exterior-close",
    image: "assets/EX2-CLOSE.jpg",
    yawOffset: 0,
    pitchPoints: [
       { pitch: 3.17, yaw: 97.59, target: "view2" },
       { pitch: -10.29, yaw: -42.11, target: "view9" },
       { pitch: -16.84, yaw: -94.42, target: "view8" },
    ],
  },
  {
    id: "view2",
    title: "Master Bedroom",
    image: "assets/pano2.jpg",
    yawOffset: 0,
    pitchPoints: [
        { pitch: -2.72, yaw: 87.5, target: "view1" },
        { pitch: -20.28, yaw: -37.74, target: "view3" },
    ],
  },
  {
    id: "view3",
    title: "Master Bedroom",
    image: "assets/pano3.jpg",
    yawOffset: 0,
    pitchPoints: [
    { pitch: -2.47, yaw: 10.51, target: "view1" },
    { pitch: -19.93, yaw: 31.85, target: "view2" },
    { pitch: -19.76, yaw: 79.18, target: "view4" },
    ],
  },
  {
    id: "view4",
    title: "W.I.C",
    image: "assets/pano4.jpg",
    yawOffset: 0,
    pitchPoints: [
    { pitch: -30.76, yaw: -158.68, target: "view3" },
    { pitch: -33.52, yaw: 85.58, target: "view5" },
    ],
  },
  {
    id: "view5",
    title: "Dressing Room",
    image: "assets/pano5.jpg",
    yawOffset: 0,
    pitchPoints: [
  { pitch: -15.21, yaw: 26.4, target: "view6" },
  { pitch: -35.95, yaw: 61.21, target: "view4" },
],
  },
  {
    id: "view6",
    title: "Bathroom",
    image: "assets/pano6.jpg",
    yawOffset: 0,
    pitchPoints: [ { pitch: -27.31, yaw: -87.86, target: "view5" },],
  },
   {
    id: "view7",
    title: "Open",
    image: "assets/EX-OPEN.jpg",
    yawOffset: 0,
    pitchPoints: [ 
       { pitch: 8.82, yaw: -6.25, target: "view8" },
       { pitch: -11.83, yaw: 22.45, target: "view1" },
    ],
  },
   {
    id: "view8",
    title: "Exterior-close",
    image: "assets/EX-CLOSE.jpg",
    yawOffset: 0,
    pitchPoints: [
       { pitch: -7.33, yaw: -6.38, target: "view7" },
       { pitch: -10.68, yaw: 21.88, target: "view1" },
    ],
  },
   {
    id: "view9",
    title: "Open",
    image: "assets/EX2-OPEN.jpg",
    yawOffset: 0,
    pitchPoints: [
       { pitch: 17.8, yaw: -43.33, target: "view1" },
       { pitch: -15.65, yaw: -95.91, target: "view8" },
       { pitch: 2.68, yaw: 97.91, target: "view2" },
    ],
  },
];

/* ============================================================
   Helper — TIDAK PERLU DIEDIT
   Dipakai oleh js/viewer.js dan js/floorplan.js untuk membaca
   data di atas. Diletakkan di sini supaya file ini tetap jadi
   satu-satunya sumber kebenaran untuk seluruh konten tur.
============================================================ */
export function findView(id) {
  return views.find((v) => v.id === id);
}

export function findFloor(id) {
  return floors.find((f) => f.id === id);
}

/** Semua lantai yang punya titik menuju view ini (dipakai saat pindah view untuk tahu harus pindah tab lantai ke mana). */
export function floorsForView(viewId) {
  return floors.filter((f) => f.points.some((p) => p.target === viewId));
}

/** Label yang ditampilkan untuk sebuah target: pakai label manual kalau ada, kalau tidak pakai title dari view tujuannya. */
export function labelForTarget(targetId, explicitLabel) {
  if (explicitLabel) return explicitLabel;
  const v = findView(targetId);
  return v ? v.title : targetId;
}
