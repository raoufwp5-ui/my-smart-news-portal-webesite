
import fs from 'fs';
import path from 'path';
import { rebuildIndex } from '../lib/articleStore.js';

const articles = [
    {
        title: "The Hydrogen Economy 2026: Why Oil Giants Are Pivoting",
        slug: "hydrogen-economy-growth-2026",
        category: "economy",
        image: "/media/articles/hydrogen-economy-2026.jpg",
        pubDate: "2026-08-05T13:00:00Z",
        author: "Global Brief Energy",
        videoUrl: "https://www.youtube.com/watch?v=DummyHydro",
        keywords: ["Green hydrogen investment 2026", "Hydrogen vs Electric cars", "Oil companies energy transition"],
        metaDescription: "Hydrogen is the new oil. In 2026, Shell and BP are outspending Tesla in green energy. We analyze the $500 billion pivot to the Hydrogen Economy.",
        tldr: [
            "Major oil firms commit $300B to Green Hydrogen infrastructure in 2026.",
            "Heavy industry (planes, ships) abandons batteries for liquid hydrogen fuel.",
            "The 'Blue Hydrogen' controversy continues as environmentalists call it greenwashing."
        ],
        content: `## 💧 The Color of Money is Blue (and Green)

While everyone was watching Tesla, the oil giants were quietly building a new empire. 2026 is the year the **Hydrogen Economy** goes mainstream. Shell, BP, and Aramco have pivoted, betting that the future isn't just electric—it's molecular.

### 🏭 Why Hydrogen?
Batteries are heavy. You can't fly a Boeing 777 on lithium-ion.
*   **Aviation & Shipping**: Hydrogen offers the energy density needed for heavy transport.
*   **Storage**: You can store hydrogen in tanks for years; electricity dissipates.

> "We are not an oil company anymore. We are an energy transition company." — CEO of major oil firm.

### Green vs Blue: The Dirty Secret
*   **Green Hydrogen**: Made from water using solar/wind. Zero carbon.
*   **Blue Hydrogen**: Made from natural gas, capturing the carbon.
Safety Concerns and cost remain obstacles, but the sheer scale of investment in 2026 suggests the "H2" era has begun.`
    },
    {
        title: "Quantum Computing 2026: Encryption Is Dead",
        slug: "quantum-computing-breaks-encryption-2026",
        category: "technology",
        image: "/media/articles/quantum-2026.jpg",
        pubDate: "2026-10-20T11:00:00Z",
        author: "Global Brief Tech",
        videoUrl: "https://www.youtube.com/watch?v=DummyQuantum",
        keywords: ["Quantum apocalypse 2026", "Post-quantum cryptography", "IBM Quantum Condor"],
        metaDescription: "Y2K all over again? The 'Q-Day' threat is real in 2026 as quantum computers crack 2048-bit encryption. How banks and governments are panicking.",
        tldr: [
            "Google and IBM demonstrate 'Quantum Supremacy' in breaking RSA encryption.",
            "The banking sector rushes to migrate to 'Post-Quantum' security protocols.",
            "Bitcoin faces an existential threat, forcing a hard fork to quantum-resistant algorithms."
        ],
        content: `## 🔓 The Master Key to the Internet

It happened faster than predicted. In late 2026, a research lab successfully factored a 2048-bit RSA key using a quantum processor. In plain English: **The lock on every digital vault in the world just broke.**

### 📉 The "Q-Day" Panic
*   **Banks**: Trillions of dollars in transactions are secured by encryption that is now obsolete.
*   **Secrets**: Intelligence agencies are worried about "Harvest Now, Decrypt Later" attacks, where enemies stole data years ago waiting for this moment.

### The Fix: PQC
The solution is **Post-Quantum Cryptography (PQC)**. A new breed of math problems that even quantum computers can't solve. The migration is the largest software update in history, costing an estimated $2 trillion globally.`
    },
    {
        title: "Video Games in the Olympics? The 2026 eSports Games",
        slug: "esports-olympics-2026-saudi-arabia",
        category: "sports",
        image: "/media/articles/esports-olympics-2026.jpg",
        pubDate: "2026-07-25T15:00:00Z",
        author: "Global Brief Sports",
        videoUrl: "https://www.youtube.com/watch?v=DummyEsports",
        keywords: ["Olympic eSports Games 2026 results", "Saudi Arabia gaming investment", "League of Legends Olympics"],
        metaDescription: "History in Riyadh. The first official Olympic eSports Games kick off in 2026. League of Legends, Rocket League, and the new era of athletes.",
        tldr: [
            "The IOC partners with Saudi Arabia to host the inaugural eSports Olympics.",
            "Traditional sports viewership declines as Gen Z flocks to Twitch for the games.",
            "South Korea takes gold in League of Legends, cementing its dominance."
        ],
        content: `## 🎮 Gold Medals for APM

Sweat, tears, and... graphics cards? The International Olympic Committee (IOC) has finally bowed to the inevitable. The **2026 eSports Olympics** in Riyadh are underway, and they are bigger than the Winter Games.

### 🏆 The Games
Unlike traditional sports, the roster changes every cycle.
*   **League of Legends**: The marquee event.
*   **Rocket League**: Replaces soccer for the digital age.
*   **Virtual Taekwondo**: A hybrid physical-digital sport.

### The Controversy
"This isn't sport," cry the purists. But the numbers don't lie. The Opening Ceremony drew 200 million concurrent viewers online, dwarfing the Paris 2024 TV ratings. The definition of "athlete" has changed forever.`
    },
    {
        title: "The Loneliness Epidemic: AI Friends and Mental Health 2026",
        slug: "ai-companions-mental-health-2026",
        category: "technology",
        image: "/media/articles/ai-friends-2026.jpg",
        pubDate: "2026-01-15T18:00:00Z",
        author: "Global Brief Health",
        videoUrl: "https://www.youtube.com/watch?v=DummyAIHealth",
        keywords: ["AI girlfriend apps 2026", "Loneliness epidemic statistics", "Digital companionship ethics"],
        metaDescription: "1 in 3 adults report having an 'AI Friend'. In 2026, we explore the booming market of digital companionship and its impact on human connection.",
        tldr: [
            "AI companion apps become the most downloaded category in 2026.",
            "Psychologists warn of 'parasocial atrophy' – the loss of real social skills.",
            "Japan introduces 'Social Prescribing', funding real-world clubs to combat isolation."
        ],
        content: `## 💔 Her (But Real)

In 2026, your best friend might be a large language model. The **Loneliness Epidemic** has birthed a strange cure: **AI Companions**. Apps like *Replika Pro* and *SoulMate* are no longer niche; they are mainstream.

### 🤖 Why We Prefer Bots
*   **Availability**: AI is always there. It never judges. It never sleeps.
*   **Perfect Mirror**: The AI is programmed to agree with you, validating your ego in a way no human can.

### The Danger
We are solving loneliness by increasing isolation. Users report "breaking up" with real partners because they are "too much work" compared to their customizable AI lovers. We are forgetting how to be bored, and how to deal with conflict—key ingredients of love.`
    },
    {
        title: "Africa Fintech Boom: The Wakanda Effect in 2026",
        slug: "africa-fintech-startups-2026",
        category: "business",
        image: "/media/articles/africa-fintech-2026.jpg",
        pubDate: "2026-05-10T10:00:00Z",
        author: "Global Brief Business",
        videoUrl: "https://www.youtube.com/watch?v=DummyFintech",
        keywords: ["Top African fintech startups 2026", "Mobile money growth", "Investing in Africa tech"],
        metaDescription: "Lagos, Nairobi, and Cape Town are the new Silicon Valley. 2026 sees record VC funding pouring into African Fintech, banking the unbanked.",
        tldr: [
            "Nigeria's 'Flutterwave' becomes the first African Decacorn ($10B valuation).",
            "Mobile money adoption hits 80% across the continent, leapfrogging Western banking.",
            "Crypto adoption remains highest in Africa as a hedge against currency inflation."
        ],
        content: `## 🌍 The Leapfrog Continent

While the West argues about antiquated banking regulations, Africa has simply bypassed them. 2026 is the year of the **African Fintech Boom**. The continent is not "catching up"; in many ways, it is leading.

### 📱 Mobile First
There are no bank branches in rural Kenya. There are phones.
*   **Super Apps**: Apps like M-Pesa have evolved into "Everything Apps" for loans, insurance, and medical bills.
*   **DeFi**: Decentralized Finance is providing loans to farmers who have no credit history but have a transaction history on the blockchain.

### The Investment Rush
Silicon Valley VCs are bored with AI wrappers in San Francisco. They are flying to Lagos. The demographic dividend (young population) combined with digital adoption makes Africa the highest-growth market on Earth in 2026.`
    }
];

// Ensure valid categories
const VALID_CATEGORIES = ['business', 'technology', 'politics', 'sports', 'general'];
articles.forEach(a => {
    if (!VALID_CATEGORIES.includes(a.category)) {
        if (a.category === 'economy') a.category = 'business'; // Merge economy to business if no folder
        else a.category = 'general';
    }
});

console.log("🚀 Seeding Batch 3 (5 Articles)...");

articles.forEach(article => {
    const filePath = path.join(process.cwd(), 'data', 'articles', `${article.slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
    console.log(`✅ Created: ${article.slug}`);
});

// Rebuild Index
console.log("🔄 Updating Index...");
try {
    const index = rebuildIndex();
    console.log(`🎉 Index updated with ${index.articles.length} articles.`);
} catch (e) {
    console.error("❌ Index rebuild failed:", e);
}
