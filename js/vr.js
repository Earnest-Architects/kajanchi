/**
 * ============================================================
 *  vr.js — VIEWER VR (vr.html)
 * ============================================================
 * Memakai data yang SAMA PERSIS dengan tur biasa (js/content.js) —
 * tidak ada data yang perlu diduplikasi. Kalau content.js berubah
 * (nambah/kurang ruangan/pitchPoints), tampilan VR otomatis ikut
 * menyesuaikan.
 *
 * Cara kerja:
 *   - Gambar 360 ditempel ke <a-sky>, yang otomatis dirender stereo
 *     oleh A-Frame begitu browser masuk sesi WebXR immersive-vr
 *     (misalnya lewat browser bawaan headset Meta Quest).
 *   - Hotspot navigasi memakai "pitchPoints" yang SAMA seperti yang
 *     dipakai tampilan web (Pannellum) — jadi panah nav di VR nempel
 *     di posisi yang sama persis dengan panah di web, bukan menu
 *     ruangan terpisah seperti versi sebelumnya.
 *   - Zoom in/out dikontrol lewat "zoom HUD": bar vertikal (mirip
 *     volume) yang selalu menempel di sudut pandang pengguna.
 * ============================================================
 */
import { views, findView, projectName } from "./content.js";

/* Komponen kecil: bikin sebuah entity menghadap satu titik tertentu
   (dipakai supaya ring hotspot selalu menghadap posisi pengguna,
   yang tetap diam di tengah/0 1.6 0). */
AFRAME.registerComponent("face-point", {
  schema: { x: { default: 0 }, y: { default: 1.6 }, z: { default: 0 } },
  init() {
    this.el.object3D.lookAt(this.data.x, this.data.y, this.data.z);
  },
});

/* ---------- Util: pitch/yaw (derajat) -> posisi 3D di bola langit ----------
   BUG LAMA: offset yaw sky ditambahkan langsung ke sudut sebelum sin/cos
   ("yaw + SKY_YAW_OFFSET"). Itu bukan cara yang benar untuk "mengikuti"
   rotasi <a-sky> — hasilnya adalah versi yang KEBALIK 180° dari posisi
   yang seharusnya (titik antipodal), makanya ring hotspot muncul di
   tempat yang berantakan/salah, dan otomatis susah diklik karena
   pengguna melihat/mengarahkan cursor ke tempat yang sebenarnya
   BUKAN posisi asli hotspot itu.

   FIX: hitung dulu arah "asli" dari pitch/yaw (persis rumus yang
   dipakai Pannellum secara internal), lalu terapkan ROTASI Y yang
   SAMA PERSIS seperti rotation Y pada <a-sky> di vr.html (memakai
   matriks rotasi Y yang benar, bukan sekadar tambah sudut). Dengan
   begini hotspot akan selalu ikut kalau suatu saat rotation <a-sky>
   diubah, tanpa perlu tebak-tebak tanda (+/-) lagi.

   SKY_ROTATION_Y wajib sama dengan angka rotation Y pada <a-sky
   id="sky" rotation="0 SKY_ROTATION_Y 0"> di vr.html. */
const SKY_ROTATION_Y = -90;
const HOTSPOT_RADIUS = 4.5;

function pitchYawToPosition(pitch, yaw) {
  const pitchRad = (pitch * Math.PI) / 180;
  const yawRad = (yaw * Math.PI) / 180;

  // Arah asli (native), sebelum rotasi sky diterapkan
  const nx = HOTSPOT_RADIUS * Math.cos(pitchRad) * Math.sin(yawRad);
  const nz = -HOTSPOT_RADIUS * Math.cos(pitchRad) * Math.cos(yawRad);

  // Rotasi Y yang identik dengan rotation Y pada <a-sky>
  const rot = (SKY_ROTATION_Y * Math.PI) / 180;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);
  const x = nx * cosR + nz * sinR;
  const z = -nx * sinR + nz * cosR;
  const y = 1.6 + HOTSPOT_RADIUS * Math.sin(pitchRad);

  return { x, y, z };
}

const params = new URLSearchParams(window.location.search);
const startId = params.get("scene") || (views[0] && views[0].id);

const sky = document.getElementById("sky");
const hotspots = document.getElementById("hotspots");

