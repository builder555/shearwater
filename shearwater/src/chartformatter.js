import uPlot from 'uplot';
import { getHhMmSs } from '@/device/divemanifest';

function getSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight - 150,
  };
}

export function makeChart(data, htmlElement) {
  const { spline } = uPlot.paths;
  const scales = {};
  data.series.forEach((s) => {
    scales[s.name] = {
      range: (self, min, max) => [0, max * 1.1],
    };
  });
  const axes = data.series.map((s) => ({
    scale: s.name,
    stroke: '#c7d0d9',
    side: 1, // y-axis on the right
  }));
  // first axes (depth) should have y-axis on the left
  // it should also have gridlines
  axes[0] = {
    ...axes[0],
    side: 3,
    grid: {
      width: 1 / devicePixelRatio,
      stroke: '#2c3235',
    },
    ticks: {
      width: 1 / devicePixelRatio,
      stroke: '#2c3235',
    },
  };
  const series = data.series.map((s) => ({
    points: { show: false },
    scale: s.name,
    label: s.title,
    paths: spline(),
    stroke: s.color,
  }));
  // depth chart is inverted
  scales['depth'].dir = -1;

  let opts = {
    ...getSize(),
    scales: { x: { time: false }, ...scales },
    series: [{ label: 'Time' }, ...series],
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
  };
  const p = new uPlot(opts, [data.x, ...data.series.map((s) => s.data)], htmlElement);
  window.addEventListener('resize', () => {
    p.setSize(getSize());
  });
  return p;
}
