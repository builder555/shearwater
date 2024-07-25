function loadFromLocalStorage(id) {
  return JSON.parse(localStorage.getItem(id));
}
function saveToLocalStorage(id, data) {
  localStorage.setItem(id, JSON.stringify(data));
}
function existsInLocalStorage(id) {
  return !!localStorage.getItem(id);
}

export async function loadManifest() {
  const dives = loadFromLocalStorage('dive-manifest') || {};
  Object.entries(dives).forEach(([, dive]) => {
    dive.isDownloaded = existsInLocalStorage(`dive-${dive.id}`);
    dive.canDownload = false;
  });
  return dives;
}

export async function saveManifest(manifest) {
  saveToLocalStorage('dive-manifest', manifest);
}

export async function saveDiveLog(dive) {
  saveToLocalStorage(`dive-${dive.id}`, dive);
}
