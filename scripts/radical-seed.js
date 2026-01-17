require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
const { execSync } = require('child_process');

// --- CONSTANTS ---
const MAX_ARTICLES = 1; // ONE BY ONE mode
const SCHEDULE_HOURS = [17, 18, 19, 20, 21, 22, 23]; // Evenings for TODAY

// Helper: Commit and Push BATCH (Once at the end)
function commitAndPushBatch(count) {
    try {
        console.log(`\n📦 Batch Committing ${count} articles...`);
        // Configure git if needed
        try { execSync('git config user.name "AI News Editor"'); } catch (e) { }
        try { execSync('git config user.email "bot@globalbrief.com"'); } catch (e) { }

        execSync('git add data/articles public/media data/articles-index.json');

        // GIT LOCK PROTECTION: Pull --rebase before committing
        try {
            console.log('    🔄 Rebase Pull...');
            execSync('git pull --rebase origin main', { stdio: 'ignore' });
        } catch (e) {
            console.warn('    ⚠️ Git Pull Rebase warning (continuing)...');
        }

        execSync(`git commit -m "📰 Daily Batch: ${count} New Scheduled Articles"`);
        execSync('git push origin main');
        console.log('    ✅ BATCH PUSH SUCCESSFUL!');
    } catch (e) {
        console.error('    ❌ Git Push Failed (Result saved locally):', e.message);
    }
}

// Manual config for standalone use
const ROOT = process.cwd();
const STORAGE_DIR = path.join(ROOT, 'data', 'articles');
const INDEX_FILE = path.join(ROOT, 'data', 'articles-index.json');
const MEDIA_DIR = path.join(ROOT, 'public', 'media', 'articles');

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

// 1. Resolve Google News Redirect
async function resolveOriginalUrl(googleUrl) {
    try {
        const res = await fetch(googleUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: { 'User-Agent': USER_AGENT }
        });
        return res.url;
    } catch (e) {
        return googleUrl;
    }
}

// 2. Extract Image from HTML
async function extractImageFromUrl(url) {
    if (!url) return null;
    try {
        const html = await safeFetch(url);
        if (!html) return null;

        const $ = cheerio.load(html);
        let foundImage = null;

        // JSON-LD Priority
        $('script[type="application/ld+json"]').each((i, el) => {
            if (foundImage) return;
            try {
                const raw = $(el).html();
                if (!raw) return;
                const data = JSON.parse(raw);
                const findImg = (obj) => {
                    if (!obj) return null;
                    if (typeof obj === 'string' && obj.startsWith('http')) return obj;
                    if (obj.image) return findImg(obj.image);
                    if (obj.url && typeof obj.url === 'string' && obj.url.startsWith('http')) return obj.url;
                    if (Array.isArray(obj)) return findImg(obj[0]);
                    return null;
                };
                if (data['@type'] && (data['@type'].includes('Article') || data['@type'].includes('News'))) {
                    foundImage = findImg(data.image);
                } else if (!foundImage && data.image) {
                    foundImage = findImg(data.image);
                }
            } catch (e) { }
        });

        if (foundImage) return foundImage;

        foundImage = $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content');

        if (foundImage) {
            if (foundImage.startsWith('//')) foundImage = 'https:' + foundImage;
            else if (foundImage.startsWith('/')) foundImage = new URL(foundImage, url).href;
            if (foundImage.includes('googleusercontent') || foundImage.includes('gstatic')) return null;
            return foundImage;
        }

    } catch (e) { }
    return null;
}

// 3. Download and Save Image
async function downloadAndSaveImage(url, slug, fallbackCategory) {
    let buffer = null;
    if (url) buffer = await safeFetch(url, true);

    if (!buffer) {
        const lockId = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const fallbackUrl = `https://loremflickr.com/800/600/${fallbackCategory},news/all?lock=${lockId}`;
        buffer = await safeFetch(fallbackUrl, true);
    }

    if (!buffer) return '/media/fallback.jpg';

    try {
        const filename = `${slug}-${Date.now().toString().slice(-6)}.jpg`;
        if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
        const filePath = path.join(MEDIA_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(buffer));
        return `/media/articles/${filename}`;
    } catch (e) {
        return null;
    }
}

