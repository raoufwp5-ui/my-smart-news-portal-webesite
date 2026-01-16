
const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../data/articles');

function countWords(str) {
    if (!str) return 0;
    return str.trim().split(/\s+/).length;
}

try {
    const files = fs.readdirSync(articlesDir);
    const shortArticles = [];

    console.log('🔍 Scanning articles for length...\n');

    files.forEach(file => {
        if (file.endsWith('.json')) {
            try {
                const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
                const article = JSON.parse(content);
                const wordCount = countWords(article.content);

                if (wordCount < 800) {
                    shortArticles.push({
                        title: article.title,
                        file: file,
                        words: wordCount
                    });
                }
            } catch (e) {
                console.error(`Error reading ${file}:`, e.message);
            }
        }
    });

    // Sort by shortest first
    shortArticles.sort((a, b) => a.words - b.words);

    if (shortArticles.length === 0) {
        console.log('✅ All articles are longer than 800 words!');
    } else {
        console.log(`⚠️  Found ${shortArticles.length} short articles (< 800 words):\n`);
        shortArticles.forEach(a => {
            console.log(`- [${a.words} words] ${a.title}`);
        });
    }

} catch (e) {
    console.error('Failed to scan directory:', e.message);
}