function loadScene(id) {
  const v = findView(id) || views[0];
  if (!v) return;
  sky.setAttribute("src", v.image);
  document.title = `${v.title} — ${projectName} VR`;
  buildHotspots(v);
}

/* ---------- Hotspot navigasi (identik dengan web: ring + label) ---------- */
function buildHotspots(view) {
  hotspots.innerHTML = "";

  (view.pitchPoints || []).forEach((p) => {
    const { x, y, z } = pitchYawToPosition(p.pitch, p.yaw);
    const label = p.label || (findView(p.target) || {}).title || "";

    /* Wrapper: cuma untuk posisi + menghadap ke user. TIDAK punya
       geometry sendiri, dan karena itu TIDAK diberi class "clickable"
       — supaya tidak ada elemen tanpa mesh yang "mengklaim" bisa
       diklik padahal raycaster tidak akan pernah kena dia. */
    const hotspot = document.createElement("a-entity");
    hotspot.setAttribute("position", `${x} ${y} ${z}`);
    hotspot.setAttribute("face-point", "x: 0; y: 1.6; z: 0");

    /* Ring luar adalah entity UTAMA yang bisa diklik: dia yang punya
       geometry (jadi target nyata buat raycaster ".clickable"), class
       "clickable", DAN event listener-nya sekaligus — tidak
       bergantung pada bubbling event dari child element mana pun. */
    const ring = document.createElement("a-entity");
    ring.classList.add("clickable");
    ring.setAttribute("geometry", "primitive: ring; radiusInner: 0.16; radiusOuter: 0.2; segmentsTheta: 32");
    ring.setAttribute("material", "color: #7fa4d6; shader: flat; opacity: 0.85; side: double");
    hotspot.appendChild(ring);

    /* Titik tengah — warna sama seperti --paper (#eef2f8) di web.
       Hanya visual, jadi tidak perlu class/listener sendiri. */
    const dot = document.createElement("a-entity");
    dot.setAttribute("geometry", "primitive: circle; radius: 0.07; segments: 24");
    dot.setAttribute("material", "color: #eef2f8; shader: flat; opacity: 0.9; side: double");
    dot.setAttribute("position", "0 0 0.001");
    ring.appendChild(dot);

    /* Label nama ruangan tujuan, di bawah ring */
    const text = document.createElement("a-entity");
    text.setAttribute(
      "text",
      `value: ${label}; align: center; color: #eef2f8; width: 2.4; wrapCount: 20`
    );
    text.setAttribute("position", "0 -0.32 0");
    ring.appendChild(text);

    /* Efek hover + klik langsung di entity yang sama dengan raycast target */
    ring.addEventListener("mouseenter", () => {
      ring.setAttribute("scale", "1.18 1.18 1.18");
    });
    ring.addEventListener("mouseleave", () => {
      ring.setAttribute("scale", "1 1 1");
    });
    ring.addEventListener("click", () => loadScene(p.target));

    hotspots.appendChild(hotspot);
  });
}

/* ============================================================
   Zoom HUD — bar vertikal mirip volume, menempel di sudut pandang
   (child dari <a-camera>, jadi selalu ikut ke mana pun user menoleh).
   Catatan: ini mengubah field-of-view (fov) kamera. Di sesi WebXR
   immersive-vr sungguhan (headset native), fov biasanya dikunci oleh
   device sendiri; efeknya paling terasa di mode "magic window"
   (preview VR lewat browser HP/desktop tanpa sesi immersive), yang
   sepertinya ini mode yang sedang dites sekarang.
============================================================ */
const zoomHud = document.getElementById("zoomHud");
const camera = document.getElementById("camera");

const DEFAULT_FOV = 80;
const MIN_FOV = 40; // paling zoom-in
const MAX_FOV = 100; // paling zoom-out
const FOV_STEP = 8;
const TRACK_HEIGHT = 0.5;

let currentFov = DEFAULT_FOV;
let fill; // element bar isi, diisi oleh buildZoomHud()

function levelFromFov(fov) {
  // 0 = paling zoom-out (MAX_FOV), 1 = paling zoom-in (MIN_FOV)
  return (MAX_FOV - fov) / (MAX_FOV - MIN_FOV);
}

function applyFov(fov) {
  currentFov = Math.min(MAX_FOV, Math.max(MIN_FOV, fov));
  camera.setAttribute("camera", "fov", currentFov);
  updateFill();
}

