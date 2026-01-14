const fs = require('fs');

async function run() {
    const url = "https://picsum.photos/seed/test1234/800/600";
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url, {
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log(`Status: ${res.status}`);
        console.log(`Final URL: ${res.url}`);
        const buffer = await res.arrayBuffer();
        console.log(`Size: ${buffer.byteLength}`);
        fs.writeFileSync('debug-picsum.jpg', Buffer.from(buffer));
        console.log("Saved debug-picsum.jpg");
    } catch (e) {
        console.error(e);
    }
}

run();
