/**
 * Test the extension using your logged-in Chrome browser
 *
 * SETUP:
 * 1. Quit Chrome completely
 * 2. Start Chrome with remote debugging:
 *
 *    Mac:
 *    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
 *
 *    Windows:
 *    "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
 *
 * 3. Log into ThredUp in that Chrome window
 * 4. Make sure your extension is loaded (chrome://extensions)
 * 5. Run this script: node test-logged-in.js
 */

const { chromium } = require('playwright');

async function testExtension() {
  console.log('Connecting to Chrome...');

  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9222');
  } catch (error) {
    console.error('\n❌ Could not connect to Chrome.');
    console.error('Make sure Chrome is running with: --remote-debugging-port=9222\n');
    console.error('Mac command:');
    console.error('/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222\n');
    process.exit(1);
  }

  console.log('✅ Connected to Chrome\n');

  // Get existing context (your logged-in session)
  const contexts = browser.contexts();
  const context = contexts[0];

  // Create a new page in your existing browser
  const page = await context.newPage();

  // Test URLs - one with 50% off, one without
  const testUrls = [
    {
      name: 'Should have 50% off',
      url: 'https://www.thredup.com/product/women-cotton-tuckernuck-blue-casual-dress/209595620'
    },
    {
      name: 'Should NOT have 50% off (designer item)',
      url: 'https://www.thredup.com/product/women-leather-philipp-plein-black-casual-dress/150073058'
    }
  ];

  for (const test of testUrls) {
    console.log(`\n📍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);

    await page.goto(test.url);

    // Wait for redirect to featured URL
    await page.waitForURL(/\/featured\//, { timeout: 5000 }).catch(() => {
      console.log('   ⚠️  No redirect happened (might already be on featured page or extension not loaded)');
    });

    console.log(`   Redirected to: ${page.url()}`);

    // Wait for the badge to appear
    await page.waitForTimeout(2000);

    // Check for our extension's badge
    const badge = await page.$('#thredup-discount-badge');
    if (badge) {
      const badgeText = await badge.textContent();
      const hasDiscount = await badge.evaluate(el => el.classList.contains('discount-badge-applied'));

      if (hasDiscount) {
        console.log(`   ✅ GREEN BADGE: ${badgeText.trim()}`);
      } else {
        console.log(`   🔴 RED BADGE: ${badgeText.trim()}`);
      }
    } else {
      console.log('   ❌ No badge found - extension might not be loaded');
    }

    // Check for ThredUp's 50% off badge
    const promoBadge = await page.$('.ui-promo-code');
    if (promoBadge) {
      const promoText = await promoBadge.textContent();
      console.log(`   ThredUp promo badge: "${promoText.trim()}"`);
    }
  }

  console.log('\n✅ Tests complete!\n');

  // Don't close the browser - it's the user's browser
  await page.close();
}

testExtension().catch(console.error);
