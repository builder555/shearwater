const { createApp, ref, onMounted } = Vue
const dives = [
    {
        "code": "a5c4",
        "diveNo": 26,
        "diveStart": "2024-05-26 10:54:06",
        "diveEnd": "2024-05-26 11:17:27",
        "diveDuration": 1406,
        "maxDepthX10": 137,
        "avgDepthX10": 27,
        "recordAddressStart": "0007a500",
        "recordAddressEnd": "0007bf40",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 25,
        "diveStart": "2024-05-26 10:50:45",
        "diveEnd": "2024-05-26 10:51:39",
        "diveDuration": 59,
        "maxDepthX10": 36,
        "avgDepthX10": 26,
        "recordAddressStart": "00079e20",
        "recordAddressEnd": "0007a320",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 24,
        "diveStart": "2023-11-03 14:27:07",
        "diveEnd": "2023-11-03 15:22:50",
        "diveDuration": 3348,
        "maxDepthX10": 132,
        "avgDepthX10": 25,
        "recordAddressStart": "00075020",
        "recordAddressEnd": "000788c0",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 23,
        "diveStart": "2023-11-03 13:19:24",
        "diveEnd": "2023-11-03 13:42:47",
        "diveDuration": 1408,
        "maxDepthX10": 135,
        "avgDepthX10": 24,
        "recordAddressStart": "00073000",
        "recordAddressEnd": "00074a80",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 22,
        "diveStart": "2023-11-03 12:55:28",
        "diveEnd": "2023-11-03 13:14:24",
        "diveDuration": 1141,
        "maxDepthX10": 131,
        "avgDepthX10": 23,
        "recordAddressStart": "000718a0",
        "recordAddressEnd": "00072e20",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 21,
        "diveStart": "2023-10-31 11:55:01",
        "diveEnd": "2023-10-31 12:51:03",
        "diveDuration": 3367,
        "maxDepthX10": 176,
        "avgDepthX10": 22,
        "recordAddressStart": "0006ca00",
        "recordAddressEnd": "000702e0",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 20,
        "diveStart": "2023-10-31 10:08:38",
        "diveEnd": "2023-10-31 11:06:31",
        "diveDuration": 3478,
        "maxDepthX10": 306,
        "avgDepthX10": 21,
        "recordAddressStart": "00068880",
        "recordAddressEnd": "0006c320",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 19,
        "diveStart": "2023-10-30 19:30:23",
        "diveEnd": "2023-10-30 20:17:54",
        "diveDuration": 2856,
        "maxDepthX10": 166,
        "avgDepthX10": 20,
        "recordAddressStart": "00064560",
        "recordAddressEnd": "00067660",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 18,
        "diveStart": "2023-10-30 16:40:26",
        "diveEnd": "2023-10-30 17:36:14",
        "diveDuration": 3353,
        "maxDepthX10": 196,
        "avgDepthX10": 19,
        "recordAddressStart": "000605e0",
        "recordAddressEnd": "00063e80",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 17,
        "diveStart": "2023-10-30 14:56:12",
        "diveEnd": "2023-10-30 15:52:48",
        "diveDuration": 3401,
        "maxDepthX10": 266,
        "avgDepthX10": 18,
        "recordAddressStart": "0005c2e0",
        "recordAddressEnd": "0005fda0",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 16,
        "diveStart": "2023-07-29 10:11:49",
        "diveEnd": "2023-07-29 10:43:03",
        "diveDuration": 1880,
        "maxDepthX10": 219,
        "avgDepthX10": 17,
        "recordAddressStart": "00058c20",
        "recordAddressEnd": "0005ae60",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 15,
        "diveStart": "2023-07-29 10:03:06",
        "diveEnd": "2023-07-29 10:09:58",
        "diveDuration": 417,
        "maxDepthX10": 72,
        "avgDepthX10": 16,
        "recordAddressStart": "00058000",
        "recordAddressEnd": "00058a40",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 14,
        "diveStart": "2023-07-23 10:12:22",
        "diveEnd": "2023-07-23 10:29:15",
        "diveDuration": 1018,
        "maxDepthX10": 118,
        "avgDepthX10": 15,
        "recordAddressStart": "00055200",
        "recordAddressEnd": "00056600",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 13,
        "diveStart": "2023-07-23 09:43:13",
        "diveEnd": "2023-07-23 09:51:10",
        "diveDuration": 482,
        "maxDepthX10": 87,
        "avgDepthX10": 14,
        "recordAddressStart": "00053fe0",
        "recordAddressEnd": "00054ba0",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 12,
        "diveStart": "2023-06-17 10:20:54",
        "diveEnd": "2023-06-17 11:12:22",
        "diveDuration": 3093,
        "maxDepthX10": 277,
        "avgDepthX10": 13,
        "recordAddressStart": "0004f660",
        "recordAddressEnd": "00052be0",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 11,
        "diveStart": "2023-06-16 12:39:42",
        "diveEnd": "2023-06-16 12:50:36",
        "diveDuration": 659,
        "maxDepthX10": 62,
        "avgDepthX10": 12,
        "recordAddressStart": "0004dc80",
        "recordAddressEnd": "0004ea80",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 10,
        "diveStart": "2023-06-16 12:12:58",
        "diveEnd": "2023-06-16 12:37:24",
        "diveDuration": 1471,
        "maxDepthX10": 98,
        "avgDepthX10": 11,
        "recordAddressStart": "0004bf80",
        "recordAddressEnd": "0004daa0",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 9,
        "diveStart": "2023-06-16 10:48:49",
        "diveEnd": "2023-06-16 11:33:28",
        "diveDuration": 2684,
        "maxDepthX10": 78,
        "avgDepthX10": 10,
        "recordAddressStart": "000488a0",
        "recordAddressEnd": "0004b7a0",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 8,
        "diveStart": "2023-06-13 12:16:17",
        "diveEnd": "2023-06-13 13:22:39",
        "diveDuration": 3987,
        "maxDepthX10": 162,
        "avgDepthX10": 9,
        "recordAddressStart": "00043b80",
        "recordAddressEnd": "00047e40",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 7,
        "diveStart": "2023-06-11 10:12:36",
        "diveEnd": "2023-06-11 11:15:31",
        "diveDuration": 3780,
        "maxDepthX10": 286,
        "avgDepthX10": 8,
        "recordAddressStart": "0003e9e0",
        "recordAddressEnd": "000429c0",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 6,
        "diveStart": "2023-06-10 12:22:14",
        "diveEnd": "2023-06-10 13:19:31",
        "diveDuration": 3442,
        "maxDepthX10": 165,
        "avgDepthX10": 7,
        "recordAddressStart": "0003a620",
        "recordAddressEnd": "0003e060",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 5,
        "diveStart": "2023-05-27 11:22:00",
        "diveEnd": "2023-05-27 11:27:23",
        "diveDuration": 328,
        "maxDepthX10": 36,
        "avgDepthX10": 6,
        "recordAddressStart": "00037c20",
        "recordAddressEnd": "00038540",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    },
    {
        "code": "a5c4",
        "diveNo": 4,
        "diveStart": "2023-05-27 10:55:29",
        "diveEnd": "2023-05-27 11:20:48",
        "diveDuration": 1524,
        "maxDepthX10": 129,
        "avgDepthX10": 5,
        "recordAddressStart": "00035e80",
        "recordAddressEnd": "00037a40",
        "depthUnits": "meters",
        "tempUnits": 2,
        "computerMode": "OC Rec",
        "manifestVersion": 2
    }
]

