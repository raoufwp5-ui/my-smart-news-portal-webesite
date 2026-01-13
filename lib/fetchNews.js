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
    business: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en',
    technology: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en',
    politics: 'https://news.google.com/rss/headlines/section/topic/POLITICS?hl=en-US&gl=US&ceid=US:en',
    sports: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en',
    general: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en'
};
