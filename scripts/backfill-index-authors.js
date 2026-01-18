const fs = require('fs');
const path = require('path');

const articlesIndexPath = path.join(__dirname, '../data/articles-index.json');
const authorsPath = path.join(__dirname, '../data/authors.json');

const articlesIndex = JSON.parse(fs.readFileSync(articlesIndexPath, 'utf8'));
const authors = JSON.parse(fs.readFileSync(authorsPath, 'utf8'));

// Mapping logic
function getAuthorIdByCategory(category) {
    const cat = category?.toLowerCase() || 'general';

    if (cat.includes('tech') || cat.includes('ai')) return 'sarah-vance';
    if (cat.includes('politic')) return 'marcus-thorne';
    if (cat.includes('business') || cat.includes('econom') || cat.includes('finance')) return 'elena-corves';
    if (cat.includes('sport')) return 'coach-mike';
    if (cat.includes('health') || cat.includes('science')) return 'dr-aris';

    return 'sarah-vance'; // Default
}

// Update Articles
let updatedCount = 0;
articlesIndex.articles = articlesIndex.articles.map(article => {
    if (!article.authorId) {
        article.authorId = getAuthorIdByCategory(article.category);
        updatedCount++;
    }
    return article;
});

// Save
fs.writeFileSync(articlesIndexPath, JSON.stringify(articlesIndex, null, 2));

console.log(`✅ Successfully backfilled authorId for ${updatedCount} articles in the index.`);
