// Sample data so the screens have something to show before the real
// job feed (step 2) exists. Run with: npm run db:seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const minutesAgo = (m) => new Date(Date.now() - m * 60_000);

const jobs = [
  ["LinkedIn", "Senior Data Engineer", "Northwind Analytics", "Remote, US", "Data Engineering", 3],
  ["Indeed", "SAP Basis Consultant", "Contoso Manufacturing", "Dallas, TX", "SAP", 8],
  ["Greenhouse", "Analytics Engineer", "Fabrikam", "New York, NY", "Data Engineering", 45],
  ["Dice", "Snowflake Developer", "Tailspin Toys", "Remote, US", "Data Engineering", 60 * 6],
  ["Robert Half", "Business Intelligence Analyst", "Adventure Works", "Chicago, IL", "Analytics", 60 * 13],
  ["Google Jobs", "Power BI Developer", "Litware", "Austin, TX", "Analytics", 60 * 20],
  ["LinkedIn", "Cloud Data Architect", "Proseware", "Seattle, WA", "Cloud", 60 * 30],
  ["Lever", "Salesforce CRM Analyst", "Wide World Importers", "Remote, US", "CRM", 60 * 24 * 4],
  ["Indeed", "ETL Developer", "Blue Yonder Airlines", "Atlanta, GA", "Data Engineering", 60 * 24 * 12],
];

async function main() {
  await prisma.applicationLog.deleteMany();
  await prisma.application.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.job.deleteMany();
  await prisma.answer.deleteMany();

  await prisma.profile.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, fullName: "Gopi", targetRoles: "Data Engineer, SAP Consultant", targetLocations: "Remote, US" },
  });

  const master = await prisma.resume.create({
    data: { label: "Master resume", isMaster: true, content: "Paste your master resume on the Profile page." },
  });

  const created = [];
  for (const [i, [source, title, company, location, category, mins]] of jobs.entries()) {
    created.push(
      await prisma.job.create({
        data: {
          source, title, company, location, category,
          externalId: `sample-${i}`,
          url: "https://example.com/job/" + i,
          description: `Sample listing for ${title} at ${company}.`,
          postedAt: minutesAgo(mins),
          discoveredAt: minutesAgo(Math.max(mins - 2, 0)),
        },
      }),
    );
  }

  // Two sample applications to fill the applied log.
  for (const [job, portal, delay] of [[created[2], "Greenhouse", 12], [created[4], "Workday", 25]]) {
    const tailored = await prisma.resume.create({
      data: { label: `${job.company} – ${job.title}`, content: "Tailored sample.", jobId: job.id, atsScore: 86 },
    });
    const appliedAt = new Date(job.postedAt.getTime() + delay * 60_000);
    await prisma.job.update({ where: { id: job.id }, data: { status: "applied" } });
    await prisma.application.create({
      data: {
        jobId: job.id, resumeId: tailored.id, portal, status: "submitted", appliedAt,
        logs: {
          create: [
            { at: new Date(appliedAt.getTime() - 4 * 60_000), message: "Scored master resume against JD: 71" },
            { at: new Date(appliedAt.getTime() - 3 * 60_000), message: "Created tailored resume: ATS score 86" },
            { at: new Date(appliedAt.getTime() - 2 * 60_000), message: `Filled ${portal} form from answer bank` },
            { at: appliedAt, message: "Approved by you and submitted" },
          ],
        },
      },
    });
  }
  void master;

  await prisma.answer.createMany({
    data: [
      { category: "Eligibility", question: "Are you legally authorized to work in the US?", answer: "" },
      { category: "Eligibility", question: "Will you now or in the future require visa sponsorship?", answer: "" },
      { category: "Compensation", question: "Desired salary", answer: "" },
      { category: "Availability", question: "Notice period / earliest start date", answer: "" },
      { category: "Preferences", question: "Willing to relocate?", answer: "" },
    ],
  });
}

main().finally(() => prisma.$disconnect());
