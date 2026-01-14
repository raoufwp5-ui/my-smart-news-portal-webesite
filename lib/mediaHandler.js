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
 * Downloads a remote file and returns the local public path using native fetch
 * @param {string} url - Remote URL
 * @param {string} slug - Article slug for filename
 * @param {string} type - 'image' or 'video'
 * @returns {Promise<string|null>} - Local public path or null on failure
 */
export async function downloadMedia(url, slug, type = 'image') {
    if (!url || typeof url !== 'string' || url.length < 5) return null;

    // Check if it's already a local path or data URI
    if (url.startsWith('/') || url.startsWith('data:')) return url;

    try {
        ensureDir();

        // Generate filename
        const ext = url.split('.').pop().split(/[#?]/)[0] || (type === 'video' ? 'mp4' : 'jpg');
        const filename = `${slug}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = path.join(MEDIA_DIR, filename);
        const publicPath = `/media/articles/${filename}`;

        console.log(`📡 Downloading ${type}: ${url} -> ${publicPath}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
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
