// The application questionnaire: what Workday, SuccessFactors and similar
// portals ask. Answers are saved in Profile.answers keyed by question id,
// and the apply agent maps each portal question onto one of these ids.

export type Question = {
  id: string;
  label: string;
  type?: "text" | "textarea" | "select" | "date" | "number";
  options?: string[];
  placeholder?: string;
  help?: string;
};

export type Section = { title: string; description?: string; questions: Question[] };

const YES_NO = ["Yes", "No"];
const DECLINE = "I don't wish to answer";

export const QUESTIONNAIRE: Section[] = [
  {
    title: "Personal details",
    questions: [
      { id: "firstName", label: "Legal first name" },
      { id: "lastName", label: "Legal last name" },
      { id: "preferredName", label: "Preferred name" },
      { id: "email", label: "Email" },
      { id: "phone", label: "Phone" },
      { id: "address", label: "Street address" },
      { id: "city", label: "City" },
      { id: "state", label: "State" },
      { id: "postalCode", label: "ZIP / postal code" },
      { id: "country", label: "Country", placeholder: "United States" },
      { id: "linkedinUrl", label: "LinkedIn profile URL" },
      { id: "websiteUrl", label: "Portfolio / GitHub URL" },
    ],
  },
  {
    title: "Jobs you want",
    description: "The job feed searches for these.",
    questions: [
      { id: "targetRoles", label: "Target job titles", type: "textarea", placeholder: "Data Engineer, SAP Basis Consultant, ..." , help: "Comma-separated." },
      { id: "keywords", label: "Must-have keywords", placeholder: "Snowflake, SAP, Python", help: "Optional. Comma-separated." },
      { id: "excludeKeywords", label: "Skip jobs mentioning", placeholder: "Clearance required, Senior Director", help: "Optional. Comma-separated." },
      { id: "targetLocations", label: "Target locations", placeholder: "Remote US, Dallas TX" },
      { id: "workplaceType", label: "Workplace", type: "select", options: ["Any", "Remote", "Hybrid", "On-site"] },
      { id: "employmentType", label: "Employment type", type: "select", options: ["Any", "Full-time", "Contract (W2)", "Contract (C2C)", "Contract to hire", "Part-time"] },
      { id: "seniority", label: "Seniority", type: "select", options: ["Entry", "Mid", "Senior", "Lead", "Manager", "Director"] },
    ],
  },
  {
    title: "Pay and availability",
    questions: [
      { id: "desiredSalary", label: "Desired annual salary (USD)", type: "number" },
      { id: "minimumSalary", label: "Minimum annual salary (USD)", type: "number", help: "Jobs paying less are skipped when pay is listed." },
      { id: "hourlyRate", label: "Desired hourly rate for contracts (USD)", type: "number" },
      { id: "startDate", label: "Earliest start date", type: "date" },
      { id: "noticePeriod", label: "Notice period", type: "select", options: ["Immediately", "1 week", "2 weeks", "3 weeks", "1 month", "2+ months"] },
      { id: "willingToRelocate", label: "Willing to relocate?", type: "select", options: YES_NO },
      { id: "willingToTravel", label: "Willing to travel", type: "select", options: ["No travel", "Up to 25%", "Up to 50%", "Up to 75%", "100%"] },
    ],
  },
  {
    title: "Work authorization",
    questions: [
      { id: "authorizedUS", label: "Are you legally authorized to work in the United States?", type: "select", options: YES_NO },
      { id: "sponsorshipNow", label: "Do you now require visa sponsorship (e.g. H-1B)?", type: "select", options: YES_NO },
      { id: "sponsorshipFuture", label: "Will you in the future require visa sponsorship?", type: "select", options: YES_NO },
      { id: "visaStatus", label: "Current work status", type: "select", options: ["US Citizen", "Green Card", "H-1B", "H-1B transfer", "H-4 EAD", "L-2 EAD", "F-1 OPT", "F-1 STEM OPT", "TN", "GC EAD", "Other"] },
      { id: "visaExpiry", label: "Visa / EAD expiry date", type: "date", help: "Leave blank if not applicable." },
      { id: "citizenship", label: "Country of citizenship (nationality)" },
      { id: "clearance", label: "Security clearance", type: "select", options: ["None", "Public Trust", "Secret", "Top Secret", "TS/SCI"] },
    ],
  },
  {
    title: "Experience and education",
    questions: [
      { id: "yearsExperience", label: "Total years of experience", type: "number" },
      { id: "currentEmployer", label: "Current / most recent employer" },
      { id: "currentTitle", label: "Current / most recent job title" },
      { id: "highestDegree", label: "Highest degree", type: "select", options: ["High school", "Associate", "Bachelor's", "Master's", "MBA", "PhD"] },
      { id: "school", label: "School / university" },
      { id: "fieldOfStudy", label: "Field of study" },
      { id: "graduationYear", label: "Graduation year", type: "number" },
      { id: "certifications", label: "Certifications", type: "textarea", placeholder: "SAP Certified Technology Associate, AWS Solutions Architect, ..." },
      { id: "skills", label: "Skills you genuinely have", type: "textarea", help: "Resume tailoring only adds keywords from your resume or this list." },
    ],
  },
  {
    title: "Standard screening questions",
    questions: [
      { id: "over18", label: "Are you 18 years of age or older?", type: "select", options: YES_NO },
      { id: "backgroundCheck", label: "Willing to undergo a background check?", type: "select", options: YES_NO },
      { id: "drugTest", label: "Willing to undergo a drug screening?", type: "select", options: YES_NO },
      { id: "nonCompete", label: "Bound by a non-compete or non-solicit agreement?", type: "select", options: YES_NO },
      { id: "felony", label: "Have you been convicted of a felony?", type: "select", options: [...YES_NO, DECLINE] },
      { id: "howHeard", label: "How did you hear about us? (default)", placeholder: "Company website" },
      { id: "coverLetter", label: "Default cover letter", type: "textarea", help: "Optional. The agent adapts it per job when a portal asks." },
    ],
  },
  {
    title: "Voluntary self-identification (EEO)",
    description: "US employers ask these optionally. Answers never affect eligibility. Choose \"I don't wish to answer\" for any of them.",
    questions: [
      { id: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Non-binary", DECLINE] },
      { id: "hispanicLatino", label: "Are you Hispanic or Latino?", type: "select", options: [...YES_NO, DECLINE] },
      {
        id: "race", label: "Race / ethnicity", type: "select",
        options: ["American Indian or Alaska Native", "Asian", "Black or African American", "Native Hawaiian or Other Pacific Islander", "White", "Two or More Races", DECLINE],
      },
      {
        id: "veteran", label: "Veteran status", type: "select",
        options: ["I am not a protected veteran", "I identify as one or more of the classifications of protected veteran", DECLINE],
      },
      {
        id: "disability", label: "Disability status", type: "select",
        options: ["Yes, I have a disability (or previously had a disability)", "No, I do not have a disability", DECLINE],
      },
    ],
  },
  {
    title: "Agent settings",
    questions: [
      {
        id: "watchBoards", label: "Company job boards to watch", type: "textarea",
        placeholder: "greenhouse:stripe\nlever:palantir\nashby:ramp",
        help: "One per line. These are checked every 5 minutes and show jobs the moment a company posts them. The board name is in the company's careers URL (boards.greenhouse.io/NAME, jobs.lever.co/NAME, jobs.ashbyhq.com/NAME).",
      },
      { id: "autoSubmit", label: "Submit applications automatically?", type: "select", options: ["Yes", "No, ask me first"], help: "When off, filled-in applications wait for your approval." },
      { id: "dailyLimit", label: "Maximum applications per day", type: "number", placeholder: "25" },
      { id: "minAtsScore", label: "Minimum ATS score to apply", type: "number", placeholder: "75", help: "Jobs whose tailored resume scores below this are skipped." },
    ],
  },
];

export const QUESTION_IDS = QUESTIONNAIRE.flatMap((s) => s.questions.map((q) => q.id));

export type Answers = Record<string, string>;

export function completion(answers: Answers) {
  const answered = QUESTION_IDS.filter((id) => (answers[id] ?? "").trim() !== "").length;
  return { answered, total: QUESTION_IDS.length };
}
