// ─────────────────────────────────────────────────────────────────────────────
// upAndTest.ts  –  PostgreSQL dev manager
//
// Usage (from this directory):
//   bun upAndTest.ts
//
// What it does:
//   1. Stops any running instance of the database container.
//   2. Starts a fresh container via docker compose.
//   3. Waits until PostgreSQL is ready to accept connections.
//   4. Runs a SELECT on demo_table to verify the database was initialised.
//
// Configuration:  ../compose/.env   (single source of truth)
// Compose file:   ../compose/docker-compose.yml
// ─────────────────────────────────────────────────────────────────────────────

import { loadConfig }              from './utils/config';
import { log, ms, sec }            from './utils/logger';
import { tearDown, start, waitForReady } from './utils/docker';

// ── 1. Load configuration from compose/.env ───────────────────────────────────

const config       = loadConfig('../compose/.env');
const COMPOSE_FILE = '../compose/docker-compose.yml';

// Make the DATABASE_URL available to Bun's built-in SQL client
process.env.DATABASE_URL = config.databaseUrl;
const { sql } = await import('bun');

// ── 2. Print startup banner ───────────────────────────────────────────────────

const TOTAL_STEPS = 4;
const totalStart  = Date.now();
let   step        = 0;

log.banner();
log.config(config.containerName, config.database, config.port, config.user);

// ── 3. Run steps ──────────────────────────────────────────────────────────────

try {

    // Step 1 – Tear down any previously running container
    {
        const t = Date.now();
        log.step(++step, TOTAL_STEPS, 'Tearing down any existing container');
        await tearDown(COMPOSE_FILE);
        log.ok('Container stopped and removed', ms(t));
    }

    // Step 2 – Start a fresh container
    {
        const t = Date.now();
        log.step(++step, TOTAL_STEPS, 'Starting database container');
        await start(COMPOSE_FILE);
        log.ok(`Container "${config.containerName}" started`, ms(t));
    }

    // Step 3 – Wait until PostgreSQL is ready to accept connections
    {
        const t = Date.now();
        log.step(++step, TOTAL_STEPS, 'Waiting for PostgreSQL to be ready');
        await waitForReady(config.containerName);
        log.ok('PostgreSQL is ready', sec(t));
    }

    // Step 4 – Verify with a SELECT query against demo_table
    {
        const t = Date.now();
        log.step(++step, TOTAL_STEPS, 'Running verification query on demo_table');
        const rows = await sql`SELECT id, name, created_at FROM demo_table ORDER BY id`;
        log.ok(`Query returned ${rows.length} row(s)`, ms(t));
        log.table(rows as { id: number; name: string; created_at: Date }[]);
    }

    log.summary(sec(totalStart));

} catch (err) {
    log.fail('Script failed', err);
    process.exit(1);
}
