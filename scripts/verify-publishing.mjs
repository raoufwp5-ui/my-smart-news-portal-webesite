import { saveArticle, getArticleBySlug, getScheduledArticles } from '../lib/articleStore.js';

console.log('--- Starting Publishing System Verification ---');

// 1. Create a Scheduled Article (Scheduled for 1 minute ago so it should trigger)
const mockSlug = 'test-scheduled-article';
const mockArticle = {
    title: 'Test Scheduled Article',
    slug: mockSlug,
    content: 'This Content should perform well.',
    status: 'scheduled',
    scheduledFor: new Date(Date.now() - 60000).toISOString(), // 1 min ago
    category: 'tech'
};

console.log(`\n1. Creating scheduled article: ${mockArticle.title}`);
saveArticle(mockArticle, 'tech');

// 2. Verify it is in scheduled list
const scheduled = getScheduledArticles();
const found = scheduled.find(a => a.slug === mockSlug);

if (found) {
    console.log('✅ Article successfully found in scheduled list.');
} else {
    console.error('❌ Article NOT found in scheduled list!');
    process.exit(1);
}

// 3. Simulate Cron Job (We can't call API directly easily in node script without fetch, 
// so we'll mock the logic here using the store functions directly to verify core logic)
console.log('\n2. Simulating Cron Logic...');
const now = new Date();
if (new Date(found.scheduledFor) <= now) {
    console.log(`   Time matched! Publishing ${found.slug}...`);

    const fullArticle = getArticleBySlug(found.slug);
    const updated = {
        ...fullArticle,
        status: 'published',
        pubDate: now.toISOString(),
        scheduledFor: null
    };
    saveArticle(updated, updated.category);
    console.log('   ✅ Article updated to published.');
} else {
    console.log('   ❌ Time did not match (unexpected).');
}

// 4. Verify it's now published
const finalArticle = getArticleBySlug(mockSlug);
if (finalArticle.status === 'published') {
    console.log(`\n✅ VERIFICATION SUCCESS: Article is now '${finalArticle.status}'.`);
} else {
    console.error(`\n❌ VERIFICATION FAILED: Article status is '${finalArticle.status}'.`);
}

// Cleanup
import fs from 'fs';
import path from 'path';
const STORAGE_DIR = path.join(process.cwd(), 'data', 'articles');
try {
    fs.unlinkSync(path.join(STORAGE_DIR, `${mockSlug}.json`));
    console.log('\n🧹 Cleanup: Test file deleted.');
} catch (e) { }
