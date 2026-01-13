/**
 * Pet911 Training Documentation Screenshot Automation
 * 
 * This script captures screenshots of all moderator and admin pages
 * for use in training materials and documentation.
 * 
 * Usage: npx ts-node scripts/capture-screenshots.ts
 * Or: npx playwright test scripts/capture-screenshots.ts
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

// Define all pages to capture
const PAGES_TO_CAPTURE = [
  // Public Pages
  { path: '/', name: 'home', folder: '01-public', description: 'Homepage' },
  { path: '/training', name: 'training-center', folder: '01-public', description: 'Training Center' },
  
  // Moderator Pages
  { path: '/admin/mods', name: 'command-center', folder: '02-moderator', description: 'Moderator Command Center' },
  { path: '/admin/mods/dispatch', name: 'dispatch-queue', folder: '02-moderator', description: 'Dispatch Queue with Auto-Match' },
  { path: '/admin/mods/map', name: 'live-map', folder: '02-moderator', description: 'Live Operations Map' },
  { path: '/admin/mods/volunteers', name: 'volunteers-roster', folder: '02-moderator', description: 'Volunteer Roster' },
  { path: '/admin/mods/volunteers/shifts', name: 'shift-calendar', folder: '02-moderator', description: 'Shift Calendar' },
  { path: '/admin/mods/volunteers/leaderboard', name: 'leaderboard', folder: '02-moderator', description: 'Volunteer Leaderboard' },
  { path: '/admin/mods/communications', name: 'communications', folder: '02-moderator', description: 'Communications Hub' },
  { path: '/admin/mods/analytics', name: 'analytics', folder: '02-moderator', description: 'Analytics Dashboard' },
  { path: '/admin/mods/incidents', name: 'incidents', folder: '02-moderator', description: 'Incident Management' },
  
  // SYSOP Pages
  { path: '/admin/sysop', name: 'sysop-dashboard', folder: '03-sysop', description: 'SYSOP Command Center' },
  { path: '/admin/sysop/compliance', name: 'compliance', folder: '03-sysop', description: 'Compliance Dashboard' },
  { path: '/admin/sysop/content', name: 'content-management', folder: '03-sysop', description: 'Content Management' },
  { path: '/admin/sysop/moderator-coverage', name: 'moderator-coverage', folder: '03-sysop', description: 'Moderator Coverage Areas' },
];

// Viewport sizes for different devices
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

async function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function captureScreenshot(
  page: Page, 
  pageConfig: typeof PAGES_TO_CAPTURE[0], 
  viewport: keyof typeof VIEWPORTS
) {
  const folderPath = path.join(OUTPUT_DIR, pageConfig.folder, viewport);
  await ensureDirectoryExists(folderPath);
  
  const filename = `${pageConfig.name}.png`;
  const filepath = path.join(folderPath, filename);
  
  try {
    await page.setViewportSize(VIEWPORTS[viewport]);
    await page.goto(`${BASE_URL}${pageConfig.path}`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for any animations to settle
    await page.waitForTimeout(1000);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: filepath, 
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log(`✓ Captured: ${pageConfig.folder}/${viewport}/${filename}`);
    return { success: true, path: filepath };
  } catch (error) {
    console.error(`✗ Failed: ${pageConfig.path} (${viewport}) - ${error}`);
    return { success: false, path: filepath, error };
  }
}

async function generateManifest(results: any[]) {
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  const manifest = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    pages: PAGES_TO_CAPTURE.map(p => ({
      ...p,
      screenshots: {
        desktop: `${p.folder}/desktop/${p.name}.png`,
        tablet: `${p.folder}/tablet/${p.name}.png`,
        mobile: `${p.folder}/mobile/${p.name}.png`,
      }
    })),
    results
  };
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📄 Manifest saved to: ${manifestPath}`);
}

async function generateIndexHtml() {
  const indexPath = path.join(OUTPUT_DIR, 'index.html');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pet911 Training Screenshots</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; padding: 2rem; }
    h1 { margin-bottom: 0.5rem; }
    .subtitle { color: #888; margin-bottom: 2rem; }
    .section { margin-bottom: 3rem; }
    .section-title { font-size: 1.25rem; color: #f59e0b; margin-bottom: 1rem; border-bottom: 1px solid #333; padding-bottom: 0.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; }
    .card img { width: 100%; height: 200px; object-fit: cover; object-position: top; border-bottom: 1px solid #27272a; }
    .card-content { padding: 1rem; }
    .card-title { font-weight: 600; margin-bottom: 0.25rem; }
    .card-desc { font-size: 0.875rem; color: #888; margin-bottom: 0.5rem; }
    .card-links { display: flex; gap: 0.5rem; }
    .card-links a { font-size: 0.75rem; color: #3b82f6; text-decoration: none; }
    .card-links a:hover { text-decoration: underline; }
    .viewport-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .viewport-tabs button { padding: 0.5rem 1rem; border: 1px solid #333; background: #18181b; color: #fff; border-radius: 4px; cursor: pointer; }
    .viewport-tabs button.active { background: #3b82f6; border-color: #3b82f6; }
  </style>
</head>
<body>
  <h1>🐕 Pet911 Training Screenshots</h1>
  <p class="subtitle">Generated ${new Date().toLocaleDateString()} - Use these images for training documentation</p>
  
  ${['01-public', '02-moderator', '03-sysop'].map(folder => {
    const folderName = folder.split('-')[1].charAt(0).toUpperCase() + folder.split('-')[1].slice(1);
    const pages = PAGES_TO_CAPTURE.filter(p => p.folder === folder);
    return `
  <div class="section">
    <h2 class="section-title">${folderName} Pages</h2>
    <div class="grid">
      ${pages.map(p => `
      <div class="card">
        <img src="${folder}/desktop/${p.name}.png" alt="${p.description}" />
        <div class="card-content">
          <div class="card-title">${p.description}</div>
          <div class="card-desc">${p.path}</div>
          <div class="card-links">
            <a href="${folder}/desktop/${p.name}.png" target="_blank">Desktop</a>
            <a href="${folder}/tablet/${p.name}.png" target="_blank">Tablet</a>
            <a href="${folder}/mobile/${p.name}.png" target="_blank">Mobile</a>
          </div>
        </div>
      </div>
      `).join('')}
    </div>
  </div>
    `;
  }).join('')}
</body>
</html>`;

  fs.writeFileSync(indexPath, html);
  console.log(`📄 Index page saved to: ${indexPath}`);
}

async function main() {
  console.log('🚀 Pet911 Screenshot Automation');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
  
  await ensureDirectoryExists(OUTPUT_DIR);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // Add auth cookies/headers here if needed for protected pages
  });
  const page = await context.newPage();
  
  const results: any[] = [];
  
  for (const pageConfig of PAGES_TO_CAPTURE) {
    console.log(`\n📸 ${pageConfig.description} (${pageConfig.path})`);
    
    for (const viewport of Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]) {
      const result = await captureScreenshot(page, pageConfig, viewport);
      results.push({
        page: pageConfig.path,
        viewport,
        ...result
      });
    }
  }
  
  await browser.close();
  
  // Generate manifest and index
  await generateManifest(results);
  await generateIndexHtml();
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Completed: ${successful} screenshots`);
  if (failed > 0) console.log(`❌ Failed: ${failed} screenshots`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`🌐 Open ${OUTPUT_DIR}/index.html to view all screenshots`);
}

main().catch(console.error);
