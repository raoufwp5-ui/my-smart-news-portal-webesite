// Simple file-based article storage
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'data', 'articles');
const INDEX_FILE = path.join(process.cwd(), 'data', 'articles-index.json');

// Ensure storage directory exists
function ensureStorageDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(INDEX_FILE)) {
        fs.writeFileSync(INDEX_FILE, JSON.stringify({ articles: [] }, null, 2));
    }
}

// Generate slug from title
export function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

// Save article
export function saveArticle(article, category) {
    ensureStorageDir();

    const slug = generateSlug(article.title);
    const timestamp = new Date().toISOString();

    const articleData = {
        ...article,
        slug,
        category,
        savedAt: timestamp,
    };

    // Save individual article file
    const articleFile = path.join(STORAGE_DIR, `${slug}.json`);
    fs.writeFileSync(articleFile, JSON.stringify(articleData, null, 2));

    // Update index
    const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));

    // Remove old entry if exists
    index.articles = index.articles.filter(a => a.slug !== slug);

    // Add new entry
    index.articles.unshift({
        slug,
        title: article.title,
        category,
        savedAt: timestamp,
        pubDate: article.pubDate || timestamp,
    });

    // Keep only last 100 articles in index
    index.articles = index.articles.slice(0, 100);

    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));

    console.log(`✅ Article saved: ${slug} (${category})`);

    return articleData;
}

// Get article by slug
export function getArticleBySlug(slug) {
    ensureStorageDir();

    const articleFile = path.join(STORAGE_DIR, `${slug}.json`);

    if (!fs.existsSync(articleFile)) {
        return null;
    }

    return JSON.parse(fs.readFileSync(articleFile, 'utf-8'));
}

// Get all articles from index
export function getAllArticles(limit = 50) {
    ensureStorageDir();

    const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
    return index.articles.slice(0, limit);
}

// Get articles by category
export function getArticlesByCategory(category, limit = 20) {
    ensureStorageDir();

    const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
    return index.articles
        .filter(a => a.category === category)
        .slice(0, limit);
}
