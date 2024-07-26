import uPlot from 'uplot';
import { getHhMmSs } from '@/device/divemanifest';

export function getSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight - 150,
  };
}

const { spline } = uPlot.paths;

const palette = [
  '#7EB26D', // 0: pale green
  '#EAB839', // 1: mustard
  '#6ED0E0', // 2: light blue
  '#EF843C', // 3: orange
  '#E24D42', // 4: red
  '#1F78C1', // 5: ocean
  '#BA43A9', // 6: purple
  '#705DA0', // 7: violet
  '#508642', // 8: dark green
  '#CCA300', // 9: dark sand
];

export function makeChart(data, htmlElement) {
  let opts = {
    ...getSize(),
    scales: {
      x: {
        time: false,
      },
      depth: {
        dir: -1,
        range: (self, min, max) => [0, max * 1.1],
      },
      sac: {
        range: (self, min, max) => [0, max * 1.1],
      },
    },
    axes: [
      {
        space: 90,
        stroke: '#c7d0d9',
        grid: {
          width: 1 / devicePixelRatio,
          stroke: '#2c3235',
        },
        ticks: {
          width: 1 / devicePixelRatio,
          stroke: '#2c3235',
        },
        values: (self, ticks) => ticks.map((seconds) => getHhMmSs(seconds)),
      },
      {
        scale: 'depth',
        stroke: '#c7d0d9',
        grid: {
          width: 1 / devicePixelRatio,
          stroke: '#2c3235',
        },
        ticks: {
          width: 1 / devicePixelRatio,
          stroke: '#2c3235',
        },
      },
      {
        scale: 'sac',
        stroke: '#c7d0d9',
        side: 1,
      },
    ],
    series: [
      {
        label: 'Time',
      },
      {
        points: { show: false },
        scale: 'depth',
        label: 'Depth',
        width: 1 / devicePixelRatio,
        paths: spline(),
        stroke: palette[4],
      },
      {
        points: { show: false },
        scale: 'sac',
        label: 'SAC Rate',
        width: 1 / devicePixelRatio,
        paths: spline(),
        stroke: palette[2],
      },
    ],
  };
  const p = new uPlot(opts, data, htmlElement);
  window.addEventListener('resize', () => {
    p.setSize(getSize());
  });
  return p;
}
