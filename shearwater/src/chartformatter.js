import uPlot from 'uplot';
import { getHhMmSs } from '@/device/divemanifest';

function getSize(container) {
  const { width, height } = container.getBoundingClientRect();
  return { width, height };
}

function tooltipPlugin(overlay) {
  let over, bLeft, bTop, bBottom, bRight;

  function syncBounds() {
    let bbox = over.getBoundingClientRect();
    bLeft = bbox.left;
    bTop = bbox.top;
    bBottom = bbox.bottom;
    bRight = bbox.right;
  }

  return {
    hooks: {
      init: (u) => {
        over = u.over;
        over.onmouseenter = () => {
          overlay.style.display = 'block';
        };

        over.onmouseleave = () => {
          overlay.style.display = 'none';
        };
        syncBounds();
      },
      setSize: () => {
        syncBounds();
      },
      setCursor: (u) => {
        const { left, top, idx } = u.cursor;
        if (!idx) return;
        const anchor = { left: `${left + bLeft + 5}px`, top: `${top + bTop + 5}px` };
        const tooltipBounds = overlay.getBoundingClientRect();
        if (left + tooltipBounds.width + 20 > bRight) {
          anchor.left = `${left - tooltipBounds.width + bLeft - 5}px`;
        }
        if (top + tooltipBounds.height + 80 > bBottom) {
          anchor.top = `${top + bTop + 5 - tooltipBounds.height}px`;
        }
        const x = u.data[0][idx];
        const itmes = u.series.map((s, i) => ({ name: s.scale, value: u.data[i][idx], color: s._stroke }));
        itmes[0] = { name: 'Time', value: getHhMmSs(x) };
        overlay.innerHTML = itmes.map((i) => `${i.name}: ${i.value}`).join('\n<br/>');
        overlay.style.left = anchor.left;
        overlay.style.top = anchor.top;
      },
    },
  };
}

export function makeChart(data, htmlElement, tooltipElement) {
  const { spline } = uPlot.paths;
  const dataSeries = data.series.filter((s) => s.isVisible);
  const scales = {};
  dataSeries.forEach((s) => {
    scales[s.name] = { range: (self, min, max) => [0, max * 1.1] };
  });
  const depthSeries = dataSeries.find((s) => s.name.toLowerCase() === 'depth');
  if (depthSeries) {
    // depth chart is inverted
    scales[depthSeries.name].dir = -1;
  }
  const axes = dataSeries.map((s) => ({ scale: s.name, label: s.title, stroke: '#c7d0d9', side: 1 }));
  axes[0] = {
    ...axes[0],
    // first series should have y-axis on the left
    // it should also have gridlines
    side: 3,
    grid: { width: 1 / devicePixelRatio, stroke: '#2c3235' },
    ticks: { width: 1 / devicePixelRatio, stroke: '#2c3235' },
  };
  const series = dataSeries.map((s) => ({
    points: { show: false },
    scale: s.name,
    label: s.title,
    paths: spline(),
    stroke: s.color,
  }));
  // get parent element of htmlElement
  const parent = htmlElement.parentElement;
  let opts = {
    ...getSize(parent),
    title: data.title,
    scales: { x: { time: false }, ...scales },
    series: [{ label: 'Time' }, ...series],
    legend: { show: false },
    axes: [
      {
        space: 90,
        stroke: '#c7d0d9',
        grid: { width: 1 / devicePixelRatio, stroke: '#2c3235' },
        ticks: { width: 1 / devicePixelRatio, stroke: '#2c3235' },
        values: (self, ticks) => ticks.map((seconds) => getHhMmSs(seconds)),
      },
      ...axes,
    ],
    plugins: [tooltipPlugin(tooltipElement)],
  };
  const p = new uPlot(opts, [data.x, ...dataSeries.map((s) => s.data)], htmlElement);

  window.addEventListener('resize', () => {
    p.setSize(getSize(parent));
  });
  return p;
}
