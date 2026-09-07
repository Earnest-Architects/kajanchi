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
   SKY_YAW_OFFSET harus sama dengan rotation Y pada <a-sky> di vr.html
   (saat ini "0 -90 0"). Ini kalibrasi supaya hotspot yang dihitung dari
   pitch/yaw content.js nempel di tempat yang SAMA PERSIS seperti yang
   muncul di tampilan web (Pannellum). Kalau posisi hotspot di headset
   kerasa "muter"/tidak pas, cukup ubah angka ini saja — rumus di
   bawah tidak perlu diutak-atik. */
const SKY_YAW_OFFSET = -90;
const HOTSPOT_RADIUS = 4.5;

function pitchYawToPosition(pitch, yaw) {
  const yawRad = ((yaw + SKY_YAW_OFFSET) * Math.PI) / 180;
  const pitchRad = (pitch * Math.PI) / 180;
  const x = HOTSPOT_RADIUS * Math.cos(pitchRad) * Math.sin(yawRad);
  const y = 1.6 + HOTSPOT_RADIUS * Math.sin(pitchRad);
  const z = -HOTSPOT_RADIUS * Math.cos(pitchRad) * Math.cos(yawRad);
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

    const hotspot = document.createElement("a-entity");
    hotspot.setAttribute("position", `${x} ${y} ${z}`);
    hotspot.setAttribute("face-point", "x: 0; y: 1.6; z: 0");
    hotspot.classList.add("clickable");

    /* Ring luar — warna sama seperti --accent (#7fa4d6) di web */
    const ring = document.createElement("a-entity");
    ring.setAttribute("geometry", "primitive: ring; radiusInner: 0.16; radiusOuter: 0.2; segmentsTheta: 32");
    ring.setAttribute("material", "color: #7fa4d6; shader: flat; opacity: 0.85; side: double");
    hotspot.appendChild(ring);

    /* Titik tengah — warna sama seperti --paper (#eef2f8) di web */
    const dot = document.createElement("a-entity");
    dot.setAttribute("geometry", "primitive: circle; radius: 0.07; segments: 24");
    dot.setAttribute("material", "color: #eef2f8; shader: flat; opacity: 0.9; side: double");
    dot.setAttribute("position", "0 0 0.001");
    hotspot.appendChild(dot);

    /* Label nama ruangan tujuan, di bawah ring */
    const text = document.createElement("a-entity");
    text.setAttribute(
      "text",
      `value: ${label}; align: center; color: #eef2f8; width: 2.4; wrapCount: 20`
    );
    text.setAttribute("position", "0 -0.32 0");
    hotspot.appendChild(text);

    /* Efek hover kecil supaya jelas kalau hotspot bisa diklik */
    hotspot.addEventListener("mouseenter", () => {
      hotspot.setAttribute("scale", "1.18 1.18 1.18");
    });
    hotspot.addEventListener("mouseleave", () => {
      hotspot.setAttribute("scale", "1 1 1");
    });
    hotspot.addEventListener("click", () => loadScene(p.target));

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

  /* Track/rel bar */
  const track = document.createElement("a-plane");
  track.setAttribute("width", "0.045");
  track.setAttribute("height", TRACK_HEIGHT);
  track.setAttribute("color", "#161616");
  track.setAttribute("opacity", "0.55");
  track.classList.add("clickable");
  zoomHud.appendChild(track);

  /* Isi bar (menunjukkan level zoom saat ini, seperti volume) */
  const fillEl = document.createElement("a-plane");
  fillEl.setAttribute("width", "0.045");
  fillEl.setAttribute("color", "#7fa4d6");
  fillEl.setAttribute("opacity", "0.9");
  zoomHud.appendChild(fillEl);
  fill = fillEl;

  /* Tombol zoom-in (+) di atas bar */
  const plusBtn = document.createElement("a-entity");
  plusBtn.setAttribute("position", `0 ${TRACK_HEIGHT / 2 + 0.09} 0`);
  plusBtn.classList.add("clickable");
  plusBtn.setAttribute("geometry", "primitive: circle; radius: 0.055; segments: 20");
  plusBtn.setAttribute("material", "color: #161616; opacity: 0.7; side: double");
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
  minusBtn.setAttribute("material", "color: #161616; opacity: 0.7; side: double");
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
