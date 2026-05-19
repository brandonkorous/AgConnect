// Skill overlap scoring shared by the applicant review, worker job feed, and
// worker search. Exact-slug comparison is brittle: any case/whitespace drift
// (legacy free-text, imported profiles) silently scores 0. Normalizing both
// sides fixes that class of false misses.
//
// SKILL_COVERS additionally lets a broader competency satisfy a narrower
// requirement (directional only — the general implies the specific, never the
// reverse). Kept deliberately tiny and explicit; every entry is a product
// judgement, so review before extending.

function norm(s: string): string {
    return s.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

// Worker holding KEY also satisfies a job requiring any slug in VALUE.
const SKILL_COVERS: Record<string, readonly string[]> = {
    // A general harvester can hand-harvest. Observed gap: worker listed
    // `harvesting`, job required `hand_harvest`, scored 0/0.
    harvesting: ['hand_harvest'],
};

/** Count how many of the job's required skills the worker satisfies. */
export function countSkillMatches(
    jobSkills: readonly string[],
    workerSkills: readonly string[],
): number {
    const covered = new Set<string>();
    for (const raw of workerSkills) {
        const s = norm(raw);
        covered.add(s);
        for (const c of SKILL_COVERS[s] ?? []) covered.add(norm(c));
    }
    let n = 0;
    for (const j of jobSkills) {
        if (covered.has(norm(j))) n += 1;
    }
    return n;
}
