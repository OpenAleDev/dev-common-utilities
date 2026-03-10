import { $ } from 'bun';
import { log, sec } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Docker helpers
//
// Wraps the raw `docker` / `docker compose` shell commands used by the script.
// Each function is self-contained: it receives only what it needs and handles
// its own error propagation.
// ─────────────────────────────────────────────────────────────────────────────

/** Stops and removes the container (equivalent to `docker compose down`). */
export async function tearDown(composeFile: string): Promise<void> {
    await $`docker compose -f ${composeFile} down`.quiet();
}

/** Creates and starts the container in detached mode (`docker compose up -d`). */
export async function start(composeFile: string): Promise<void> {
    await $`docker compose -f ${composeFile} up -d`.quiet();
}

/**
 * Polls `docker logs` until PostgreSQL reports that it is ready to accept
 * connections, then returns.
 *
 * @param containerName  Name of the running container (from compose/.env).
 * @param timeoutMs      How long to wait before giving up (default: 60 s).
 * @param pollIntervalMs How often to check the logs   (default:  2 s).
 */
export async function waitForReady(
    containerName  : string,
    timeoutMs      : number = 60_000,
    pollIntervalMs : number = 2_000,
    readyIntervalMs : number = 5_000 // extra wait time after ready signal before returning - waiting for init scripts
): Promise<void> {
    const READY_SIGNAL = 'ready to accept connections';
    const startedAt    = Date.now();
    let   attempts     = 0;

    log.info(`poll interval: ${pollIntervalMs / 1000}s  |  timeout: ${timeoutMs / 1000}s`);

    while (true) {
        if (Date.now() - startedAt > timeoutMs) {
            throw new Error(
                `PostgreSQL did not become ready within ${timeoutMs / 1000}s. ` +
                `Check the container logs: docker logs ${containerName}`
            );
        }

        attempts++;
        const output = await $`docker logs ${containerName} 2>&1`.quiet().text();

        if (output.includes(READY_SIGNAL)) {
            process.stdout.write('\n'); // clear the live \r line
            log.info(`Ready after ${attempts} poll${attempts !== 1 ? 's' : ''}  (${sec(startedAt)})`);
            await Bun.sleep(readyIntervalMs);
            return;
        }

        log.poll(attempts, sec(startedAt));
        await Bun.sleep(pollIntervalMs);
    }
}
