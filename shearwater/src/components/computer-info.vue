<script setup>
import { computed } from 'vue';
const props = defineProps(['dive']);

const batteryPct = computed(() => Math.max(0, Math.min(100, parseFloat(props.dive?.battery_percentage) || 0)));
const fillColor  = computed(() => {
  const hue = parseFloat(props.dive?.battery_percent_remaining) || 0;
  return `hsl(${hue}, 75%, 38%)`;
});
</script>

<template>
  <div class="vintage-card computer-info">
    <div class="card-stripe"></div>
    <div class="card-title">{{ dive.product }}</div>
    <div class="card-row">
      <span class="card-label">S/N</span>
      <span class="card-value">{{ dive.serial_number }}</span>
    </div>
    <div class="card-row">
      <span class="card-label">Firmware</span>
      <span class="card-value">{{ dive.firmware_version }}</span>
    </div>
    <div class="battery-section">
      <div class="battery-visual">
        <svg width="44" height="92" viewBox="0 0 44 92" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- two-tone body: copper top → black bottom -->
            <linearGradient id="bi-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#9a6c1c"/>
              <stop offset="36%"  stop-color="#7a5010"/>
              <stop offset="42%"  stop-color="#3a200a"/>
              <stop offset="46%"  stop-color="#111008"/>
              <stop offset="100%" stop-color="#0c0b09"/>
            </linearGradient>
            <!-- cylindrical shading overlay: bright left highlight, dark right shadow -->
            <linearGradient id="bi-cyl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stop-color="rgba(220,150,40,0.18)"/>
              <stop offset="7%"   stop-color="rgba(255,220,110,0.72)"/>
              <stop offset="20%"  stop-color="rgba(255,255,255,0)"/>
              <stop offset="72%"  stop-color="rgba(0,0,0,0)"/>
              <stop offset="88%"  stop-color="rgba(0,0,0,0.22)"/>
              <stop offset="100%" stop-color="rgba(0,0,0,0.65)"/>
            </linearGradient>
            <!-- metallic rim/terminal: swept warm silver -->
            <linearGradient id="bi-metal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stop-color="#a09070"/>
              <stop offset="15%"  stop-color="#d8c898"/>
              <stop offset="38%"  stop-color="#f0e0b0"/>
              <stop offset="54%"  stop-color="#b09870"/>
              <stop offset="76%"  stop-color="#706050"/>
              <stop offset="100%" stop-color="#282010"/>
            </linearGradient>
            <!-- dome terminal: bright silver radial -->
            <radialGradient id="bi-dome" cx="36%" cy="30%" r="65%">
              <stop offset="0%"   stop-color="#f4f2ea"/>
              <stop offset="30%"  stop-color="#c8c0a0"/>
              <stop offset="65%"  stop-color="#8a8068"/>
              <stop offset="100%" stop-color="#3c3020"/>
            </radialGradient>
            <!-- powercheck segment glow -->
            <radialGradient id="bi-glow" cx="50%" cy="40%" r="60%">
              <stop offset="0%"   stop-color="rgba(255,255,255,0.4)"/>
              <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
            </radialGradient>
          </defs>

          <!-- ── body base (two-tone) ── -->
          <rect x="3" y="14" width="38" height="72" rx="5" fill="url(#bi-body)"/>

          <!-- ── cylindrical shading overlay ── -->
          <rect x="3" y="14" width="38" height="72" rx="5" fill="url(#bi-cyl)"/>

          <!-- ── "+" on copper section ── -->
          <text x="22" y="31" text-anchor="middle" dominant-baseline="middle"
                font-size="9" font-weight="900" font-family="Arial Black,sans-serif"
                fill="rgba(255,240,190,0.55)">+</text>

          <!-- ── PowerCheck strip (4 segments) ── -->
          <g>
            <!-- segment 1 (0-25%) -->
            <rect x="8"  y="72" width="6" height="7" rx="2"
                  :fill="batteryPct > 0  ? fillColor : '#1a1408'"/>
            <rect x="8"  y="72" width="6" height="7" rx="2"
                  :fill="batteryPct > 0  ? 'url(#bi-glow)' : 'none'"/>
            <!-- segment 2 (25-50%) -->
            <rect x="16" y="72" width="6" height="7" rx="2"
                  :fill="batteryPct > 25 ? fillColor : '#1a1408'"/>
            <rect x="16" y="72" width="6" height="7" rx="2"
                  :fill="batteryPct > 25 ? 'url(#bi-glow)' : 'none'"/>
            <!-- segment 3 (50-75%) -->
            <rect x="24" y="72" width="6" height="7" rx="2"
                  :fill="batteryPct > 50 ? fillColor : '#1a1408'"/>
            <rect x="24" y="72" width="6" height="7" rx="2"
                  :fill="batteryPct > 50 ? 'url(#bi-glow)' : 'none'"/>
            <!-- segment 4 (75-100%) -->
            <rect x="32" y="72" width="6" height="7" rx="2"
                  :fill="batteryPct > 75 ? fillColor : '#1a1408'"/>
            <rect x="32" y="72" width="6" height="7" rx="2"
                  :fill="batteryPct > 75 ? 'url(#bi-glow)' : 'none'"/>
          </g>

          <!-- ── top rim band (metal cap edge) ── -->
          <rect x="3" y="11" width="38" height="6" rx="4" fill="url(#bi-metal)"/>
          <line x1="3.5" y1="16.5" x2="40.5" y2="16.5" stroke="rgba(0,0,0,0.45)" stroke-width="1.2"/>

          <!-- ── bottom terminal ── -->
          <rect x="3" y="83" width="38" height="6" rx="3" fill="url(#bi-metal)"/>
          <line x1="4"  y1="83.5" x2="40" y2="83.5" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>

          <!-- ── dome terminal ── -->
          <circle cx="22" cy="6" r="8" fill="url(#bi-dome)"/>
          <circle cx="22" cy="6" r="8" fill="none" stroke="rgba(80,70,50,0.8)" stroke-width="1.2"/>
          <!-- dome specular dot -->
          <circle cx="20" cy="4" r="2.5" fill="rgba(255,255,255,0.35)"/>

          <!-- ── body outline ── -->
          <rect x="3" y="14" width="38" height="72" rx="5" fill="none"
                stroke="rgba(0,0,0,0.8)" stroke-width="1.5"/>
        </svg>
        <div class="battery-pct">{{ dive.battery_percentage }}</div>
      </div>
      <div class="battery-rows">
        <div class="card-row">
          <span class="card-label">Voltage</span>
          <span class="card-value">{{ dive.battery_voltage }}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Type</span>
          <span class="card-value">{{ dive.battery_type }}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Warn / Crit</span>
          <span class="card-value">{{ dive.battery_warning_level }} / {{ dive.battery_critical_level }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.computer-info { margin-bottom: 0; }
.battery-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(0,0,0,0.15);
  border-top: 1px solid rgba(240,230,204,0.15);
}
.battery-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.battery-pct {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.85em;
  color: rgba(240,230,204,0.65);
  letter-spacing: 0.05em;
}
.battery-rows {
  flex: 1;
  .card-row {
    padding: 3px 0;
    &:nth-child(odd) { background: none; }
  }
}
</style>
