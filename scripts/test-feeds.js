const Parser = require('rss-parser');
const parser = new Parser();

const FEEDS = {
    business: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en',
    technology: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en',
    politics: 'https://news.google.com/rss/headlines/section/topic/POLITICS?hl=en-US&gl=US&ceid=US:en',
    sports: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en',
    general: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en'
};

async function test() {
    for (const [cat, url] of Object.entries(FEEDS)) {
        console.log(`📡 Testing ${cat}...`);
        try {
            const feed = await parser.parseURL(url);
            console.log(`✅ ${cat}: Found ${feed.items?.length || 0} items`);
        } catch (e) {
            console.error(`❌ ${cat}: Failed - ${e.message}`);
        }
    }
}

test();
