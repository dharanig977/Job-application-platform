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

## If something goes wrong

| You see | Do this |
|---|---|
| "Server setup: APP_PASSWORD is not set." | Add `APP_PASSWORD` in Vercel → Settings → Environment Variables, then **Redeploy**. |
| Build fails at `prisma migrate deploy` | `DIRECT_URL` is missing or wrong. Re-copy it from Neon with pooling off. |
| A page shows "Application error" | Vercel → the project → **Logs** shows the real error. |
