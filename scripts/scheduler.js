const { exec } = require('child_process');
const path = require('path');

const SEED_SCRIPT = path.join(__dirname, 'radical-seed.js');
const INTERVAL_HOURS = 2;
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;

function runSeed() {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Starting scheduled news update...`);

    const child = exec(`node "${SEED_SCRIPT}"`, { cwd: process.cwd() });

    child.stdout.on('data', (data) => process.stdout.write(data));
    child.stderr.on('data', (data) => process.stderr.write(data));

    child.on('close', (code) => {
        console.log(`✅ Update completed with code ${code}. Next run in ${INTERVAL_HOURS} hours.`);
    });
}

// Run immediately on start
runSeed();

// Schedule
setInterval(runSeed, INTERVAL_MS);

console.log(`🚀 News Scheduler Active. Running every ${INTERVAL_HOURS} hours.`);
console.log('Keep this terminal open to maintain the schedule.');
