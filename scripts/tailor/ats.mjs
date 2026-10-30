// ATS-style keyword scoring, the way resume screeners do it: pull the
// skills and terms a job description asks for, then check which ones the
// resume contains. No AI involved, so it's free and repeatable.

// Terms screeners commonly key on. Extend freely; matching is
// case-insensitive and whole-word.
export const SKILL_TERMS = [
  // Languages
  "Python", "SQL", "Java", "Scala", "JavaScript", "TypeScript", "Go", "C#", "C++", "R", "Bash", "PowerShell", "ABAP", "PL/SQL", "T-SQL",
  // Data
  "Snowflake", "Databricks", "Spark", "PySpark", "Hadoop", "Hive", "Kafka", "Airflow", "dbt", "Informatica", "Talend", "SSIS", "Fivetran",
  "ETL", "ELT", "Data Warehouse", "Data Lake", "Lakehouse", "Data Modeling", "Dimensional Modeling", "Star Schema", "Data Pipeline", "Data Governance",
  "Data Quality", "Master Data", "MDM", "Redshift", "BigQuery", "Synapse", "Delta Lake", "Iceberg",
  // Databases
  "PostgreSQL", "MySQL", "Oracle", "SQL Server", "MongoDB", "Cassandra", "DynamoDB", "Redis", "Elasticsearch", "HANA", "Teradata",
  // BI
  "Power BI", "Tableau", "Looker", "Qlik", "DAX", "SSRS", "Excel", "Data Visualization",
  // Cloud & DevOps
  "AWS", "Azure", "GCP", "Google Cloud", "S3", "EC2", "Lambda", "Glue", "EMR", "Azure Data Factory", "ADF", "Docker", "Kubernetes", "Terraform",
  "CI/CD", "Jenkins", "GitHub Actions", "Git", "Linux", "Ansible",
  // SAP
  "SAP", "SAP Basis", "S/4HANA", "SAP ECC", "SAP BW", "BW/4HANA", "SAP FICO", "SAP MM", "SAP SD", "SAP PP", "SAP SuccessFactors", "SAP Ariba",
  "SAP Solution Manager", "SAP NetWeaver", "SAP Fiori", "SAP PI/PO", "SAP CPI", "SAP BTP", "Transport Management", "System Copy", "Kernel Upgrade",
  // CRM / enterprise
  "Salesforce", "Dynamics 365", "ServiceNow", "Workday", "CRM", "ERP", "Supply Chain",
  // ML / AI
  "Machine Learning", "Deep Learning", "NLP", "LLM", "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy",
  // Software
  "REST", "API", "Microservices", "React", "Node.js", ".NET", "Spring",
  // Practices
  "Agile", "Scrum", "Jira", "Stakeholder Management", "Requirements Gathering", "Performance Tuning", "Monitoring", "Troubleshooting", "Documentation",
  "Unit Testing", "Data Migration", "Disaster Recovery", "High Availability", "Security", "SOX", "HIPAA", "GDPR",
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

function termRegex(term) {
  // Whole-word match that also works for terms like C#, C++, .NET, CI/CD.
  return new RegExp(`(^|[^a-z0-9])${escape(term.toLowerCase())}(?=$|[^a-z0-9])`, "i");
}

export const has = (text, term) => termRegex(term).test(text.toLowerCase());

const list = (v = "") => v.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

// Terms the job asks for: dictionary terms present in the JD, plus any of
// the user's own listed skills that the JD mentions.
export function jobKeywords(description, extraTerms = []) {
  const seen = new Map();
  for (const term of [...SKILL_TERMS, ...extraTerms]) {
    const key = term.toLowerCase();
    if (!seen.has(key) && has(description, term)) seen.set(key, term);
  }
  // Drop a short term when a longer matched term contains it ("SAP" when
  // "SAP Basis" matched), so one skill isn't counted twice.
  const terms = [...seen.values()];
  return terms.filter((t) => !terms.some((o) => o !== t && o.length > t.length && has(o, t)));
}

// Score 0-100: share of the job's keywords the resume contains, with a
// bonus when the resume carries the job's title.
export function scoreResume(resume, job, answers = {}) {
  const userSkills = [...list(answers.skills), ...list(answers.certifications)];
  const keywords = jobKeywords(job.description, userSkills);
  const matched = keywords.filter((k) => has(resume, k));
  const missing = keywords.filter((k) => !has(resume, k));

  const coverage = keywords.length ? matched.length / keywords.length : 1;
  const titleWords = job.title.toLowerCase().match(/[a-z]+/g)?.filter((w) => w.length > 3) ?? [];
  const titleHit = titleWords.length ? titleWords.filter((w) => resume.toLowerCase().includes(w)).length / titleWords.length : 1;
  const score = Math.round(coverage * 85 + titleHit * 15);

  // Missing keywords the user has evidence for (listed skills or
  // certifications) may be added when tailoring; the rest may not.
  const supported = missing.filter((k) => userSkills.some((s) => s.toLowerCase() === k.toLowerCase() || has(s, k)));
  const unsupported = missing.filter((k) => !supported.includes(k));

  return { score, keywords, matched, missing, supported, unsupported };
}
