// One-off scrub for employer_profiles.legal_name and dba_name where prior
// dev sessions appended " (modified)" to the values. Idempotent — re-running
// after rows are clean is a no-op.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const result = await prisma.$executeRaw`
    UPDATE employer_profiles
    SET legal_name = regexp_replace(legal_name, '\\s*\\(modified\\)\\s*$', ''),
        dba_name   = CASE
            WHEN dba_name IS NULL THEN NULL
            ELSE regexp_replace(dba_name, '\\s*\\(modified\\)\\s*$', '')
        END
    WHERE legal_name LIKE '%(modified)%'
       OR dba_name   LIKE '%(modified)%';
`;

console.log(`scrubbed (modified) suffix from ${result} employer_profiles row(s).`);

process.exit(0);
