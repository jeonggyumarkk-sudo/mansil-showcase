import { readFileSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

let cachedGzip: Buffer | null = null;

function getGzipped(): Buffer {
    if (cachedGzip) return cachedGzip;
    const filePath = join(process.cwd(), 'data/listings-map.json');
    const raw = readFileSync(filePath, 'utf-8');
    cachedGzip = gzipSync(raw);
    return cachedGzip;
}

export async function GET() {
    const gzipped = getGzipped();
    return new Response(gzipped as unknown as BodyInit, {
        headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
