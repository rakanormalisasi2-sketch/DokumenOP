const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  const consoleErrors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') consoleErrors.push(text);
    consoleMessages.push(`[${msg.type()}] ${text}`);
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  console.log('=== Opening https://suratop.vercel.app ===');
  await page.goto('https://suratop.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait a bit for React to render
  await page.waitForTimeout(3000);

  // Check page title
  const title = await page.title();
  console.log('Title:', title);

  // Check what's visible
  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || 'EMPTY');
  console.log('\n--- Body Text (first 500 chars) ---');
  console.log(bodyText || '(empty)');

  // Check if there are any visible elements
  const bodyHTML = await page.evaluate(() => document.body?.innerHTML?.substring(0, 1000) || 'EMPTY');
  console.log('\n--- Body HTML (first 1000 chars) ---');
  console.log(bodyHTML);

  // Check for specific elements
  const hasRoot = await page.$('#root');
  const hasContent = await page.$('[class]');

  console.log('\n--- Element Checks ---');
  console.log('#root exists:', !!hasRoot);
  console.log('Has any elements:', !!hasContent);

  // Check localStorage for any auth state
  const localStorage = await page.evaluate(() => {
    const keys = Object.keys(window.localStorage);
    const data = {};
    keys.forEach(k => { try { data[k] = window.localStorage.getItem(k); } catch {} });
    return data;
  });
  console.log('\n--- LocalStorage ---');
  Object.keys(localStorage).forEach(k => {
    const val = localStorage[k];
    console.log(`${k}: ${val?.substring(0, 100)}...`);
  });

  // Console errors
  console.log('\n--- Console Errors ---');
  if (consoleErrors.length === 0) {
    console.log('No errors!');
  } else {
    consoleErrors.forEach(e => console.log('ERROR:', e));
  }

  // Page errors
  console.log('\n--- Page Errors ---');
  if (pageErrors.length === 0) {
    console.log('No page errors!');
  } else {
    pageErrors.forEach(e => console.log('PAGE ERROR:', e));
  }

  // Take screenshot
  await page.screenshot({ path: 'G:/project web/pusdaop-main/test-screenshot.png', fullPage: true });
  console.log('\nScreenshot saved to: G:/project web/pusdaop-main/test-screenshot.png');

  await browser.close();
  console.log('\n=== Test Complete ===');
})();