// Local, offline preview of the theme.
// Renders templates with liquidjs + mock Shopify data, then screenshots them with Chromium.
// This is a design check, not a Shopify emulator: server-only features (cart API, filters,
// search) are mocked. Usage: node tools/preview/preview.mjs [--no-shots]
import { Liquid, Tag } from 'liquidjs';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from '../brand/render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outDir = path.join(here, 'out');
const imagesDir = path.resolve(process.env.PREVIEW_IMAGES || path.join(root, 'tools/brand/images/products'));
mkdirSync(outDir, { recursive: true });

const read = (file) => readFileSync(path.join(root, file), 'utf8').replace(/posted_successfully\?/g, 'posted_successfully');
const fileUrl = (p) => pathToFileURL(p).href;

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const catalog = JSON.parse(read('tools/catalog.json'));
const settingsData = JSON.parse(read('config/settings_data.json').replace(/\/\*[\s\S]*?\*\//g, '')).current;
// Font settings are handles like "inter_n7"; Shopify turns them into font objects.
for (const key of ['type_heading_font', 'type_body_font']) {
  const [family, variant] = String(settingsData[key]).split('_');
  settingsData[key] = {
    family: family.charAt(0).toUpperCase() + family.slice(1),
    fallback_families: 'sans-serif',
    weight: Number(variant.slice(1)) * 100,
    style: 'normal',
  };
}
const locale = JSON.parse(read('locales/en.default.json'));

let nextId = 1000;
const image = (name) => ({
  src: fileUrl(path.join(imagesDir, `${name}.jpg`)),
  width: 1600,
  height: 2000,
  aspect_ratio: 0.8,
  alt: '',
  id: nextId++,
  media_type: 'image',
});

const cents = (usd) => Math.round(usd * catalog.usd_lbp_rate * 100);

const products = catalog.products.map((p) => {
  const imgs = p.images.map(image);
  const media = imgs.map((img) => ({ ...img, preview_image: img }));
  const sizes = p.sizes.length ? p.sizes : ['Default Title'];
  const variants = sizes.map((size, i) => ({
    id: nextId++,
    title: size,
    price: cents(p.usd),
    compare_at_price: null,
    available: !(p.handle === 'collective-emblem-hoodie' && size === 'XXL'),
    options: [size],
    sku: '',
    featured_media: null,
    url: `/products/${p.handle}?variant=${i}`,
  }));
  return {
    id: nextId++,
    handle: p.handle,
    title: p.title,
    type: p.type,
    vendor: 'Crusader Collective',
    url: `/products/${p.handle}`,
    tags: p.tags,
    description: p.description,
    available: true,
    price: cents(p.usd),
    price_min: cents(p.usd),
    price_max: cents(p.usd),
    price_varies: false,
    compare_at_price: null,
    featured_image: imgs[0],
    featured_media: media[0],
    images: imgs,
    media,
    has_only_default_variant: p.sizes.length === 0,
    options: p.sizes.length ? ['Size'] : ['Title'],
    options_with_values: [{ name: p.sizes.length ? 'Size' : 'Title', position: 1, values: sizes, selected_value: sizes[0] }],
    variants,
    selected_or_first_available_variant: variants[0],
  };
});

const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));
const collections = {};
for (const c of catalog.collections) {
  const items = products.filter((p) => (c.product_type ? p.type === c.product_type : p.tags.includes(c.tag)));
  collections[c.handle] = {
    handle: c.handle,
    title: c.title,
    url: `/collections/${c.handle}`,
    description: c.description,
    image: image(c.image),
    featured_image: image(c.image),
    products: items,
    products_count: items.length,
    all_products_count: items.length,
    filters: [],
    sort_options: [
      { value: 'manual', name: 'Featured' },
      { value: 'price-ascending', name: 'Price, low to high' },
      { value: 'created-descending', name: 'Newest' },
    ],
    default_sort_by: 'manual',
    sort_by: '',
  };
}
collections.all = {
  handle: 'all',
  title: 'Shop All',
  url: '/collections/all',
  products,
  products_count: products.length,
  filters: [
    { label: 'Availability', type: 'list', param_name: 'filter.v.availability', active_values: [], values: [{ label: 'In stock', value: '1', param_name: 'filter.v.availability', count: products.length, active: false }] },
    { label: 'Product type', type: 'list', param_name: 'filter.p.product_type', active_values: [], values: ['Hoodie', 'T-Shirt', 'Cap', 'Hat', 'Mug'].map((t) => ({ label: t, value: t, param_name: 'filter.p.product_type', count: products.filter((p) => p.type === t).length, active: false })) },
    { label: 'Price', type: 'price_range', param_name: 'filter.v.price', range_max: cents(55), min_value: { param_name: 'filter.v.price.gte', value: null }, max_value: { param_name: 'filter.v.price.lte', value: null }, active_values: [] },
  ],
  sort_options: collections.hoodies.sort_options,
  default_sort_by: 'manual',
  sort_by: '',
};
const collectionsList = catalog.collections.filter((c) => c.product_type).map((c) => collections[c.handle]);

