# Job Agent

A personal job-application agent. It finds new job posts within minutes, scores and tailors your resume against each job description the way an ATS screener would (truthfully, without inventing skills), fills in company application portals from your answer bank, and logs every application.

## Build plan

1. **Profile and tracker screens** (this step): profile, master resume, answer bank, jobs tracker by category and "posted within" window, applications log.
2. **Job feed**: polls job APIs (JSearch for Google Jobs/LinkedIn/Indeed listings, Adzuna, Greenhouse/Lever/Ashby boards) every few minutes, removes duplicates, records posted and discovered times.
3. **AI match and tailoring**: ATS-style score, missing keywords, tailored resume versions.
4. **Apply assistant**: a browser agent that fills Workday, SuccessFactors and other portals from the answer bank; you approve each submission.

LinkedIn and Indeed are used only as listing sources through job APIs. The agent never signs into those accounts, and applications go through each company's own portal.

## Running locally

```bash
cp .env.example .env
npm install
npm run db:migrate   # creates prisma/dev.db
npm run db:seed      # optional sample data
npm run dev
```

Open http://localhost:3000. Your data lives in `prisma/dev.db`, which is git-ignored, so your resume and answers never get committed.
