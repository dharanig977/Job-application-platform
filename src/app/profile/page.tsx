import { db } from "@/lib/db";
import { Card } from "../ui";
import { deleteAnswer, saveAnswer, saveMasterResume, saveProfile } from "./actions";

export const dynamic = "force-dynamic";

const input = "w-full rounded border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700";
const button = "rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900";

function Field({ label, name, value, placeholder }: { label: string; name: string; value: string; placeholder?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-xs text-zinc-500">{label}</span>
      <input name={name} defaultValue={value} placeholder={placeholder} className={input} />
    </label>
  );
}

export default async function ProfilePage() {
  const [profile, master, answers] = await Promise.all([
    db.profile.findUnique({ where: { id: 1 } }),
    db.resume.findFirst({ where: { isMaster: true } }),
    db.answer.findMany({ orderBy: [{ category: "asc" }, { id: "asc" }] }),
  ]);
  const p = profile ?? { fullName: "", email: "", phone: "", location: "", linkedinUrl: "", targetRoles: "", targetLocations: "", seniority: "" };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Profile</h1>

      <Card>
        <h2 className="mb-3 font-medium">About you and what you&apos;re looking for</h2>
        <form action={saveProfile} className="grid gap-3 md:grid-cols-2">
          <Field label="Full name" name="fullName" value={p.fullName} />
          <Field label="Email" name="email" value={p.email} />
          <Field label="Phone" name="phone" value={p.phone} />
          <Field label="Current location" name="location" value={p.location} />
          <Field label="LinkedIn profile URL" name="linkedinUrl" value={p.linkedinUrl} />
          <Field label="Seniority" name="seniority" value={p.seniority} placeholder="e.g. Senior, Lead" />
          <Field label="Target roles (comma-separated)" name="targetRoles" value={p.targetRoles} />
          <Field label="Target locations (comma-separated)" name="targetLocations" value={p.targetLocations} />
          <div className="md:col-span-2"><button className={button}>Save profile</button></div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-1 font-medium">Master resume</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Every tailored version starts from this. Tailoring only rewords and reorders what&apos;s here; it never adds skills you don&apos;t have.
        </p>
        <form action={saveMasterResume} className="space-y-3">
          <textarea name="content" defaultValue={master?.content ?? ""} rows={14} className={`${input} font-mono`} />
          <div className="flex flex-wrap items-center gap-3">
            <input type="file" name="file" accept=".txt,.md" className="text-sm" />
            <button className={button}>Save resume</button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-1 font-medium">Answer bank</h2>
        <p className="mb-3 text-sm text-zinc-500">
          The agent fills application-portal questions from these answers. Anything it can&apos;t match waits for you.
        </p>
        <div className="space-y-3">
          {answers.map((a) => (
            <div key={a.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
              <form action={saveAnswer} className="grid gap-2 md:grid-cols-[10rem_1fr_1fr_auto]">
                <input type="hidden" name="id" value={a.id} />
                <input name="category" defaultValue={a.category} className={input} />
                <input name="question" defaultValue={a.question} className={input} />
                <input name="answer" defaultValue={a.answer} placeholder="Your answer" className={input} />
                <button className={button}>Save</button>
              </form>
              <form action={deleteAnswer} className="mt-1">
                <input type="hidden" name="id" value={a.id} />
                <button className="text-xs text-red-600 hover:underline">Delete</button>
              </form>
            </div>
          ))}
          <form action={saveAnswer} className="grid gap-2 rounded border border-dashed border-zinc-300 p-3 md:grid-cols-[10rem_1fr_1fr_auto] dark:border-zinc-700">
            <input name="category" placeholder="Category" className={input} />
            <input name="question" placeholder="New question" className={input} />
            <input name="answer" placeholder="Your answer" className={input} />
            <button className={button}>Add</button>
          </form>
        </div>
      </Card>
    </div>
  );
}
