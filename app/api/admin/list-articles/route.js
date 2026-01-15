
import { NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/articleStore';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch all articles (limit 1000 for admin view)
        const { articles } = getAllArticles(1, 1000);

        return NextResponse.json({ articles });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }
}
