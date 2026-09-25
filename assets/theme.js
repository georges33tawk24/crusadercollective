/* Crusader theme — storefront behaviour. No dependencies. */
(() => {
  'use strict';

  const theme = window.theme || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const debounce = (fn, wait = 250) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };

  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        /* private mode or storage disabled */
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* Toast                                                               */
  /* ------------------------------------------------------------------ */

  let toastTimer;
  function toast(message) {
    const el = $('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 2600);
  }

  /* ------------------------------------------------------------------ */
  /* Currency toggle (display only)                                      */
  /* ------------------------------------------------------------------ */

  const Currency = {
    config: theme.currency || { enabled: false },
    supported: ['USD', 'LBP'],

    get active() {
      const stored = storage.get('cc-currency');
      if (this.supported.includes(stored)) return stored;
      return this.supported.includes(this.config.fallback) ? this.config.fallback : this.config.shop;
    },

    get usable() {
      return Boolean(this.config.enabled) && this.supported.includes(this.config.shop) && Number(this.config.rate) > 0;
    },

    convert(cents, target) {
      const amount = Number(cents) / 100;
      const { shop } = this.config;
      const rate = Number(this.config.rate);
      if (target === shop) return amount;
      if (shop === 'LBP' && target === 'USD') return amount / rate;
      if (shop === 'USD' && target === 'LBP') return amount * rate;
      return null;
    },

    format(cents, target = this.usable ? this.active : this.config.shop) {
      const value = this.usable ? this.convert(cents, target) : Number(cents) / 100;
      const code = this.usable ? target : this.config.shop;
      if (value === null || Number.isNaN(value)) return null;

      if (code === 'LBP') {
        const rounded = Math.round(value / 1000) * 1000;
        return `${rounded.toLocaleString('en-US')} LBP`;
      }
      if (code === 'USD') {
        const whole = Math.abs(value - Math.round(value)) < 0.005;
        return `$${value.toLocaleString('en-US', {
          minimumFractionDigits: whole ? 0 : 2,
          maximumFractionDigits: 2,
        })}`;
      }
      try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(value);
      } catch (error) {
        return null;
      }
    },

    render(root = document) {
      if (!this.usable) return;
      const nodes = root.matches && root.matches('[data-money]') ? [root] : $$('[data-money]', root);
      nodes.forEach((node) => {
        const cents = node.getAttribute('data-money');
        if (cents === '' || cents === null) return;
        const text = this.format(cents);
        if (text && node.textContent !== text) node.textContent = text;
      });
      const showNote = this.active !== this.config.shop;
      $$('[data-currency-note]', root.nodeType === 1 ? root : document).forEach((note) => {
        note.hidden = !showNote;
      });
    },

    set(code) {
      if (!this.supported.includes(code)) return;
      storage.set('cc-currency', code);
      this.syncToggles();
      this.render();
    },

    syncToggles() {
      const active = this.active;
      $$('[data-currency-toggle] [data-currency]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.currency === active));
      });
    },

    init() {
      if (!this.usable) {
        $$('[data-currency-toggle]').forEach((toggle) => {
          toggle.hidden = true;
        });
        return;
      }
      document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-currency-toggle] [data-currency]');
        if (button) this.set(button.dataset.currency);
      });
      this.syncToggles();
      this.render();

      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) this.render(node);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Header                                                              */
  /* ------------------------------------------------------------------ */

  function initHeader() {
    const header = $('[data-header]');
    if (!header) return;

    const setHeight = () => {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    };
    setHeight();
    if ('ResizeObserver' in window) new ResizeObserver(setHeight).observe(header);
    else window.addEventListener('resize', setHeight);

    if (header.hasAttribute('data-transparent')) {
      const update = () => {
        const solid = window.scrollY > 24 || document.body.classList.contains('is-locked');
        header.classList.toggle('is-solid', solid);
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      header.addEventListener('mouseenter', () => header.classList.add('is-solid'));
      header.addEventListener('mouseleave', update);
      document.addEventListener('drawer:change', update);
    }

    // Open desktop dropdowns on hover, close them when clicking elsewhere.
    const canHover = window.matchMedia('(hover: hover)').matches;
    $$('[data-hover-details]').forEach((details) => {
      if (canHover) {
        details.addEventListener('mouseenter', () => details.setAttribute('open', ''));
        details.addEventListener('mouseleave', () => details.removeAttribute('open'));
      }
    });
    document.addEventListener('click', (event) => {
      $$('[data-hover-details][open]').forEach((details) => {
        if (!details.contains(event.target)) details.removeAttribute('open');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Drawers                                                             */
  /* ------------------------------------------------------------------ */

  const Drawer = {
    current: null,
    trigger: null,

    open(id, trigger) {
      const drawer = document.getElementById(id);
      if (!drawer) return;
      if (this.current && this.current !== drawer) this.close(false);
      this.current = drawer;
      this.trigger = trigger || document.activeElement;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      $$(`[data-drawer-toggle="${id}"]`).forEach((el) => el.setAttribute('aria-expanded', 'true'));
      const focusTarget = $('[data-predictive-search-input]', drawer) || $('.drawer__panel', drawer);
      requestAnimationFrame(() => focusTarget && focusTarget.focus({ preventScroll: true }));
      document.dispatchEvent(new CustomEvent('drawer:change'));
    },

    close(restoreFocus = true) {
      const drawer = this.current;
      if (!drawer) return;
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      $$(`[data-drawer-toggle="${drawer.id}"]`).forEach((el) => el.setAttribute('aria-expanded', 'false'));
      this.current = null;
      if (restoreFocus && this.trigger && this.trigger.focus) this.trigger.focus({ preventScroll: true });
      document.dispatchEvent(new CustomEvent('drawer:change'));
    },

    init() {
      document.addEventListener('click', (event) => {
        const toggle = event.target.closest('[data-drawer-toggle]');
        if (toggle) {
          const id = toggle.getAttribute('data-drawer-toggle');
          if (!document.getElementById(id)) return;
          event.preventDefault();
          if (this.current && this.current.id === id) this.close();
          else this.open(id, toggle);
          return;
        }
        if (event.target.closest('[data-drawer-close]')) {
          event.preventDefault();
          this.close();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (!this.current) return;
        if (event.key === 'Escape') {
          this.close();
          return;
        }
        if (event.key !== 'Tab') return;
        const focusable = $$(
          'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
          this.current,
        ).filter((el) => el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Cart                                                                */
  /* ------------------------------------------------------------------ */

  const Cart = {
    get drawer() {
      return document.getElementById('CartDrawer');
    },

    sectionIds() {
      const ids = [];
      if (this.drawer) ids.push('cart-drawer');
      const page = $('[data-cart-page]');
      const wrapper = page && page.closest('.shopify-section');
      if (wrapper) ids.push(wrapper.id.replace('shopify-section-', ''));
      return ids;
    },

    renderSections(sections) {
      if (!sections) return;
      Object.entries(sections).forEach(([id, html]) => {
        if (!html) return;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        if (id === 'cart-drawer') {
          const nextPanel = $('#CartDrawer .drawer__panel', doc);
          const panel = $('#CartDrawer .drawer__panel');
          if (nextPanel && panel) panel.innerHTML = nextPanel.innerHTML;
          const count = $('[data-cart-drawer-count]', doc);
          if (count) this.updateCount(Number(count.getAttribute('data-cart-drawer-count')));
          return;
        }
        const target = document.getElementById(`shopify-section-${id}`);
        const source = doc.getElementById(`shopify-section-${id}`);
        if (target && source) target.innerHTML = source.innerHTML;
      });
    },

    updateCount(count) {
      $$('[data-cart-count]').forEach((bubble) => {
        const label = $('[aria-hidden="true"]', bubble);
        if (label) label.textContent = count > 99 ? '99' : String(count);
        bubble.hidden = count === 0;
        bubble.classList.remove('is-bumped');
        void bubble.offsetWidth;
        bubble.classList.add('is-bumped');
      });
    },

    async refreshCount() {
      try {
        const response = await fetch(`${theme.routes.cart}.js`, { headers: { Accept: 'application/json' } });
        const cart = await response.json();
        this.updateCount(cart.item_count);
      } catch (error) {
        /* ignore */
      }
    },

    async add(body, { button } = {}) {
      if (button) button.classList.add('is-loading');
      try {
        const response = await fetch(`${theme.routes.cartAdd}.js`, {
          method: 'POST',
          headers: body instanceof FormData ? { Accept: 'application/json' } : { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: body instanceof FormData ? body : JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok || data.status) {
          throw new Error(data.description || data.message || theme.strings.cartError);
        }
        if (this.drawer) {
          this.renderSections(data.sections);
          Drawer.open('CartDrawer', button);
        } else {
          await this.refreshCount();
          toast(theme.strings.added);
        }
        return data;
      } finally {
        if (button) button.classList.remove('is-loading');
      }
    },

    async change(line, quantity) {
      const item = $$(`[data-line="${line}"]`);
      item.forEach((el) => el.classList.add('is-updating'));
      try {
        const response = await fetch(`${theme.routes.cartChange}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ line, quantity, sections: this.sectionIds(), sections_url: window.location.pathname }),
        });
        const data = await response.json();
        if (!response.ok || data.status) throw new Error(data.description || theme.strings.cartError);
        this.renderSections(data.sections);
        this.updateCount(data.item_count);
        if (!data.sections || !Object.keys(data.sections).length) window.location.reload();
      } catch (error) {
        toast(error.message || theme.strings.cartError);
        item.forEach((el) => el.classList.remove('is-updating'));
      }
    },

    init() {
      // Product forms
      document.addEventListener('submit', async (event) => {
        const form = event.target.closest('form[data-type="product-form"]');
        if (!form) return;
        if (!this.drawer) return; // cart page mode: let the browser submit normally
        event.preventDefault();
        const button = $('[data-add-to-cart]', form);
        const error = $('[data-form-error]', form);
        if (error) error.hidden = true;
        const formData = new FormData(form);
        formData.append('sections', this.sectionIds().join(','));
        formData.append('sections_url', window.location.pathname);
        try {
          await this.add(formData, { button });
        } catch (err) {
          if (error) {
            error.textContent = err.message;
            error.hidden = false;
          } else {
            toast(err.message);
          }
        }
      });

      // Quick add from product cards
      document.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-quick-add]');
        if (!button) return;
        event.preventDefault();
        try {
          await this.add(
            { items: [{ id: Number(button.dataset.quickAdd), quantity: 1 }], sections: this.sectionIds(), sections_url: window.location.pathname },
            { button },
          );
        } catch (err) {
          toast(err.message);
        }
      });

      // Remove links
      document.addEventListener('click', (event) => {
        const remove = event.target.closest('[data-cart-remove]');
        if (!remove) return;
        event.preventDefault();
        this.change(Number(remove.dataset.cartRemove), 0);
      });

      // Quantity inputs in cart
      const onQuantity = debounce((input) => {
        const quantity = Math.max(0, parseInt(input.value, 10) || 0);
        this.change(Number(input.dataset.cartQuantity), quantity);
      }, 400);
      document.addEventListener('change', (event) => {
        const input = event.target.closest('[data-cart-quantity]');
        if (input) onQuantity(input);
      });

      // Order note
      document.addEventListener(
        'input',
        debounce((event) => {
          const note = event.target.closest('[data-cart-note]');
          if (!note) return;
          fetch(`${theme.routes.cart}/update.js`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ note: note.value }),
          });
        }, 500),
      );
    },
  };

  /* ------------------------------------------------------------------ */
  /* Quantity steppers                                                   */
  /* ------------------------------------------------------------------ */

  function initQuantity() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-quantity-step]');
      if (!button) return;
      const wrapper = button.closest('[data-quantity]');
      const input = wrapper && $('input', wrapper);
      if (!input) return;
      const min = input.min === '' ? 0 : Number(input.min);
      const next = Math.max(min, (parseInt(input.value, 10) || 0) + Number(button.dataset.quantityStep));
      if (String(next) === input.value) return;
      input.value = next;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Product page                                                        */
  /* ------------------------------------------------------------------ */

  function initProduct(section) {
    const jsonEl = $('[data-product-json]', section);
    if (!jsonEl) return;
    const product = JSON.parse(jsonEl.textContent);
    const picker = $('[data-variant-picker]', section);
    const form = $('form[data-type="product-form"]', section);
    const idInput = form && $('[data-variant-id]', form);
    const button = form && $('[data-add-to-cart]', form);
    const buttonText = button && $('[data-add-to-cart-text]', button);
    const gallery = $('[data-gallery]', section);

    const selectedOptions = () =>
      $$('.variant-picker__option', picker).map((fieldset) => {
        const checked = $('input:checked', fieldset);
        return checked ? checked.value : null;
      });

    const findVariant = (options) =>
      product.variants.find((variant) => variant.options.every((value, index) => value === options[index]));

    const markAvailability = (options) => {
      $$('.variant-picker__option', picker).forEach((fieldset, index) => {
        $$('input', fieldset).forEach((input) => {
          const candidate = options.slice();
          candidate[index] = input.value;
          const match = product.variants.find(
            (variant) => variant.available && variant.options.every((value, i) => value === candidate[i]),
          );
          input.classList.toggle('is-unavailable', !match);
        });
      });
    };

    const updatePrice = (variant) => {
      const price = $('[data-product-price] [data-price]', section);
      if (!price || !variant) return;
      const current = $('[data-price-current]', price);
      const compareWrap = $('.price__compare', price);
      const compare = $('[data-price-compare]', price);
      const onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
      current.setAttribute('data-money', variant.price);
      current.textContent = Currency.format(variant.price) || current.textContent;
      if (compare) {
        compare.setAttribute('data-money', variant.compare_at_price || 0);
        compare.textContent = Currency.format(variant.compare_at_price || 0) || compare.textContent;
      }
      if (compareWrap) compareWrap.hidden = !onSale;
      price.classList.toggle('price--sale', Boolean(onSale));
    };

    const scrollToMedia = (variant) => {
      if (!gallery || !variant || !variant.featured_media) return;
      const item = $(`[data-media-id="${variant.featured_media.id}"]`, gallery);
      if (!item) return;
      if (window.matchMedia('(max-width: 749px)').matches) {
        gallery.scrollTo({ left: item.offsetLeft - gallery.offsetLeft, behavior: 'smooth' });
      }
    };

    const onChange = () => {
      const options = selectedOptions();
      const variant = findVariant(options);
      $$('.variant-picker__option', picker).forEach((fieldset, index) => {
        const label = $('[data-selected-value]', fieldset);
        if (label) label.textContent = options[index] || '';
      });
      markAvailability(options);

      if (button) {
        button.disabled = !variant || !variant.available;
        if (buttonText) {
          buttonText.textContent = !variant
            ? theme.strings.unavailable
            : variant.available
              ? theme.strings.addToCart
              : theme.strings.soldOut;
        }
      }
      if (!variant) return;
      if (idInput) idInput.value = variant.id;
      updatePrice(variant);
      scrollToMedia(variant);
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    };

    if (picker) {
      picker.addEventListener('change', onChange);
      markAvailability(selectedOptions());
    }

    // Gallery dots on mobile
    const dots = $$('.product-gallery__dot', section);
    if (gallery && dots.length) {
      gallery.addEventListener(
        'scroll',
        debounce(() => {
          const index = Math.round(gallery.scrollLeft / gallery.clientWidth);
          dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
        }, 60),
        { passive: true },
      );
    }
  }

  function initShare() {
    document.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-share]');
      if (!button) return;
      const url = button.dataset.shareUrl || window.location.href;
      const title = button.dataset.shareTitle || document.title;
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch (error) {
          /* cancelled */
        }
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
      } catch (error) {
        window.prompt('Copy link', url);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Product recommendations                                             */
  /* ------------------------------------------------------------------ */

  function initRecommendations() {
    $$('[data-recommendations]').forEach((container) => {
      const load = async () => {
        try {
          const response = await fetch(container.dataset.url);
          const html = await response.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const next = $('[data-recommendations]', doc);
          if (next && next.innerHTML.trim()) container.innerHTML = next.innerHTML;
        } catch (error) {
          /* ignore */
        }
      };
      if (!('IntersectionObserver' in window)) return load();
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            load();
          }
        },
        { rootMargin: '0px 0px 400px 0px' },
      );
      observer.observe(container);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Predictive search                                                   */
  /* ------------------------------------------------------------------ */

  function initPredictiveSearch() {
    const input = $('[data-predictive-search-input]');
    const results = $('[data-predictive-search-results]');
    if (!input || !results || !theme.routes.predictiveSearch) return;
    let controller;

    const search = debounce(async () => {
      const query = input.value.trim();
      if (controller) controller.abort();
      if (query.length < 2) {
        results.innerHTML = '';
        return;
      }
      controller = new AbortController();
      const params = new URLSearchParams({
        q: query,
        'resources[type]': 'product,collection,page',
        'resources[limit]': '6',
        section_id: 'predictive-search',
      });
      try {
        const response = await fetch(`${theme.routes.predictiveSearch}?${params}`, { signal: controller.signal });
        if (!response.ok) return;
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const body = $('[data-predictive-search-body]', doc);
        results.innerHTML = body ? body.outerHTML : '';
      } catch (error) {
        /* aborted */
      }
    }, 220);

    input.addEventListener('input', search);
  }

  /* ------------------------------------------------------------------ */
  /* Filters and sorting                                                 */
  /* ------------------------------------------------------------------ */

  function initFacets() {
    $$('[data-facets-form]').forEach((form) => {
      form.addEventListener('change', (event) => {
        if (!event.target.matches('[data-facet-input]')) return;
        const params = new URLSearchParams(new FormData(form));
        // Drop empty price inputs so they don't filter everything out.
        Array.from(params.keys()).forEach((key) => {
          if (params.get(key) === '') params.delete(key);
        });
        window.location.search = params.toString();
      });

      $$('[data-facet]', form).forEach((details) => {
        details.addEventListener('toggle', () => {
          if (!details.open) return;
          $$('[data-facet]', form).forEach((other) => {
            if (other !== details) other.removeAttribute('open');
          });
        });
      });
    });

    document.addEventListener('click', (event) => {
      $$('[data-facet][open]').forEach((details) => {
        if (!details.contains(event.target)) details.removeAttribute('open');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                       */
  /* ------------------------------------------------------------------ */

  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets = $$(
      '.section-heading, .category-card, .product-grid__item, .image-with-text__grid, .features__item, .newsletter__inner',
    ).filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    if (!targets.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    targets.forEach((el, index) => {
      el.setAttribute('data-reveal', '');
      el.style.transitionDelay = `${(index % 4) * 70}ms`;
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Theme editor support                                                */
  /* ------------------------------------------------------------------ */

  function initEditor() {
    if (!window.Shopify || !window.Shopify.designMode) return;
    document.addEventListener('shopify:section:load', (event) => {
      $$('[data-product-section]', event.target).forEach(initProduct);
      Currency.render(event.target);
      initHeader();
    });
  }

  /* ------------------------------------------------------------------ */

  function init() {
    Currency.init();
    initHeader();
    Drawer.init();
    Cart.init();
    initQuantity();
    $$('[data-product-section]').forEach(initProduct);
    initShare();
    initRecommendations();
    initPredictiveSearch();
    initFacets();
    initReveal();
    initEditor();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.CrusaderTheme = { Cart, Currency, Drawer, toast };
})();
