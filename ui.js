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
        "manifestVersion": 2,
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
        "manifestVersion": 2,
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
        "diveNo": 2100,
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
        "diveNo": 200,
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
        "diveNo": 65535,
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
];


function getHhMmSs(s) {
    const date = new Date(s * 1000);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${hours}h ${minutes}m ${seconds}s`;
}


function drawClock(ctx, radius, minutes) {
    drawFace(ctx, radius);
    // drawNumbers(ctx, radius);
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
    // background
    // ctx.beginPath();
    // ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    // // ctx.fillStyle = '#334041';
    // ctx.fillStyle = '#334041';
    // ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.01, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
}

function drawNumbers(ctx, radius) {
    let ang;
    let num;
    ctx.font = radius * 0.2 + "px verdana";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (num = 1; num < 7; num++) {
        ang = num * Math.PI / 3;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.8);
        ctx.rotate(-ang);
        ctx.fillText((num*2).toString()+"0", 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 0.8);
        ctx.rotate(-ang);
    }
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
        // if (num % 5 === 0) {
        //     ctx.lineTo(0, radius * 0.1);
        //     ctx.lineWidth = 6;
        // } else {
        ctx.lineTo(0, radius * 0.2);
        ctx.lineWidth = 0.75;
        // }
        ctx.stroke();
        
        ctx.translate(0, radius * 0.99);
        ctx.rotate(-ang);
    }
}

function drawTime(ctx, radius, minutes) {
    const hourPos = Math.PI * 2 * Math.min(120, minutes)/120;
    // drawHand(ctx, hourPos, radius * 0.8, radius * 0.03);
    drawBackgroundArc(ctx, Math.PI*1.5, hourPos - Math.PI / 2, radius);
}

function drawHand(ctx, pos, length, width, color = '#333') {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.moveTo(0, 0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-pos);
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