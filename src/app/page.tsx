import Link from "next/link";
import { db } from "@/lib/db";
import { WINDOWS, ago, duration, stamp } from "@/lib/time";
import { Card, Stat } from "./ui";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [jobs, applications, lastRun] = await Promise.all([
    db.job.findMany({ select: { postedAt: true } }),
    db.application.findMany({
      where: { status: "submitted" },
      include: { job: true, resume: true },
      orderBy: { appliedAt: "desc" },
    }),
    db.feedRun.findFirst({ orderBy: { at: "desc" } }),
  ]);

  const now = Date.now();
  const windowCounts = WINDOWS.map((w) => ({
    ...w,
    count: jobs.filter((j) => now - j.postedAt.getTime() <= w.minutes * 60_000).length,
  }));

  const speeds = applications
    .filter((a) => a.appliedAt)
    .map((a) => a.appliedAt!.getTime() - a.job.postedAt.getTime());
  const avgSpeed = speeds.length
    ? duration(new Date(0), new Date(speeds.reduce((a, b) => a + b, 0) / speeds.length))
    : "–";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <span className="text-sm text-zinc-500">
          {lastRun ? `Job feed last checked ${ago(lastRun.at)}, ${lastRun.added} new` : "Job feed hasn't run yet"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Applied" value={applications.length} />
        <Stat label="Jobs tracked" value={jobs.length} />
        <Stat label="Posted last 24 h" value={windowCounts.find((w) => w.key === "24h")!.count} />
        <Stat label="Avg time to apply" value={avgSpeed} />
      </div>

      <Card>
        <div className="mb-3 text-sm font-medium">New jobs by posted time</div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
          {windowCounts.map((w) => (
            <Link key={w.key} href={`/jobs?within=${w.key}`} className="rounded border border-zinc-200 p-2 text-center hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
              <div className="text-lg font-semibold">{w.count}</div>
              <div className="text-xs text-zinc-500">{w.label}</div>
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">Recent applications</span>
          <Link href="/applications" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-zinc-500">No applications yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {applications.slice(0, 5).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-medium">{a.job.title}</span> · {a.job.company}
                </span>
                <span className="text-zinc-500">
                  applied {a.appliedAt ? stamp(a.appliedAt) : "–"} · posted {ago(a.job.postedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
