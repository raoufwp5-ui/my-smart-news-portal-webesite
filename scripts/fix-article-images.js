
const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../data/articles');

// Curated list of high-quality Unsplash images by category
const imageBank = {
    technology: [
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80', // Robot/AI
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', // Chip
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80', // Cybersecurity
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80', // Matrix code
        'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=1200&q=80', // VR
        'https://images.unsplash.com/photo-1531297461136-82lwDe43qRcf?auto=format&fit=crop&w=1200&q=80', // Tech office
        'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=1200&q=80', // Quantum/Science
        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80', // AI Brain
    ],
    business: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80', // Graphs/Analytics
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80', // Business man
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80', // Meeting
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80', // Skyscraper
        'https://images.unsplash.com/photo-1526304640152-d4619684e484?auto=format&fit=crop&w=1200&q=80', // Crypto/Bitcoin
        'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=1200&q=80', // Stock market
    ],
    sports: [
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80', // Runner
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80', // Football
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80', // Soccer
        'https://images.unsplash.com/photo-1628891890377-511bb6f4ce3d?auto=format&fit=crop&w=1200&q=80', // Esports/Gaming
        'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80', // Gym
    ],
    politics: [
        'https://images.unsplash.com/photo-1529107386315-e5aa3d45f61e?auto=format&fit=crop&w=1200&q=80', // Government building
        'https://images.unsplash.com/photo-1541872703-74c5963631df?auto=format&fit=crop&w=1200&q=80', // Debate/Mic
        'https://images.unsplash.com/photo-1575320181502-909192f0f13d?auto=format&fit=crop&w=1200&q=80', // Flags
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', // Globe
    ],
    general: [
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80', // News
        'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80', // Newspaper
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80', // TV News
    ]
};

function getRandomImage(category) {
    const list = imageBank[category] || imageBank['general'];
    return list[Math.floor(Math.random() * list.length)];
}

function fixImages() {
    const files = fs.readdirSync(articlesDir);
    let updatedCount = 0;

    files.forEach(file => {
        if (!file.endsWith('.json')) return;

        const filePath = path.join(articlesDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const article = JSON.parse(content);

            if (article.image && article.image.startsWith('/media/')) {
                console.log(`Fixing image for: ${article.slug}`);
                article.image = getRandomImage(article.category || 'general');

                fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
                updatedCount++;
            }
        } catch (e) {
            console.error(`Error processing ${file}:`, e.message);
        }
    });

    console.log(`Updated ${updatedCount} articles with new Unsplash images.`);
}

fixImages();
