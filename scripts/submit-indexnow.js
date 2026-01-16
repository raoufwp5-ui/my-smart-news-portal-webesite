
const fs = require('fs');
const path = require('path');
const https = require('https');

const DOMAIN = 'global-brief.vercel.app';
const KEY = '8bd5c79296344585973c1d4715f368e7';
const KEY_LOCATION = `https://${DOMAIN}/${KEY}.txt`;

const articlesDir = path.join(__dirname, '../data/articles');

// 1. Collect all URLs
const urls = [];
// Add Main Pages
urls.push(`https://${DOMAIN}/`);
urls.push(`https://${DOMAIN}/about`);
urls.push(`https://${DOMAIN}/contact`);

// Add Articles
const files = fs.readdirSync(articlesDir);
files.forEach(file => {
    if (file.endsWith('.json')) {
        const content = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf8'));
        if (content.slug) {
            urls.push(`https://${DOMAIN}/article/${content.slug}`);
        }
    }
});

console.log(`📡 Preparing to submit ${urls.length} URLs to IndexNow...`);

// 2. Prepare Payload
const payload = JSON.stringify({
    host: DOMAIN,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
});

// 3. Send Request
const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/indexnow',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': payload.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Response Status: ${res.statusCode}`);

    res.on('data', (d) => {
        process.stdout.write(d);
    });

    if (res.statusCode === 200 || res.statusCode === 202) {
        console.log('\n✅ Success! Bing/Yandex have been notified.');
    } else {
        console.log('\n❌ Failed. Check your key location and domain.');
    }
});

req.on('error', (e) => {
    console.error(e);
});

req.write(payload);
req.end();
