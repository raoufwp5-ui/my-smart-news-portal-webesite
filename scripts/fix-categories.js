
const fs = require('fs');
const path = require('path');
const { rebuildIndex } = require('./rebuild-index.js'); // Assuming rebuild-index exports or we just run it after

// The strict list of allowed categories
const ALLOWED_CATEGORIES = ['business', 'technology', 'politics', 'sports'];

// Mapping rules
const MAPPING = {
    'economy': 'business',
    'health': 'technology', // Most health articles are about Tech (CRISPR, AI)
    'general': 'politics',  // General world news -> Politics
    'science': 'technology',
    'environment': 'politics' // Climate change policy -> Politics
};

const articlesDir = path.join(process.cwd(), 'data', 'articles');
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));

let changedCount = 0;

files.forEach(file => {
    const filePath = path.join(articlesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    try {
        const article = JSON.parse(content);
        let currentCat = article.category.toLowerCase();
        let newCat = currentCat;

        // Direct mapping
        if (MAPPING[currentCat]) {
            newCat = MAPPING[currentCat];
        }
        // Fallback for logic check
        else if (!ALLOWED_CATEGORIES.includes(currentCat)) {
            // Smart guessing based on title/keywords if needed, or default
            if (currentCat === 'environment') newCat = 'politics';
            else newCat = 'business'; // safe fallback
        }

        if (newCat !== currentCat) {
            console.log(`Resource: ${article.title}`);
            console.log(`  └─ Remapping '${currentCat}' -> '${newCat}'`);
            article.category = newCat;
            fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
            changedCount++;
        }
    } catch (e) {
        console.error(`Error processing ${file}:`, e);
    }
});

console.log(`\n✅ Fixed categories for ${changedCount} articles.`);
// Note: We need to run rebuild-index separately or import logic.
// For simplicity, we will assume user runs rebuild-index.js next.