const link = (title, url, links = []) => ({ title, url, links, active: false, current: false, child_active: false });
const linklists = {
  'main-menu': {
    handle: 'main-menu',
    links: [
      link('Shop', '/collections/all', [
        link('Shop all', '/collections/all'),
        ...collectionsList.map((c) => link(c.title, c.url)),
      ]),
      link('New Arrivals', '/collections/new-arrivals'),
      link('About', '/pages/about'),
      link('Contact', '/pages/contact'),
    ],
  },
  footer: {
    handle: 'footer',
    links: [link('Search', '/search'), link('FAQ', '/pages/faq'), link('Shipping & Returns', '/pages/shipping-returns'), link('Size Guide', '/pages/size-guide'), link('Contact', '/pages/contact')],
  },
};

const pages = {
  'size-guide': { title: 'Size Guide', handle: 'size-guide', content: '<table><tr><th>Size</th><th>Chest (cm)</th><th>Length (cm)</th></tr><tr><td>S</td><td>56</td><td>70</td></tr><tr><td>M</td><td>59</td><td>72</td></tr></table>' },
  'shipping-returns': { title: 'Shipping & Returns', handle: 'shipping-returns', content: '<p>Delivery details go here.</p>' },
  about: { title: 'About', handle: 'about', url: '/pages/about', content: '<p>Our story goes here.</p>' },
};

const cartItems = [byHandle['in-hoc-signo-hoodie'], byHandle['emblem-dad-cap']].map((p, i) => ({
  key: `k${i}`,
  url: p.url,
  image: p.featured_image,
  product: p,
  variant: p.variants[i === 0 ? 2 : 0],
  quantity: i === 0 ? 1 : 2,
  properties: [],
  original_line_price: p.price * (i === 0 ? 1 : 2),
  final_line_price: p.price * (i === 0 ? 1 : 2),
  line_level_discount_allocations: [],
  url_to_remove: '/cart/change?line=1&quantity=0',
}));
const cart = {
  item_count: 3,
  items: cartItems,
  total_price: cartItems.reduce((sum, item) => sum + item.final_line_price, 0),
  currency: { iso_code: 'LBP', symbol: 'LBP' },
  taxes_included: false,
  cart_level_discount_applications: [],
  note: '',
};

const baseScope = {
  settings: settingsData,
  shop: {
    name: 'Crusader Collective',
    currency: 'LBP',
    description: 'Streetwear for believers.',
    customer_accounts_enabled: true,
    policies: [],
    enabled_payment_types: [],
    shipping_policy: { body: '' },
    password_message: 'Opening soon.',
  },
  routes: {
    root_url: '/',
    cart_url: '/cart',
    cart_add_url: '/cart/add',
    cart_change_url: '/cart/change',
    search_url: '/search',
    predictive_search_url: '/search/suggest',
    product_recommendations_url: '/recommendations/products',
    collections_url: '/collections',
    all_products_collection_url: '/collections/all',
    account_url: '/account',
  },
  collections: { ...collections, size: collectionsList.length, [Symbol.iterator]: undefined },
  linklists,
  pages,
  cart,
  canonical_url: 'https://example.com/',
  page_description: 'Streetwear for believers.',
  current_page: 1,
  customer: null,
};

