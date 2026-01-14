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

        let index = { articles: [] };
        if (fs.existsSync(INDEX_FILE)) {
            index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
        }

        // Remove old entry to avoid duplicates
        index.articles = index.articles.filter(a => a.slug !== slug);

        // Add to top (Latest First)
        index.articles.unshift({
            slug,
            title: article.title,
            category,
            image: article.image || '/default-news.jpg',
            tldr: article.tldr,
            savedAt: timestamp,
            pubDate: article.pubDate || timestamp,
            metaDescription: article.metaDescription || article.meta_description
        });

        // Archive maintenance
        if (index.articles.length > MAX_INDEX_SIZE) {
            index.articles = index.articles.slice(0, MAX_INDEX_SIZE);
        }

        fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
        console.log(`✅ Indexed (Latest-First): ${slug}`);
    } catch (error) {
        console.warn(`📝 Memory save only: ${slug}`);
    }
    return articleData;
}

// Get all articles (Paginated)
export function getAllArticles(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    try {
        if (fs.existsSync(INDEX_FILE)) {
            const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
            return {
                articles: index.articles.slice(offset, offset + limit),
                total: index.articles.length
            };
        }
    } catch (e) { }

    const items = Array.from(memoryCache.values())
        .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    return {
        articles: items.slice(offset, offset + limit),
        total: items.length
    };
}

// Get articles by category (Paginated)
export function getArticlesByCategory(category, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    try {
        if (fs.existsSync(INDEX_FILE)) {
            const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
            const filtered = index.articles.filter(a => a.category === category);
            return {
                articles: filtered.slice(offset, offset + limit),
                total: filtered.length
            };
        }
    } catch (e) { }

    const filtered = Array.from(memoryCache.values())
        .filter(a => a.category === category)
        .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    return {
        articles: filtered.slice(offset, offset + limit),
        total: filtered.length
    };
}

// Get article by slug (Disk + Cache + Defensive)
export function getArticleBySlug(slug) {
    if (!slug || typeof slug !== 'string') return null;

    try {
        // 1. Check Memory Cache
        if (memoryCache.has(slug)) {
            const cached = memoryCache.get(slug);
            if (cached && typeof cached === 'object') return cached;
        }

        // 2. Check Disk Storage
        ensureStorageDir();
        const articleFile = path.join(STORAGE_DIR, `${slug}.json`);

        if (fs.existsSync(articleFile)) {
            const fileContent = fs.readFileSync(articleFile, 'utf-8');
            if (fileContent) {
                const data = JSON.parse(fileContent);
                if (data && typeof data === 'object') {
                    memoryCache.set(slug, data); // Refresh cache
                    return data;
                }
            }
        }
    } catch (error) {
        console.error(`🔴 CRITICAL STORAGE ERROR [${slug}]:`, error.message);
    }

    return null;
}
