
const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../data/articles');

// Curated list of high-quality YouTube videos by category
const videoBank = {
    technology: [
        'https://www.youtube.com/watch?v=hpC8tJgxy68', // Future Tech (Generic)
        'https://www.youtube.com/watch?v=ad79nYk2keg', // AI Explained
        'https://www.youtube.com/watch?v=GjK7J6hTqj0', // Quantum Computing
        'https://www.youtube.com/watch?v=B8eTEI7y0d4', // Cybersecurity
        'https://www.youtube.com/watch?v=l95K4HlqKGs', // Smart Cities (NEOM)
    ],
    business: [
        'https://www.youtube.com/watch?v=T3y6ki-B6xI', // Economic Trends
        'https://www.youtube.com/watch?v=w_a19Fj0P5I', // Stock Market
        'https://www.youtube.com/watch?v=9p55QGT7C00', // Business Strategy
    ],
    sports: [
        'https://www.youtube.com/watch?v=eD52OqC-O5U', // FIFA 2026 Promo
        'https://www.youtube.com/watch?v=_UKo7mZ2Sck', // Olympics
    ],
    politics: [
        'https://www.youtube.com/watch?v=S0T0HwT5J00', // Geopolitics
        'https://www.youtube.com/watch?v=34gALVqRk8Q', // Global News
    ],
    general: [
        'https://www.youtube.com/watch?v=b0O6nS4rF6k', // World News
    ]
};

function getRandomVideo(category) {
    const list = videoBank[category] || videoBank['general'];
    return list[Math.floor(Math.random() * list.length)];
}

function fixVideos() {
    const files = fs.readdirSync(articlesDir);
    let updatedCount = 0;

    files.forEach(file => {
        if (!file.endsWith('.json')) return;

        const filePath = path.join(articlesDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const article = JSON.parse(content);

            // Check if videoUrl is missing, or contains "Dummy"
            if (!article.videoUrl || article.videoUrl.includes('Dummy')) {
                console.log(`Fixing video for: ${article.slug}`);
                article.videoUrl = getRandomVideo(article.category || 'general');

                fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
                updatedCount++;
            }
        } catch (e) {
            console.error(`Error processing ${file}:`, e.message);
        }
    });

    console.log(`Updated ${updatedCount} articles with valid YouTube videos.`);
}

fixVideos();
