import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {
  isVariantMode,
  toVariantMode,
  getActiveVariant,
  switchVariant,
} = require('./variant-manager.js');

// テスト用のサンプルモデルデータ
const SAMPLE_MODEL = {
  devices: ['desktop', 'mobile'],
  objects: [{ id: 'obj1', name: 'ユーザー' }],
  views: [{ id: 'v1', name: 'View1' }],
  paneGraph: { nodes: [], edges: [] },
  screens: [{ id: 's1', name: 'Screen1' }],
};

describe('isVariantMode', () => {
  it('_variantsが空でない配列であればtrueを返す', () => {
    const data = { _variants: [{ id: 'a', name: 'Option A', active: true }] };
    expect(isVariantMode(data)).toBe(true);
  });

  it('_variantsが存在しなければfalseを返す', () => {
    expect(isVariantMode(SAMPLE_MODEL)).toBe(false);
  });

  it('_variantsが空配列であればfalseを返す', () => {
    expect(isVariantMode({ _variants: [] })).toBe(false);
  });

  it('_variantsがnullであればfalseを返す', () => {
    expect(isVariantMode({ _variants: null })).toBe(false);
  });

  it('_variantsが配列でなければfalseを返す', () => {
    expect(isVariantMode({ _variants: {} })).toBe(false);
  });
});

describe('toVariantMode — 通常モードからの変換', () => {
  it('_variantsに2つのエントリが作られる', () => {
    const result = toVariantMode(SAMPLE_MODEL);
    expect(result._variants).toHaveLength(2);
  });

  it('1つ目のエントリはOption Aでactive: true', () => {
    const result = toVariantMode(SAMPLE_MODEL);
    const varA = result._variants[0];
    expect(varA.id).toBe('a');
    expect(varA.name).toBe('Option A');
    expect(varA.active).toBe(true);
  });

  it('2つ目のエントリはOption Bでactive: false', () => {
    const result = toVariantMode(SAMPLE_MODEL);
    const varB = result._variants[1];
    expect(varB.id).toBe('b');
    expect(varB.name).toBe('Option B');
    expect(varB.active).toBe(false);
  });

  it('各バリアントにモデルキーが含まれる', () => {
    const result = toVariantMode(SAMPLE_MODEL);
    for (const v of result._variants) {
      expect(v).toHaveProperty('objects');
      expect(v).toHaveProperty('views');
      expect(v).toHaveProperty('paneGraph');
      expect(v).toHaveProperty('screens');
    }
  });

  it('パススルーキー（devices）が_variantsの外に保持される', () => {
    const result = toVariantMode(SAMPLE_MODEL);
    expect(result.devices).toEqual(['desktop', 'mobile']);
  });

  it('トップレベルのモデルキーは_variantsの外に存在しない', () => {
    const result = toVariantMode(SAMPLE_MODEL);
    expect(result).not.toHaveProperty('objects');
    expect(result).not.toHaveProperty('views');
    expect(result).not.toHaveProperty('paneGraph');
    expect(result).not.toHaveProperty('screens');
  });

  it('モデルデータはディープコピーされる（参照共有なし）', () => {
    const result = toVariantMode(SAMPLE_MODEL);
    const varA = result._variants[0];
    const varB = result._variants[1];
    // 同じ内容だが別オブジェクト
    expect(varA.objects).not.toBe(varB.objects);
    expect(varA.objects).not.toBe(SAMPLE_MODEL.objects);
  });

  it('元のデータは変更されない', () => {
    const original = JSON.parse(JSON.stringify(SAMPLE_MODEL));
    toVariantMode(SAMPLE_MODEL);
    expect(SAMPLE_MODEL).toEqual(original);
  });
});

