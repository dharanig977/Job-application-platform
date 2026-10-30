# Job Agent

A personal job-application agent. It finds new job posts within minutes, scores and tailors your resume against each job description the way an ATS screener would (truthfully, without inventing skills), fills in company application portals from your answer bank, and logs every application.

## Build plan

1. **Profile and tracker screens** (this step): resume upload, the full Workday/SuccessFactors-style questionnaire, jobs tracker by category and "posted within" window, applications log.
2. **Job feed**: Greenhouse/Lever/Ashby boards every 5 minutes; JSearch (LinkedIn, Indeed, Google Jobs listings) and Adzuna every 6 hours on their free tiers.
3. **ATS score and tailoring**: keyword scoring in plain code; resume rewrites through Claude Code on your Claude plan. Only keywords backed by your resume or listed skills are ever added.
4. **Apply assistant**: a browser agent that fills Workday, SuccessFactors and other portals from the answer bank; you approve each submission.

LinkedIn and Indeed are used only as listing sources through job APIs. The agent never signs into those accounts, and applications go through each company's own portal.

## Deploying

See [docs/setup_guide.md](docs/setup_guide.md): Neon Postgres for data, Vercel for the app, one `APP_PASSWORD` protecting every page.

## Running locally

```bash
cp .env.example .env   # point DATABASE_URL and DIRECT_URL at any Postgres
npm install
npx prisma migrate deploy
npm run db:seed        # optional sample jobs and applications
npm run dev
```

Your resume and answers live in the database, never in the repository.
