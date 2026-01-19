/**
 * ThredUp Price Checker - Content Script
 * Auto-redirects to featured URL and shows discount status with savings
 */

(function() {
  'use strict';

  // Configuration
  const THREDUP_BASE_URL = 'https://www.thredup.com';
  const REFERRAL_PARAMS = {
    context: 'google_pmax_pla',
    code: 'adwords_pla'
  };
  const STORAGE_KEY = 'thredup_checker_original_discount';

  /**
   * Check if we're on a featured/discount page
   * @returns {boolean} True if on featured page
   */
  function isOnFeaturedPage() {
    return window.location.pathname.startsWith('/featured/');
  }

  /**
   * Check if we're on a product page
   * @returns {boolean} True if on product page
   */
  function isOnProductPage() {
    return window.location.pathname.startsWith('/product/');
  }

  /**
   * Extract product ID from current URL (works for both /product/ and /featured/ pages)
   * @returns {string|null} Product ID or null if not found
   */
  function extractProductId() {
    const url = window.location.href;

    // Try /product/ URL pattern
    let match = url.match(/\/product\/[^/]+\/(\d+)/);
    if (match) return match[1];

    // Try /featured/ URL pattern
    match = url.match(/\/featured\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract category from URL
   * @returns {string} Category (women, kids) or default 'women'
   */
  function extractCategory() {
    const url = window.location.href;
    const match = url.match(/\/product\/(women|kids)-/);
    return match ? match[1] : 'women';
  }

  /**
   * Build featured URL with proper parameters
   * @param {string} productId - The product ID
   * @param {string} category - The product category
   * @returns {string} Complete featured URL
   */
  function buildFeaturedUrl(productId, category) {
    const params = new URLSearchParams({
      department_tags: category,
      referral_context: REFERRAL_PARAMS.context,
      referral_code: REFERRAL_PARAMS.code
    });
    return `${THREDUP_BASE_URL}/featured/${productId}?${params.toString()}`;
  }



  /**
   * Get discount percentage from the .ui-promo-code badge (featured page)
   * Format: <span class="ui-promo-code ...">50% off</span>
   * @returns {number|null} Discount percentage or null if not found
   */
  function getPromoCodeDiscount() {
    const promoBadges = document.querySelectorAll('.ui-promo-code');

    for (const badge of promoBadges) {
      const text = badge.textContent.trim().toLowerCase();
      const match = text.match(/(\d+)%\s*off/);
      if (match) {
        const percent = parseInt(match[1], 10);
        console.log('[ThredUp Checker] Found promo code badge:', text, '->', percent, '%');
        return percent;
      }
    }

    console.log('[ThredUp Checker] No promo code badge found');
    return null;
  }

  /**
   * Get discount percentage from "XX% off with code" text (product page)
   * Format: <span class="u-text-burgundy-700 u-ml-1xs">30<!-- -->% off with code</span>
   * @returns {number|null} Discount percentage or null if not found
   */
  function getProductPageDiscount() {
    // Use specific selector from the product page structure
    const el = document.querySelector('#root > div > main section div.u-flex-grow span.u-text-burgundy-700.u-ml-1xs');
    if (el) {
      const text = el.textContent.replace(/<!--.*?-->/g, '').trim();
      const match = text.match(/(\d+)\s*%\s*off\s+with\s+code/i);
      if (match) {
        const percent = parseInt(match[1], 10);
        console.log('[ThredUp Checker] Found product page discount:', text, '->', percent, '%');
        return percent;
      }
    }
    console.log('[ThredUp Checker] No product page discount found');
    return null;
  }

  /**
   * Create discount badge showing result
   * @param {boolean} has50PercentOff - Whether 50%+ discount was found
   * @param {number} promoDiscount - Discount percentage from promo badge
   * @param {number|null} originalSaleDiscount - Original sale discount (e.g., 40% off with code)
   */
  function createDiscountBadge(has50PercentOff, promoDiscount, originalSaleDiscount) {
    // Check if badge already exists
    if (document.getElementById('thredup-discount-badge')) {
      return;
    }

    const badge = document.createElement('div');
    badge.id = 'thredup-discount-badge';

    const content = document.createElement('div');
    content.className = 'discount-badge-content';

    const mainText = document.createElement('span');
    mainText.className = 'discount-badge-text';

    const subText = document.createElement('span');
    subText.className = 'discount-badge-subtext';

    // Check if promo discount is greater than 50%
    const hasLargerDiscount = promoDiscount > 50;

    if (hasLargerDiscount) {
      // Already more than 50% off!
      badge.className = 'thredup-discount-badge discount-badge-original-better';
      mainText.textContent = `${promoDiscount}% OFF!`;
      subText.textContent = 'Better than 50% off!';
    } else if (has50PercentOff) {
      // 50% off is available
      badge.className = 'thredup-discount-badge discount-badge-applied';
      mainText.textContent = `${promoDiscount}% OFF AVAILABLE`;
      if (originalSaleDiscount !== null) {
        subText.textContent = `Original sale was ${originalSaleDiscount}% off`;
      } else {
        subText.textContent = 'Discount applied!';
      }
    } else {
      // No discount available
      badge.className = 'thredup-discount-badge discount-badge-unavailable';
      mainText.textContent = 'NO 50% DISCOUNT';
      if (originalSaleDiscount !== null) {
        subText.textContent = `Only ${originalSaleDiscount}% off available`;
      } else {
        subText.textContent = 'Regular price only';
      }
    }
    badge.style.cursor = 'default';

    const loginHint = document.createElement('span');
    loginHint.className = 'discount-badge-hint';
    loginHint.textContent = '(make sure you\'re logged in)';

    content.appendChild(mainText);
    content.appendChild(subText);
    content.appendChild(loginHint);
    badge.appendChild(content);

    document.body.appendChild(badge);
  }


  /**
   * Create badge for product page when discount is already >50%
   * @param {number} discountPercent - The discount percentage
   */
  function createProductPageBadge(discountPercent) {
    // Check if badge already exists
    if (document.getElementById('thredup-discount-badge')) {
      return;
    }

    const badge = document.createElement('div');
    badge.id = 'thredup-discount-badge';
    badge.className = 'thredup-discount-badge discount-badge-original-better';

    const content = document.createElement('div');
    content.className = 'discount-badge-content';

    const mainText = document.createElement('span');
    mainText.className = 'discount-badge-text';
    mainText.textContent = `${discountPercent}% OFF!`;

    const subText = document.createElement('span');
    subText.className = 'discount-badge-subtext';
    subText.textContent = 'Better than the 50% deal!';

    const loginHint = document.createElement('span');
    loginHint.className = 'discount-badge-hint';
    loginHint.textContent = '(make sure you\'re logged in)';

    content.appendChild(mainText);
    content.appendChild(subText);
    content.appendChild(loginHint);
    badge.appendChild(content);
    badge.style.cursor = 'default';

    document.body.appendChild(badge);
  }

  /**
   * Remove the badge from the page
   */
  function removeBadge() {
    const badge = document.getElementById('thredup-discount-badge');
    if (badge) {
      badge.remove();
    }
  }

  /**
   * Main execution
   */
  function init() {
    // Always remove existing badge first
    removeBadge();

    const productId = extractProductId();
    if (!productId) {
      console.log('[ThredUp Checker] Not a valid product page');
      return;
    }

    // If on a product page, wait for page to load then check discount
    if (isOnProductPage()) {
      setTimeout(() => {
        const productDiscount = getProductPageDiscount();
        console.log(`[ThredUp Checker] Product page discount: ${productDiscount}%`);

        if (productDiscount !== null && productDiscount > 50) {
          // Already has a bigger discount, don't redirect - show badge here
          console.log(`[ThredUp Checker] Already ${productDiscount}% off on product page, not redirecting`);
          createProductPageBadge(productDiscount);
          return;
        }

        // Store the original discount before redirecting
        if (productDiscount !== null) {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
            productId: productId,
            discount: productDiscount,
            timestamp: Date.now()
          }));
        }

        const category = extractCategory();
        const featuredUrl = buildFeaturedUrl(productId, category);
        console.log(`[ThredUp Checker] Redirecting to featured URL: ${featuredUrl}`);
        window.location.href = featuredUrl;
      }, 1000);
      return;
    }

    // If on a featured page, wait for page to load then check for discount
    if (isOnFeaturedPage()) {
      console.log('[ThredUp Checker] On featured page, waiting for page to load...');

      const checkWhenReady = () => {
        // Wait for price element to appear (indicates page is loaded)
        const priceElement = document.querySelector('.heading-sm-sans-bold');
        if (!priceElement) {
          // Page not ready yet, keep waiting
          setTimeout(checkWhenReady, 300);
          return;
        }

        // Page is loaded - now check for promo badge
        const promoDiscount = getPromoCodeDiscount();
        const discountPercent = promoDiscount !== null ? promoDiscount : 0;
        const has50PercentOff = promoDiscount !== null && promoDiscount >= 50;

        // Get stored original discount from product page
        let originalSaleDiscount = null;
        try {
          const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
          if (stored && stored.productId === productId && (Date.now() - stored.timestamp) < 60000) {
            originalSaleDiscount = stored.discount;
          }
        } catch (e) {}

        console.log(`[ThredUp Checker] Promo badge: ${promoDiscount}%, Original sale: ${originalSaleDiscount}%`);
        createDiscountBadge(has50PercentOff, discountPercent, originalSaleDiscount);
      };

      checkWhenReady();
    }
  }

  // Track URL changes for SPA navigation
  let lastUrl = window.location.href;

  function checkUrlChange() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('[ThredUp Checker] URL changed, re-running...');
      init();
    }
  }

  // Check for URL changes periodically (handles SPA navigation)
  setInterval(checkUrlChange, 500);

  // Also listen for popstate (back/forward navigation)
  window.addEventListener('popstate', () => {
    setTimeout(init, 100);
  });

  // Run when page is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
