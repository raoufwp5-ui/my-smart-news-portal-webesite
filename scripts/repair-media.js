const fs = require('fs');
const path = require('path');

// Mocking 'process.cwd()' if needed, but here it should work
const root = process.cwd();
const INDEX_FILE = path.join(root, 'data', 'articles-index.json');
const STORAGE_DIR = path.join(root, 'data', 'articles');
const MEDIA_DIR = path.join(root, 'public', 'media', 'articles');

// Import utilities using require (Node.js style)
// Note: In Next.js these are ES modules, so we might need a workaround or simple re-implementation
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function extractOGImage(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
    try {
        let targetUrl = url;

        // Fast Unfolding for Google News
        if (url.includes('news.google.com')) {
            const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
            targetUrl = res.url;
        }

        const response = await fetch(targetUrl, { headers: HEADERS });
        if (!response.ok) return null;

        const html = await response.text();
        const match = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
            html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);

        let found = match ? match[1] : null;
        if (found && (found.includes('google.com') || found.includes('placeholder'))) return null;
        return found;
    } catch (e) { return null; }
}

async function downloadMedia(url, slug) {
    if (!url || !url.startsWith('http')) return null;
    try {
        if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
        const ext = url.split('.').pop().split(/[#?]/)[0] || 'jpg';
        const filename = `${slug.substring(0, 50)}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = path.join(MEDIA_DIR, filename);

        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
        return `/media/articles/${filename}`;
    } catch (e) { return null; }
}

async function startRepair() {
    console.log('🔍 Starting retrospective media repair...');

    if (!fs.existsSync(INDEX_FILE)) {
        console.error('❌ Index file not found.');
        return;
    }

    const indexData = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
    const index = indexData.articles;
    let repairedCount = 0;

    for (let i = 0; i < index.length; i++) {
        const art = index[i];

        // Target: articles with default placeholder or non-local images
        if (!art.image || art.image === '/default-news.jpg' || (typeof art.image === 'string' && !art.image.startsWith('/media'))) {
            console.log(`🛠️ Processing: ${art.slug}`);

            const articleFile = path.join(STORAGE_DIR, `${art.slug}.json`);
            if (!fs.existsSync(articleFile)) {
                console.log(`  ⚠️ Article JSON missing: ${art.slug}`);
                continue;
            }

            const fullArticle = JSON.parse(fs.readFileSync(articleFile, 'utf-8'));
            const link = fullArticle.source || fullArticle.link;

            if (link && link.startsWith('http')) {
                console.log(`  📡 Scraping: ${link}`);
                const ogImage = await extractOGImage(link);
                if (ogImage) {
                    console.log(`  ✨ Found OG: ${ogImage}`);
                    const localImage = await downloadMedia(ogImage, art.slug);
                    if (localImage) {
                        fullArticle.image = localImage;
                        fs.writeFileSync(articleFile, JSON.stringify(fullArticle, null, 2));

                        index[i].image = localImage;
                        repairedCount++;
                        console.log(`  ✅ Success: ${localImage}`);
                    } else {
                        console.log(`  ❌ Download failed for: ${ogImage}`);
                    }
                } else {
                    console.log(`  ⚠️ No OG image found for this link.`);
                }
            } else {
                console.log(`  ⚠️ No valid source link found.`);
            }
        }
    }

    if (repairedCount > 0) {
        fs.writeFileSync(INDEX_FILE, JSON.stringify({ articles: index }, null, 2));
        console.log(`\n🎉 Repair complete! Updated ${repairedCount} articles.`);
    } else {
        console.log('\n✨ No articles were repaired (Scraping may have failed or no targets left).');
    }
}

startRepair();
