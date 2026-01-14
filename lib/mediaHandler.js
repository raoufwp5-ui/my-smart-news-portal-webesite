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

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
};

/**
 * Scrapes the OG image from a URL if direct link is missing
 */
export async function extractOGImage(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;

    try {
        let targetUrl = url;

        // Aggressive Unfolding for Google News
        if (url.includes('news.google.com/rss/articles')) {
            console.log(`🔗 Unfolding Google News Link: ${url}`);
            const res = await fetch(url, { headers: HEADERS });
            const html = await res.text();

            // Look for the actual publisher link in the source
            const match = html.match(/data-url=["'](https?:\/\/[^"']+)["']/i) ||
                html.match(/url=["'](https?:\/\/[^"']+)["']/i) ||
                html.match(/href=["'](https?:\/\/[^"']+)["'][^>]*rel=["']canonical["']/i) ||
                html.match(/<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>[\s\S]*?<\/a>/i);

            if (match && match[1] && !match[1].includes('google.com')) {
                targetUrl = match[1];
                console.log(`📡 Reached Publisher: ${targetUrl}`);
            }
        }

        const response = await fetch(targetUrl, {
            headers: HEADERS,
            redirect: 'follow'
        });

        if (!response.ok) return null;

        const html = await response.text();

        // Multi-variant OG/Twitter Regex
        const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
            html.match(/<meta[^>]*name=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

        let found = ogMatch ? ogMatch[1] : null;

        // Safeguard against generic placeholders
        if (found && (found.includes('googleusercontent.com') || found.includes('google.com') || found.includes('placeholder'))) {
            console.log(`⚠️ Generic placeholder detected: ${found}`);
            return null;
        }

        if (found) {
            console.log(`✨ Successfully scraped unique media: ${found}`);
            return found;
        }

        return null;
    } catch (e) {
        console.warn(`⚠️ Scraping failure: ${e.message}`);
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

        const response = await fetch(url, { headers: HEADERS });

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
