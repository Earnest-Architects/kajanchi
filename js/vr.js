/**
 * ============================================================
 *  vr.js — VIEWER VR (vr.html)
 * ============================================================
 * Memakai data yang SAMA PERSIS dengan tur biasa (js/content.js) —
 * tidak ada data yang perlu diduplikasi. Kalau content.js berubah
 * (nambah/kurang ruangan), menu di sini otomatis ikut menyesuaikan.
 *
 * Cara kerja:
 *   - Gambar 360 ditempel ke <a-sky>, yang otomatis dirender stereo
 *     oleh A-Frame begitu browser masuk sesi WebXR immersive-vr
 *     (misalnya lewat browser bawaan headset Meta Quest).
 *   - Panel menu berbentuk lingkaran mengelilingi posisi pengguna,
 *     satu tombol per ruangan, supaya pengguna bisa pindah ruangan
 *     tanpa perlu melepas headset.
 * ============================================================
 */
import { views, findView, projectName } from "./content.js";

/* Komponen kecil: bikin sebuah entity selalu menghadap satu titik
   tertentu (dipakai supaya tombol menu selalu menghadap pengguna,
   berapa pun sudut penempatannya di lingkaran). */
AFRAME.registerComponent("face-point", {
  schema: { x: { default: 0 }, y: { default: 1.6 }, z: { default: 0 } },
  init() {
    this.el.object3D.lookAt(this.data.x, this.data.y, this.data.z);
  },
});

const params = new URLSearchParams(window.location.search);
const startId = params.get("scene") || (views[0] && views[0].id);

const sky = document.getElementById("sky");
const menu = document.getElementById("menu");

function loadScene(id) {
  const v = findView(id) || views[0];
  if (!v) return;
  sky.setAttribute("src", v.image);
  document.title = `${v.title} — ${projectName} VR`;
  buildMenu(v.id);
}

function buildMenu(activeId) {
  menu.innerHTML = "";

  const radius = 3.2;
  const angleStep = (2 * Math.PI) / views.length;

  views.forEach((v, i) => {
    const angle = i * angleStep;
    const x = radius * Math.sin(angle);
    const z = -radius * Math.cos(angle);
    const isActive = v.id === activeId;

    const btn = document.createElement("a-entity");
    btn.setAttribute("position", `${x} 1.6 ${z}`);
    btn.setAttribute("face-point", "x: 0; y: 1.6; z: 0");
    btn.classList.add("clickable");

    btn.setAttribute(
      "geometry",
      "primitive: plane; width: 1.5; height: 0.42"
    );
    btn.setAttribute(
      "material",
      `color: ${isActive ? "#c9a24b" : "#161616"}; opacity: 0.88; side: double`
    );
    btn.setAttribute(
      "text",
      `value: ${v.title}; align: center; color: #f5f2ea; width: 2.6; wrapCount: 22`
    );

    /* Efek hover kecil supaya jelas kalau tombol bisa diklik */
    btn.addEventListener("mouseenter", () => {
      btn.setAttribute("scale", "1.08 1.08 1.08");
    });
    btn.addEventListener("mouseleave", () => {
      btn.setAttribute("scale", "1 1 1");
    });
    btn.addEventListener("click", () => {
      if (v.id !== activeId) loadScene(v.id);
    });

    menu.appendChild(btn);
  });

  /* Tombol tambahan: kembali ke tur biasa, ditaruh di tengah lingkaran
     menghadap ke arah datang pertama kali (yaw 0). */
  const exitBtn = document.createElement("a-entity");
  exitBtn.setAttribute("position", "0 1.05 -3.2");
  exitBtn.setAttribute("face-point", "x: 0; y: 1.05; z: 0");
  exitBtn.classList.add("clickable");
  exitBtn.setAttribute("geometry", "primitive: plane; width: 1.1; height: 0.34");
  exitBtn.setAttribute("material", "color: #3a3a3a; opacity: 0.8; side: double");
  exitBtn.setAttribute(
    "text",
    "value: ← Back to tour; align: center; color: #f5f2ea; width: 2.2"
  );
  exitBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  menu.appendChild(exitBtn);
}

loadScene(startId);
