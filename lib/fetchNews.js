import Parser from 'rss-parser';

const parser = new Parser();

// Simple in-memory cache to avoid hitting RSS feeds too often during dev
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchFeed(url) {
    const now = Date.now();
    if (cache.has(url)) {
        const { timestamp, data } = cache.get(url);
        if (now - timestamp < CACHE_TTL) {
            return data;
        }
    }

    try {
        const feed = await parser.parseURL(url);
        cache.set(url, { timestamp: now, data: feed });
        return feed;
    } catch (error) {
        console.error(`Error fetching feed ${url}:`, error);
        return null;
    }
}

export const FEEDS = {
    business: 'http://feeds.bbci.co.uk/news/business/rss.xml',
    technology: 'http://feeds.bbci.co.uk/news/technology/rss.xml',
    politics: 'http://feeds.bbci.co.uk/news/politics/rss.xml',
    sports: 'http://feeds.bbci.co.uk/sport/rss.xml', // BBC Sport
    general: 'http://feeds.bbci.co.uk/news/rss.xml'
};