describe('toVariantMode — バリアントモードからの追加', () => {
  function makeVariantData() {
    return {
      devices: ['desktop'],
      _variants: [
        {
          id: 'a', name: 'Option A', active: true,
          objects: [{ id: 'o1', name: 'A-Object' }],
          views: [], paneGraph: { nodes: [], edges: [] }, screens: [],
        },
        {
          id: 'b', name: 'Option B', active: false,
          objects: [{ id: 'o2', name: 'B-Object' }],
          views: [], paneGraph: { nodes: [], edges: [] }, screens: [],
        },
      ],
    };
  }

  it('バリアントが1つ追加されて合計3つになる', () => {
    const data = makeVariantData();
    const result = toVariantMode(data);
    expect(result._variants).toHaveLength(3);
  });

  it('追加されたバリアントはOption Cでactive: false', () => {
    const data = makeVariantData();
    const result = toVariantMode(data);
    const varC = result._variants[2];
    expect(varC.id).toBe('c');
    expect(varC.name).toBe('Option C');
    expect(varC.active).toBe(false);
  });

  it('追加バリアントのデータはアクティブなバリアントのコピー', () => {
    const data = makeVariantData();
    const result = toVariantMode(data);
    const varC = result._variants[2];
    expect(varC.objects).toEqual([{ id: 'o1', name: 'A-Object' }]);
  });

  it('追加バリアントはディープコピーされる', () => {
    const data = makeVariantData();
    const result = toVariantMode(data);
    const varC = result._variants[2];
    // アクティブバリアントのオブジェクトとは別参照
    expect(varC.objects).not.toBe(result._variants[0].objects);
  });

  it('既存のバリアントは変更されない', () => {
    const data = makeVariantData();
    const result = toVariantMode(data);
    expect(result._variants[0].active).toBe(true);
    expect(result._variants[1].active).toBe(false);
  });

  it('パススルーキーは保持される', () => {
    const data = makeVariantData();
    const result = toVariantMode(data);
    expect(result.devices).toEqual(['desktop']);
  });
});

describe('getActiveVariant', () => {
  it('active: trueのバリアントを返す', () => {
    const data = {
      _variants: [
        { id: 'a', name: 'Option A', active: false },
        { id: 'b', name: 'Option B', active: true },
      ],
    };
    const active = getActiveVariant(data);
    expect(active.id).toBe('b');
  });

  it('active: trueがなければ最初のバリアントを返す', () => {
    const data = {
      _variants: [
        { id: 'a', name: 'Option A', active: false },
        { id: 'b', name: 'Option B', active: false },
      ],
    };
    const active = getActiveVariant(data);
    expect(active.id).toBe('a');
  });

  it('バリアントが1つのときはそれを返す', () => {
    const data = {
      _variants: [{ id: 'a', name: 'Option A', active: true }],
    };
    expect(getActiveVariant(data).id).toBe('a');
  });
});

describe('switchVariant', () => {
  function makeData() {
    return {
      _variants: [
        { id: 'a', name: 'Option A', active: true },
        { id: 'b', name: 'Option B', active: false },
        { id: 'c', name: 'Option C', active: false },
      ],
    };
  }

  it('指定したIDのバリアントをactiveにする', () => {
    const result = switchVariant(makeData(), 'b');
    expect(result._variants.find(v => v.id === 'b').active).toBe(true);
  });

  it('他のバリアントのactiveはfalseになる', () => {
    const result = switchVariant(makeData(), 'b');
    expect(result._variants.find(v => v.id === 'a').active).toBe(false);
    expect(result._variants.find(v => v.id === 'c').active).toBe(false);
  });

  it('元のデータは変更されない（イミュータブル）', () => {
    const data = makeData();
    switchVariant(data, 'b');
    // 元データのaはまだactiveのまま
    expect(data._variants[0].active).toBe(true);
  });

  it('存在しないIDを指定すると全バリアントがinactiveになる', () => {
    const result = switchVariant(makeData(), 'z');
    for (const v of result._variants) {
      expect(v.active).toBe(false);
    }
  });
});
