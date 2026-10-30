import { db } from "@/lib/db";
import { QUESTIONNAIRE, completion, type Answers, type Question } from "@/lib/questionnaire";
import { SaveForm } from "../save-form";
import { Card } from "../ui";
import { deleteAnswer, saveAnswer, saveQuestionnaire, uploadResume } from "./actions";

export const dynamic = "force-dynamic";

const input = "w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const button = "rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900";

function Field({ q, value }: { q: Question; value: string }) {
  const control =
    q.type === "select" ? (
      <select name={q.id} defaultValue={value} className={input}>
        <option value="">Select…</option>
        {q.options!.map((o) => <option key={o}>{o}</option>)}
      </select>
    ) : q.type === "textarea" ? (
      <textarea name={q.id} defaultValue={value} placeholder={q.placeholder} rows={3} className={input} />
    ) : (
      <input name={q.id} type={q.type ?? "text"} defaultValue={value} placeholder={q.placeholder} className={input} />
    );

  return (
    <label className={`block text-sm ${q.type === "textarea" ? "md:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{q.label}</span>
      {control}
      {q.help && <span className="mt-1 block text-xs text-zinc-500">{q.help}</span>}
    </label>
  );
}

export default async function ProfilePage() {
  const [profile, master, extras] = await Promise.all([
    db.profile.findUnique({ where: { id: 1 } }),
    db.resume.findFirst({ where: { isMaster: true }, select: { id: true, fileName: true, content: true } }),
    db.answer.findMany({ orderBy: [{ category: "asc" }, { id: "asc" }] }),
  ]);
  const answers = (profile?.answers ?? {}) as Answers;
  const { answered, total } = completion(answers);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-xl font-semibold">Profile</h1>
        <span className="text-sm text-zinc-500">{answered} of {total} questions answered</span>
      </div>

      <Card>
        <h2 className="mb-1 font-medium">Resume</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Upload your master resume (PDF or Word). Every tailored version starts from it, and tailoring never adds skills you don&apos;t have.
        </p>
        {master?.fileName && (
          <p className="mb-3 text-sm">
            Current: <a href={`/api/resume/${master.id}`} className="text-blue-600 hover:underline">{master.fileName}</a>
            <span className="text-zinc-500"> · {master.content.split(/\s+/).filter(Boolean).length} words read</span>
          </p>
        )}
        <form action={uploadResume} className="flex flex-wrap items-center gap-3">
          <input type="file" name="file" accept=".pdf,.docx,.txt" required className="text-sm" />
          <button className={button}>{master?.fileName ? "Replace resume" : "Upload resume"}</button>
        </form>
        {master?.content && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-blue-600">Text the agent reads</summary>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-3 text-xs dark:bg-zinc-900">{master.content}</pre>
          </details>
        )}
      </Card>

      <SaveForm
        action={saveQuestionnaire}
        className="space-y-6"
        footerClassName="sticky bottom-0 -mx-4 border-t border-zinc-200 bg-[var(--background)] px-4 py-3 dark:border-zinc-800"
        submitLabel="Save all answers"
        savedLabel="All answers saved"
      >
        {QUESTIONNAIRE.map((section) => (
          <Card key={section.title}>
            <h2 className="font-medium">{section.title}</h2>
            {section.description && <p className="mt-1 text-sm text-zinc-500">{section.description}</p>}
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {section.questions.map((q) => <Field key={q.id} q={q} value={answers[q.id] ?? ""} />)}
            </div>
          </Card>
        ))}
      </SaveForm>

      <Card>
        <h2 className="mb-1 font-medium">Other questions</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Portal questions the form above doesn&apos;t cover. When the agent meets a new one it can&apos;t answer, it adds it here for you.
        </p>
        <div className="space-y-3">
          {extras.map((a) => (
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
