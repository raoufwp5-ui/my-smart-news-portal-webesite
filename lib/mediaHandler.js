import fs from 'fs';
import path from 'path';

const MEDIA_DIR = path.join(process.cwd(), 'public', 'media', 'articles');

/**
 * Ensures the media directory exists
 */
function ensureDir() {
    try {
        if (!fs.existsSync(MEDIA_DIR)) {
            fs.mkdirSync(MEDIA_DIR, { recursive: true });
        }
    } catch (e) {
        console.warn("Dir creation failed", e.message);
    }
}

/**
 * Scrapes the OG image from a URL if direct link is missing
 */
export async function extractOGImage(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;

    try {
        console.log(`🔍 Attempting to scrape OG metadata for: ${url}`);
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            next: { revalidate: 3600 }
        });

        if (!response.ok) return null;

        const html = await response.text();

        // Simple regex extraction for OG tags to avoid heavy DOM parsers
        const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

        if (ogMatch && ogMatch[1]) {
            console.log(`✨ Found OG Image: ${ogMatch[1]}`);
            return ogMatch[1];
        }

        // Fallback to twitter image
        const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
        if (twitterMatch && twitterMatch[1]) return twitterMatch[1];

        return null;
    } catch (e) {
        console.warn(`⚠️ Meta scraping failed: ${e.message}`);
        return null;
    }
}

/**
 * Downloads a remote file and returns the local public path
 */
export async function downloadMedia(url, slug, type = 'image') {
    if (!url || typeof url !== 'string' || url.length < 5) return null;

    // Check if it's already a local path or data URI
    if (url.startsWith('/') || url.startsWith('data:')) return url;

    try {
        ensureDir();

        // Generate filename with sanitized slug
        const sanitizedSlug = slug.substring(0, 100).replace(/[^a-z0-9]/gi, '-');
        const ext = url.split('.').pop().split(/[#?]/)[0] || (type === 'video' ? 'mp4' : 'jpg');
        const filename = `${sanitizedSlug}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = path.join(MEDIA_DIR, filename);
        const publicPath = `/media/articles/${filename}`;

        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        fs.writeFileSync(filePath, buffer);
        console.log(`✅ ${type} saved locally: ${publicPath}`);

        return publicPath;

    } catch (error) {
        console.warn(`⚠️ Failed to download ${type}: ${error.message}`);
        return null;
    }
}
