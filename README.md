# Crusader Collective — Shopify theme

A custom Shopify Online Store 2.0 theme for **Crusader Collective**: black and white, bold streetwear for hoodies, tees, caps, hats and mugs.

## What's in it

- **Transparent header over the hero** that turns solid on scroll, round logo mark, desktop dropdown menu and a full-screen mobile menu.
- **USD / LBP price toggle** in the header. Prices are converted in the browser at a rate you set in *Theme settings → Currency toggle*. Customers are still charged in the store currency at checkout, and the cart says so.
- **Home page sections**: hero, shop by category, scrolling text, featured products, image with text, highlights, newsletter, rich text, apps.
- **Product page**: large gallery (swipe on mobile), size buttons that grey out sold-out combinations, size guide, quantity, add to cart, dynamic checkout buttons, collapsible tabs, share, "Complete the fit" recommendations, Product JSON-LD for search engines.
- **Collection page**: storefront filters (Search & Discovery), sorting, pagination.
- **Quick add** from product grids (size picker on hover for apparel, one-tap for single-variant products).
- **Cart drawer** with quantity controls, optional free-shipping progress bar and order note; full cart page as a fallback.
- **Predictive search** drawer, search results page, 404, blog, article, contact form, password page, gift card.
- Optional **floating WhatsApp button** (Theme settings → Social media).
- Accessible (skip link, focus management, keyboard-friendly drawers, reduced-motion support), no jQuery, one CSS and one JS file.

## Theme layout

```
assets/      base.css, theme.js, default hero art, favicon
config/      settings_schema.json, settings_data.json
layout/      theme.liquid, password.liquid
locales/     en.default.json (all storefront text, ready for Arabic/French translations)
sections/    header, footer, hero, category-grid, featured-collection, main-* templates…
snippets/    product-card, price, cart-items, facets, icons…
templates/   JSON templates (index, product, collection, cart, page.about, page.contact…)
tools/       brand artwork generator, product catalog data, local preview (not part of the theme)
```

## Using it in Shopify

**Option A — connect GitHub (recommended):** Shopify admin → *Online Store → Themes → Add theme → Connect from GitHub*, pick this repository and branch. Every push updates the theme.

**Option B — upload a zip:** download [`dist/crusader-theme.zip`](dist/crusader-theme.zip) and upload it in *Online Store → Themes → Add theme → Upload zip file*. Rebuild it after changes by zipping the theme folders (`assets config layout locales sections snippets templates`) at the zip's root.

Then *Customize* the theme to swap in your own photos, logo and text.

## Tools (optional)

```
cd tools
npm install
npm run brand     # re-render the logo mark, hero art and product mockups
npm run preview   # render pages with mock data and screenshot them (tools/preview/out)
```

`tools/catalog.json` holds the sample products and collections used to set up the store.
