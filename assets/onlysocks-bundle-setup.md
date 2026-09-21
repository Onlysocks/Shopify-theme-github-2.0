# Only Socks bundle builder

## Add to the unpublished theme

After these files are synced to the GitHub-connected theme, open Customize, select a product template, then Product information > Add block > Only Socks bundle builder. Choose a collection containing single-pair products (up to 50). Each product needs an option named Size, ignoring case. Other product options are also shown and must be selected.

The block is optional and has not been inserted into existing product templates. To use it instead of the standard purchase controls, hide the existing variant picker, quantity selector and buy-buttons blocks on that template in the editor. Keep the price block only if you want the normal product price displayed as well.

Each tier has its own collection selector. A blank tier selector uses the default single-pair collection, preserving existing setups. An explicitly selected empty collection stays empty. Each tier's first selection and dropdown choices come only from its effective collection, with a maximum of 50 products per tier.

Duplicate collections containing the same products do not isolate native Shopify discounts: cart items retain their product/variant identities, not the collection they were selected from. Overlapping collections still make products eligible for overlapping rules. Order discounts remain order-wide.

Sizes auto-select when exactly one in-stock size is available for the selected product and any other chosen options. Multiple available sizes still require a choice; sold-out sizes are never auto-selected. Other product options remain manual.

## Configure the offers

Tier 1 starts with up to four paid pairs, tier 2 with five paid plus one free, and tier 3 with seven paid plus two free. All percentage discounts default to zero until you set your intended percentages. Free-delivery badges default off until shipping is configured. Titles are editable independently; update titles if quantities change.

The percentage setting represents an additional order discount after the cheapest pairs become free. It does not represent total percentage savings including free pairs. The crossed-out price is the sum of the selected variants' current prices before bundle discounts, not their compare-at prices.

Theme settings only calculate the product-page estimate. They do not create Shopify discounts.

For the default fixed tiers, configure native automatic Buy X Get Y offers with buy quantities 5 and 7, get quantities 1 and 2, and the same single-pair collection for both buy and get. Review maximum uses per order (one use is the simplest starting point).

Create matching automatic percentage Amount off order discounts with minimum item counts 6 and 9. Set each order discount to combine with product discounts; set the Buy X Get Y offers to combine with order discounts. Do not allow the two order discounts to combine with each other, or their percentages can stack. Configure shipping separately if offering free delivery. Review any existing discounts, including app discounts, for interactions.

Shopify chooses eligible discounts across the entire cart, not by which tier the shopper clicked. More socks, other products, multiple bundles and discount codes can change eligibility or the best available discount combination. Order percentage discounts can apply to unrelated cart items too. The product-page estimate covers this selection only and cannot guarantee the same allocation in a different cart.

Shopify can choose a different equal-price pair as free. The picker uses selection order to break ties; the total free value is the same.

## Verify before enabling ordering

Use the unpublished theme and a test customer/cart. Native automatic discounts are store-wide even when the theme is unpublished, so schedule/activate test rules deliberately.

Check six pairs and nine pairs with unequal prices, sizes with different prices, repeated variants, existing cart items, additional quantities and your existing offers. Verify free-item quantities and the final checkout total. Verify free shipping separately. Do not complete a paid order just to check pricing.

Only after matching discounts have been tested, enable “Enable Add to cart after discount testing” in the block. The picker sends regular variant IDs and quantities, then opens Shopify's cart page to show the actual discounts. It does not set prices, assign permanent free-item properties, or depend on Unicorn.

## Implementation checks

Local pricing tests: run `node assets/onlysocks-bundle.test.cjs` from the theme root. Checks cover unequal prices, two free pairs, ties, changed prices, incomplete selections, rounding and schema defaults.

Local headless Edge checks also passed for blank sizes, optional tier 1 slots, six/nine slots, badge reassignment, incomplete-selection validation, missing Size errors, narrow mobile overflow, nine-item cart payload and inventory-error recovery. These used fixture products, not a connected Shopify checkout. Shopify theme validation and real-store checkout testing remain required.

References:
- https://help.shopify.com/en/manual/discounts/discount-combinations
- https://help.shopify.com/en/manual/discounts/discount-types/buy-x-get-y
