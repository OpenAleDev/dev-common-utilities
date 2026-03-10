import { readFileSync } from 'fs';

// ─────────────────────────────────────────────────────────────────────────────
// DB configuration
//
// compose/.env is the single source of truth for all values.
// This module reads it once and exports a typed config object that the rest
// of the scripts can import without repeating any values.
// ─────────────────────────────────────────────────────────────────────────────

export type DbConfig = {
    containerName : string;
    host          : string;
    port          : number;
    user          : string;
    password      : string;
    database      : string;
    databaseUrl   : string;
};

export function loadConfig(envFilePath: string): DbConfig {
    const raw = parseEnvFile(envFilePath);

    const containerName = raw.DATABASE_CONTAINER_NAME;
    const host          = 'localhost';
    const port          = Number(raw.OUTPUT_PORT);
    const user          = raw.POSTGRES_USER;
    const password      = raw.POSTGRES_PASSWORD;
    const database      = raw.POSTGRES_DB;
    const databaseUrl   = `postgresql://${user}:${password}@${host}:${port}/${database}`;

    return { containerName, host, port, user, password, database, databaseUrl };
}

// ─── Internal: .env parser ────────────────────────────────────────────────────
// Supports quoted values and ${VAR} self-references (same syntax as Docker
// Compose, so the files stay compatible with both tools).

function parseEnvFile(filePath: string): Record<string, string> {
    const vars: Record<string, string> = {};

    for (const raw of readFileSync(filePath, 'utf-8').split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;

        const eq = line.indexOf('=');
        if (eq === -1) continue;

        const key = line.slice(0, eq).trim();
        let   val = line.slice(eq + 1).trim();

        // Strip surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }

        // Resolve ${VAR} references against already-parsed keys
        val = val.replace(/\$\{(\w+)\}/g, (_, k) => vars[k] ?? '');

        vars[key] = val;
    }

    return vars;
}
