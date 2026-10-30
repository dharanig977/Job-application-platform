import Link from "next/link";
import { db } from "@/lib/db";
import { WINDOWS, ago, windowStart } from "@/lib/time";
import { Badge, Card } from "../ui";

export const dynamic = "force-dynamic";

type Search = { category?: string; within?: string };

function href(current: Search, change: Search) {
  const params = new URLSearchParams();
  const merged = { ...current, ...change };
  if (merged.category) params.set("category", merged.category);
  if (merged.within) params.set("within", merged.within);
  const qs = params.toString();
  return qs ? `/jobs?${qs}` : "/jobs";
}

function Chip({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
          : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const since = windowStart(search.within);

  const [categories, jobs] = await Promise.all([
    db.job.groupBy({ by: ["category"], _count: true, orderBy: { category: "asc" } }),
    db.job.findMany({
      where: {
        ...(search.category ? { category: search.category } : {}),
        ...(since ? { postedAt: { gte: since } } : {}),
      },
      orderBy: { postedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Jobs</h1>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Chip active={!search.category} href={href(search, { category: undefined })}>All categories</Chip>
          {categories.map((c) => (
            <Chip key={c.category} active={search.category === c.category} href={href(search, { category: c.category })}>
              {c.category} ({c._count})
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={!search.within} href={href(search, { within: undefined })}>Any time</Chip>
          {WINDOWS.map((w) => (
            <Chip key={w.key} active={search.within === w.key} href={href(search, { within: w.key })}>
              Last {w.label}
            </Chip>
          ))}
        </div>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-left text-xs uppercase text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Posted</th>
              <th className="px-4 py-2">ATS</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                <td className="px-4 py-2">
                  <Link href={`/jobs/${j.id}`} className="font-medium hover:underline">{j.title}</Link>
                  <div className="text-xs text-zinc-500">{j.company} · {j.location}</div>
                </td>
                <td className="px-4 py-2">{j.category}</td>
                <td className="px-4 py-2">{j.source}</td>
                <td className="px-4 py-2 whitespace-nowrap">{ago(j.postedAt)}</td>
                <td className="px-4 py-2">{j.atsScore ?? "–"}</td>
                <td className="px-4 py-2"><Badge status={j.status} /></td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-500">No jobs match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
