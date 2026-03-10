// ─────────────────────────────────────────────────────────────────────────────
// Console logger
//
// Provides coloured, structured output for every step of the script.
// All formatting (ANSI codes, box characters, table layout) lives here so
// upAndTest.ts stays free of visual noise.
// ─────────────────────────────────────────────────────────────────────────────

// ANSI escape codes
const R   = '\x1b[0m';   // reset
const B   = '\x1b[1m';   // bold
const DIM = '\x1b[2m';   // dimmed
const RED = '\x1b[31m';
const GRN = '\x1b[32m';
const BLU = '\x1b[34m';
const CYN = '\x1b[36m';

// ── Timing helpers ────────────────────────────────────────────────────────────

export function ms(startedAt: number): string {
    return `${Date.now() - startedAt}ms`;
}

export function sec(startedAt: number): string {
    return `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
}

// ── Log functions ─────────────────────────────────────────────────────────────

export const log = {

    /** Top banner printed once at startup. */
    banner() {
        console.log(`\n${B}${BLU}╔══════════════════════════════════════════════════╗${R}`);
        console.log(`${B}${BLU}║       ${GRN}PostgreSQL Dev Manager${R}  ${BLU}·  docker compose${B}${BLU}  ║${R}`);
        console.log(`${B}${BLU}╚══════════════════════════════════════════════════╝${R}`);
    },

    /** Active configuration summary printed after the banner. */
    config(containerName: string, database: string, port: number, user: string) {
        console.log(`\n${DIM}  container : ${R}${containerName}`);
        console.log(`${DIM}  database  : ${R}${database}`);
        console.log(`${DIM}  port      : ${R}${port}`);
        console.log(`${DIM}  user      : ${R}${user}`);
    },

    /** Opening line of a numbered step. */
    step(current: number, total: number, description: string) {
        console.log(`\n${B}${BLU}┌─ Step ${current}/${total} ──────────────────────────────────────────${R}`);
        console.log(`${BLU}│  ${R}${B}${description}${R}`);
    },

    /** Closing line of a step – printed when it succeeds. */
    ok(message: string, elapsed: string) {
        console.log(`${BLU}└─${GRN}✔${R}  ${message}  ${DIM}(${elapsed})${R}`);
    },

    /** Informational note inside a step (indented). */
    info(message: string) {
        console.log(`   ${CYN}ℹ${R}  ${message}`);
    },

    /** Live polling indicator – overwrites the same line via \r. */
    poll(attempt: number, elapsed: string) {
        process.stdout.write(`   ${DIM}· waiting... attempt ${attempt}  ${elapsed}${R}\r`);
    },

    /** Renders an ASCII table for rows returned by the verification query. */
    table(rows: { id: number; name: string; created_at: Date }[]) {
        const COL = { ID: 4, NAME: 22, DATE: 32 };

        const border = (l: string, m: string, r: string, sep: string) =>
            `${DIM}${l}${'─'.repeat(COL.ID   + 2)}${sep}` +
                    `${'─'.repeat(COL.NAME + 2)}${sep}` +
                    `${'─'.repeat(COL.DATE + 2)}${r}${R}`;

        const cell = (v: string, width: number) =>
            `${DIM}│${R} ${v.padEnd(width)} `;

        const dataRow = (id: string, name: string, date: string) =>
            cell(id, COL.ID) + cell(name, COL.NAME) + cell(date, COL.DATE) + `${DIM}│${R}`;

        console.log(`\n   ${border('┌', '┬', '┐', '┬')}`);
        console.log(`   ${dataRow(B + 'id' + R, B + 'name' + R, B + 'created_at' + R)}`);
        console.log(`   ${border('├', '┼', '┤', '┼')}`);
        for (const row of rows) {
            console.log(`   ${dataRow(String(row.id), row.name, row.created_at.toISOString())}`);
        }
        console.log(`   ${border('└', '┴', '┘', '┴')}`);
    },

    /** Final summary line printed when all steps succeed. */
    summary(totalElapsed: string) {
        console.log(`\n${DIM}${'─'.repeat(52)}${R}`);
        console.log(`${B}${GRN}✔  All checks passed${R}  ${DIM}total: ${totalElapsed}${R}\n`);
    },

    /** Error summary printed when the script catches an exception. */
    fail(message: string, error?: unknown) {
        console.error(`\n${DIM}${'─'.repeat(52)}${R}`);
        console.error(`${B}${RED}✖  ${message}${R}`);
        if (error) console.error(`   ${DIM}${String(error)}${R}`);
        console.error('');
    },
};
