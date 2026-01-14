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
                        metaDescription: data.metaDescription || data.meta_description
                    });
                } catch (e) { }
            }
        });

        // Sort Latest First
        articles.sort((a, b) => new Date(b.pubDate || b.savedAt) - new Date(a.pubDate || a.savedAt));

        const index = { articles: articles.slice(0, MAX_INDEX_SIZE) };
        fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
        return index;
    } catch (error) {
        console.error('🔴 Index Rebuild Failed:', error.message);
        return { articles: [] };
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
        return {
            articles: index.articles.slice(offset, offset + limit),
            total: index.articles.length
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
        const filtered = index.articles.filter(a => a.category === category);
        return {
            articles: filtered.slice(offset, offset + limit),
            total: filtered.length
        };
    } catch (e) {
        return { articles: [], total: 0 };
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
