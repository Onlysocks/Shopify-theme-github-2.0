/* Prices are integer Shopify currency subunits. Shopify remains the checkout authority. */
(function (root) {
  function calculate(slots, freeCount, percent, complete) {
    const selected = slots.map((slot, index) => ({ ...slot, index })).filter(slot => slot.price != null);
    const free = complete ? selected.slice().sort((a, b) => a.price - b.price || a.index - b.index)
      .slice(0, Math.max(0, Math.min(freeCount, selected.length))).map(slot => slot.index) : [];
    const original = selected.reduce((sum, slot) => sum + slot.price, 0);
    const subtotal = selected.reduce((sum, slot) => sum + (free.includes(slot.index) ? 0 : slot.price), 0);
    const total = complete ? subtotal - Math.round(subtotal * Math.max(0, Math.min(100, percent)) / 100) : original;
    return { original, total, free, each: selected.length ? Math.round(total / selected.length) : 0 };
  }
  root.OnlySocksBundlePricing = { calculate };
  if (typeof module !== 'undefined') module.exports = { calculate };
})(typeof window === 'undefined' ? globalThis : window);
