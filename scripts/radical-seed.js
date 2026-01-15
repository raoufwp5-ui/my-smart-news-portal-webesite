require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
const { execSync } = require('child_process');

// Helper: Commit and Push immediately
function commitAndPush(slug) {
    try {
        console.log(`    📦 Committing article: ${slug}...`);
        // Configure git if needed (often persistent, but good safety)
        try { execSync('git config user.name "AutoBot"'); } catch (e) { }
        try { execSync('git config user.email "bot@news.com"'); } catch (e) { }

        execSync('git add data/articles public/media');

        // GIT LOCK PROTECTION: Pull --rebase before committing
        try {
            execSync('git pull --rebase origin main', { stdio: 'ignore' });
        } catch (e) {
            console.warn('    ⚠️ Git Pull Rebase warning (continuing)...');
        }

        execSync(`git commit -m "📰 New Article: ${slug}"`);
        execSync('git push origin main');
        console.log('    ✅ Pushed to GitHub!');
    } catch (e) {
        console.error('    ❌ Git Push Failed (will retry next time):', e.message);
    }
}

// Manual config for standalone use
const ROOT = process.cwd();
const STORAGE_DIR = path.join(ROOT, 'data', 'articles');
const INDEX_FILE = path.join(ROOT, 'data', 'articles-index.json');
const MEDIA_DIR = path.join(ROOT, 'public', 'media', 'articles');
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const FEEDS = {
    business: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en',
    technology: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en',
    politics: 'https://news.google.com/rss/headlines/section/topic/POLITICS?hl=en-US&gl=US&ceid=US:en',
    sports: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en',
    general: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en'
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: robust fetch with timeout and headers
async function safeFetch(url, isBinary = false) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.google.com/',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-User': '?1'
            },
            redirect: 'follow',
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return isBinary ? res.arrayBuffer() : res.text();
    } catch (e) {
        clearTimeout(timeout);
        console.warn(`    ⚠️ Fetch Error [${url}]: ${e.message}`);
        return null;
    }
}

// 1. Resolve Google News Redirect to get real URL
async function resolveOriginalUrl(googleUrl) {
    try {
        const res = await fetch(googleUrl, {
            method: 'GET',
            redirect: 'follow', // Fetch API follows redirects automatically
            headers: { 'User-Agent': USER_AGENT }
        });
        console.log(`      🔗 Resolved to: ${res.url}`);
        return res.url; // This should be the final URL
    } catch (e) {
        console.warn(`Original URL resolution failed: ${e.message}`);
        return googleUrl;
    }
}

// 2. Extract Image from HTML (Smart Extraction with Cheerio)
async function extractImageFromUrl(url) {
    if (!url) return null;
    try {
        const html = await safeFetch(url);
        if (!html) return null;

        const $ = cheerio.load(html);
        let foundImage = null;

        // 1. JSON-LD (Highest Priority - "Gold Standard" for News)
        $('script[type="application/ld+json"]').each((i, el) => {
            if (foundImage) return; // Stop if already found
            try {
                const raw = $(el).html();
                if (!raw) return;
                const data = JSON.parse(raw);

                // Start: Intelligent JSON Recursion to find 'image'
                const findImg = (obj) => {
                    if (!obj) return null;
                    if (typeof obj === 'string' && obj.startsWith('http')) return obj;
                    if (obj.image) return findImg(obj.image);
                    if (obj.url && typeof obj.url === 'string' && obj.url.startsWith('http')) return obj.url;
                    if (Array.isArray(obj)) return findImg(obj[0]);
                    return null;
                };

                // Prioritize NewsArticle or Article types if possible, but general search works too
                if (data['@type'] && (data['@type'].includes('Article') || data['@type'].includes('News'))) {
                    foundImage = findImg(data.image);
                } else if (!foundImage && data.image) {
                    foundImage = findImg(data.image);
                }
            } catch (e) { /* Ignore JSON parse errors */ }
        });

        if (foundImage) {
            console.log(`    🔍 Found Image (JSON-LD): ${foundImage}`);
            return foundImage;
        }

        // 2. Meta Tags (Robust Fallback)
        foundImage = $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content');

        if (foundImage) {
            // Fix relative URLs
            if (foundImage.startsWith('//')) foundImage = 'https:' + foundImage;
            else if (foundImage.startsWith('/')) foundImage = new URL(foundImage, url).href;

            console.log(`    🔍 Found Image (Meta): ${foundImage}`);

            // Filter out common google/generic images
            if (foundImage.includes('googleusercontent') || foundImage.includes('gstatic')) {
                console.log(`    ⚠️  Skipping generic Google image: ${foundImage}`);
                return null;
            }
            return foundImage;
        }

    } catch (e) {
        console.warn(`    ⚠️ Image extraction failed: ${e.message}`);
        return null;
    }
    return null;
}

