// @ts-check
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";

export const CANDIDATE_REVISION = "7c2f9e36453c6081db7641b7efae00c6e271fa39";
const DIGESTS = {
    "mpr-ui-config.js": "3f56fbd212a516d2bd8b0b95f73ae7ad82952c10d8d5f4e6f8b44d3233f01304",
    "mpr-ui.js": "2023d9a7b4bb979eda5a22fe75bcf826fcb8d1173d651944177be2096d421a8e",
    "mpr-ui.css": "31b92536df3a1584b7f19ac50eb61d6c7aff7c710ee92b84c46835194849e816"
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
