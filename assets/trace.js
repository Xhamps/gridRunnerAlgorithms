// Code listing with named lines: the generators step by name (L.forw) instead of a hand-counted index,
// so the highlighted line can never drift from the code shown on the page.
function listing(rows) {
  const at = {};
  rows.forEach(([name], k) => { if (name) at[name] = k; });
  return { text: rows.map((r) => r[1]), at };
}

if (typeof module !== 'undefined') module.exports = { listing };
