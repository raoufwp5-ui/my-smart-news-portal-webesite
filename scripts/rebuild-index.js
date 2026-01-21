const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(process.cwd(), 'data', 'articles');
const INDEX_FILE = path.join(process.cwd(), 'data', 'articles-index.json');

function rebuildIndex() {
    try {
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
                } catch (e) {
                    console.error('Error parsing file:', file, e);
                }
            }
        });

        // Sort Latest First
        articles.sort((a, b) => new Date(b.pubDate || b.savedAt) - new Date(a.pubDate || a.savedAt));

        const index = { articles: articles };
        fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
        console.log(`✅ Index Rebuilt: ${articles.length} articles found.`);

    } catch (error) {
        console.error('🔴 Index Rebuild Failed:', error.message);
    }
}

rebuildIndex();
