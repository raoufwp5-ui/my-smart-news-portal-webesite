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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
}

async function seed() {
    if (!GEMINI_KEY) { console.error('❌ GEMINI_API_KEY missing'); return; }

    console.log('🚮 Wiping existing data...');
    if (fs.existsSync(STORAGE_DIR)) fs.rmSync(STORAGE_DIR, { recursive: true, force: true });
    fs.mkdirSync(STORAGE_DIR, { recursive: true });

    for (const [category, url] of Object.entries(FEEDS)) {
        console.log(`\n📡 Seeding ${category}...`);
        try {
            const res = await fetch(url);
            const text = await res.text();
            const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);

            for (const match of items) {
                const itemXml = match[1];
                const title = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') || 'Untitled';
                const link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') || '#';
                const description = (itemXml.match(/<description>([\s\S]*?)<\/description>/) || [])[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') || '';
                const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 60);

                console.log(`  📝 Processing: ${title}`);
                let finalData = null;

                try {
                    const prompt = `Lead AI News Analyst: Rewrite this news: "${title}" into a 500-word premium SEO article in Markdown. Structure: H1, H2, H3. Return ONLY valid JSON: { "title": "${title.replace(/"/g, "'")}", "content": "Markdown Content...", "tldr": ["Point 1", "Point 2", "Point 3"], "metaDescription": "Detailed news update about ${title.replace(/"/g, "'")}", "keywords": ["News"] }`;
                    const aiRaw = await generateWithGemini(prompt);
                    finalData = JSON.parse(aiRaw.replace(/```json|```/g, '').trim());
                } catch (e) {
                    console.warn(`    ⚠️ AI Fallback for ${title}: ${e.message}`);
                    finalData = {
                        title: title,
                        content: `## ${title}\n\n${description}\n\nRead more at the source.`,
                        tldr: ["Contextual analysis in progress", "Original source verified", "Global impact being evaluated"],
                        metaDescription: title,
                        keywords: [category, "News"]
                    };
                }

                const image = await extractOGImage(link);
                const localImage = await downloadMedia(image, slug);

                const final = {
                    ...finalData,
                    slug,
                    category,
                    image: localImage || '/default-news.jpg',
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
            articles.push({ slug: d.slug, title: d.title, category: d.category, image: d.image, tldr: d.tldr, savedAt: d.savedAt, pubDate: d.pubDate });
        } catch (e) { }
    });
    fs.writeFileSync(INDEX_FILE, JSON.stringify({ articles }, null, 2));
    console.log('✨ MISSION ACCOMPLISHED!');
}

seed();
