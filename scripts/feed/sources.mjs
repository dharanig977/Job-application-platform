// Job sources. Each fetcher returns jobs in one shape:
// { source, externalId, title, company, location, url, description, postedAt }

const UA = { "User-Agent": "job-agent (personal job search)" };

function htmlToText(html = "") {
  return html
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/<\/(p|div|li|h\d|br)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { ...UA, ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// Public company job boards: no key needed, and they list a job the moment
// the employer publishes it.

export async function greenhouse(board) {
  const data = await getJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
  return data.jobs.map((j) => ({
    source: "Greenhouse",
    externalId: `${board}:${j.id}`,
    title: j.title,
    company: j.company_name ?? board,
    location: j.location?.name ?? "",
    url: j.absolute_url,
    description: htmlToText(j.content),
    postedAt: new Date(j.first_published ?? j.updated_at),
  }));
}

export async function lever(company) {
  const data = await getJson(`https://api.lever.co/v0/postings/${company}?mode=json`);
  return data.map((j) => ({
    source: "Lever",
    externalId: `${company}:${j.id}`,
    title: j.text,
    company,
    location: j.categories?.location ?? "",
    url: j.hostedUrl,
    description: j.descriptionPlain ?? htmlToText(j.description),
    postedAt: new Date(j.createdAt),
  }));
}

export async function ashby(board) {
  const data = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${board}`);
  return data.jobs.map((j) => ({
    source: "Ashby",
    externalId: `${board}:${j.id}`,
    title: j.title,
    company: board,
    location: j.location ?? "",
    url: j.jobUrl,
    description: j.descriptionPlain ?? htmlToText(j.descriptionHtml),
    postedAt: new Date(j.publishedAt),
  }));
}

// Aggregators: listings from LinkedIn, Indeed, Google Jobs, Dice and others,
// read through their APIs. Both need a key.

export async function jsearch(query, apiKey) {
  const params = new URLSearchParams({ query, date_posted: "today", num_pages: "1", country: "us" });
  const data = await getJson(`https://jsearch.p.rapidapi.com/search?${params}`, {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
  });
  return (data.data ?? []).map((j) => ({
    // The board the listing came from, e.g. "LinkedIn", "Indeed", "Dice".
    source: j.job_publisher || "Google Jobs",
    externalId: j.job_id,
    title: j.job_title,
    company: j.employer_name ?? "",
    location: j.job_is_remote ? "Remote" : [j.job_city, j.job_state].filter(Boolean).join(", "),
    url: j.job_apply_link,
    description: j.job_description ?? "",
    postedAt: new Date(j.job_posted_at_datetime_utc ?? Date.now()),
  }));
}

export async function adzuna(query, appId, appKey) {
  const params = new URLSearchParams({
    app_id: appId, app_key: appKey, what: query, max_days_old: "1", sort_by: "date", results_per_page: "50",
  });
  const data = await getJson(`https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`);
  return (data.results ?? []).map((j) => ({
    source: "Adzuna",
    externalId: String(j.id),
    title: j.title.replace(/<[^>]+>/g, ""),
    company: j.company?.display_name ?? "",
    location: j.location?.display_name ?? "",
    url: j.redirect_url,
    description: htmlToText(j.description),
    postedAt: new Date(j.created),
  }));
}

export const BOARD_FETCHERS = { greenhouse, lever, ashby };
