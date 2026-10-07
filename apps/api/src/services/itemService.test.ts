import { describe, expect, it } from 'vitest';
import { normalizeShares } from './itemService';

describe('normalizeShares 成员授权归一化', () => {
  it('selected 范围保留授权并按成员去重（重复出现时以可编辑为准）', () => {
    const out = normalizeShares(
      'selected',
      [
        { userId: 'u2', canEdit: false },
        { userId: 'u2', canEdit: true },
        { userId: 'u3', canEdit: false },
      ],
      'u1',
    );
    expect(out).toHaveLength(2);
    expect(out.find((s) => s.userId === 'u2')?.canEdit).toBe(true);
    expect(out.find((s) => s.userId === 'u3')?.canEdit).toBe(false);
  });

  it('创建者无需给自己授权，自动剔除', () => {
    const out = normalizeShares('selected', [{ userId: 'u1', canEdit: true }], 'u1');
    expect(out).toEqual([]);
  });

  it.each(['private', 'family', 'link'] as const)('切到 %s 可见范围时旧授权一律清空', (visibility) => {
    const out = normalizeShares(visibility, [{ userId: 'u2', canEdit: true }], 'u1');
    expect(out).toEqual([]);
  });

  it('没有传入 sharedWith 时返回空（创建场景）', () => {
    expect(normalizeShares('selected', undefined, 'u1')).toEqual([]);
  });
});
