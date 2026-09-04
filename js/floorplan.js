/**
 * ============================================================
 *  floorplan.js — panel denah kanan-bawah
 * ============================================================
 * Tab pilih lantai, titik pandang yang bisa diklik untuk pindah
 * view, dan zoom/pan gambar denah. Semua data (lantai, titik)
 * dibaca langsung dari content.js — tambah/hapus lantai atau
 * titik di sana, panel ini otomatis menyesuaikan.
 * ============================================================
 */
import { floors, findFloor, floorsForView, labelForTarget } from "./content.js";
import { getCurrentViewId, tourEvents } from "./state.js";
import { goToView } from "./viewer.js";

let activeFloorId = floors[0].id;

/* ---------- DOM refs ---------- */

const floorTabsWrap = document.getElementById("floor-tabs");
const floorplanImg = document.getElementById("floorplan-img");
const floorplanCanvas = document.getElementById("floorplan-canvas");
const floorplanPanel = document.getElementById("floorplan-panel");
const floorplanHideBtn = document.getElementById("floorplan-hide-btn");
const floorplanShowBtn = document.getElementById("floorplan-show-btn");
const floorplanViewport = document.getElementById("floorplan-viewport");
const zoomInBtn = document.getElementById("zoom-in-btn");
const zoomOutBtn = document.getElementById("zoom-out-btn");
const zoomResetBtn = document.getElementById("zoom-reset-btn");

/* ---------- Tab lantai ---------- */

floors.forEach((floor) => {
  const tab = document.createElement("button");
  tab.type = "button";
  tab.className = "floor-tab";
  tab.dataset.floor = floor.id;
  tab.textContent = floor.label;
  tab.setAttribute("role", "tab");
  tab.addEventListener("click", () => setActiveFloor(floor.id));
  floorTabsWrap.appendChild(tab);
});

function setActiveFloor(floorId) {
  activeFloorId = floorId;
  const floor = findFloor(floorId);
  if (floor) {
    floorplanImg.src = floor.image;
    floorplanImg.alt = floor.name + "の平面図と視点";
  }
  document.querySelectorAll(".floor-tab").forEach((tab) => {
    const isActive = tab.dataset.floor === floorId;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  resetZoom();
  renderViewpointDots();
}

/* ---------- Titik pandang (dots) di atas denah ---------- */

function renderViewpointDots() {
  floorplanCanvas.querySelectorAll(".viewpoint-dot").forEach((d) => d.remove());
  const floor = findFloor(activeFloorId);
  (floor ? floor.points : []).forEach((point) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "viewpoint-dot";
    dot.dataset.view = point.target;
    dot.style.left = point.x + "%";
    dot.style.top = point.y + "%";
    dot.setAttribute("aria-label", "この地点から見る: " + labelForTarget(point.target, point.label));
    dot.addEventListener("click", () => {
      if (point.target === getCurrentViewId()) return;
      goToView(point.target);
    });
    floorplanCanvas.appendChild(dot);
  });
  highlightActiveDot();
}

function highlightActiveDot() {
  const currentId = getCurrentViewId();
  document.querySelectorAll(".viewpoint-dot").forEach((dot) => {
    dot.classList.toggle("active", dot.dataset.view === currentId);
  });
}

/** Setiap kali view berpindah, cek apakah masih perlu pindah tab lantai juga. */
tourEvents.on("scenechange", ({ id }) => {
  const floorsHere = floorsForView(id);
  if (floorsHere.length && !floorsHere.some((f) => f.id === activeFloorId)) {
    setActiveFloor(floorsHere[0].id);
  } else {
    highlightActiveDot();
  }
});

/* ---------- Sembunyikan / tampilkan panel denah ---------- */

floorplanHideBtn.addEventListener("click", () => {
  floorplanPanel.classList.add("hidden");
  floorplanShowBtn.classList.add("visible");
});
floorplanShowBtn.addEventListener("click", () => {
  floorplanPanel.classList.remove("hidden");
  floorplanShowBtn.classList.remove("visible");
});

/* ---------- Zoom & pan gambar denah ---------- */

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.5;
let zoomLevel = 1;
let panX = 0;
let panY = 0;

function applyTransform() {
  floorplanCanvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

function clampPan() {
  const rect = floorplanViewport.getBoundingClientRect();
  const maxX = (rect.width * (zoomLevel - 1)) / 2;
  const maxY = (rect.height * (zoomLevel - 1)) / 2;
  panX = Math.min(maxX, Math.max(-maxX, panX));
  panY = Math.min(maxY, Math.max(-maxY, panY));
}

function updateZoomUI() {
  zoomOutBtn.disabled = zoomLevel <= ZOOM_MIN;
  zoomInBtn.disabled = zoomLevel >= ZOOM_MAX;
  zoomResetBtn.textContent = zoomLevel.toFixed(1).replace(".0", "") + "×";
  floorplanViewport.classList.toggle("zoomed", zoomLevel > 1);
}

function setZoom(next) {
  zoomLevel = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)) * 100) / 100;
  clampPan();
  applyTransform();
  updateZoomUI();
}

function resetZoom() {
  zoomLevel = 1;
  panX = 0;
  panY = 0;
  floorplanCanvas.classList.add("smooth");
  applyTransform();
  updateZoomUI();
  window.setTimeout(() => floorplanCanvas.classList.remove("smooth"), 220);
}

zoomInBtn.addEventListener("click", () => setZoom(zoomLevel + ZOOM_STEP));
zoomOutBtn.addEventListener("click", () => setZoom(zoomLevel - ZOOM_STEP));
zoomResetBtn.addEventListener("click", resetZoom);

let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let panStartX = 0;
let panStartY = 0;

floorplanViewport.addEventListener("pointerdown", (e) => {
  if (zoomLevel <= 1) return;
  if (e.target.closest(".viewpoint-dot")) return; // biarkan titik tetap bisa diklik normal
  dragging = true;
  floorplanCanvas.classList.remove("smooth");
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  panStartX = panX;
  panStartY = panY;
  floorplanViewport.setPointerCapture(e.pointerId);
});
floorplanViewport.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  panX = panStartX + (e.clientX - dragStartX);
  panY = panStartY + (e.clientY - dragStartY);
  clampPan();
  applyTransform();
});
["pointerup", "pointercancel", "pointerleave"].forEach((evt) => {
  floorplanViewport.addEventListener(evt, () => {
    dragging = false;
  });
});

// Scroll wheel untuk zoom (desktop)
floorplanViewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    setZoom(zoomLevel + (e.deltaY < 0 ? 0.25 : -0.25));
  },
  { passive: false }
);

/* ---------- Inisialisasi ---------- */
updateZoomUI();
setActiveFloor(activeFloorId);
