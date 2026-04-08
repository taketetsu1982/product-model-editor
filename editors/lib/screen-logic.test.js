import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { ensureScreenPositions } = require('./screen-logic.js');

const DEFAULT_CONFIG = {
  cols: 3, gapX: 280, gapY: 220, padX: 60, padY: 60,
  minSpanFactor: 160, minSpanMin: 200,
};

describe('ensureScreenPositions', () => {
  it('null/undefinedを安全に返す', () => {
    expect(ensureScreenPositions(null, [], DEFAULT_CONFIG)).toBe(null);
    expect(ensureScreenPositions(undefined, [], DEFAULT_CONFIG)).toBe(undefined);
  });

  it('screensがない場合はそのまま返す', () => {
    const data = { transitions: [] };
    expect(ensureScreenPositions(data, [], DEFAULT_CONFIG)).toBe(data);
  });

  it('actorsがnullの場合はそのまま返す', () => {
    const data = { screens: [{ id: 's1', actorId: 'a1', x: 0, y: 0 }] };
    expect(ensureScreenPositions(data, null, DEFAULT_CONFIG)).toBe(data);
  });

  it('1つのスクリーンでは再配置しない', () => {
    const actors = [{ id: 'a1' }];
    const data = { screens: [{ id: 's1', actorId: 'a1', x: 10, y: 20 }] };
    ensureScreenPositions(data, actors, DEFAULT_CONFIG);
    expect(data.screens[0].x).toBe(10);
    expect(data.screens[0].y).toBe(20);
  });

  it('密集したスクリーンを再配置する', () => {
    const actors = [{ id: 'a1' }];
    const data = {
      screens: [
        { id: 's1', actorId: 'a1', x: 0, y: 0 },
        { id: 's2', actorId: 'a1', x: 1, y: 1 },
        { id: 's3', actorId: 'a1', x: 2, y: 2 },
      ],
    };
    ensureScreenPositions(data, actors, DEFAULT_CONFIG);
    expect(data.screens[0]).toMatchObject({ x: 60, y: 60 });
    expect(data.screens[1]).toMatchObject({ x: 340, y: 60 });
    expect(data.screens[2]).toMatchObject({ x: 620, y: 60 });
  });

  it('十分に散らばっているスクリーンは再配置しない', () => {
    const actors = [{ id: 'a1' }];
    const data = {
      screens: [
        { id: 's1', actorId: 'a1', x: 0, y: 0 },
        { id: 's2', actorId: 'a1', x: 500, y: 500 },
      ],
    };
    ensureScreenPositions(data, actors, DEFAULT_CONFIG);
    expect(data.screens[0]).toMatchObject({ x: 0, y: 0 });
    expect(data.screens[1]).toMatchObject({ x: 500, y: 500 });
  });
});
