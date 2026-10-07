import { describe, expect, it } from 'vitest';
import { itemVisibilityWhere } from './visibility';

describe('itemVisibilityWhere', () => {
  it('普通成员：自己创建的、被授权的、family/link 已发布的条目可见', () => {
    const where = itemVisibilityWhere('u1', 'viewer');
    expect(where.OR).toEqual([
      { createdBy: 'u1' },
      { shares: { some: { userId: 'u1' } }, status: { in: ['published', 'archived'] } },
      { visibility: { in: ['family', 'link'] }, status: { in: ['published', 'archived'] } },
    ]);
  });

  it('被授权的成员看不到他人的草稿与回收站条目', () => {
    // 与 itemAccess 一致：share 只在 published/archived 状态下授予读权限，
    // 否则列表里能看到标题、点开却 404，还会泄露草稿的存在。
    const where = itemVisibilityWhere('u1', 'editor');
    const shareClause = (where.OR as unknown[])[1] as Record<string, unknown>;
    expect(shareClause.status).toEqual({ in: ['published', 'archived'] });
  });

  it('owner/admin 不受可见范围限制', () => {
    for (const role of ['owner', 'admin'] as const) {
      const where = itemVisibilityWhere('u1', role);
      expect(where.OR).toContainEqual({});
    }
  });
});