// 3. Download and Save Image Locally
async function downloadAndSaveImage(url, slug, fallbackCategory) {
    let buffer = null;

    // Fallback if download fails or URL is missing
    if (!url) {
        console.log(`    ⚠️  Source image unavailable (URL null). Fetching relevant fallback for [${fallbackCategory}]...`);
    } else {
        buffer = await safeFetch(url, true);
    }

    if (!buffer) {
        // Use LoremFlickr with category keywords for relevance, and a hash-based lock for consistency/uniqueness
        const lockId = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const fallbackUrl = `https://loremflickr.com/800/600/${fallbackCategory},news/all?lock=${lockId}`;
        console.log(`    🔗 Semantic Fallback: ${fallbackUrl}`);
        buffer = await safeFetch(fallbackUrl, true);
    }

    if (!buffer) return '/media/fallback.jpg'; // Ultimate safety net

    try {
        console.log(`    📦 Buffer size: ${buffer.byteLength} bytes`);
        // Determine extension (magic bytes would be better but simple string check usually suffices for web)
        // Default to jpg
        const ext = 'jpg';
        const filename = `${slug}-${Date.now().toString().slice(-6)}.${ext}`;

        if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

        const filePath = path.join(MEDIA_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`    💾 Saved: ${filename}`);
        return `/media/articles/${filename}`;
    } catch (e) {
        console.error(`    ❌ Save failed: ${e.message}`);
        return null;
    }
}

