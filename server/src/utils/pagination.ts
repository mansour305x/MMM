export function pagination(page = 1, limit = 20): { offset: number; limit: number; page: number } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;
  return { offset, limit: safeLimit, page: safePage };
}
