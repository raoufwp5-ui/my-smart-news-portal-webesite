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
        console.warn('⚠️ Could not initialize file storage (expected in some serverless envs):', error.message);
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

    // Update in-memory cache
    memoryCache.set(slug, articleData);

    try {
        ensureStorageDir();

        // Save individual article file
        const articleFile = path.join(STORAGE_DIR, `${slug}.json`);
        fs.writeFileSync(articleFile, JSON.stringify(articleData, null, 2));

        // Update index
        let index = { articles: [] };
        if (fs.existsSync(INDEX_FILE)) {
            index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
        }

        // Remove old entry if exists
        index.articles = index.articles.filter(a => a.slug !== slug);

        // Add new entry with expanded metadata for cards
        index.articles.unshift({
            slug,
            title: article.title,
            category,
            image: article.image,
            tldr: article.tldr,
            savedAt: timestamp,
            pubDate: article.pubDate || timestamp,
        });

        // Keep only last 200 articles in index for robustness
        index.articles = index.articles.slice(0, 200);

        fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
        console.log(`✅ Article persisted: ${slug}`);
    } catch (error) {
        console.warn(`📝 Memory-only save: ${slug}`, error.message);
    }
    return articleData;
}

// ... existing code ...

// Get all articles (updated fallback)
export function getAllArticles(limit = 100) {
    try {
        if (fs.existsSync(INDEX_FILE)) {
            const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
            return index.articles.slice(0, limit);
        }
    } catch (e) { }
    return Array.from(memoryCache.values())
        .map(({ slug, title, category, savedAt, pubDate, image, tldr }) => ({ slug, title, category, savedAt, pubDate, image, tldr }))
        .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
        .slice(0, limit);
}

// Get articles by category (updated fallback)
export function getArticlesByCategory(category, limit = 50) {
    try {
        if (fs.existsSync(INDEX_FILE)) {
            const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
            return index.articles
                .filter(a => a.category === category)
                .slice(0, limit);
        }
    } catch (e) { }
    return Array.from(memoryCache.values())
        .filter(a => a.category === category)
        .map(({ slug, title, category, savedAt, pubDate, image, tldr }) => ({ slug, title, category, savedAt, pubDate, image, tldr }))
        .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
        .slice(0, limit);
}
