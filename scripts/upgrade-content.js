require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration
const ROOT = process.cwd();
const STORAGE_DIR = path.join(ROOT, 'data', 'articles');
const MEDIA_DIR = path.join(ROOT, 'public', 'media', 'articles');
const INDEX_FILE = path.join(ROOT, 'data', 'articles-index.json');
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// --- HELPERS (Duplicated for Safety) ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function safeFetch(url, isBinary = false) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Referer': 'https://www.google.com/'
            },
            redirect: 'follow',
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return isBinary ? res.arrayBuffer() : res.text();
    } catch (e) {
        clearTimeout(timeout);
        // console.warn(`    ⚠️ Fetch Error: ${e.message}`);
        return null;
    }
}

async function extractImageFromUrl(url) {
    if (!url) return null;
    try {
        const html = await safeFetch(url);
        if (!html) return null;
        let match = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
        if (!match) {
            match = html.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                html.match(/content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
        }
        if (match && match[1]) {
            let imgUrl = match[1];
            if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
            else if (imgUrl.startsWith('/')) imgUrl = new URL(imgUrl, url).href;

            if (imgUrl.includes('googleusercontent') || imgUrl.includes('gstatic')) return null;
            return imgUrl;
        }
    } catch (e) { return null; }
    return null;
}

async function downloadAndSaveImage(url, slug, category) {
    let buffer = await safeFetch(url, true);
    if (!buffer) {
        const lockId = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const fallbackUrl = `https://loremflickr.com/800/600/${category},news/all?lock=${lockId}`;
        console.log(`    🔗 Fallback: ${fallbackUrl}`);
        buffer = await safeFetch(fallbackUrl, true);
    }
    if (!buffer) return '/media/fallback.jpg';

    try {
        if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
        const filename = `${slug}-${Date.now().toString().slice(-6)}.jpg`;
        fs.writeFileSync(path.join(MEDIA_DIR, filename), Buffer.from(buffer));
        return `/media/articles/${filename}`;
    } catch (e) { return null; }
}

// --- MAIN UPGRADE LOGIC ---

async function upgradeArticles() {
    if (!GEMINI_KEY) { console.error('❌ GEMINI_API_KEY missing'); return; }
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Helper: Retry logic
    async function generateWithRetry(prompt, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const result = await model.generateContent(prompt);
                return result;
            } catch (e) {
                if (e.message.includes('429') || e.message.includes('Quota')) {
                    const delay = (i + 1) * 20000; // 20s, 40s, 60s
                    console.log(`    ⏳ Rate limited. Waiting ${delay / 1000}s...`);
                    await sleep(delay);
                } else {
                    throw e;
                }
            }
        }
        throw new Error('Max retries exceeded for AI generation');
    }

    if (!fs.existsSync(STORAGE_DIR)) {
        console.log("No articles to upgrade.");
        return;
    }

    const files = fs.readdirSync(STORAGE_DIR).filter(f => f.endsWith('.json'));
    console.log(`🚀 Upgrading ${files.length} articles to High-Quality Standards...\n`);

    for (const file of files) {
        const filePath = path.join(STORAGE_DIR, file);
        let article;
        try {
            article = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (e) { continue; }

        console.log(`📝 Processing: ${article.title.substring(0, 40)}...`);

        // 1. Upgrade Image
        let newImage = article.image;
        if (article.originalUrl) {
            const realImg = await extractImageFromUrl(article.originalUrl);
            newImage = await downloadAndSaveImage(realImg, article.slug, article.category);
        } else {
            newImage = await downloadAndSaveImage(null, article.slug, article.category);
        }

        // 2. Upgrade Content (AI)
        let newContentData = {};
        try {
            const prompt = `You are a senior investigative journalist. 
            Rewrite this news title: "${article.title}" into a comprehensive, deep-dive feature article (800-1200 words).
            Category: ${article.category}.
            
            Strictly output JSON:
            {
                "title": "Engaging Headline",
                "content": "Full markdown content with hashtags ##...",
                "tldr": ["Point 1", "Point 2", "Point 3"],
                "metaDescription": "SEO summary",
                "keywords": ["tag1", "tag2"]
            }`;

            const result = await generateWithRetry(prompt);
            const text = result.response.text().replace(/```json|```/g, '').trim();
            newContentData = JSON.parse(text);
        } catch (e) {
            console.log(`    ⚠️ AI Skip: ${e.message}`);
            newContentData = {
                title: article.title,
                content: article.content,
                tldr: article.tldr,
                metaDescription: article.metaDescription,
                keywords: article.keywords
            };
        }

        // 3. Save
        const updatedArticle = {
            ...article,
            ...newContentData,
            image: newImage || article.image,
            upgradedAt: new Date().toISOString()
        };

        fs.writeFileSync(filePath, JSON.stringify(updatedArticle, null, 2));
        console.log(`    ✅ Upgraded and Saved.\n`);

        // Rate limit protection
        await sleep(10000);
    }

    // Rebuild Index
    console.log('📚 Rebuilding Index...');
    const index = fs.readdirSync(STORAGE_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => {
            const d = JSON.parse(fs.readFileSync(path.join(STORAGE_DIR, f)));
            return {
                slug: d.slug,
                title: d.title,
                category: d.category,
                image: d.image,
                tldr: d.tldr,
                pubDate: d.pubDate || d.savedAt
            };
        }).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    fs.writeFileSync(INDEX_FILE, JSON.stringify({ articles: index }, null, 2));
    console.log('🎉 Upgrade Complete!');
}

upgradeArticles();
