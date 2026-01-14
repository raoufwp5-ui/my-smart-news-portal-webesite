require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// 2. Extract Image from HTML
async function extractImageFromUrl(url) {
    if (!url) return null;
    try {
        const html = await safeFetch(url);
        if (!html) return null;

        // Try standard OG tag
        let match = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

        // Try Twitter card
        if (!match) {
            match = html.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                html.match(/content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
        }

        if (match && match[1]) {
            let imgUrl = match[1];
            // Handle relative URLs
            if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
            else if (imgUrl.startsWith('/')) imgUrl = new URL(imgUrl, url).href;

            console.log(`    🔍 Found Image URL: ${imgUrl}`);
            // Filter out common google/generic images if needed
            if (imgUrl.includes('googleusercontent') || imgUrl.includes('gstatic')) {
                console.log(`    ⚠️  Skipping generic Google image: ${imgUrl}`);
                return null;
            }
            return imgUrl;
        }
    } catch (e) {
        return null; // Fail silently
    }
    return null;
}

// 3. Download and Save Image Locally
async function downloadAndSaveImage(url, slug, fallbackCategory) {
    let buffer = await safeFetch(url, true);

    // Fallback if download fails or URL is missing
    if (!buffer) {
        console.log(`    ⚠️  Source image unavailable. Fetching relevant fallback for [${fallbackCategory}]...`);
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
    if (!GEMINI_KEY) { console.error('❌ GEMINI_API_KEY missing'); return; }

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Helper: Retry logic for AI generation
    async function generateWithRetry(prompt, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const result = await model.generateContent(prompt);
                return result;
            } catch (e) {
                if (e.message.includes('429') || e.message.includes('Quota')) {
                    const delay = (i + 1) * 20000; // 20s, 40s, 60s wait
                    console.log(`    ⏳ Rate limited. Waiting ${delay / 1000}s...`);
                    await sleep(delay);
                } else {
                    throw e;
                }
            }
        }
        throw new Error('Max retries exceeded for AI generation');
    }

    // Ensure directories exist (Do NOT purge old data - Incremental Mode)
    if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
    if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

    for (const [category, url] of Object.entries(FEEDS)) {
        console.log(`\n📡 Scanning ${category}...`);
        const rssText = await safeFetch(url);
        if (!rssText) continue;

        const items = [...rssText.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5); // Ceiling of 5 items per run

        for (const match of items) {
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

            // --- AI GENERATION ---
            let finalData = null;
            try {
                // Updated Prompt for Long-Form, High-Quality Journalism
                const prompt = `You are a senior investigative journalist for a major global news network (like BBC, CNN, or Reuters).
                Rewrite this news title: "${title}" into a comprehensive, deep-dive feature article.

                STRICT GUIDELINES:
                1.  **Length**: MUST be 800 - 1200 words. Do not write short summaries.
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

                const result = await generateWithRetry(prompt);
                const text = result.response.text().replace(/```json|```/g, '').trim();
                finalData = JSON.parse(text);
            } catch (e) {
                console.warn(`    ⚠️ AI Gen failed: ${e.message}`);
                finalData = {
                    title: title,
                    content: `## ${title}\n\nFull coverage of this event is currently being updated by our editorial team. Please check back shortly for the complete analysis of this developing story within the ${category} sector.`,
                    tldr: ["Breaking news report.", "Details emerging properly."],
                    metaDescription: `Breaking news regarding ${title}.`,
                    keywords: [category, "News"]
                };
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
            await sleep(10000); // Politeness delay increased to 10s
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
}

seed();
