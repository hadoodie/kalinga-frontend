/**
 * Parses pagination query params and returns a Supabase-ready range.
 *
 * @param {object} query - req.query
 * @returns {{ page, limit, from, to, orderBy, orderDir }}
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const orderBy = query.sort_by || 'created_at';
  const orderDir = query.order === 'asc' ? true : false; // Supabase: ascending=true

  return { page, limit, from, to, orderBy, orderDir };
};

/**
 * Builds a pagination metadata object for API responses.
 *
 * @param {number} total - Total count from Supabase
 * @param {number} page
 * @param {number} limit
 * @returns {{ total, page, limit, total_pages, has_next, has_prev }}
 */
const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  total_pages: Math.ceil(total / limit),
  has_next: page * limit < total,
  has_prev: page > 1,
});

export { parsePagination, buildPaginationMeta };
