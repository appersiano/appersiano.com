#!/usr/bin/env node

/**
 * Build script: reads JSON data and pre-renders HTML sections.
 * Output: dist/ folder with static site (no runtime fetch).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);
const DATA_DIR = path.join(ROOT, 'data');
const DIST_DIR = path.join(ROOT, 'dist');
const SECTIONS = ['experiments', 'blog', 'talks', 'community'];

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createCardHTML(item) {
  const title = escapeHtml(item.title);
  const description = escapeHtml(item.description);
  const link = escapeHtml(item.link);
  const tags = (item.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
  return `
                    <div class="item">
                        <a href="${link}" target="_blank">
                            <h3>${title}</h3>
                            <p>${description}</p>
                            <div class="tags">
                                ${tags}
                            </div>
                        </a>
                    </div>`;
}

function loadSectionData(section) {
  const filePath = path.join(DATA_DIR, `${section}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return data.items || [];
  } catch (err) {
    console.error(`Error loading ${section}.json:`, err.message);
    return [];
  }
}

function build() {
  console.log('Building static site...\n');

  // Read template
  const indexPath = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');

  // Pre-render each section
  for (const section of SECTIONS) {
    const items = loadSectionData(section);
    const cardsHtml = items.map(createCardHTML).join('\n');
    const sectionClass = section === 'experiments' ? 'section active' : 'section';
    const replacement = `<div id="${section}" class="${sectionClass}">\n${cardsHtml}\n                </div>`;

    // Replace empty section div (supports both "section active" and "section")
    const patterns = [
      new RegExp(`<div id="${section}" class="[^"]*"></div>`, 's'),
      new RegExp(`<div id="${section}" class="[^"]*">\\s*</div>`, 's'),
    ];
    let replaced = false;
    for (const re of patterns) {
      if (re.test(html)) {
        html = html.replace(re, replacement);
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      html = html.replace(
        new RegExp(`<div id="${section}"[^>]*></div>`, 's'),
        replacement
      );
    }

    console.log(`  ✓ ${section}: ${items.length} items`);
  }

  // Remove fetch-based initialization (content is now pre-rendered)
  html = html.replace(/\s*initializeSections\(\);\s*\n\s*/g, '\n                ');

  // Create dist directory
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Write index.html
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf-8');
  console.log('\n  ✓ index.html');

  // Copy assets
  const cssDir = path.join(DIST_DIR, 'css');
  if (!fs.existsSync(cssDir)) fs.mkdirSync(cssDir, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'css', 'styles.css'), path.join(cssDir, 'styles.css'));
  console.log('  ✓ css/styles.css');

  const faviconSrc = path.join(ROOT, 'favicon.svg');
  if (fs.existsSync(faviconSrc)) {
    fs.copyFileSync(faviconSrc, path.join(DIST_DIR, 'favicon.svg'));
    console.log('  ✓ favicon.svg');
  }

  const cnameSrc = path.join(ROOT, 'CNAME');
  if (fs.existsSync(cnameSrc)) {
    fs.copyFileSync(cnameSrc, path.join(DIST_DIR, 'CNAME'));
    console.log('  ✓ CNAME');
  }

  console.log('\n✅ Build complete: dist/');
}

build();
