const SCHEMA_MISMATCH_CODES = new Set([
  '42P01', // undefined_table
  '42703', // undefined_column
  '42883', // undefined_function
  '42P10', // invalid_column_reference
]);

const isSchemaMismatchError = (err) => {
  if (!err) return false;
  if (SCHEMA_MISMATCH_CODES.has(err.code)) return true;
  const msg = String(err.message || '').toLowerCase();
  return msg.includes('does not exist') || msg.includes('undefined table') || msg.includes('undefined column');
};

const logFallback = (scope, err) => {
  console.warn(`[DB FALLBACK] ${scope}: ${err.code || 'unknown'} ${err.message || ''}`);
};

export { isSchemaMismatchError, logFallback };
