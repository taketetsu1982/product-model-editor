import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createFileIO } = require('./file-io.js');

const TEST_IDS = { toast:'t', dot:'d', label:'l', hint:'h', edited:'e', autoBtn:'a', overlay:'o' };
const TEST_KEYS = { undo:'__u', redo:'__r', copy:'__c', paste:'__p', cut:'__x', del:'__d' };

function makeConfig(overrides) {
  return {
    ids: TEST_IDS,
    getFullJson: () => null,
    loadDataKey: '__test',
    keys: TEST_KEYS,
    filePickerId: 'test',
    ...overrides,
  };
}

describe('createFileIO', () => {
  it('必要なメソッドを全て返す', () => {
    const io = createFileIO(makeConfig());
    expect(typeof io.showToast).toBe('function');
    expect(typeof io.markModified).toBe('function');
    expect(typeof io.writeFile).toBe('function');
    expect(typeof io.handleConnect).toBe('function');
    expect(typeof io.toggleAuto).toBe('function');
    expect(typeof io.setupDragDrop).toBe('function');
    expect(typeof io.setupKeyboard).toBe('function');
    expect(typeof io.getFileHandle).toBe('function');
    expect(typeof io.updateStatus).toBe('function');
  });

  it('初期状態ではfileHandleがnull', () => {
    const io = createFileIO(makeConfig());
    expect(io.getFileHandle()).toBe(null);
  });
});

describe('writeFile ガードロジック', () => {
  it('fileHandleがnullの場合はfalseを返す', async () => {
    const io = createFileIO(makeConfig());
    const result = await io.writeFile();
    expect(result).toBe(false);
  });

  it('getFullJsonがnullを返す場合はfalseを返す', async () => {
    const io = createFileIO(makeConfig({ getFullJson: () => null }));
    const result = await io.writeFile();
    expect(result).toBe(false);
  });
});
