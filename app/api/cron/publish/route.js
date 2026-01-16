import { NextResponse } from 'next/server';
import { getScheduledArticles, saveArticle, getArticleBySlug } from '@/lib/articleStore';

export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET(request) {
    try {
        console.log('⏰ Cron Job Triggered: Checking for scheduled articles...');

        const scheduled = getScheduledArticles();
        const now = new Date();
        const published = [];

        for (const articleInfo of scheduled) {
            const scheduledTime = new Date(articleInfo.scheduledFor);

            if (scheduledTime <= now) {
                // Time to publish!
                console.log(`🚀 Publishing: ${articleInfo.title}`);

                // 1. Get full article data
                const fullArticle = getArticleBySlug(articleInfo.slug);

                if (fullArticle) {
                    // 2. Update status
                    const updatedArticle = {
                        ...fullArticle,
                        status: 'published',
                        pubDate: now.toISOString(), // Set actual publish time to now
                        scheduledFor: null // Clear schedule
                    };

                    // 3. Save
                    saveArticle(updatedArticle, updatedArticle.category);
                    published.push(updatedArticle.title);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${scheduled.length} scheduled articles`,
            published: published,
            timestamp: now.toISOString()
        });

    } catch (error) {
        console.error('❌ Cron Job Failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
