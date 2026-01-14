const { fetchFeed, FEEDS } = require('../lib/fetchNews');
const { saveArticle, generateSlug } = require('../lib/articleStore');
const { downloadMedia } = require('../lib/mediaHandler');
const { model } = require('../lib/gemini');

async function populateAll() {
    console.log('🚀 Starting Global News Population...');

    for (const category of Object.keys(FEEDS)) {
        console.log(`📡 Processing Category: ${category}`);
        try {
            const feed = await fetchFeed(FEEDS[category]);
            if (!feed || !feed.items) continue;

            const articles = feed.items.slice(0, 5); // 5 per category for initial seed

            for (const item of articles) {
                const slug = generateSlug(item.title);
                console.log(`📝 Generating: ${slug}`);

                try {
                    const prompt = `Lead AI Analyst: Reconstruct this news into a 400-600 word SEO report in Markdown (H1, H2, H3). Include 3 tldr, 5 keywords, metaDescription. Context: ${item.contentSnippet || item.title}`;

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const aiData = JSON.parse(response.text().replace(/```json|```/g, '').trim());

                    const localImage = await downloadMedia(item.enclosure?.url || item['media:content']?.['$']?.url, slug, 'image');

                    saveArticle({
                        ...aiData,
                        slug,
                        pubDate: item.pubDate || new Date().toISOString(),
                        originalSource: item.creator || "Global News",
                        image: localImage || '/default-news.jpg'
                    }, category);
                } catch (e) {
                    console.warn(`⚠️ Skipped ${slug}: ${e.message}`);
                }
            }
        } catch (e) {
            console.error(`❌ Category failure ${category}: ${e.message}`);
        }
    }
}

// Mocking environment for node script if needed or just use this as logic reference
// populateAll();
