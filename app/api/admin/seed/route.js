import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { saveArticle, generateSlug, rebuildIndex } from '@/lib/articleStore';
import { downloadMedia, extractOGImage } from '@/lib/mediaHandler';
import { model } from '@/lib/gemini';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const maxDuration = 300; // 5 minutes for deep seeding

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const auth = searchParams.get('auth');

    // Simple protection
    if (auth !== 'force') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    console.log('🚀 RADICAL SEED STARTING...');

    const results = {};

    for (const category of Object.keys(FEEDS)) {
        console.log(`📡 Seeding Category: ${category}`);
        results[category] = 0;

        try {
            const feed = await fetchFeed(FEEDS[category]);
            if (!feed || !feed.items) continue;

            const items = feed.items.slice(0, 5); // 5 premium articles per category

            for (const item of items) {
                const slug = generateSlug(item.title);
                console.log(`  📝 Processing: ${slug}`);

                try {
                    // 1. Get Image
                    let remoteUrl = item.enclosure?.url || item['media:content']?.['$']?.url || await extractOGImage(item.link);
                    const localImage = await downloadMedia(remoteUrl, slug, 'image');

                    // 2. AI Content
                    const prompt = `Lead AI Analyst. Write a 400-600 word premium news report in Markdown. 
                    Target: ${item.title}. 
                    Context: ${item.contentSnippet || item.content || item.title}.
                    Return JSON: { "title": "Headline", "content": "Markdown...", "tldr": ["P1", "P2", "P3"], "metaDescription": "...", "keywords": ["T1"] }`;

                    const aiRes = await model.generateContent(prompt);
                    const aiData = JSON.parse(aiRes.response.text().replace(/```json|```/g, '').trim());

                    saveArticle({
                        ...aiData,
                        slug,
                        image: localImage || '/default-news.jpg',
                        pubDate: item.pubDate || new Date().toISOString(),
                        originalSource: item.creator || "Global News",
                        source: item.link
                    }, category);

                    results[category]++;
                    console.log(`  ✅ Finished: ${slug}`);
                } catch (inner) {
                    console.warn(`  ⚠️ Skip item: ${inner.message}`);
                }
            }
        } catch (catError) {
            console.error(`❌ Category failed: ${category}`, catError.message);
        }
    }

    rebuildIndex();
    return NextResponse.json({ success: true, results });
}