/* ------------------------------------------------------------------ */
/* Liquid engine with Shopify-ish tags and filters                     */
/* ------------------------------------------------------------------ */

const engine = new Liquid({
  root: [path.join(root, 'snippets')],
  extname: '.liquid',
  relativeReference: false,
  fs: {
    readFileSync: (file) => readFileSync(file, 'utf8').replace(/posted_successfully\?/g, 'posted_successfully'),
    readFile: async (file) => readFileSync(file, 'utf8').replace(/posted_successfully\?/g, 'posted_successfully'),
    existsSync,
    exists: async (file) => existsSync(file),
    resolve: (dir, file, ext) => path.resolve(dir, file.endsWith(ext) ? file : file + ext),
    contains: () => true,
    sep: path.sep,
    dirname: path.dirname,
  },
});

const kw = (args) => Object.fromEntries(args.filter((a) => Array.isArray(a)).map(([k, v]) => [k, v]));
const pluralize = (value, count) => {
  if (value && typeof value === 'object') return count === 1 ? value.one : value.other;
  return value;
};

engine.registerFilter('t', (key, ...args) => {
  const vars = kw(args);
  let value = key.split('.').reduce((obj, part) => (obj ? obj[part] : undefined), locale);
  value = pluralize(value, vars.count);
  if (typeof value !== 'string') return `translation missing: ${key}`;
  return value.replace(/{{\s*(\w+)\s*}}/g, (_, name) => (vars[name] !== undefined ? vars[name] : ''));
});
engine.registerFilter('asset_url', (name) => fileUrl(path.join(root, 'assets', name)));
engine.registerFilter('shopify_asset_url', (name) => name);
engine.registerFilter('stylesheet_tag', (url) => `<link rel="stylesheet" href="${url}">`);
engine.registerFilter('image_url', (img) => (img && typeof img === 'object' ? img.src : img || ''));
engine.registerFilter('image_tag', (src, ...args) => {
  const opts = kw(args);
  const attrs = Object.entries(opts)
    .filter(([k]) => !['widths', 'sizes', 'loading'].includes(k))
    .map(([k, v]) => `${k}="${v ?? ''}"`)
    .join(' ');
  return `<img src="${src}" ${attrs} width="1600" height="2000">`;
});
const money = (value) => `${(Number(value || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} LBP`;
engine.registerFilter('money', money);
engine.registerFilter('money_without_currency', (value) => (Number(value || 0) / 100).toFixed(2));
engine.registerFilter('font_modify', (font, prop, value) => (font ? { ...font, [prop]: value === 'bolder' ? 700 : value } : font));
engine.registerFilter('font_face', (font) =>
  font && typeof font === 'object'
    ? `@font-face{font-family:${font.family};font-weight:${font.weight};src:url(${fileUrl(path.join(root, 'tools/brand/fonts/inter-latin.woff2'))}) format('woff2')}`
    : '',
);
engine.registerFilter('font_url', () => '');
engine.registerFilter('preload_tag', () => '');
engine.registerFilter('color_modify', (color, prop, value) => {
  const hex = String(color).replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${value})`;
});
engine.registerFilter('placeholder_svg_tag', (name, cls) => `<svg class="${cls || ''}" viewBox="0 0 10 10"><rect width="10" height="10" fill="#ddd"/></svg>`);
engine.registerFilter('payment_type_svg_tag', () => '');
engine.registerFilter('payment_button', () => '<button type="button" class="shopify-payment-button__button shopify-payment-button__button--unbranded">Buy it now</button>');
engine.registerFilter('link_to', (text, url) => `<a href="${url}">${text}</a>`);
engine.registerFilter('handle', (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-'));
engine.registerFilter('handleize', (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-'));
engine.registerFilter('default_errors', () => '');
engine.registerFilter('time_tag', (d) => `<time>${d}</time>`);
engine.registerFilter('format_code', (s) => s);
engine.registerFilter('external_video_tag', () => '');
engine.registerFilter('video_tag', () => '');
engine.registerFilter('media_tag', () => '');

class SkipBlock extends Tag {
  constructor(token, remainTokens, liquid) {
    super(token, remainTokens, liquid);
    const end = `end${token.name}`;
    while (remainTokens.length) {
      const next = remainTokens.shift();
      if (next.name === end) return;
    }
    throw new Error(`${token.name} not closed`);
  }
  *render() {}
}
engine.registerTag('schema', SkipBlock);
engine.registerTag('javascript', SkipBlock);

class InnerBlock extends Tag {
  constructor(token, remainTokens, liquid) {
    super(token, remainTokens, liquid);
    this.args = token.args;
    this.templates = [];
    const stream = liquid.parser
      .parseStream(remainTokens)
      .on(`tag:end${token.name}`, () => stream.stop())
      .on('template', (tpl) => this.templates.push(tpl))
      .on('end', () => {
        throw new Error(`${token.name} not closed`);
      });
    stream.start();
  }
}

engine.registerTag(
  'form',
  class extends InnerBlock {
    *render(ctx, emitter) {
      const cls = (this.args.match(/class:\s*'([^']*)'/) || [])[1] || '';
      const type = (this.args.match(/data-type:\s*'([^']*)'/) || [])[1] || '';
      ctx.push({ form: { posted_successfully: false, errors: null, email: '' } });
      emitter.write(`<form method="post" class="${cls}"${type ? ` data-type="${type}"` : ''}>`);
      yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
      emitter.write('</form>');
      ctx.pop();
    }
  },
);

engine.registerTag(
  'paginate',
  class extends InnerBlock {
    *render(ctx, emitter) {
      ctx.push({ paginate: { pages: 1, current_page: 1, parts: [] } });
      yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
      ctx.pop();
    }
  },
);

engine.registerTag(
  'section',
  class extends Tag {
    constructor(token, remainTokens, liquid) {
      super(token, remainTokens, liquid);
      this.name = token.args.replace(/['"]/g, '').trim();
    }
    *render(ctx, emitter) {
      emitter.write(yield renderSection(this.name, this.name, { settings: {} }, ctx.getAll()));
    }
  },
);

engine.registerTag(
  'sections',
  class extends Tag {
    constructor(token, remainTokens, liquid) {
      super(token, remainTokens, liquid);
      this.name = token.args.replace(/['"]/g, '').trim();
    }
    *render(ctx, emitter) {
      const group = JSON.parse(read(`sections/${this.name}.json`));
      for (const key of group.order) {
        emitter.write(yield renderSection(group.sections[key].type, `sections--1__${key}`, group.sections[key], ctx.getAll()));
      }
    }
  },
);

/* ------------------------------------------------------------------ */
/* Section rendering                                                   */
/* ------------------------------------------------------------------ */

function resolveSetting(type, value) {
  if (value === undefined || value === null || value === '') return type === 'collection' || type === 'page' || type === 'image_picker' ? null : value;
  switch (type) {
    case 'collection':
      return collections[value] || null;
    case 'link_list':
      return linklists[value] || null;
    case 'page':
      return pages[value] || null;
    case 'url':
      return String(value).replace('shopify://', '/');
    default:
      return value;
  }
}

function buildSettings(defs = [], values = {}) {
  const out = {};
  for (const def of defs) {
    if (!def.id) continue;
    const raw = values[def.id] !== undefined ? values[def.id] : def.default;
    out[def.id] = resolveSetting(def.type, raw);
  }
  return out;
}

async function renderSection(type, id, data, scope) {
  const source = read(`sections/${type}.liquid`);
  const schemaMatch = source.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  const schema = schemaMatch ? JSON.parse(schemaMatch[1]) : {};
  const blockDefs = Object.fromEntries((schema.blocks || []).map((b) => [b.type, b]));
  const blocks = (data.block_order || []).map((key) => {
    const block = data.blocks[key];
    return { id: key, type: block.type, settings: buildSettings((blockDefs[block.type] || {}).settings, block.settings), shopify_attributes: '' };
  });
  const section = { id, settings: buildSettings(schema.settings, data.settings), blocks };
  const html = await engine.parseAndRender(source, { ...scope, section }, { globals: scope });
  return `<div id="shopify-section-${id}" class="shopify-section ${schema.class || ''}">${html}</div>`;
}

async function renderPage(templateName, extra = {}) {
  const template = JSON.parse(read(`templates/${templateName}.json`));
  const [name, suffix] = templateName.split('.');
  const scope = {
    ...baseScope,
    ...extra,
    template: { name, suffix: suffix || null },
    request: { page_type: name, locale: { iso_code: 'en' }, origin: 'https://example.com' },
    page_title: extra.page_title || 'Crusader Collective',
  };
  let content = '';
  for (const key of template.order) {
    content += await renderSection(template.sections[key].type, `template--1__${key}`, template.sections[key], scope);
  }
  const layout = read(`layout/${template.layout || 'theme'}.liquid`);
  return engine.parseAndRender(layout, { ...scope, content_for_layout: content, content_for_header: '' }, { globals: scope });
}

/* ------------------------------------------------------------------ */
/* Pages to preview                                                    */
/* ------------------------------------------------------------------ */

const product = byHandle['in-hoc-signo-hoodie'];
const pagesToRender = {
  index: () => renderPage('index'),
  collection: () => renderPage('collection', { collection: collections.all, page_title: 'Shop All' }),
  product: () => renderPage('product', { product, page_title: product.title }),
  cart: () => renderPage('cart', { page_title: 'Cart' }),
  about: () => renderPage('page.about', { page: pages.about, page_title: 'About' }),
  '404': () => renderPage('404', { page_title: 'Not found' }),
  password: () => renderPage('password'),
};

const files = {};
for (const [name, render] of Object.entries(pagesToRender)) {
  const html = await render();
  const file = path.join(outDir, `${name}.html`);
  writeFileSync(file, html);
  files[name] = file;
  const missing = html.match(/translation missing: [\w.]+/g);
  if (missing) console.warn(`${name}: ${[...new Set(missing)].join(', ')}`);
  console.log(`rendered ${name}`);
}

if (!process.argv.includes('--no-shots')) {
  const browser = await launchBrowser();
  const shots = [
    ['index', 1440, 900, true],
    ['index', 390, 844, true],
    ['collection', 1440, 900, true],
    ['collection', 390, 844, true],
    ['product', 1440, 900, true],
    ['product', 390, 844, true],
    ['cart', 1440, 900, true],
    ['about', 1440, 900, false],
    ['404', 1440, 900, false],
    ['password', 1440, 900, false],
  ];
  for (const [name, width, height, full] of shots) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', (err) => console.warn(`[${name}@${width}] page error: ${err.message}`));
    await page.goto(fileUrl(files[name]));
    await page.waitForTimeout(600);
    // Reveal-on-scroll hides below-the-fold content; show everything for full-page shots.
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important} [data-reveal]{opacity:1!important;transform:none!important;transition:none!important} .hero__image,.hero__content{animation:none!important}' });
    await page.screenshot({ path: path.join(outDir, `${name}-${width}.png`), fullPage: full });
    if (name === 'index' && width === 1440) {
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(outDir, `index-scrolled-${width}.png`) });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.click('[data-currency="LBP"]');
      await page.evaluate(() => document.querySelector('.section-featured-collection').scrollIntoView());
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(outDir, `index-lbp-${width}.png`) });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.click('[data-currency="USD"]');
      await page.click('.header__icon--cart');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, `cart-drawer-${width}.png`) });
    }
    if (name === 'index' && width === 390) {
      await page.click('.header__menu-toggle');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, `menu-drawer-${width}.png`) });
    }
    await page.close();
  }
  await browser.close();
  console.log(`screenshots in ${outDir}`);
}
