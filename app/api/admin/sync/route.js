import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST() {
    try {
        // 1. Git Add
        await execPromise('git add .');

        // 2. Git Commit
        // Using a timestamp in the message to ensure it's always a unique commit if changes exist
        const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        try {
            await execPromise(`git commit -m "chore(admin): manual sync via dashboard at ${timestamp}"`);
        } catch (e) {
            // Ignore "nothing to commit" errors
            if (!e.stdout.includes('nothing to commit') && !e.message.includes('nothing to commit')) {
                throw e;
            }
        }

        // 3. Git Push
        await execPromise('git push');

        return NextResponse.json({ success: true, message: '✅ Synced to GitHub!' });

    } catch (error) {
        console.error('Git Sync Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Sync failed'
        }, { status: 500 });
    }
}
