export function getHhMmSs(seconds) {
  const hr = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  const sec = seconds % 60;
  return `${hr}h ${min}m ${sec}s`;
}

export function getDaysHhMm(minutes) {
  const day = Math.floor(minutes / 1440);
  const hr = Math.floor((minutes % 1440) / 60);
  const min = minutes % 60;
  return `${day}d ${hr}h ${min}m`;
}

export function getDateTime(timestamp) {
  return new Date(timestamp * 1000).toISOString().replace('T', ' ').slice(0, 19);
}