function getHhMmSs(s) {
    const date = new Date(s * 1000);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${hours}h ${minutes}m ${seconds}s`;
}


function drawClock(ctx, radius, minutes) {
    drawFace(ctx, radius);
    drawTicks(ctx, radius);
    drawTime(ctx, radius, minutes);
}
function drawBackgroundArc(ctx, startAngle, endAngle, radius) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = 'rgba(114, 192, 210, 0.6)';
    ctx.fill();
}

function drawFace(ctx, radius) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.01, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
}

function drawTicks(ctx, radius) {
    let ang;
    const ticks = 6;
    ctx.strokeStyle = '#ff0';
    for (let num = 1; num <= ticks; num++) {
        ang = num * Math.PI / (ticks / 2);
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.99);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, radius * 0.2);
        ctx.lineWidth = 0.75;
        ctx.stroke();
        
        ctx.translate(0, radius * 0.99);
        ctx.rotate(-ang);
    }
}

function drawTime(ctx, radius, minutes) {
    const hourPos = Math.PI * 2 * Math.min(120, minutes)/120;
    drawBackgroundArc(ctx, Math.PI*1.5, hourPos - Math.PI / 2, radius);
}


createApp({
  setup() {

    function drawDiveClock(dive) {
        const canvas = document.getElementById(`clock-${dive.diveNo}`);
        const ctx = canvas.getContext('2d');
        const radius = canvas.height / 2;
        ctx.translate(radius, radius);
        const minutes = dive.diveDuration/60;
        drawClock(ctx, radius, minutes);
    }
    onMounted(() => {
        for (const dive of dives) {
            drawDiveClock(dive);
        }
    });

    const message = ref('goodbye vue');
    const picked = ref([]);
    dives.forEach((dive) => {
        const dateStart = new Date(dive.diveStart);
        dive.startDateFmt = dateStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        dive.startTimeFmt = dateStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        dive.diveDurationFmt = getHhMmSs(dive.diveDuration);
    });
    function toggleDivePicked(dive) {
      if (picked.value.includes(dive.diveNo)) {
          picked.value = picked.value.filter((d) => d !== dive.diveNo);
        } else {
          picked.value.push(dive.diveNo);
      }
    }
    function toggleAllDives(event) {
      if (event.target.checked) {
        picked.value = dives.map((dive) => dive.diveNo);
      } else {
        picked.value = [];
      }
    }
    function getFontSize(strDiveNo) {
        const diveNo = parseInt(strDiveNo);
        if (diveNo >= 10000) {
            return '1.75em';
        }
        if (diveNo >= 1000) {
            return '2.2em';
        }
        return '2.5em';
    }
    return {
      message,
      dives,
      picked,
      toggleDivePicked,
      toggleAllDives,
      getFontSize,
    }
  }
}).mount('#app')