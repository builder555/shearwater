import { describe, it, expect } from 'vitest';
import {
  getHhMmSs,
  getDaysHhMm,
  getDateTime,
  getDate,
  getTime,
} from '@/device/date.functions';

describe('getHhMmSs', () => {
  it('formats zero seconds', () => {
    expect(getHhMmSs(0)).toBe('0h 0m 0s');
  });

  it('formats sub-minute seconds', () => {
    expect(getHhMmSs(45)).toBe('0h 0m 45s');
  });

  it('formats minutes and seconds', () => {
    expect(getHhMmSs(125)).toBe('0h 2m 5s');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(getHhMmSs(3661)).toBe('1h 1m 1s');
  });

  it('formats values over 24h', () => {
    expect(getHhMmSs(90061)).toBe('25h 1m 1s');
  });
});

describe('getDaysHhMm', () => {
  it('formats zero minutes', () => {
    expect(getDaysHhMm(0)).toBe('0d 0h 0m');
  });

  it('formats minutes-only', () => {
    expect(getDaysHhMm(45)).toBe('0d 0h 45m');
  });

  it('formats hours and minutes', () => {
    expect(getDaysHhMm(125)).toBe('0d 2h 5m');
  });

  it('formats days, hours, minutes', () => {
    expect(getDaysHhMm(1500)).toBe('1d 1h 0m');
  });
});

describe('getDateTime', () => {
  it('converts unix timestamp to ISO date-time string', () => {
    expect(getDateTime(0)).toBe('1970-01-01 00:00:00');
  });

  it('formats arbitrary timestamp', () => {
    expect(getDateTime(1700000000)).toBe('2023-11-14 22:13:20');
  });
});

describe('getDate', () => {
  it('returns date portion only', () => {
    expect(getDate(0)).toBe('1970-01-01');
    expect(getDate(1700000000)).toBe('2023-11-14');
  });
});

describe('getTime', () => {
  it('returns hour:minute portion', () => {
    expect(getTime(0)).toBe('00:00');
    expect(getTime(1700000000)).toBe('22:13');
  });
});
