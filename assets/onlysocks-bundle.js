(() => {
  if (customElements.get('onlysocks-bundle')) return;
  class BundlePicker extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      const config = this.querySelector('[data-osb-config]');
      if (!config) return;
      this.initialized = true;
      this.config = JSON.parse(config.textContent);
      this.s = this.config.settings;
      this.active = 0;
      this.busy = false;
      this.money = cents => new Intl.NumberFormat(this.config.locale, { style: 'currency', currency: this.config.currency }).format(cents / 100);
      this.button = this.querySelector('[data-osb-add]');
      this.status = this.querySelector('[data-osb-status]');
      this.tiers = [1, 2, 3].map(n => {
        const products = this.config.tierProducts?.[n - 1] ?? this.config.products ?? [];
        const current = products.find(p => p.id === this.config.currentProduct);
        const first = current || products[0];
        const autofill = n > 1 && Boolean(this.s[`t${n}_autofill`]);
        const count = Number(this.s[`t${n}_paid`]) + Number(this.s[`t${n}_free`]);
        return { n, products, current, autofill, autoPercent: Boolean(this.s[`t${n}_auto_percent`]), free: Number(this.s[`t${n}_free`]), percent: Number(this.s[`t${n}_percent`]),
          slots: Array.from({ length: count }, (_, i) => ({
            products,
            product: !autofill && i === 0 ? first : null,
            choices: [],
            variant: null
          })) };
      });
      this.tiers.forEach((tier, index) => this.buildTier(tier, index));
      this.button.addEventListener('click', () => this.add());
      this.addEventListener('keydown', event => {
        if (event.key === 'Escape') this.querySelectorAll('.osb-menu:not([hidden])').forEach(menu => {
          menu.hidden = true; menu.previousElementSibling.setAttribute('aria-expanded', 'false'); menu.previousElementSibling.focus();
        });
      });
      this.addEventListener('focusout', event => {
        const picker = event.target.closest('.osb-picker');
        if (picker && !picker.contains(event.relatedTarget)) {
          picker.querySelector('.osb-menu').hidden = true;
          picker.querySelector('.osb-product').setAttribute('aria-expanded', 'false');
        }
      });
      this.refresh();
    }
    node(tag, className, text) {
      const node = document.createElement(tag); node.className = className || '';
      if (text != null) node.textContent = text;
      if (tag === 'button') node.type = 'button';
      return node;
    }
    buildTier(tier, index) {
      const root = this.node('div', 'osb-tier');
      const toggle = this.node('button', 'osb-toggle');
      const title = this.node('span', 'osb-title', this.s[`t${tier.n}_title`]);
      const badges = this.node('span', 'osb-badges');
      tier.discountBadge = this.node('span', 'osb-badge osb-discount');
      badges.append(tier.discountBadge);
      if (this.s[`t${tier.n}_value`]) badges.append(this.node('span', 'osb-badge osb-value', this.s.value_text));
      if (this.s[`t${tier.n}_shipping`]) badges.append(this.node('span', 'osb-badge osb-shipping', this.s.shipping_text));
      title.append(badges);
      const price = this.node('span', 'osb-prices');
      toggle.append(this.node('span', 'osb-radio'), title, price);
      const panel = this.node('div', 'osb-slots');
      panel.id = `osb-${this.config.id}-${index}`;
      toggle.setAttribute('aria-controls', panel.id);
      toggle.addEventListener('click', () => this.selectTier(index));
      root.append(toggle, panel);
      Object.assign(tier, { root, toggle, panel, price });
      tier.slots.forEach((slot, slotIndex) => this.buildSlot(tier, slot, slotIndex));
      this.querySelector('[data-osb-tiers]').append(root);
    }
    selectTier(index) {
      if (this.busy || index === this.active) return;
      const previous = this.tiers[this.active];
      if (previous.autofill) this.populateTier(previous, false);
      this.active = index;
      const selected = this.tiers[index];
      if (selected.autofill) this.populateTier(selected, true);
      this.refresh();
    }
    populateTier(tier, selected) {
      const product = selected ? tier.current : null;
      const variant = product?.options.some(option => option.name.trim().toLowerCase() === 'size')
        ? product.variants.find(candidate => candidate.available) : null;
      tier.slots.forEach(slot => {
        slot.product = product || null;
        slot.choices = variant ? [...variant.options] : [];
        slot.variant = variant || null;
        this.renderControls(slot);
      });
    }
    productButton(product) {
      const button = this.node('button', 'osb-product');
      if (product?.image) {
        const img = this.node('img'); img.src = product.image; img.alt = ''; img.loading = 'lazy'; img.width = 50; img.height = 60; button.append(img);
      }
      button.append(this.node('span', '', product ? product.title : this.s.choose_style));
      return button;
    }
    buildSlot(tier, slot, index) {
      const row = this.node('div', 'osb-slot');
      slot.row = row;
      const meta = this.node('div', 'osb-slot-meta');
      meta.append(this.node('span', '', this.s.pair_text.replace('{number}', index + 1)));
      slot.badge = this.node('span', 'osb-badge osb-free', this.s.free_text); slot.badge.hidden = true;
      slot.priceNode = this.node('span'); meta.append(slot.badge, slot.priceNode);
      row.append(meta);
      slot.controls = this.node('div', 'osb-controls'); row.append(slot.controls);
      slot.error = this.node('div', 'osb-error'); row.append(slot.error);
      if (tier.n === 1 && index > 0) {
        slot.remove = this.node('button', 'osb-remove', this.s.remove_text);
        slot.remove.addEventListener('click', () => { slot.product = null; slot.choices = []; slot.variant = null; this.renderControls(slot); this.refresh(); });
        row.append(slot.remove);
      }
      tier.panel.append(row); this.renderControls(slot);
    }
    renderControls(slot) {
      slot.controls.replaceChildren();
      const picker = this.node('div', 'osb-picker');
      const trigger = this.productButton(slot.product);
      trigger.setAttribute('aria-expanded', 'false');
      const menu = this.node('div', 'osb-menu'); menu.hidden = true;
      slot.products.forEach(product => {
        const choice = this.productButton(product);
        choice.addEventListener('click', () => {
          slot.product = product; slot.choices = []; slot.variant = null;
          this.renderControls(slot); this.refresh(); slot.controls.querySelector('button').focus();
        }); menu.append(choice);
      });
      trigger.addEventListener('click', () => {
        const opening = menu.hidden;
        this.querySelectorAll('.osb-menu').forEach(m => { m.hidden = true; m.previousElementSibling.setAttribute('aria-expanded', 'false'); });
        menu.hidden = !opening; trigger.setAttribute('aria-expanded', String(opening));
      });
      picker.append(trigger, menu); slot.controls.append(picker);
      const product = slot.product;
      slot.error.textContent = '';
      if (slot.remove) slot.remove.hidden = !product;
      if (!product) return;
      const sizeIndex = product.options.findIndex(o => o.name.trim().toLowerCase() === 'size');
      if (sizeIndex < 0) { slot.error.textContent = this.s.size_error; return; }
      const availableSizes = [...new Set(product.variants
        .filter(variant => variant.available && slot.choices.every((picked, i) => i === sizeIndex || !picked || variant.options[i] === picked))
        .map(variant => variant.options[sizeIndex]))];
      if (availableSizes.length === 1) slot.choices[sizeIndex] = availableSizes[0];
      else if (!availableSizes.includes(slot.choices[sizeIndex])) slot.choices[sizeIndex] = '';
      slot.variant = product.variants.find(variant => variant.available && product.options.every((_, i) => variant.options[i] === slot.choices[i])) || null;
      const options = this.node('div', 'osb-options');
      const sizeOnly = product.options.length === 1;
      options.classList.toggle('osb-options--size-only', sizeOnly);
      product.options.forEach((option, optionIndex) => {
        const label = this.node('label');
        label.append(this.node('span', sizeOnly ? 'osb-visually-hidden' : '', option.name));
        const select = this.node('select');
        const placeholder = this.node('option', '', this.s.choose_option.replace('{option}', option.name));
        placeholder.value = ''; placeholder.disabled = true; select.append(placeholder);
        option.values.forEach(value => {
          const available = product.variants.some(v => v.available && v.options[optionIndex] === value && slot.choices.every((picked, i) => i === optionIndex || !picked || v.options[i] === picked));
          const entry = this.node('option', '', value + (available ? '' : ` — ${this.s.sold_out}`));
          entry.value = value; entry.disabled = !available; select.append(entry);
        });
        select.value = slot.choices[optionIndex] || '';
        const missingSize = optionIndex === sizeIndex && !select.value;
        select.classList.toggle('osb-size--missing', missingSize);
        select.setAttribute('aria-invalid', String(missingSize));
        select.addEventListener('change', () => {
          slot.choices[optionIndex] = select.value;
          this.updateVariantControls(slot);
          this.refresh();
        });
        label.append(select); options.append(label);
      });
      slot.controls.append(options);
    }
    updateVariantControls(slot) {
      const product = slot.product;
      const sizeIndex = product.options.findIndex(option => option.name.trim().toLowerCase() === 'size');
      const availableSizes = [...new Set(product.variants
        .filter(variant => variant.available && slot.choices.every((picked, i) => i === sizeIndex || !picked || variant.options[i] === picked))
        .map(variant => variant.options[sizeIndex]))];
      if (availableSizes.length === 1) slot.choices[sizeIndex] = availableSizes[0];
      else if (!availableSizes.includes(slot.choices[sizeIndex])) slot.choices[sizeIndex] = '';
      slot.variant = product.variants.find(variant => variant.available && product.options.every((_, i) => variant.options[i] === slot.choices[i])) || null;
      // Preserve native select elements and focus while the mobile picker closes.
      slot.controls.querySelectorAll('select').forEach((select, optionIndex) => {
        Array.from(select.options).slice(1).forEach(entry => {
          const available = product.variants.some(variant => variant.available && variant.options[optionIndex] === entry.value
            && slot.choices.every((picked, i) => i === optionIndex || !picked || variant.options[i] === picked));
          entry.disabled = !available;
          const label = entry.value + (available ? '' : ` — ${this.s.sold_out}`);
          if (entry.textContent !== label) entry.textContent = label;
        });
        const value = slot.choices[optionIndex] || '';
        if (select.value !== value) select.value = value;
        const missingSize = optionIndex === sizeIndex && !value;
        select.classList.toggle('osb-size--missing', missingSize);
        select.setAttribute('aria-invalid', String(missingSize));
      });
    }
    refresh() {
      this.tiers.forEach((tier, index) => {
        const chosen = tier.slots.filter(slot => slot.product);
        const complete = chosen.length > 0 && chosen.every(slot => slot.variant) && (tier.n === 1 ? chosen.length >= tier.free + 1 : chosen.length === tier.slots.length);
        const prices = tier.slots.map(slot => ({ price: slot.variant ? slot.variant.price : null }));
        const result = OnlySocksBundlePricing.calculate(prices, tier.free, tier.percent, complete, tier.autoPercent);
        tier.complete = complete; tier.result = result;
        // Header-only estimate: never assign preview variants to slots or cart state.
        const previewVariant = tier.n > 1 && index !== this.active && this.s[`t${tier.n}_preview`]
          && tier.current?.options.some(option => option.name.trim().toLowerCase() === 'size')
          ? tier.current.variants.find(variant => variant.available) : null;
        const headerResult = previewVariant
          ? OnlySocksBundlePricing.calculate(tier.slots.map(() => ({ price: previewVariant.price })), tier.free, tier.percent, true, tier.autoPercent)
          : result;
        const headerComplete = complete || Boolean(previewVariant);
        const discount = tier.autoPercent ? OnlySocksBundlePricing.savingsPercent(headerResult, headerComplete) : tier.percent;
        const discountLabel = tier.autoPercent ? (this.s.auto_discount_text || '{percent}% off') : this.s.discount_text;
        tier.discountBadge.hidden = !(discount > 0);
        tier.discountBadge.textContent = discountLabel.replace('{percent}', new Intl.NumberFormat(this.config.locale, { maximumFractionDigits: 2 }).format(discount));
        tier.root.classList.toggle('is-selected', index === this.active);
        tier.toggle.setAttribute('aria-expanded', String(index === this.active)); tier.panel.hidden = index !== this.active;
        tier.price.replaceChildren();
        if (headerComplete) {
          if (headerResult.original > headerResult.total) tier.price.append(this.node('s', '', this.money(headerResult.original)));
          tier.price.append(this.node('strong', '', this.money(headerResult.total)), this.node('small', '', `${this.money(headerResult.each)} ${this.s.each_text}`));
        } else tier.price.append(this.node('small', '', this.s.incomplete_price));
        tier.slots.forEach((slot, i) => {
          const free = result.free.includes(i); slot.row.classList.toggle('is-free', free); slot.badge.hidden = !free;
          slot.priceNode.textContent = slot.variant ? this.money(free ? 0 : slot.variant.price) : '';
        });
      });
      const tier = this.tiers[this.active];
      this.button.disabled = this.busy || !tier.complete || !this.config.enabled;
      this.button.textContent = this.busy ? this.s.adding_text : this.s.add_text + (tier.complete ? ` · ${this.money(tier.result.total)}` : '');
      this.status.textContent = !tier.products.length ? this.s.empty_text : !this.config.enabled ? this.s.setup_text : !tier.complete ? this.s.selection_text : this.s.ready_text;
    }
    async add() {
      const tier = this.tiers[this.active];
      if (this.busy || !tier.complete || !this.config.enabled) return;
      const items = [];
      tier.slots.filter(slot => slot.variant).forEach(slot => {
        const existing = items.find(item => item.id === slot.variant.id);
        if (existing) existing.quantity++; else items.push({ id: slot.variant.id, quantity: 1 });
      });
      this.busy = true; this.refresh();
      this.querySelectorAll('button,select').forEach(control => { control.disabled = true; });
      try {
        const root = window.Shopify?.routes?.root || '/';
        const response = await fetch(`${root}cart/add.js`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items })
        });
        if (!response.ok) {
          const error = await response.json(); throw new Error(error.description || this.s.cart_error);
        }
        // Navigate to Shopify's cart so real automatic discounts, stock and quantities are authoritative.
        window.location.assign(`${root}cart`);
      } catch (error) {
        this.busy = false;
        this.querySelectorAll('button,select').forEach(control => { control.disabled = false; });
        this.refresh(); this.status.textContent = error.message || this.s.cart_error;
      }
    }
  }
  customElements.define('onlysocks-bundle', BundlePicker);
})();
