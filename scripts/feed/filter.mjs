// Decide which fetched jobs match the profile, and file each under the
// target role it matched (that role is the job's category on the Jobs page).

const list = (value = "") => value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
const words = (s) => s.toLowerCase().match(/[a-z0-9+#]+/g) ?? [];

export function buildFilter(answers) {
  const roles = list(answers.targetRoles);
  const exclude = list(answers.excludeKeywords).map((k) => k.toLowerCase());
  const mustHave = list(answers.keywords).map((k) => k.toLowerCase());
  const workplace = answers.workplaceType;

  return function match(job) {
    const titleWords = new Set(words(job.title));
    const role = roles.find((r) => words(r).every((w) => titleWords.has(w)));
    if (!role) return null;

    const haystack = `${job.title}\n${job.description}`.toLowerCase();
    if (exclude.some((k) => haystack.includes(k))) return null;
    if (mustHave.length && !mustHave.some((k) => haystack.includes(k))) return null;
    if (workplace === "Remote" && !/remote/i.test(`${job.location} ${job.title}`)) return null;

    return role;
  };
}

export { list };
