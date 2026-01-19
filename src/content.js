/**
 * ThredUp Price Checker - Content Script
 * Auto-redirects to featured URL and shows discount status
 */

(function() {
  'use strict';

  // Configuration
  const THREDUP_BASE_URL = 'https://www.thredup.com';
  const REFERRAL_PARAMS = {
    context: 'google_pmax_pla',
    code: 'adwords_pla'
  };

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
   * @returns {string} Category (women, men, kids) or default 'women'
   */
  function extractCategory() {
    const url = window.location.href;
    const match = url.match(/\/product\/(women|men|kids)-/);
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
   * Check if page has 50% OFF badge for THIS product
   * @returns {boolean} True if 50% OFF found for product
   */
  function pageHasDiscountBadge() {
    // Look for the specific promo code badge element
    // ThredUp uses: <span class="ui-promo-code ...">50% off</span>
    const promoBadges = document.querySelectorAll('.ui-promo-code');

    for (const badge of promoBadges) {
      const text = badge.textContent.trim().toLowerCase();
      if (text === '50% off') {
        console.log('[ThredUp Checker] Found 50% OFF badge:', badge);
        return true;
      }
    }

    console.log('[ThredUp Checker] No 50% OFF badge found for this product');
    return false;
  }

  /**
   * Create discount badge showing result
   * @param {boolean} hasDiscount - Whether discount was found
   */
  function createDiscountBadge(hasDiscount) {
    // Check if badge already exists
    if (document.getElementById('thredup-discount-badge')) {
      return;
    }

    const badge = document.createElement('div');
    badge.id = 'thredup-discount-badge';
    badge.className = hasDiscount
      ? 'thredup-discount-badge discount-badge-applied'
      : 'thredup-discount-badge discount-badge-unavailable';

    const content = document.createElement('div');
    content.className = 'discount-badge-content';

    const mainText = document.createElement('span');
    mainText.className = 'discount-badge-text';
    mainText.textContent = hasDiscount ? '50% OFF AVAILABLE' : 'NO DISCOUNT';

    const subText = document.createElement('span');
    subText.className = 'discount-badge-subtext';
    subText.textContent = hasDiscount ? 'Discount applied!' : 'Regular price only';

    content.appendChild(mainText);
    content.appendChild(subText);
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

    // If on a product page, redirect to featured URL
    if (isOnProductPage()) {
      const category = extractCategory();
      const featuredUrl = buildFeaturedUrl(productId, category);
      console.log(`[ThredUp Checker] Redirecting to featured URL: ${featuredUrl}`);
      window.location.href = featuredUrl;
      return;
    }

    // If on a featured page, check for discount and show badge
    if (isOnFeaturedPage()) {
      console.log('[ThredUp Checker] On featured page, checking for discount...');

      // Wait a moment for the page to fully render
      setTimeout(() => {
        const hasDiscount = pageHasDiscountBadge();
        console.log(`[ThredUp Checker] Discount found: ${hasDiscount}`);
        createDiscountBadge(hasDiscount);
      }, 1000);
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
