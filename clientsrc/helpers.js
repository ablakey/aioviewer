export function dedupe(arr) {
  return [...new Set(arr.map(r => r.split(' ')[0]))];
}
