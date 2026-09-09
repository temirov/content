// @ts-check
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";

export const CANDIDATE_REVISION = "768f25936497c5aabd426197d21c2100b6e5d9a1";
const DIGESTS = {
    "mpr-ui-config.js": "3f56fbd212a516d2bd8b0b95f73ae7ad82952c10d8d5f4e6f8b44d3233f01304",
    "mpr-ui.js": "3e725dbe911470ca934cb46456369479b6ac232eee5ccba2582bf8d939259ae8",
    "mpr-ui.css": "351bbf6c15054528a651571d8c8bd85536eea76c3e574f9335e6cd413878923f"
};
/** @type {Promise<Map<string, Buffer>> | undefined} */
let assetsPromise;

/**
 * Retrieves the immutable shared assets and verifies each digest.
 * @returns {Promise<Map<string, Buffer>>}
 */
export async function sharedUiCandidate() {
    assetsPromise ??= (async () => {
        const assets = new Map();
        for (const [name, digest] of Object.entries(DIGESTS)) {
            const response = await fetch(`https://raw.githubusercontent.com/MarcoPoloResearchLab/mpr-ui/${CANDIDATE_REVISION}/${name}`, { signal: AbortSignal.timeout(15000) });
            if (!response.ok) throw new Error(`MPR UI candidate ${name}: HTTP ${response.status}`);
            const bytes = Buffer.from(await response.arrayBuffer());
            if (createHash("sha256").update(bytes).digest("hex") !== digest) throw new Error(`MPR UI candidate ${name}: digest mismatch`);
            assets.set(name, bytes);
        }
        return assets;
    })();
    return assetsPromise;
}
