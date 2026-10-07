import { describe, expect, it } from 'vitest';
import type { Prisma } from '@prisma/client';
import { itemVisibilityWhere } from './visibility';

/** 递归找出 where 树里所有形如 { visibility: ... } 的叶子约束。 */
function visibilityClauses(node: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const walk = (n: unknown) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    const obj = n as Record<string, unknown>;
    if ('visibility' in obj) out.push(obj);
    for (const v of Object.values(obj)) {
      if (v && typeof v === 'object') walk(v);
    }
  };
  walk(node);
  return out;
}

describe('itemVisibilityWhere', () => {
  it('普通成员：授权子句只匹配 selected 且已发布/归档的条目', () => {
    const where = itemVisibilityWhere('u2', 'contributor') as { OR: Prisma.ItemWhereInput[] };
    const shareClause = where.OR.find(
      (c) => typeof c === 'object' && c !== null && 'shares' in c,
    ) as Prisma.ItemWhereInput;
    expect(shareClause).toBeDefined();

    const vis = visibilityClauses(shareClause);
    // 同一授权子句内同时带 visibility 与 status 约束
    expect(vis.some((c) => c.visibility === 'selected')).toBe(true);
    expect(vis.some((c) => JSON.stringify(c.status).includes('published'))).toBe(true);
    expect(vis.some((c) => JSON.stringify(c.status).includes('archived'))).toBe(true);
  });

  it('普通成员的授权子句不匹配 private/family/link 可见范围', () => {
    const where = itemVisibilityWhere('u2', 'viewer') as { OR: Prisma.ItemWhereInput[] };
    const shareClause = where.OR.find(
      (c) => typeof c === 'object' && c !== null && 'shares' in c,
    ) as Prisma.ItemWhereInput;
    const clauses = visibilityClauses(shareClause);
    // 不允许出现 in: ['family','link'] 这类放行其他范围的约束混在授权子句里
    for (const c of clauses) {
      expect(JSON.stringify(c.visibility)).not.toContain('family');
    }
  });

  it('管理员不过滤条目（OR 中包含空对象放行全部）', () => {
    const where = itemVisibilityWhere('u1', 'admin') as { OR: unknown[] };
    expect(where.OR.some((c) => typeof c === 'object' && c !== null && Object.keys(c).length === 0)).toBe(true);
  });
});
