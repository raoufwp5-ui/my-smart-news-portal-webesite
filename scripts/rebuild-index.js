
const fs = require('fs');
const path = require('path');

const articlesDir = path.join(process.cwd(), 'data', 'articles');
const indexFile = path.join(process.cwd(), 'data', 'articles-index.json');

function rebuild() {
    try {
        if (!fs.existsSync(articlesDir)) {
            console.log("No articles directory found.");
            return;
        }

        const files = fs.readdirSync(articlesDir).filter(file => file.endsWith('.json'));
        const articles = [];

        files.forEach(file => {
            const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
            try {
                const article = JSON.parse(content);
                // Minify for index: keep only necessary fields
                articles.push({
                    title: article.title,
                    slug: article.slug,
                    category: article.category,
                    image: article.image,
                    pubDate: article.pubDate,
                    description: article.metaDescription || article.title // Fallback
                });
            } catch (err) {
                console.error(`Error parsing ${file}:`, err);
            }
        });

        // Sort by date descending
        articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        fs.writeFileSync(indexFile, JSON.stringify({ articles }, null, 2));
        console.log(`Index rebuilt with ${articles.length} articles.`);
    } catch (error) {
        console.error("Rebuild failed:", error);
    }
}

rebuild();
