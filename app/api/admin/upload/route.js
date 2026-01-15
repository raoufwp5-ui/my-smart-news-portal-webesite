import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(request) {
    try {
        const data = await request.formData();
        const file = data.get('file');

        if (!file) {
            return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename to avoid collisions, or just use original?
        // User wants to update images, maybe keeping original name is better for recognition,
        // but let's prepend timestamp to ensure uniqueness and prevent caching issues if they upload same name different content.
        // Actually, user might want simple names. Let's start with timestamp-dashed-name.

        // Sanitize filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${Date.now()}-${safeName}`;

        // Ensure directory exists (redundant if I ran mkdir, but good for safety)
        const uploadDir = path.join(process.cwd(), 'public', 'media', 'articles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);
        console.log(`✅ File saved to ${filepath}`);

        // Return the URL relative to public
        // Assuming Next.js serves public folder at root
        const imageUrl = `/media/articles/${filename}`;

        return NextResponse.json({ success: true, url: imageUrl });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
    }
}
