import Parser from 'rss-parser';

const parser = new Parser();

export async function fetchFeed(url) {
    // Force fresh data by appending timestamp
    const separator = url.includes('?') ? '&' : '?';
    const freshUrl = `${url}${separator}t=${Date.now()}`;

    try {
        console.log(`📡 Fetching fresh feed: ${freshUrl}`);
        const feed = await parser.parseURL(freshUrl);
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
