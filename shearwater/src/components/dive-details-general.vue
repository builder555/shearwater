<script setup>
defineProps(['dive']);
</script>
<template>
  <div class="vintage-card general">
    <div class="card-stripe"></div>
    <div class="dg-date">{{ dive.dive_start_date }}</div>
    <div class="dg-stats">
      <div class="stat-box">
        <div class="stat-label">Duration</div>
        <div class="stat-value">{{ dive.dive_length_fmt }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">In / Out</div>
        <div class="stat-value small">{{ dive.dive_start_time }} – {{ dive.dive_end_time }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Surface</div>
        <div class="stat-value">{{ dive.surface_time }}</div>
      </div>
    </div>
    <div class="dg-depth-row">
      <div class="dg-depth">
        <span class="depth-value">{{ dive.max_depth }}</span>
        <span class="depth-unit">{{ dive.depth_units }}</span>
      </div>
      <div class="dg-water">
        <div class="water-type">{{ dive.water_type }}</div>
        <div class="water-label">WATER</div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.general {
  margin-bottom: 0;
}
.dg-date {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.6em;
  letter-spacing: 0.06em;
  padding: 8px 12px 4px;
  color: var(--v-cream);
}
.dg-stats {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(0,0,0,0.15);
}
.stat-box .stat-value.small {
  font-size: 1.1em;
}
.dg-depth-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid rgba(240,230,204,0.2);
}
.dg-depth {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.depth-value {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.8em;
  color: var(--v-yellow);
  line-height: 1;
}
.depth-unit {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2em;
  color: rgba(240,230,204,0.7);
}
.dg-water {
  text-align: right;
}
.water-type {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3em;
  letter-spacing: 0.1em;
  color: var(--v-orange-light);
  text-transform: uppercase;
}
.water-label {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.75em;
  letter-spacing: 0.12em;
  color: rgba(240,230,204,0.5);
}
</style>