function cleanText(text) {
    if (!text) return "";
    return text.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

async function seed() {
    console.log('🚀 INITIALIZING GLOBAL BRIEF CONTENT ENGINE (PREMIUM MODE)');
    console.log(`🎯 Target: ${MAX_ARTICLES} Article(s) - 1200+ Words - TODAY`);

    const START_TIME = Date.now();
    const KEYS = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean);

    if (KEYS.length === 0) { console.error('❌ No GEMINI_API_KEY found'); return; }

    // Initialize both models for fallback
    const modelsPrimary = KEYS.map(key => new GoogleGenerativeAI(key).getGenerativeModel({ model: "gemini-2.0-flash-exp" }));
    const modelsBackup = KEYS.map(key => new GoogleGenerativeAI(key).getGenerativeModel({ model: "gemini-1.5-flash" }));

    let currentKeyIndex = 0;
    let totalGenerated = 0;

    // Helper: Retry logic with Model Fallback
    async function generateContentWithRetry(prompt) {
        // Attempt 1 & 2: Primary Model (Flash 2.0 Exp)
        for (let i = 0; i < 2; i++) {
            try {
                const model = modelsPrimary[currentKeyIndex % modelsPrimary.length];
                const result = await model.generateContent(prompt);
                currentKeyIndex++;
                return result.response.text();
            } catch (e) {
                console.warn(`    ⚠️ Primary Model Error (Attempt ${i + 1}): ${e.message.split('[')[0]}`);
                currentKeyIndex++;
                await sleep(1000);
            }
        }

        // Attempt 3 & 4: Backup Model (Flash 1.5 - Separate Quota)
        console.log('    🔄 Switching to Backup Model (Gemini 1.5 Flash)...');
        for (let i = 0; i < 2; i++) {
            try {
                const model = modelsBackup[currentKeyIndex % modelsBackup.length];
                const result = await model.generateContent(prompt);
                currentKeyIndex++;
                return result.response.text();
            } catch (e) {
                console.warn(`    ⚠️ Backup Model Error (Attempt ${i + 1}): ${e.message.split('[')[0]}`);
                currentKeyIndex++;
                await sleep(1000);
            }
        }
        return null;
    }

    if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

    // Calculate Schedule Base (TODAY)
    const scheduleBaseDate = new Date();
    // NO +1 DAY - We want today
    console.log(`📅 Scheduling for: ${scheduleBaseDate.toDateString()} (Immediate/Today)`);

    outerLoop:
    for (const [category, url] of Object.entries(FEEDS)) {
        if (totalGenerated >= MAX_ARTICLES) break;

        console.log(`\n📡 Scanning ${category}...`);
        const rssText = await safeFetch(url);
        if (!rssText) continue;

        const items = [...rssText.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 3); // Check top 3 per category

        for (const match of items) {
            if (totalGenerated >= MAX_ARTICLES) break outerLoop;

            const itemXml = match[1];
            const rawTitle = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'Untitled';
            const title = cleanText(rawTitle);
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60);

            if (fs.existsSync(path.join(STORAGE_DIR, `${slug}.json`))) {
                console.log(`  ⏭️  Skipping existing: "${title.substring(0, 20)}..."`);
                continue;
            }

            // --- SMART SCHEDULE TIME ---
            const slotHour = SCHEDULE_HOURS[totalGenerated % SCHEDULE_HOURS.length];
            const scheduledTime = new Date(scheduleBaseDate);
            scheduledTime.setHours(slotHour, 0, 0, 0);

            let link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
            const realUrl = await resolveOriginalUrl(link);

            // --- AI GENERATION ---
            const prompt = `You are an elite SEO Strategist & Senior Journalist. Analyze this trending headline: "${title}" and create a MASTERPIECE article.
            
            CRITICAL REQUIREMENTS:
            1. **WORD COUNT**: MUST BE 1200+ WORDS. Do not hallucinate length. Go deep, add context, history, analysis.
            2. **SEO**: Focus on high-volume long-tail keywords. 
            3. **FORMAT**: Markdown (## H2, ### H3, **Bold**, > Blockquotes, *Italic*).
            4. **TONE**: Authoritative, engaging, "viral" but professional.

            STRUCTURE:
            - **Catchy Hook**: First paragraph must grab attention.
            - **Deep Dive**: Explain *why* this matters.
            - **Global Context**: enhancing the content's depth.
            - **Future Outlook**: Predictions for 2026 and beyond.

            OUTPUT JSON ONLY:
            {
                "title": "Click-Worthy & SEO-Optimized Headline (Max 60 chars)",
                "content": "Full 1200+ word markdown text...",
                "tldr": ["Punchy insight 1", "Punchy insight 2", "Punchy insight 3"],
                "metaDescription": "Irresistible Google description (150 chars) with keywords.",
                "keywords": ["trend1", "trend2", "specific keyword", "broad keyword"]
            }`;

            console.log(`    🧠 Generating Article #${totalGenerated + 1}: ${title.substring(0, 40)}...`);
            const textRaw = await generateContentWithRetry(prompt);
            if (!textRaw) continue; // Skip if failed

            let finalData;
            try {
                finalData = JSON.parse(textRaw.replace(/```json|```/g, '').trim());
            } catch (e) { continue; }

            // --- IMAGE ---
            let localImagePath = '/media/fallback.jpg';
            try {
                const imageUrl = await extractImageFromUrl(realUrl);
                localImagePath = await downloadAndSaveImage(imageUrl, slug, category);
            } catch (e) { }

            const article = {
                ...finalData,
                id: Math.random().toString(36).substr(2, 9),
                slug,
                category,
                image: localImagePath,
                originalUrl: realUrl,
                savedAt: new Date().toISOString(),
                // KEY UPGRADE: SCHEDULED STATUS
                ticketId: `SCH-${totalGenerated + 1}`,
                status: 'scheduled',
                scheduledFor: scheduledTime.toISOString()
            };

            fs.writeFileSync(path.join(STORAGE_DIR, `${slug}.json`), JSON.stringify(article, null, 2));

            console.log(`    ✅ SAVED & SCHEDULED for ${scheduledTime.toLocaleTimeString()} (Today)`);
            totalGenerated++;

            // Cool down
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
                pubDate: d.pubDate || d.savedAt,
                status: d.status || 'published', // Default to published for old attrs
                scheduledFor: d.scheduledFor || null
            };
        });

    fs.writeFileSync(INDEX_FILE, JSON.stringify({ articles: index }, null, 2));
    console.log(`✅ Index updated: ${index.length} total articles.`);

    // BATCH PUSH
    if (totalGenerated > 0) {
        commitAndPushBatch(totalGenerated);
    } else {
        console.log('✨ No new articles generated. Nothing to push.');
    }
}

seed().catch(console.error);