function updateFill() {
  const level = levelFromFov(currentFov);
  const fillHeight = Math.max(0.02, TRACK_HEIGHT * level);
  fill.setAttribute("height", fillHeight);
  fill.setAttribute("position", `0 ${-TRACK_HEIGHT / 2 + fillHeight / 2} 0.001`);
}

function buildZoomHud() {
  zoomHud.innerHTML = "";

  /* Track/rel bar — dibuat cukup transparan secara default supaya
     tidak "berat" menghalangi pandangan; jadi lebih terlihat hanya
     saat cursor benar-benar diarahkan ke sana (mouseenter/leave). */
  const track = document.createElement("a-plane");
  track.setAttribute("width", "0.045");
  track.setAttribute("height", TRACK_HEIGHT);
  track.setAttribute("color", "#161616");
  track.setAttribute("opacity", "0.28");
  track.classList.add("clickable");
  track.addEventListener("mouseenter", () => {
    track.setAttribute("opacity", "0.6");
    fill.setAttribute("opacity", "0.95");
  });
  track.addEventListener("mouseleave", () => {
    track.setAttribute("opacity", "0.28");
    fill.setAttribute("opacity", "0.55");
  });
  zoomHud.appendChild(track);

  /* Isi bar (menunjukkan level zoom saat ini, seperti volume) */
  const fillEl = document.createElement("a-plane");
  fillEl.setAttribute("width", "0.045");
  fillEl.setAttribute("color", "#7fa4d6");
  fillEl.setAttribute("opacity", "0.55");
  zoomHud.appendChild(fillEl);
  fill = fillEl;

  /* Tombol zoom-in (+) di atas bar */
  const plusBtn = document.createElement("a-entity");
  plusBtn.setAttribute("position", `0 ${TRACK_HEIGHT / 2 + 0.09} 0`);
  plusBtn.classList.add("clickable");
  plusBtn.setAttribute("geometry", "primitive: circle; radius: 0.055; segments: 20");
  plusBtn.setAttribute("material", "color: #161616; opacity: 0.4; side: double");
  plusBtn.addEventListener("mouseenter", () => plusBtn.setAttribute("material", "opacity", 0.75));
  plusBtn.addEventListener("mouseleave", () => plusBtn.setAttribute("material", "opacity", 0.4));
  const plusLabel = document.createElement("a-entity");
  plusLabel.setAttribute("text", "value: +; align: center; color: #eef2f8; width: 2.4");
  plusLabel.setAttribute("position", "0 0 0.001");
  plusBtn.appendChild(plusLabel);
  plusBtn.addEventListener("click", () => applyFov(currentFov - FOV_STEP));
  zoomHud.appendChild(plusBtn);

  /* Tombol zoom-out (−) di bawah bar */
  const minusBtn = document.createElement("a-entity");
  minusBtn.setAttribute("position", `0 ${-TRACK_HEIGHT / 2 - 0.09} 0`);
  minusBtn.classList.add("clickable");
  minusBtn.setAttribute("geometry", "primitive: circle; radius: 0.055; segments: 20");
  minusBtn.setAttribute("material", "color: #161616; opacity: 0.4; side: double");
  minusBtn.addEventListener("mouseenter", () => minusBtn.setAttribute("material", "opacity", 0.75));
  minusBtn.addEventListener("mouseleave", () => minusBtn.setAttribute("material", "opacity", 0.4));
  const minusLabel = document.createElement("a-entity");
  minusLabel.setAttribute("text", "value: -; align: center; color: #eef2f8; width: 2.4");
  minusLabel.setAttribute("position", "0 0 0.001");
  minusBtn.appendChild(minusLabel);
  minusBtn.addEventListener("click", () => applyFov(currentFov + FOV_STEP));
  zoomHud.appendChild(minusBtn);

  /* Klik langsung di track untuk lompat ke level tertentu (seperti geser volume) */
  track.addEventListener("click", (evt) => {
    const point = evt.detail.intersection && evt.detail.intersection.point;
    if (!point) return;
    const local = new THREE.Vector3();
    track.object3D.worldToLocal(local.copy(point));
    const level = Math.min(1, Math.max(0, local.y / TRACK_HEIGHT + 0.5));
    applyFov(MAX_FOV - level * (MAX_FOV - MIN_FOV));
  });
}

buildZoomHud();
applyFov(DEFAULT_FOV);

loadScene(startId);