// 4. Clean Text Logic
function cleanText(text) {
    if (!text) return "";
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<[^>]*>?/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function seed() {
    const START_TIME = Date.now();
    const MAX_RUNTIME = 5.5 * 60 * 60 * 1000; // 5.5 Hours

    // --- MULTI-KEY GEMINI SETUP ---
    const KEYS = [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_2
    ].filter(k => k && k.length > 10);

    if (KEYS.length === 0) { console.error('❌ No GEMINI_API_KEY found'); return; }

    console.log(`🤖 Loaded ${KEYS.length} Gemini API Keys for rotation.`);

    const models = KEYS.map(key => {
        const genAI = new GoogleGenerativeAI(key);
        return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    });

    let currentKeyIndex = 0;

    // Strict Mode Generator: Infinite Retry until Success
    async function generateContentStrict(prompt) {
        while (true) { // Infinite Loop until success
            // Time Check: 5.5 Hours Limit
            if (Date.now() - START_TIME > MAX_RUNTIME) {
                console.log('🛑 Max runtime reached (5.5h). Exiting gracefully.');
                process.exit(0);
            }

            // Round-robin selection
            const modelIndex = currentKeyIndex % models.length;
            const model = models[modelIndex];

            try {
                // console.log(`    🤖 Using Key #${modelIndex + 1}...`);
                const result = await model.generateContent(prompt);
                currentKeyIndex++; // Rotate on success
                return result.response.text();

            } catch (e) {
                const isRateLimit = e.message.includes('429') || e.message.includes('Quota') || e.message.includes('Too Many Requests');

                if (isRateLimit) {
                    console.warn(`    ⚠️ Key #${modelIndex + 1} Rate Limited.`);

                    // Try the OTHER keys immediately
                    for (let j = 1; j < models.length; j++) {
                        const nextIndex = (modelIndex + j) % models.length;
                        console.log(`    🔄 Failover to Key #${nextIndex + 1}...`);
                        try {
                            const result = await models[nextIndex].generateContent(prompt);
                            currentKeyIndex = nextIndex + 1;
                            return result.response.text();
                        } catch (innerE) {
                            console.warn(`    ⚠️ Key #${nextIndex + 1} failed: ${innerE.message}`);
                        }
                    }

                    // If ALL keys failed, Rotate start index for next time and WAIT
                    currentKeyIndex++;
                    console.log(`    ⏳ All keys exhausted. Waiting 60s for quota reset...`);
                    await sleep(60000);

                } else {
                    // For Strict Mode, we retry even on other errors to be safe, but wait short time
                    console.warn(`    ⚠️ Gen Error: ${e.message}. Retrying in 5s...`);
                    await sleep(5000);
                }
            }
        }
    }

    // Ensure directories exist (Do NOT purge old data - Incremental Mode)
    if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
    if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

    for (const [category, url] of Object.entries(FEEDS)) {
        // Time Check
        if (Date.now() - START_TIME > MAX_RUNTIME) process.exit(0);

        console.log(`\n📡 Scanning ${category}...`);
        const rssText = await safeFetch(url);
        if (!rssText) continue;

        const items = [...rssText.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5); // Ceiling of 5 items per run

        for (const match of items) {
            // Time Check
            if (Date.now() - START_TIME > MAX_RUNTIME) process.exit(0);

            const itemXml = match[1];
            const rawTitle = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'Untitled';
            const title = cleanText(rawTitle);

            // Deduplication: Check if article already exists
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60);
            if (fs.existsSync(path.join(STORAGE_DIR, `${slug}.json`))) {
                console.log(`  ⏭️  Skipping existing: "${title.substring(0, 30)}..."`);
                continue;
            }

            let link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');

            // --- LINK RESOLUTION ---
            const realUrl = await resolveOriginalUrl(link);

            // --- IMAGE EXTRACTION ---
            let imageUrl = await extractImageFromUrl(realUrl);
            const localImagePath = await downloadAndSaveImage(imageUrl, slug, category);

            // --- AI GENERATION (STRICT) ---
            let finalData = null;
            // Updated Prompt for Long-Form, High-Quality Journalism
            const prompt = `You are a senior investigative journalist for a major global news network (like BBC, CNN, or Reuters).
            Rewrite this news title: "${title}" into a comprehensive, deep-dive feature article.

            STRICT GUIDELINES:
            1.  **Length**: MUST be 600 - 800 words. Do not write short summaries.
            2.  **Tone**: Professional, objective, authoritative, and engaging.
            3.  **Structure**:
                -   **Headline**: Catchy, SEO-optimized.
                -   **Lead Paragraph**: Strong hook, answering Who, What, When, Where, Why.
                -   **Deep Analysis**: Use ## subheaders to break down background context, expert opinions, and future implications.
                -   **Key Highlights**: A clear list of facts.
            4.  **Formatting**: Use Markdown (##, ###, **bold**, > blockquotes).

            Output structure (JSON only):
            {
                "title": "Engaging Headline",
                "content": "Full markdown content with headers...",
                "tldr": ["Key point 1", "Key point 2", "Key point 3"],
                "metaDescription": "Compelling SEO summary (150-160 chars)",
                "keywords": ["tag1", "tag2", "tag3", "tag4", "tag5"]
            }`;

            // STRICT GENERATION: Will wait FOREVER until successful
            const textRaw = await generateContentStrict(prompt);
            const text = textRaw.replace(/```json|```/g, '').trim();

            try {
                finalData = JSON.parse(text);
            } catch (jsonErr) {
                console.warn('    ⚠️ JSON Parse Error. Retrying article next loop...');
                continue;
            }

            const article = {
                ...finalData,
                id: Math.random().toString(36).substr(2, 9),
                slug,
                category,
                image: localImagePath,
                originalUrl: realUrl,
                savedAt: new Date().toISOString()
            };

            fs.writeFileSync(path.join(STORAGE_DIR, `${slug}.json`), JSON.stringify(article, null, 2));

            // PUBLISH IMMEDIATELY
            commitAndPush(slug);

            // Short rest before next battle to save API
            await sleep(5000);
        }
    }

    // Rebuild Index
    console.log('\n📚 Rebuilding Index...');
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
                pubDate: d.savedAt
            };
        });

    fs.writeFileSync(INDEX_FILE, JSON.stringify({ articles: index }, null, 2));
    console.log(`✅ Index verified with ${index.length} articles.`);
    fs.writeFileSync(INDEX_FILE, JSON.stringify({ articles: index }, null, 2));
    console.log(`✅ Index verified with ${index.length} articles.`);
}

seed().catch(console.error);
