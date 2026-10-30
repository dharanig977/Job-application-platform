# Job Agent setup guide (online only, about 10 minutes)

You need: your GitHub account (already connected), Neon (the database is already created for you), and Vercel (already used for the CRM). Nothing is installed on your computer.

## 1. Copy the two database connection strings from Neon

1. Open the Neon project **job-agent**: [console.neon.tech/app/projects/old-pine-61281798](https://console.neon.tech/app/projects/old-pine-61281798).
2. Click **Connect**. Leave database `neondb` and role `neondb_owner`.
3. With **Connection pooling ON**, copy the string. This is `DATABASE_URL`.
4. Turn **Connection pooling OFF** and copy the string again. This is `DIRECT_URL` (the same string without `-pooler` in the host).

## 2. Deploy on Vercel (a new Vercel project)

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the `Job-application-platform` repository.
2. Leave **Root Directory** as the repository root. Vercel detects Next.js.
3. **Environment Variables:**

| Name | Value |
|---|---|
| `DATABASE_URL` | the pooled string from step 1 |
| `DIRECT_URL` | the direct string from step 1 |
| `APP_PASSWORD` | a long password you choose; it protects the whole site |

4. Click **Deploy**. The build creates the database tables on its own.

## 3. Sign in and fill in your profile

1. Open the Vercel link. Your browser asks for a username and password: type any username and your `APP_PASSWORD`.
2. Go to **Profile**, upload your resume, answer the questionnaire and click **Save all answers**.

## 4. Turn on the job feed

The feed runs on GitHub Actions: company boards every 5 minutes, and the LinkedIn / Indeed / Google Jobs listings every 6 hours (one JSearch request per run, which fits JSearch's free plan).

1. In **Profile**, fill in **Target job titles** (the feed searches for these) and, under **Agent settings**, any **Company job boards to watch**.
2. Get a JSearch key (covers LinkedIn, Indeed, Google Jobs, Dice and more): sign up at [rapidapi.com](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch), subscribe to the free **Basic** plan, and copy your **X-RapidAPI-Key**. For more frequent checks later, move to a paid plan and change `2 */6 * * *` in `.github/workflows/job-feed.yml`.
3. Optional, free: an Adzuna key from [developer.adzuna.com](https://developer.adzuna.com) (App ID and App Key).
4. GitHub → the repository → **Settings → Secrets and variables → Actions → New repository secret**, and add:

| Name | Value |
|---|---|
| `DATABASE_URL` | the **direct** Neon string (pooling off) from step 1 |
| `JSEARCH_API_KEY` | your RapidAPI key |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | optional |

5. GitHub → **Actions → Job feed → Run workflow** to try it once. New jobs appear on the **Jobs** page, and the dashboard shows when the feed last ran.

## 5. Turn on resume tailoring (uses your Claude Max plan)

The ATS score and keyword check are plain code and always run. Rewriting the resume uses Claude Code signed in with your Claude plan, so there is no separate API bill; it counts toward your plan's usage limits.

1. On your computer, install Claude Code once: `npm install -g @anthropic-ai/claude-code` (needs Node.js), or follow [the Claude Code install page](https://docs.claude.com/en/docs/claude-code/setup).
2. Run `claude setup-token`, sign in with the account that has your Max plan, and copy the token it prints.
3. Add it as a GitHub secret named `CLAUDE_CODE_OAUTH_TOKEN` (same place as step 4).
4. In **Profile → Agent settings**, set **Minimum ATS score** (default 75) and **Maximum applications per day** (default 25; it also caps rewrites per day).

Each job then shows its ATS score on the **Jobs** page. Open a job to see the keywords matched, the ones added from your skills list, the ones you don't have (never added), and the exact resume version used.

## 6. Turn on the apply agent

The apply agent runs on GitHub Actions every 10 minutes. Each run takes up to 2 queued jobs (best ATS score first), opens the posting in a headless browser, and has Claude fill in the company's portal (Workday, SuccessFactors, Greenhouse, Lever, iCIMS and others) from your profile, uploading the resume version chosen for that job. It uses the same `CLAUDE_CODE_OAUTH_TOKEN` as step 5, so it runs on your Max plan.

1. Make up a **new password used only for job portals** (many portals, Workday especially, make you create an account per company). Don't reuse a password from anywhere else.
2. Add it as a GitHub secret named `PORTAL_PASSWORD`.
3. Make sure **Email** in your profile is the address you want portal accounts and recruiter emails to go to.
4. In **Agent settings**, **Submit applications automatically?** is Yes unless you change it. With "No, ask me first", the agent fills everything in and stops at the final step; you click **Approve and submit** on the Applications page.

What still needs you, shown at the top of the dashboard:
- **New questions**: when a portal asks something your profile doesn't cover, the agent stops, adds the question under **Profile → Other questions**, and marks the application "needs you". Answer it and click **Retry**.
- **CAPTCHAs and email verification codes**: the agent can't pass these, so the application is marked "needs you" with a link to the posting to finish yourself.
- **LinkedIn / Indeed-only postings**: never applied through those sites; marked "needs you".

## If something goes wrong

| You see | Do this |
|---|---|
| "Server setup: APP_PASSWORD is not set." | Add `APP_PASSWORD` in Vercel → Settings → Environment Variables, then **Redeploy**. |
| Build fails at `prisma migrate deploy` | `DIRECT_URL` is missing or wrong. Re-copy it from Neon with pooling off. |
| The dashboard says the feed hasn't run | Check GitHub → **Actions → Job feed** for a red run; the log names the problem. Scheduled runs only start once the code is on the `main` branch. |
| A source shows an error in the run log | A wrong board name gives 404; a JSearch 403 means the key or plan is wrong. |
| A job's note says "Tailoring failed" | Check `CLAUDE_CODE_OAUTH_TOKEN`; tokens from `claude setup-token` last about a year. |
| Applications show "failed" | Open it on the Applications page: the log shows the last step the agent reached and the error. **Retry** queues it again. |
| A page shows "Application error" | Vercel → the project → **Logs** shows the real error. |
