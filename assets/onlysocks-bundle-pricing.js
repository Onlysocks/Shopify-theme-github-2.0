/* Prices are integer Shopify currency subunits. Shopify remains the checkout authority. */
(function (root) {
  function calculate(slots, freeCount, percent, complete, autoPercent = false) {
    const selected = slots.map((slot, index) => ({ ...slot, index })).filter(slot => slot.price != null);
    const free = complete ? selected.slice().sort((a, b) => a.price - b.price || a.index - b.index)
      .slice(0, Math.max(0, Math.min(freeCount, selected.length))).map(slot => slot.index) : [];
    const original = selected.reduce((sum, slot) => sum + slot.price, 0);
    const subtotal = selected.reduce((sum, slot) => sum + (free.includes(slot.index) ? 0 : slot.price), 0);
    const total = complete ? subtotal - Math.round(subtotal * Math.max(0, Math.min(100, autoPercent ? 0 : percent)) / 100) : original;
    return { original, total, free, each: selected.length ? Math.round(total / selected.length) : 0 };
  }
  function savingsPercent(result, complete) {
    return complete && result.original > 0 ? (result.original - result.total) / result.original * 100 : 0;
  }
  root.OnlySocksBundlePricing = { calculate, savingsPercent };
  if (typeof module !== 'undefined') module.exports = { calculate, savingsPercent };
})(typeof window === 'undefined' ? globalThis : window);
