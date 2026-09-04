/**
 * ============================================================
 *  hotspots.js — tampilan panah navigasi di dalam gambar 360
 * ============================================================
 * Satu fungsi saja: cara sebuah pitch point digambar di dalam
 * panorama. Dipakai oleh viewer.js.
 * ============================================================
 */
export function createNavHotspotEl(hotSpotDiv, text) {
  hotSpotDiv.classList.add("nav-hotspot-inner");
  hotSpotDiv.innerHTML = `
    <span class="nav-hotspot-ring"></span>
    <svg class="nav-hotspot-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7"/>
    </svg>
    <span class="nav-hotspot-label">${text}</span>
  `;
}
