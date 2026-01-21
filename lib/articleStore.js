// Simple file-based article storage with in-memory fallback for serverless
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'data', 'articles');
const INDEX_FILE = path.join(process.cwd(), 'data', 'articles-index.json');

// In-memory cache for serverless persistence during active sessions
const memoryCache = new Map();

// Ensure storage directory exists
function ensureStorageDir() {
    try {
        if (!fs.existsSync(STORAGE_DIR)) {
            fs.mkdirSync(STORAGE_DIR, { recursive: true });
        }
        if (!fs.existsSync(INDEX_FILE)) {
            fs.writeFileSync(INDEX_FILE, JSON.stringify({ articles: [] }, null, 2));
        }
    } catch (error) {
        console.warn('⚠️ Could not initialize file storage:', error.message);
    }
}

// Generate slug from title
export function generateSlug(title) {
    if (!title) return 'untitled';
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

const MAX_INDEX_SIZE = 2000;

// Rebuild index from directory scan (Race-condition safe)
export function rebuildIndex() {
    let index = { articles: [] };
    try {
        ensureStorageDir();
        if (!fs.existsSync(STORAGE_DIR)) return { articles: [] };

        const files = fs.readdirSync(STORAGE_DIR);
        const articles = [];

        files.forEach(file => {
            if (file.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(path.join(STORAGE_DIR, file), 'utf-8');
                    const data = JSON.parse(content);
                    articles.push({
                        slug: data.slug,
                        title: data.title,
                        category: data.category,
                        image: data.image || '/default-news.jpg',
                        tldr: data.tldr,
                        savedAt: data.savedAt,
                        pubDate: data.pubDate || data.savedAt,
                        metaDescription: data.metaDescription || data.meta_description,
                        status: data.status || 'published',
                        scheduledFor: data.scheduledFor || null
                    });
                } catch (e) { }
            }
        });

        // Sort Latest First
        articles.sort((a, b) => new Date(b.pubDate || b.savedAt) - new Date(a.pubDate || a.savedAt));

        index = { articles: articles.slice(0, MAX_INDEX_SIZE) };

        // Try to write to disk, but don't fail the whole operation if it fails (Vercel is read-only)
        try {
            fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
        } catch (writeError) {
            console.warn('⚠️ Could not persist index to disk (likely read-only fs):', writeError.message);
        }

        return index;
    } catch (error) {
        console.error('🔴 Index Rebuild Failed:', error.message);
        return index; // Return what we have so far
    }
}

// Save article
export function saveArticle(article, category) {
    const slug = article.slug || generateSlug(article.title);
    const timestamp = new Date().toISOString();

    const articleData = {
        ...article,
        slug,
        category,
        savedAt: timestamp,
    };

    memoryCache.set(slug, articleData);

    try {
        ensureStorageDir();
        const articleFile = path.join(STORAGE_DIR, `${slug}.json`);
        fs.writeFileSync(articleFile, JSON.stringify(articleData, null, 2));

        // Refresh Index
        rebuildIndex();

        console.log(`✅ Saved & Indexed: ${slug}`);
    } catch (error) {
        console.warn(`📝 Memory save only: ${slug}`);
    }
    return articleData;
}

// Get all articles (Paginated)
export function getAllArticles(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    try {
        if (!fs.existsSync(INDEX_FILE)) rebuildIndex();
        const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
        const now = new Date();
        const published = index.articles.filter(a =>
            !a.status || a.status === 'published' ||
            (a.status === 'scheduled' && new Date(a.scheduledFor) <= now)
        );
        return {
            articles: published.slice(offset, offset + limit),
            total: published.length
        };
    } catch (e) {
        return { articles: [], total: 0 };
    }
}

// Get articles by category (Paginated)
export function getArticlesByCategory(category, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    try {
        if (!fs.existsSync(INDEX_FILE)) rebuildIndex();
        const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
        const now = new Date();
        const filtered = index.articles.filter(a =>
            a.category === category &&
            (!a.status || a.status === 'published' || (a.status === 'scheduled' && new Date(a.scheduledFor) <= now))
        );
        return {
            articles: filtered.slice(offset, offset + limit),
            total: filtered.length
        };
    } catch (e) {
        return { articles: [], total: 0 };
    }
}

// Get related articles (Same category, excluding current)
export function getRelatedArticles(currentSlug, category, limit = 3) {
    try {
        // Fetch more than needed to account for exclusion
        const { articles } = getArticlesByCategory(category, 1, limit + 5);

        // Filter out current article and slice
        return articles
            .filter(a => a.slug !== currentSlug)
            .slice(0, limit);
    } catch (e) {
        return [];
    }
}

// Get article by slug (Disk + Cache + Defensive)
export function getArticleBySlug(slug) {
    if (!slug || typeof slug !== 'string') return null;

    try {
        if (memoryCache.has(slug)) return memoryCache.get(slug);

        const articleFile = path.join(STORAGE_DIR, `${slug}.json`);
        if (fs.existsSync(articleFile)) {
            const data = JSON.parse(fs.readFileSync(articleFile, 'utf-8'));
            memoryCache.set(slug, data);
            return data;
        }
    } catch (error) { }
    return null;
}

// Get all scheduled articles (For Cron Job)
export function getScheduledArticles() {
    try {
        if (!fs.existsSync(INDEX_FILE)) rebuildIndex();
        const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
        return index.articles.filter(a => a.status === 'scheduled');
    } catch (e) {
        return [];
    }
}
