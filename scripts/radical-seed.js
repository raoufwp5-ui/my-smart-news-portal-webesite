const fs = require('fs');
const path = require('path');

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

async function extractOGImage(url) {
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await res.text();
        const match = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
        return match ? match[1] : null;
    } catch (e) { return null; }
}

async function downloadMedia(url, slug) {
    if (!url) return null;
    try {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const ext = url.split('.').pop().split(/[#?]/)[0] || 'jpg';
        const filename = `${slug}-${Math.random().toString(36).substring(7)}.${ext}`;
        if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
        fs.writeFileSync(path.join(MEDIA_DIR, filename), Buffer.from(buffer));
        return `/media/articles/${filename}`;
    } catch (e) { return null; }
}

async function generateWithGemini(prompt) {
    // Correcting endpoint to v1 for gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    if (!data.candidates || !data.candidates[0].content) throw new Error('Empty response from AI');
    return data.candidates[0].content.parts[0].text;
}

// Robust HTML Entity Decoding + Tag Stripping
function cleanText(text) {
    if (!text) return "";
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/&ndash;/g, '-')
        .replace(/&mdash;/g, '-')
        .replace(/<[^>]*>?/gm, '') // Final tag strip
        .replace(/[^\x20-\x7E\s\u0600-\u06FF]/g, '') // Remove non-printable but keep Arabic
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function seed() {
    if (!GEMINI_KEY) { console.error('❌ GEMINI_API_KEY missing'); return; }

    // Using gemini-pro for maximum compatibility and reliability
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    console.log('🚮 Performing a TOTAL PURGE for a clean start...');
    if (fs.existsSync(STORAGE_DIR)) fs.rmSync(STORAGE_DIR, { recursive: true, force: true });
    if (fs.existsSync(MEDIA_DIR)) fs.rmSync(MEDIA_DIR, { recursive: true, force: true });

    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    fs.mkdirSync(MEDIA_DIR, { recursive: true });

    for (const [category, url] of Object.entries(FEEDS)) {
        console.log(`\n📡 Seeding ${category}...`);
        try {
            const res = await fetch(url);
            const text = await res.text();
            const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);

            for (const match of items) {
                const itemXml = match[1];
                const rawTitle = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'Untitled';
                const title = cleanText(rawTitle);
                const link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') || '#';
                const rawDesc = (itemXml.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';
                const description = cleanText(rawDesc);

                const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 60);

                console.log(`  📝 Processing: ${title}`);
                let finalData = null;

                try {
                    const prompt = `Senior Executive News Editor: Rewrite this breaking news story: "${title}" into a premium, 800-word SEO-optimized long-form article in Markdown. 
                    Requirements:
                    1. Use professional, journalistic tone with H1, H2, and H3 headers.
                    2. Expand on the global context and future implications.
                    3. Return ONLY a valid JSON object: 
                    { 
                        "title": "${title.replace(/"/g, "'")}", 
                        "content": "Full Markdown article (800 words)...", 
                        "tldr": ["Major Update 1", "Major Update 2", "Major Update 3", "Major Update 4", "Major Update 5"], 
                        "metaDescription": "Detailed 800-word report on ${title.replace(/"/g, "'")}", 
                        "keywords": ["News", "${category}", "Analysis"] 
                    }`;

                    const result = await model.generateContent(prompt);
                    const aiRaw = result.response.text();
                    finalData = JSON.parse(aiRaw.replace(/```json|```/g, '').trim());
                } catch (e) {
                    console.warn(`    ⚠️ AI Fallback for ${title}: ${e.message}`);
                    finalData = {
                        title: title,
                        content: `## ${title}\n\nOur investigative team is currently developing a comprehensive 800-word feature on this breaking development. Initial intelligence suggests that this event represents a major strategic shift in the ${category} sector, with significant ramifications for international stakeholders.\n\n### Strategic Analysis\nThe current situation is characterized by high volatility and rapid information flow. We are coordinating with multiple global bureaus to synthesize a word-perfect report that maintains our standard for journalistic excellence. This report will cover the socio-economic context, immediate impacts, and long-term forecasts associated with this news.\n\n### Future Implications\nAs official statements are released, we will integrate direct quotes and verified data points to provide the most authoritative account available. The impact on local and global markets is being audited by our specialized analysts.\n\nStay tuned for the full 800-word investigative report.`,
                        tldr: [
                            "Comprehensive multi-source investigation initiated.",
                            "Analyzing socio-economic and global strategic impacts.",
                            "Direct coordination with international bureaus for verification.",
                            "Long-term policy and market forecasts in development.",
                            "Real-time monitoring of secondary impact channels."
                        ],
                        metaDescription: `In-depth 800-word analysis and investigation into ${title}. Real-time monitoring active.`,
                        keywords: [category, "In-Depth Analysis", "Breaking Report"]
                    };
                }

                // Enhanced Image Logic
                const image = await extractOGImage(link);
                const localImage = await downloadMedia(image, slug);

                const final = {
                    ...finalData,
                    title: cleanText(finalData.title),
                    slug,
                    category,
                    // Diverse Unsplash logic - using random seed in the URL parameters correctly
                    image: localImage || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800&sig=${Math.random()}`,
                    savedAt: new Date().toISOString(),
                    pubDate: new Date().toISOString(),
                    source: link
                };

                fs.writeFileSync(path.join(STORAGE_DIR, `${slug}.json`), JSON.stringify(final, null, 2));
                console.log(`  ✅ Done: ${slug}`);
            }
        } catch (e) { console.error(`❌ ${category} failure: ${e.message}`); }
    }

    console.log('\n🔄 Finalizing Index...');
    const files = fs.readdirSync(STORAGE_DIR);
    const articles = [];
    files.forEach(f => {
        try {
            const d = JSON.parse(fs.readFileSync(path.join(STORAGE_DIR, f)));
            articles.push({
                slug: d.slug,
                title: d.title,
                category: d.category,
                image: d.image,
                tldr: d.tldr,
                savedAt: d.savedAt,
                pubDate: d.pubDate,
                metaDescription: d.metaDescription
            });
        } catch (e) { }
    });
    fs.writeFileSync(INDEX_FILE, JSON.stringify({ articles }, null, 2));
    console.log('✨ MISSION ACCOMPLISHED!');
}

seed();
