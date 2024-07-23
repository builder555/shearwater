import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { checkBluetoothEnabled } from '@/device/ble';
import { loadManifest, saveDiveLog, saveManifest } from '@/db';
import { BLEShearwater } from '@/device/ble';
import { LogDownloader, LogDecoder, formatLogs } from '@/device/divelogs';
import { DiveManifestReader } from '@/device/divemanifest';

export const useMainStore = defineStore('main', () => {
    const dives = ref({});
    const isBluetoothEnabled = ref(false);
    const isConnected = ref(false);
    const progress = ref(0);
    const ble = new BLEShearwater();
    const computerName = computed(() => ble.name);
    const selectedIds = computed(() => Object.keys(dives.value).filter(id => dives.value[id].isSelected));
    const downloadedIds = computed(() => Object.keys(dives.value).filter(id => dives.value[id].isDownloaded));
    const areAllDivesPicked = computed(() => selectedIds.value.length == (Object.keys(dives.value).length - downloadedIds.value.length));

    checkBluetoothEnabled().then((isEnabled) => {
        isBluetoothEnabled.value = isEnabled;
    });

    loadManifest().then((manifest) => {
        dives.value = manifest;
    });

    function diveCardClicked(dive) {
        if (dive.canDownload) {
            dive.isSelected = !dive.isSelected;
        }
    }
    function toggleAllDiveCards() {
        const shouldSelect = !areAllDivesPicked.value;
        for (const dive of Object.values(dives.value)) {
            dive.isSelected = !dive.isDownloaded && shouldSelect;
        }
        console.log(areAllDivesPicked.value);
        console.log(selectedIds.value.length, downloadedIds.value.length, Object.keys(dives.value).length);
    }

    ble.onDisconnect(async () => {
        for (const id in dives.value) {
            if (!dives.value[id].isDownloaded) {
                dives.value[id].canDownload = false;
            }
        }
        isConnected.value = false;
    });
    

    async function connect() {
        await ble.connect();
        isConnected.value = true;
        const manifestReader = new DiveManifestReader(ble);
        manifestReader.onProgress(p => {
            progress.value = p * 100;
        });
        const manifest = await manifestReader.read();
        for (const dive of manifest) {
            if (dive.id in dives.value && dives.value[dive.id].isDownloaded) {
                continue;
            }
            dives.value[dive.id] = dive;
        }
        saveManifest(dives.value);
        progress.value = 0;
    }

    async function downloadDives() {
        const downloader = new LogDownloader(ble);
        const decoder = new LogDecoder();
        progress.value = 1;
        const totalItems = selectedIds.value.length;
        while(selectedIds.value.length > 0) {
            const diveId = selectedIds.value[0];
            const dive = dives.value[diveId];
            const logs = [];
            downloader.subscribe((data) => {
                const decoded = decoder.decode(data);
                if (typeof decoded === 'object') {
                    logs.push(decoded);
                }
            });
            await downloader.download(dive.recordAddressStart);
            const formatted = formatLogs(logs);
            formatted.id = diveId;
            dive.isDownloaded = true;
            dive.isSelected = false;
            saveDiveLog(formatted);
            progress.value = Math.max(1, (totalItems - selectedIds.value.length) / totalItems * 100);
        }
        setTimeout(() => {
            progress.value = 0;
        }, 500);
    }
    return { dives, isBluetoothEnabled, isConnected, diveCardClicked, progress, connect, computerName, selectedIds, downloadDives, toggleAllDiveCards, areAllDivesPicked };
});
