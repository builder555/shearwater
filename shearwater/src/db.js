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
    const dives = loadFromLocalStorage('dive-manifest') || [];
    dives.forEach(dive => {
        dive.isDownloaded = existsInLocalStorage(`dive-${dive.id}`);
    });
    return dives;
}

export async function saveManifest(manifest) {
    saveToLocalStorage('dive-manifest', manifest);
}
