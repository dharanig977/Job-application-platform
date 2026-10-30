import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ago, stamp } from "@/lib/time";
import { Badge, Card } from "../../ui";

export const dynamic = "force-dynamic";

type Ats = { before: number; resumeId: number; matched: string[]; missing: string[]; supported: string[]; unsupported: string[] };

function Chips({ label, items, tone }: { label: string; items: string[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-xs text-zinc-500">{label}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((k) => <span key={k} className={`rounded px-2 py-0.5 text-xs ${tone}`}>{k}</span>)}
      </div>
    </div>
  );
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.job.findUnique({ where: { id: Number(id) } });
  if (!job) notFound();

  const ats = job.ats as Ats | null;
  const resume = ats ? await db.resume.findUnique({ where: { id: ats.resumeId } }) : null;

  return (
    <div className="space-y-4">
      <Link href="/jobs" className="text-sm text-blue-600 hover:underline">← Jobs</Link>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{job.title}</h1>
          <div className="text-sm text-zinc-500">
            {job.company} · {job.location} · {job.source} · posted {ago(job.postedAt)} ({stamp(job.postedAt)})
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={job.status} />
          <a href={job.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Open posting</a>
        </div>
      </div>

      {job.note && <Card className="border-amber-300 text-sm dark:border-amber-800">{job.note}</Card>}

      {ats ? (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-4">
            <div><span className="text-3xl font-semibold">{job.atsScore}</span><span className="text-zinc-500"> / 100 ATS score</span></div>
            {ats.before !== job.atsScore && <span className="text-sm text-zinc-500">master resume scored {ats.before}</span>}
          </div>
          <Chips label="Keywords your resume has" items={ats.matched} tone="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" />
          <Chips label="Still missing, but you list them as skills" items={ats.supported} tone="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" />
          <Chips label="Missing, and not in your skills (never added)" items={ats.unsupported} tone="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" />
        </Card>
      ) : (
        <Card className="text-sm text-zinc-500">Not scored yet. The agent scores new jobs a few minutes after the feed finds them.</Card>
      )}

      {resume && (
        <Card>
          <details>
            <summary className="cursor-pointer text-sm font-medium">
              Resume used: {resume.label}{resume.isMaster ? " (master, no changes needed)" : ""}
            </summary>
            <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap text-xs">{resume.content}</pre>
          </details>
        </Card>
      )}

      <Card>
        <details>
          <summary className="cursor-pointer text-sm font-medium">Job description</summary>
          <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap text-xs">{job.description}</pre>
        </details>
      </Card>
    </div>
  );
}
