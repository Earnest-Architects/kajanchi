/**
 * ============================================================
 *  viewer.js — CORE VIEWER
 * ============================================================
 * Membungkus instance Pannellum. Membangun konfigurasi scene
 * langsung dari data di content.js — kalau content.js bertambah
 * atau berkurang isinya, viewer ini otomatis menyesuaikan tanpa
 * perlu diedit sama sekali.
 * ============================================================
 */
import { views, findView, projectName } from "./content.js";
import { createNavHotspotEl } from "./hotspots.js";
import { setCurrentView, getCurrentViewId, tourEvents } from "./state.js";

/* ---------- Judul halaman (tab browser) & judul besar HUD ----------
   Satu-satunya sumber datanya adalah `projectName` di content.js —
   ganti nilainya di sana, kedua judul di bawah ikut berubah otomatis. */
document.title = `${projectName} Virtual Tour | Earnest Architects`;

const projectTitleEl = document.getElementById("project-title");
if (projectTitleEl) projectTitleEl.textContent = `${projectName} Virtual Tour`;

export const viewer = pannellum.viewer("panorama", {
  default: {
    firstScene: views[0].id,
    sceneFadeDuration: 600,
    autoLoad: true,
    showControls: false,
    compass: false,
    hfov: 100,
  },
  scenes: Object.fromEntries(
    views.map((v) => [
      v.id,
      {
        type: "equirectangular",
        panorama: v.image,
        autoLoad: true,
        yaw: v.yawOffset || 0,
        hotSpots: (v.pitchPoints || []).map((p) => ({
          pitch: p.pitch,
          yaw: p.yaw,
          type: "scene",
          sceneId: p.target,
          cssClass: "nav-hotspot",
          createTooltipFunc: createNavHotspotEl,
          createTooltipArgs: p.label || (findView(p.target) || {}).title || "",
        })),
      },
    ])
  ),
});

/** Pindah ke view lain. Dipakai floorplan.js (klik titik di denah). */
export function goToView(id) {
  if (!id) return;
  viewer.loadScene(id);
}

/* ---------- Nama ruangan (eyebrow kecil di atas judul project) ---------- */

const sceneTitleEl = document.getElementById("scene-title");

function updateTitle(id) {
  const v = findView(id);
  if (v && sceneTitleEl) sceneTitleEl.textContent = v.title;
}

/* ---------- Loading screen ----------
   Animasi brand "Earnest Architects" butuh waktu untuk tampil penuh
   dengan mulus, jadi loading screen ditahan minimal MIN_LOADING_MS
   walaupun panorama sudah selesai dimuat lebih cepat dari itu. */

const loadingScreen = document.getElementById("loading-screen");
const MIN_LOADING_MS = 1700;
const loadingStartedAt = performance.now();

function hideLoadingScreen() {
  loadingScreen.classList.add("hidden");
  tourEvents.emit("viewerload", { id: viewer.getScene() });
}

viewer.on("load", () => {
  const elapsed = performance.now() - loadingStartedAt;
  const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
  setTimeout(hideLoadingScreen, remaining);
});

viewer.on("scenechange", (id) => {
  setCurrentView(id);
  updateTitle(id);
});

/* ---------- Fullscreen control ---------- */

const fullscreenBtn = document.getElementById("fullscreen-btn");

const supportsFullscreen =
  document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;

if (!supportsFullscreen) {
  // iPhone (iOS Safari & semua browser di iOS) belum mendukung Fullscreen API
  // untuk elemen selain <video>, jadi tombolnya disembunyikan saja.
  fullscreenBtn.style.display = "none";
} else {
  fullscreenBtn.addEventListener("click", () => viewer.toggleFullscreen());
}

/* ---------- Tombol VR (buka viewer VR di vr.html) ---------- */
/* Membawa scene yang sedang dilihat lewat ?scene=..., supaya begitu
   masuk mode VR, pengguna melanjutkan dari ruangan yang sama. */

const vrBtn = document.getElementById("vr-btn");

if (vrBtn) {
  vrBtn.addEventListener("click", () => {
    const id = getCurrentViewId() || views[0].id;
    window.location.href = `vr.html?scene=${encodeURIComponent(id)}`;
  });
}

/* ---------- Share (copy link / native share) ---------- */

const shareBtn = document.getElementById("share-btn");
const toastEl = document.getElementById("toast");

let toastTimer = null;
function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("visible"), 2400);
}

async function copyLinkFallback(url) {
  const input = document.createElement("textarea");
  input.value = url;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  try {
    document.execCommand("copy");
    return true;
  } catch (err) {
    return false;
  } finally {
    document.body.removeChild(input);
  }
}

async function copyLink() {
  const url = window.location.href;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(url);
      showToast("リンクをコピーしました");
      return;
    } catch (err) {
      /* lanjut ke fallback di bawah */
    }
  }
  const ok = await copyLinkFallback(url);
  showToast(ok ? "リンクをコピーしました" : "コピーに失敗しました");
}

if (shareBtn) {
  shareBtn.addEventListener("click", async () => {
    const shareData = {
      title: document.title,
      text: `${projectName} Virtual Tour — Earnest Architects`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Pengguna membatalkan share sheet, atau gagal — jangan tampilkan
        // pesan error, cukup diamkan (perilaku umum Web Share API).
        if (err && err.name === "AbortError") return;
      }
    }
    copyLink();
  });
}

/* ---------- Inisialisasi view pertama ---------- */
setCurrentView(views[0].id);
updateTitle(views[0].id);
