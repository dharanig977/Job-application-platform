import { db } from "@/lib/db";
import { duration, stamp } from "@/lib/time";
import { Badge, Card } from "../ui";
import { approveApplication, skipApplication } from "./actions";

const ACTIONS: Record<string, string> = {
  pending_approval: "Approve and submit",
  needs_you: "Retry",
  failed: "Retry",
};

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const applications = await db.application.findMany({
    include: { job: true, resume: true, logs: { orderBy: { at: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Applications</h1>
      {applications.length === 0 && <p className="text-sm text-zinc-500">No applications yet.</p>}
      {applications.map((a) => (
        <Card key={a.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-medium">{a.job.title}</div>
              <div className="text-sm text-zinc-500">{a.job.company} · {a.portal || a.job.source}</div>
            </div>
            <div className="flex items-center gap-2">
              {ACTIONS[a.status] && (
                <>
                  <form action={approveApplication}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="rounded bg-zinc-900 px-2 py-1 text-xs text-white dark:bg-white dark:text-zinc-900">{ACTIONS[a.status]}</button>
                  </form>
                  <form action={skipApplication}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs text-zinc-500 hover:underline">Skip</button>
                  </form>
                </>
              )}
              <Badge status={a.status} />
            </div>
          </div>
          {a.job.note && a.status !== "submitted" && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">{a.job.note}</p>}

          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div><dt className="text-xs text-zinc-500">Posted</dt><dd>{stamp(a.job.postedAt)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Applied</dt><dd>{a.appliedAt ? stamp(a.appliedAt) : "–"}</dd></div>
            <div><dt className="text-xs text-zinc-500">Time to apply</dt><dd>{a.appliedAt ? duration(a.job.postedAt, a.appliedAt) : "–"}</dd></div>
            <div>
              <dt className="text-xs text-zinc-500">Resume used</dt>
              <dd>{a.resume ? `${a.resume.label}${a.resume.atsScore ? ` (ATS ${a.resume.atsScore})` : ""}` : "–"}</dd>
            </div>
          </dl>

          {a.logs.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-blue-600">Application log ({a.logs.length})</summary>
              <ol className="mt-2 space-y-1 border-l border-zinc-200 pl-4 text-sm dark:border-zinc-800">
                {a.logs.map((l) => (
                  <li key={l.id}><span className="font-mono text-xs text-zinc-500">{stamp(l.at)}</span> {l.message}</li>
                ))}
              </ol>
            </details>
          )}
        </Card>
      ))}
    </div>
  );
}
