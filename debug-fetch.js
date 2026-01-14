const https = require('https');

const RSS_URL = 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en';

// Better fetch logic
async function robustFetch(url) {
    console.log(`Fetching: ${url}`);
    // Google News links often redirect. Node's fetch (v18+) follows redirects by default.
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
    console.log(`Status: ${res.status}`);
    console.log(`Final URL: ${res.url}`);
    const text = await res.text();
    return { text, url: res.url };
}

async function run() {
    try {
        console.log('1. Fetching RSS...');
        const rssRes = await fetch(RSS_URL);
        const rssText = await rssRes.text();

        // Correct extraction logic same as radical-seed.js
        const items = [...rssText.matchAll(/<item>([\s\S]*?)<\/item>/g)];
        if (items.length === 0) { console.log("No items found"); return; }

        const firstItem = items[0][1];
        let link = (firstItem.match(/<link>([\s\S]*?)<\/link>/) || [])[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');

        console.log(`2. Found Article Link: ${link}`);

        if (!link) return;

        console.log('3. Attempting to resolve...');
        const result = await robustFetch(link);

        console.log('4. content length:', result.text.length);

        // Debug: Check if it's a google page
        if (result.text.includes('Google News') || result.text.includes('Opening...')) {
            console.log("WARNING: Looks like a Google intermediate page!");
        }

        const ogImage = result.text.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            result.text.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

        console.log('5. OG Image found:', ogImage ? ogImage[1] : 'NONE');

        // If not found, log title to see if we are on the right page
        const titleMatch = result.text.match(/<title>([\s\S]*?)<\/title>/i);
        console.log('   Page Title:', titleMatch ? titleMatch[1] : 'No title');

    } catch (e) {
        console.error(e);
    }
}

run();
