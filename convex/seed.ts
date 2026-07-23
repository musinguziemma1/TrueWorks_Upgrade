import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function orderNumber(index: number): string {
  return `TW-${10000 + index}`;
}

const categories = [
  {
    name: "Hospital & Healthcare",
    slug: "hospital-healthcare",
    description: "Dashboards and trackers for hospitals, clinics, and healthcare NGOs.",
    industry: "Healthcare",
    icon: "Hospital",
  },
  {
    name: "Finance & Accounting",
    slug: "finance-accounting",
    description: "Financial models, budgeting templates, and accounting dashboards.",
    industry: "Finance",
    icon: "BarChart3",
  },
  {
    name: "NGO & Grants",
    slug: "ngo-grants",
    description: "Grant tracking, donor management, and program reporting tools.",
    industry: "Nonprofit",
    icon: "HeartHand",
  },
  {
    name: "Education & E-Learning",
    slug: "education-elearning",
    description: "Course trackers, student dashboards, and learning management tools.",
    industry: "Education",
    icon: "GraduationCap",
  },
  {
    name: "Project Management",
    slug: "project-management",
    description: "Project trackers, task managers, and team collaboration dashboards.",
    industry: "Operations",
    icon: "Kanban",
  },
  {
    name: "Sales & CRM",
    slug: "sales-crm",
    description: "Sales pipelines, CRM dashboards, and lead tracking templates.",
    industry: "Sales",
    icon: "Users",
  },
];

const productsSeed = [
  {
    name: "Hospital KPI Dashboard",
    sku: "TW-HKD-001",
    shortDescription: "A complete KPI dashboard for tracking hospital performance metrics.",
    description:
      "Track patient admissions, bed occupancy, surgery schedules, staff utilization, and financial performance in one interactive dashboard. Built for hospital administrators and department heads.",
    price: 49.99,
    salePrice: 39.99,
    category: "Hospital & Healthcare",
    industry: "Healthcare",
    fileType: "Excel / Google Sheets",
    tags: ["dashboard", "healthcare", "kpi", "hospital"],
    galleryImages: [
      "https://placehold.co/800x600/2563eb/ffffff?text=Hospital+Dashboard+1",
      "https://placehold.co/800x600/1d4ed8/ffffff?text=Hospital+Dashboard+2",
    ],
    thumbnail: "https://placehold.co/400x300/2563eb/ffffff?text=Hospital+KPI",
    downloadableFile: "https://placehold.co/10x10/transparent/transparent",
    fileSize: "2.4 MB",
    version: "1.2.0",
    changelog: "Added monthly comparison charts and export to PDF.",
    downloadLimit: 5,
    downloadExpiry: 365,
    seoTitle: "Hospital KPI Dashboard Template",
    seoDescription: "Monitor hospital performance with our comprehensive KPI dashboard template.",
    faqs: [
      { question: "Is this compatible with Google Sheets?", answer: "Yes, it works in both Excel and Google Sheets." },
      { question: "Can I customize the KPIs?", answer: "Absolutely. All formulas and metrics are fully editable." },
    ],
    demoVideo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    featured: true,
    status: "published" as const,
    totalSales: 42,
    rating: 4.8,
    reviewCount: 12,
  },
  {
    name: "Financial Model Bundle",
    sku: "TW-FMB-002",
    shortDescription: "A bundle of financial models for startups and SMEs.",
    description:
      "Includes 3-statement financial models, valuation templates, cap tables, and scenario planning tools. Perfect for founders, CFOs, and financial analysts.",
    price: 79.99,
    salePrice: 59.99,
    category: "Finance & Accounting",
    industry: "Finance",
    fileType: "Excel",
    tags: ["finance", "model", "startup", "valuation"],
    galleryImages: [
      "https://placehold.co/800x600/16a34a/ffffff?text=Finance+Model+1",
      "https://placehold.co/800x600/15803d/ffffff?text=Finance+Model+2",
    ],
    thumbnail: "https://placehold.co/400x300/16a34a/ffffff?text=Finance+Bundle",
    downloadableFile: "https://placehold.co/10x10/transparent/transparent",
    fileSize: "5.1 MB",
    version: "2.0.0",
    changelog: "New DCF valuation sheet and sensitivity analysis.",
    downloadLimit: 10,
    downloadExpiry: 365,
    seoTitle: "Financial Model Bundle for Startups",
    seoDescription: "Complete financial modeling bundle for startups and small businesses.",
    faqs: [
      { question: "Do I need advanced Excel skills?", answer: "Basic Excel knowledge is sufficient; instructions are included." },
      { question: "Are macros used?", answer: "No macros. All formulas are standard Excel functions." },
    ],
    demoVideo: undefined,
    featured: true,
    status: "published" as const,
    totalSales: 85,
    rating: 4.7,
    reviewCount: 24,
  },
  {
    name: "NGO Grant Tracker",
    sku: "TW-NGT-003",
    shortDescription: "Track grants, donors, and reporting deadlines.",
    description:
      "Manage your grant pipeline from application to closeout. Track deadlines, deliverables, budgets, and donor communications in a single dashboard.",
    price: 39.99,
    salePrice: undefined,
    category: "NGO & Grants",
    industry: "Nonprofit",
    fileType: "Google Sheets",
    tags: ["ngo", "grants", "donor", "reporting"],
    galleryImages: [
      "https://placehold.co/800x600/db2777/ffffff?text=Grant+Tracker+1",
      "https://placehold.co/800x600/be185d/ffffff?text=Grant+Tracker+2",
    ],
    thumbnail: "https://placehold.co/400x300/db2777/ffffff?text=Grant+Tracker",
    downloadableFile: "https://placehold.co/10x10/transparent/transparent",
    fileSize: "1.8 MB",
    version: "1.0.0",
    changelog: "Initial release.",
    downloadLimit: 5,
    downloadExpiry: 365,
    seoTitle: "NGO Grant Tracker Template",
    seoDescription: "Track grants, donors, and deadlines with this NGO grant tracker.",
    faqs: [
      { question: "Can multiple team members use it?", answer: "Yes, it is designed for shared Google Sheets use." },
      { question: "Does it track donor history?", answer: "Yes, donor interaction history is included." },
    ],
    demoVideo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    featured: false,
    status: "published" as const,
    totalSales: 31,
    rating: 4.5,
    reviewCount: 8,
  },
  {
    name: "Student Progress Dashboard",
    sku: "TW-SPD-004",
    shortDescription: "Monitor student attendance, grades, and progress.",
    description:
      "Designed for teachers and school administrators. Track attendance, assignment scores, grade trends, and parent communication logs.",
    price: 29.99,
    salePrice: 24.99,
    category: "Education & E-Learning",
    industry: "Education",
    fileType: "Google Sheets",
    tags: ["education", "students", "dashboard", "grades"],
    galleryImages: [
      "https://placehold.co/800x600/ca8a04/ffffff?text=Student+Dashboard+1",
      "https://placehold.co/800x600/a16207/ffffff?text=Student+Dashboard+2",
    ],
    thumbnail: "https://placehold.co/400x300/ca8a04/ffffff?text=Student+Progress",
    downloadableFile: "https://placehold.co/10x10/transparent/transparent",
    fileSize: "1.2 MB",
    version: "1.1.0",
    changelog: "Added parent communication log.",
    downloadLimit: 5,
    downloadExpiry: 365,
    seoTitle: "Student Progress Dashboard",
    seoDescription: "Track student attendance, grades, and progress with this dashboard.",
    faqs: [
      { question: "How many students can it handle?", answer: "It scales to hundreds of students per sheet." },
      { question: "Is it FERPA compliant?", answer: "The template itself does not store data; compliance depends on your storage practices." },
    ],
    demoVideo: undefined,
    featured: false,
    status: "published" as const,
    totalSales: 56,
    rating: 4.6,
    reviewCount: 15,
  },
  {
    name: "Project Portfolio Tracker",
    sku: "TW-PPT-005",
    shortDescription: "Track multiple projects, timelines, and budgets.",
    description:
      "A portfolio-level project tracker with Gantt-style timelines, budget vs actuals, risk registers, and resource allocation.",
    price: 44.99,
    salePrice: undefined,
    category: "Project Management",
    industry: "Operations",
    fileType: "Excel",
    tags: ["project", "portfolio", "timeline", "budget"],
    galleryImages: [
      "https://placehold.co/800x600/7c3aed/ffffff?text=Portfolio+Tracker+1",
      "https://placehold.co/800x600/6d28d9/ffffff?text=Portfolio+Tracker+2",
    ],
    thumbnail: "https://placehold.co/400x300/7c3aed/ffffff?text=Portfolio+Tracker",
    downloadableFile: "https://placehold.co/10x10/transparent/transparent",
    fileSize: "3.0 MB",
    version: "1.3.0",
    changelog: "Added resource allocation view.",
    downloadLimit: 5,
    downloadExpiry: 365,
    seoTitle: "Project Portfolio Tracker",
    seoDescription: "Track multiple projects, timelines, and budgets in one template.",
    faqs: [
      { question: "Does it include Gantt charts?", answer: "Yes, a simplified Gantt timeline is included." },
      { question: "Can I track portfolio risks?", answer: "Yes, a risk register is built in." },
    ],
    demoVideo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    featured: true,
    status: "published" as const,
    totalSales: 38,
    rating: 4.4,
    reviewCount: 9,
  },
  {
    name: "Sales Pipeline CRM",
    sku: "TW-SPC-006",
    shortDescription: "Manage leads, deals, and sales activities.",
    description:
      "A lightweight CRM for small sales teams. Track leads through your pipeline, forecast revenue, and log activities and follow-ups.",
    price: 34.99,
    salePrice: 29.99,
    category: "Sales & CRM",
    industry: "Sales",
    fileType: "Google Sheets",
    tags: ["sales", "crm", "pipeline", "leads"],
    galleryImages: [
      "https://placehold.co/800x600/ea580c/ffffff?text=Sales+CRM+1",
      "https://placehold.co/800x600/c2410c/ffffff?text=Sales+CRM+2",
    ],
    thumbnail: "https://placehold.co/400x300/ea580c/ffffff?text=Sales+Pipeline",
    downloadableFile: "https://placehold.co/10x10/transparent/transparent",
    fileSize: "1.5 MB",
    version: "1.0.0",
    changelog: "Initial release.",
    downloadLimit: 5,
    downloadExpiry: 365,
    seoTitle: "Sales Pipeline CRM Template",
    seoDescription: "Manage leads and deals with this sales pipeline CRM template.",
    faqs: [
      { question: "Can I integrate with email?", answer: "Direct email integration is not included, but activity logging is." },
      { question: "Is forecasting automated?", answer: "Yes, weighted pipeline forecasting is automated." },
    ],
    demoVideo: undefined,
    featured: false,
    status: "published" as const,
    totalSales: 47,
    rating: 4.3,
    reviewCount: 11,
  },
  {
    name: "Clinic Appointment Scheduler",
    sku: "TW-CAS-007",
    shortDescription: "Schedule and manage patient appointments.",
    description:
      "A simple appointment scheduling template for clinics and private practices. Track appointments, patient details, and provider availability.",
    price: 24.99,
    salePrice: undefined,
    category: "Hospital & Healthcare",
    industry: "Healthcare",
    fileType: "Google Sheets",
    tags: ["healthcare", "appointments", "clinic", "scheduler"],
    galleryImages: [
      "https://placehold.co/800x600/0891b2/ffffff?text=Scheduler+1",
      "https://placehold.co/800x600/0e7490/ffffff?text=Scheduler+2",
    ],
    thumbnail: "https://placehold.co/400x300/0891b2/ffffff?text=Appointment+Scheduler",
    downloadableFile: "https://placehold.co/10x10/transparent/transparent",
    fileSize: "0.9 MB",
    version: "1.0.0",
    changelog: "Initial release.",
    downloadLimit: 5,
    downloadExpiry: 365,
    seoTitle: "Clinic Appointment Scheduler",
    seoDescription: "Schedule and manage patient appointments with this template.",
    faqs: [
      { question: "Does it send reminders?", answer: "No, but reminder columns are included for manual follow-up." },
      { question: "Can providers have different schedules?", answer: "Yes, provider availability is tracked separately." },
    ],
    demoVideo: undefined,
    featured: false,
    status: "published" as const,
    totalSales: 22,
    rating: 4.2,
    reviewCount: 5,
  },
  {
    name: "Budget vs Actual Tracker",
    sku: "TW-BVA-008",
    shortDescription: "Compare budgeted amounts to actual spending.",
    description:
      "A monthly budget tracker with variance analysis, category breakdowns, and visual summaries. Suitable for personal and department budgets.",
    price: 19.99,
    salePrice: 14.99,
    category: "Finance & Accounting",
    industry: "Finance",
    fileType: "Excel",
    tags: ["budget", "finance", "tracker", "variance"],
    galleryImages: [
      "https://placehold.co/800x600/059669/ffffff?text=Budget+Tracker+1",
      "https://placehold.co/800x600/047857/ffffff?text=Budget+Tracker+2",
    ],
    thumbnail: "https://placehold.co/400x300/059669/ffffff?text=Budget+Tracker",
    downloadableFile: "https://placehold.co/10x10/transparent/transparent",
    fileSize: "1.1 MB",
    version: "1.1.0",
    changelog: "Added variance sparklines.",
    downloadLimit: 5,
    downloadExpiry: 365,
    seoTitle: "Budget vs Actual Tracker",
    seoDescription: "Compare budgeted amounts to actual spending with this tracker.",
    faqs: [
      { question: "Is it suitable for personal budgets?", answer: "Yes, it works for personal and departmental budgets." },
      { question: "Can I add custom categories?", answer: "Yes, categories are fully customizable." },
    ],
    demoVideo: undefined,
    featured: false,
    status: "published" as const,
    totalSales: 63,
    rating: 4.5,
    reviewCount: 18,
  },
  {
    name: "Volunteer Management System",
    sku: "TW-VMS-009",
    shortDescription: "Track volunteers, hours, and assignments.",
    description:
      "Designed for nonprofits to manage volunteer recruitment, schedules, hours logged, and event assignments.",
    price: 29.99,
    salePrice: undefined,
    category: "NGO & Grants",
    industry: "Nonprofit",
    fileType: "Google Sheets",
    tags: ["volunteer", "ngo", "hours", "events"],
    galleryImages: [
      "https://placehold.co/800x600/9333ea/ffffff?text=Volunteer+System+1",
      "https://placehold.co/800x600/7e22ce/ffffff?text=Volunteer+System+2",
    ],
    thumbnail: "https://placehold.co/400x300/9333ea/ffffff?text=Volunteer+Management",
    downloadableFile: "https://placehold.co/10x10/transparent/transparent",
    fileSize: "1.3 MB",
    version: "1.0.0",
    changelog: "Initial release.",
    downloadLimit: 5,
    downloadExpiry: 365,
    seoTitle: "Volunteer Management System",
    seoDescription: "Track volunteers, hours, and event assignments with this system.",
    faqs: [
      { question: "Can it track volunteer certifications?", answer: "Yes, certification tracking is included." },
      { question: "Does it support event signups?", answer: "Yes, event assignment sheets are included." },
    ],
    demoVideo: undefined,
    featured: false,
    status: "draft" as const,
    totalSales: 0,
    rating: 0,
    reviewCount: 0,
  },
  {
    name: "Course Enrollment Tracker",
    sku: "TW-CET-010",
    shortDescription: "Track course enrollments, completions, and certificates.",
    description:
      "An enrollment tracker for training providers and educators. Monitor student enrollments, completion rates, and certificate issuance.",
    price: 27.99,
    salePrice: 22.99,
    category: "Education & E-Learning",
    industry: "Education",
    fileType: "Excel",
    tags: ["course", "enrollment", "certificates", "education"],
    galleryImages: [
      "https://placehold.co/800x600/d97706/ffffff?text=Course+Tracker+1",
      "https://placehold.co/800x600/b45309/ffffff?text=Course+Tracker+2",
    ],
    thumbnail: "https://placehold.co/400x300/d97706/ffffff?text=Course+Tracker",
    downloadableFile: "https://placehold.co/10x10/transparent/transparent",
    fileSize: "1.4 MB",
    version: "1.0.0",
    changelog: "Initial release.",
    downloadLimit: 5,
    downloadExpiry: 365,
    seoTitle: "Course Enrollment Tracker",
    seoDescription: "Track course enrollments, completions, and certificates.",
    faqs: [
      { question: "Can it generate certificates?", answer: "It tracks certificate issuance; certificate generation is separate." },
      { question: "Does it handle payments?", answer: "Payment tracking is not included." },
    ],
    demoVideo: undefined,
    featured: false,
    status: "published" as const,
    totalSales: 19,
    rating: 4.1,
    reviewCount: 4,
  },
];

const customersSeed = [
  { email: "sarah.johnson@example.com", name: "Sarah Johnson", phone: "+1-555-0101", newsletterSubscribed: true },
  { email: "michael.chen@example.com", name: "Michael Chen", phone: "+1-555-0102", newsletterSubscribed: false },
  { email: "amanda.peters@ngo.org", name: "Amanda Peters", phone: "+1-555-0103", newsletterSubscribed: true },
  { email: "david.okello@hospital.go.ug", name: "David Okello", phone: "+256-700-123456", newsletterSubscribed: true },
  { email: "james.wilson@example.com", name: "James Wilson", phone: "+1-555-0105", newsletterSubscribed: false },
  { email: "linda.brown@edu.org", name: "Linda Brown", phone: "+1-555-0106", newsletterSubscribed: true },
  { email: "robert.taylor@example.com", name: "Robert Taylor", phone: "+1-555-0107", newsletterSubscribed: false },
  { email: "grace.nakato@finance.co.ug", name: "Grace Nakato", phone: "+256-701-234567", newsletterSubscribed: true },
  { email: "emily.davis@example.com", name: "Emily Davis", phone: "+1-555-0109", newsletterSubscribed: true },
  { email: "daniel.mutebi@clinic.co.ug", name: "Daniel Mutebi", phone: "+256-702-345678", newsletterSubscribed: false },
];

const couponsSeed = [
  { code: "WELCOME20", type: "percentage" as const, value: 20, minPurchase: 0, usageLimit: 100, expiresAt: now + 30 * oneDay, isActive: true, usageCount: 12 },
  { code: "SUMMER15", type: "percentage" as const, value: 15, minPurchase: 30, usageLimit: 50, expiresAt: now + 60 * oneDay, isActive: true, usageCount: 8 },
  { code: "SAVE10", type: "fixed" as const, value: 10, minPurchase: 50, usageLimit: 200, expiresAt: now + 90 * oneDay, isActive: true, usageCount: 25 },
  { code: "BUNDLE25", type: "percentage" as const, value: 25, minPurchase: 100, usageLimit: 20, expiresAt: now + 14 * oneDay, isActive: true, usageCount: 3 },
  { code: "FLASH50", type: "percentage" as const, value: 50, minPurchase: 0, usageLimit: 10, expiresAt: now - oneDay, isActive: false, usageCount: 10 },
  { code: "LOYALTY5", type: "fixed" as const, value: 5, minPurchase: 0, usageLimit: undefined, expiresAt: undefined, isActive: true, usageCount: 7 },
];

const pagesSeed = [
  {
    title: "About TrueWorks",
    slug: "about",
    content:
      "<p>TrueWorks provides ready-to-use spreadsheet templates and dashboards for healthcare, finance, education, and nonprofit organizations.</p>",
    type: "page" as const,
    excerpt: "Learn more about TrueWorks and our mission.",
    coverImage: "https://placehold.co/1200x600/2563eb/ffffff?text=About+TrueWorks",
    author: "TrueWorks Team",
    readingTime: 3,
    status: "published" as const,
  },
  {
    title: "How to Use Our Templates",
    slug: "how-to-use-our-templates",
    content:
      "<p>Our templates work in Excel and Google Sheets. Simply purchase, download, and customize the fields to match your organization.</p>",
    type: "post" as const,
    excerpt: "A quick guide to getting started with TrueWorks templates.",
    coverImage: "https://placehold.co/1200x600/16a34a/ffffff?text=Getting+Started",
    author: "Support Team",
    readingTime: 5,
    status: "published" as const,
  },
  {
    title: "Top 5 KPIs for Hospitals",
    slug: "top-5-kpis-for-hospitals",
    content:
      "<p>Hospital KPIs include bed occupancy rate, average length of stay, readmission rate, patient satisfaction, and operating margin.</p>",
    type: "resource" as const,
    excerpt: "Essential KPIs every hospital should track.",
    coverImage: "https://placehold.co/1200x600/db2777/ffffff?text=Hospital+KPIs",
    author: "Healthcare Analyst",
    readingTime: 7,
    status: "published" as const,
  },
  {
    title: "Financial Modeling 101",
    slug: "financial-modeling-101",
    content:
      "<p>Financial modeling combines historical data, assumptions, and projections to forecast business performance.</p>",
    type: "resource" as const,
    excerpt: "Introduction to building financial models.",
    coverImage: "https://placehold.co/1200x600/ca8a04/ffffff?text=Financial+Modeling",
    author: "Finance Team",
    readingTime: 10,
    status: "published" as const,
  },
  {
    title: "Grant Writing Checklist",
    slug: "grant-writing-checklist",
    content: "<p>A comprehensive checklist to prepare your next grant application.</p>",
    type: "resource" as const,
    excerpt: "Prepare winning grant applications with our checklist.",
    coverImage: "https://placehold.co/1200x600/7c3aed/ffffff?text=Grant+Writing",
    author: "NGO Specialist",
    readingTime: 6,
    status: "draft" as const,
  },
  {
    title: "Contact Us",
    slug: "contact",
    content:
      "<p>Reach out to our support team at support@trueworks.example.com or through the contact form.</p>",
    type: "page" as const,
    excerpt: "Get in touch with the TrueWorks team.",
    coverImage: undefined,
    author: "TrueWorks Team",
    readingTime: 2,
    status: "published" as const,
  },
];

const subscribersSeed = [
  { email: "sarah.johnson@example.com", name: "Sarah Johnson", source: "checkout", active: true },
  { email: "amanda.peters@ngo.org", name: "Amanda Peters", source: "resource-download", active: true },
  { email: "david.okello@hospital.go.ug", name: "David Okello", source: "footer-signup", active: true },
  { email: "linda.brown@edu.org", name: "Linda Brown", source: "blog", active: true },
  { email: "grace.nakato@finance.co.ug", name: "Grace Nakato", source: "checkout", active: true },
  { email: "emily.davis@example.com", name: "Emily Davis", source: "footer-signup", active: false },
  { email: "robert.taylor@example.com", name: "Robert Taylor", source: "popup", active: true },
  { email: "michael.chen@example.com", name: "Michael Chen", source: "checkout", active: false },
];

const notificationsSeed = [
  { type: "order", title: "New order received", message: "Order TW-10003 has been placed for $79.99.", link: "/admin/orders", read: false },
  { type: "review", title: "New review posted", message: "Hospital KPI Dashboard received a 5-star review.", link: "/admin/products", read: false },
  { type: "user", title: "New customer signed up", message: "Grace Nakato created an account.", link: "/admin/customers", read: true },
  { type: "system", title: "Seed data complete", message: "Dummy data has been loaded into the database.", link: undefined, read: true },
  { type: "order", title: "Order refunded", message: "Order TW-10008 was refunded.", link: "/admin/orders", read: false },
];

const settingsSeed = [
  { key: "siteName", value: "TrueWorks" },
  { key: "siteDescription", value: "Premium spreadsheet templates and dashboards for modern teams." },
  { key: "currency", value: "USD" },
  { key: "supportEmail", value: "support@trueworks.example.com" },
  { key: "featuredProductSlugs", value: ["hospital-kpi-dashboard", "financial-model-bundle", "project-portfolio-tracker"] },
];

const resourcesSeed = [
  {
    title: "How to Build a Hospital KPI Dashboard That Drives Better Patient Outcomes",
    slug: "how-to-build-a-hospital-kpi-dashboard",
    description: "Learn how healthcare administrators can design and implement effective KPI dashboards that improve operational efficiency, patient care, and regulatory compliance.",
    content: "A comprehensive guide covering bed occupancy tracking, patient wait times, revenue per bed, and departmental performance metrics. Includes step-by-step instructions for setting up your dashboard in Excel or Google Sheets.",
    category: "Guide",
    type: "document" as const,
    status: "published" as const,
    featured: true,
    featuredImage: "https://placehold.co/800x400/2563eb/ffffff?text=Hospital+KPI+Guide",
    attachments: [],
    tags: ["healthcare", "kpi", "dashboard", "hospital"],
    downloadCount: 124,
  },
  {
    title: "Financial Modeling Best Practices for East African SMEs",
    slug: "financial-modeling-best-practices-east-african-smes",
    description: "A practical guide to building financial models that help small and medium enterprises secure funding and plan for growth in the East African market.",
    content: "Covers 3-statement modeling, DCF valuation, sensitivity analysis, and investor-ready presentation formats tailored for the East African business context.",
    category: "Guide",
    type: "document" as const,
    status: "published" as const,
    featured: false,
    featuredImage: "https://placehold.co/800x400/16a34a/ffffff?text=Financial+Modeling+Guide",
    attachments: [],
    tags: ["finance", "modeling", " sme", "east-africa"],
    downloadCount: 89,
  },
  {
    title: "The Modern Business Plan: What Investors Actually Want to See",
    slug: "modern-business-plan-what-investors-want",
    description: "Discover how to craft a compelling business plan that resonates with today's investors and stakeholders.",
    content: "An article breaking down the key sections investors focus on, common mistakes to avoid, and templates you can use to structure your plan.",
    category: "Article",
    type: "document" as const,
    status: "published" as const,
    featured: false,
    featuredImage: "https://placehold.co/800x400/ca8a04/ffffff?text=Business+Plan+Guide",
    attachments: [],
    tags: ["business plan", "investors", "fundraising"],
    downloadCount: 67,
  },
  {
    title: "Strategic Planning for Nonprofits: A Template-Driven Approach",
    slug: "strategic-planning-for-nonprofits",
    description: "How nonprofit organizations can use strategic planning templates to align teams, measure impact, and drive mission success.",
    content: "Step-by-step walkthrough of creating a strategic plan using our nonprofit template, including theory of change, logical framework, and M&E indicators.",
    category: "Guide",
    type: "document" as const,
    status: "published" as const,
    featured: false,
    featuredImage: "https://placehold.co/800x400/db2777/ffffff?text=Nonprofit+Strategy",
    attachments: [],
    tags: ["nonprofit", "strategic planning", "ngo"],
    downloadCount: 56,
  },
  {
    title: "Cash Flow Forecasting: A Guide for Growing Businesses",
    slug: "cash-flow-forecasting-guide",
    description: "Master the art of cash flow forecasting to make informed decisions and keep your business financially healthy.",
    content: "Covers daily, weekly, and monthly forecasting methods, working capital management, and scenario planning for cash flow gaps.",
    category: "Guide",
    type: "document" as const,
    status: "published" as const,
    featured: false,
    featuredImage: "https://placehold.co/800x400/059669/ffffff?text=Cash+Flow+Guide",
    attachments: [],
    tags: ["cash flow", "forecasting", "finance"],
    downloadCount: 78,
  },
  {
    title: "Streamlining NGO Operations with Standard Operating Procedures",
    slug: "streamlining-ngo-operations-with-sops",
    description: "A step-by-step guide to creating SOPs that improve efficiency, accountability, and scalability in non-profit organizations.",
    content: "Learn how to document processes, create reusable templates, and implement SOPs across your organization for consistent operations.",
    category: "Article",
    type: "document" as const,
    status: "published" as const,
    featured: false,
    featuredImage: "https://placehold.co/800x400/9333ea/ffffff?text=NGO+Operations",
    attachments: [],
    tags: ["ngo", "operations", "sop", "efficiency"],
    downloadCount: 45,
  },
  {
    title: "Sales KPI Dashboards: Tracking What Matters Most",
    slug: "sales-kpi-dashboards",
    description: "Learn which sales metrics to track and how to build a dashboard that gives your team real-time visibility into performance.",
    content: "Covers pipeline metrics, conversion rates, revenue forecasting, and team performance tracking with visual dashboard examples.",
    category: "Guide",
    type: "video" as const,
    status: "published" as const,
    featured: false,
    featuredImage: "https://placehold.co/800x400/ea580c/ffffff?text=Sales+KPI+Dashboard",
    attachments: [],
    tags: ["sales", "kpi", "dashboard", "crm"],
    downloadCount: 92,
  },
  {
    title: "Grant Writing Checklist for African NGOs",
    slug: "grant-writing-checklist-african-ngos",
    description: "A comprehensive checklist to prepare your next grant application, tailored for African nonprofit organizations.",
    content: "Downloadable checklist covering eligibility, budget preparation, narrative writing, supporting documents, and submission best practices.",
    category: "Checklist",
    type: "download" as const,
    status: "published" as const,
    featured: false,
    featuredImage: "https://placehold.co/800x400/be185d/ffffff?text=Grant+Writing+Checklist",
    attachments: [
      { name: "Grant-Writing-Checklist.pdf", url: "#", size: 245000 },
      { name: "Budget-Template.xlsx", url: "#", size: 180000 },
    ],
    tags: ["grant writing", "checklist", "ngo", "fundraising"],
    downloadCount: 134,
  },
  {
    title: "Introduction to Excel Dashboards for Beginners",
    slug: "intro-to-excel-dashboards",
    description: "A beginner-friendly video tutorial on building your first interactive dashboard in Microsoft Excel.",
    content: "Covers pivot tables, charts, slicers, and conditional formatting to create professional dashboards from scratch.",
    category: "Video",
    type: "video" as const,
    status: "published" as const,
    featured: false,
    featuredImage: "https://placehold.co/800x400/d97706/ffffff?text=Excel+Dashboard+Tutorial",
    attachments: [],
    tags: ["excel", "tutorial", "dashboard", "beginner"],
    downloadCount: 203,
  },
  {
    title: "TrueWorks Template Setup Guide",
    slug: "trueworks-template-setup-guide",
    description: "Step-by-step instructions for downloading, setting up, and customizing your TrueWorks template purchase.",
    content: "Covers file formats, Google Sheets import, Excel customization, data entry best practices, and troubleshooting common issues.",
    category: "Guide",
    type: "document" as const,
    status: "published" as const,
    featured: false,
    featuredImage: "https://placehold.co/800x400/0891b2/ffffff?text=Setup+Guide",
    attachments: [
      { name: "Quick-Start-Guide.pdf", url: "#", size: 320000 },
    ],
    tags: ["setup", "guide", "getting started", "template"],
    downloadCount: 156,
  },
];

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results: Record<string, number> = {};

    // Seed categories
    const categoryIds = new Map<string, Id<"categories">>();
    for (const c of categories) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", c.slug))
        .collect();
      if (existing.length > 0) {
        categoryIds.set(c.slug, existing[0]._id);
      } else {
        const id = await ctx.db.insert("categories", {
          ...c,
          productCount: 0,
          createdAt: now,
        });
        categoryIds.set(c.slug, id);
      }
    }
    results.categories = categoryIds.size;

    // Map category names to slugs so productCount stays accurate (e.g. "Education & E-Learning")
    const categoryNameToSlug = new Map(categories.map((c) => [c.name, c.slug]));

    // Update productCount on categories based on products we are about to insert
    const categoryProductCounts = new Map<string, number>();
    for (const p of productsSeed) {
      const slug = categoryNameToSlug.get(p.category);
      if (slug) {
        categoryProductCounts.set(slug, (categoryProductCounts.get(slug) ?? 0) + 1);
      }
    }

    // Seed products
    const productIds = new Map<string, Id<"products">>();
    for (const p of productsSeed) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", slugify(p.name)))
        .collect();
      if (existing.length > 0) {
        productIds.set(slugify(p.name), existing[0]._id);
      } else {
        const id = await ctx.db.insert("products", {
          ...p,
          slug: slugify(p.name),
          createdAt: now,
          updatedAt: now,
        });
        productIds.set(slugify(p.name), id);
      }
    }
    results.products = productIds.size;

    // Sync category product counts
    for (const [slug, count] of categoryProductCounts) {
      const id = categoryIds.get(slug);
      if (id) {
        await ctx.db.patch(id, { productCount: count });
      }
    }

    // Seed customers
    const customerIds = new Map<string, Id<"customers">>();
    for (const c of customersSeed) {
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", c.email))
        .collect();
      if (existing.length > 0) {
        customerIds.set(c.email, existing[0]._id);
      } else {
        const id = await ctx.db.insert("customers", {
          ...c,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`,
          lifetimeValue: 0,
          totalOrders: 0,
          favoriteCategories: [],
          notes: "",
          createdAt: now,
          updatedAt: now,
        });
        customerIds.set(c.email, id);
      }
    }
    results.customers = customerIds.size;

    // Seed orders
    const orderStatuses = ["pending", "processing", "completed", "cancelled"] as const;
    const paymentStatuses = ["pending", "completed", "failed", "refunded"] as const;
    const productList = Array.from(productIds.values());
    const customerList = Array.from(customerIds.values());

    let orderCount = 0;
    for (let i = 0; i < 20; i++) {
      const product = productList[i % productList.length];
      const customer = customerList[i % customerList.length];
      const productDoc = await ctx.db.get(product);
      if (!productDoc) continue;

      const quantity = (i % 3) + 1;
      const price = productDoc.salePrice ?? productDoc.price;
      const subtotal = price * quantity;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;
      const paymentStatus = paymentStatuses[i % paymentStatuses.length];
      const orderStatus = orderStatuses[i % orderStatuses.length];
      const customerDoc = await ctx.db.get(customer);
      if (!customerDoc) continue;

      const existing = await ctx.db
        .query("orders")
        .withIndex("by_orderNumber", (q) => q.eq("orderNumber", orderNumber(i)))
        .collect();
      if (existing.length > 0) continue;

      await ctx.db.insert("orders", {
        orderNumber: orderNumber(i),
        customerId: customer,
        customerEmail: customerDoc.email,
        customerName: customerDoc.name,
        items: [
          {
            productId: product,
            productName: productDoc.name,
            quantity,
            price,
          },
        ],
        subtotal,
        tax,
        total,
        paymentMethod: i % 2 === 0 ? "Card" : "PayPal",
        paymentStatus,
        orderStatus,
        downloadLinks: [
          {
            productId: product,
            url: productDoc.downloadableFile ?? "",
            expiresAt: now + 365 * oneDay,
            downloadCount: 0,
          },
        ],
        notes: paymentStatus === "refunded" ? "Customer requested refund" : undefined,
        createdAt: now - i * oneDay,
        updatedAt: now - i * oneDay,
      });

      orderCount++;

      // Update customer lifetime value and total orders for completed orders
      if (paymentStatus === "completed") {
        await ctx.db.patch(customer, {
          lifetimeValue: customerDoc.lifetimeValue + total,
          totalOrders: customerDoc.totalOrders + 1,
          updatedAt: now,
        });
      }
    }
    results.orders = orderCount;

    // Seed coupons
    let couponCount = 0;
    for (const c of couponsSeed) {
      const existing = await ctx.db
        .query("coupons")
        .withIndex("by_code", (q) => q.eq("code", c.code))
        .collect();
      if (existing.length > 0) continue;
      await ctx.db.insert("coupons", {
        ...c,
        createdAt: now,
      });
      couponCount++;
    }
    results.coupons = couponCount;

    // Seed pages
    let pageCount = 0;
    for (const p of pagesSeed) {
      const existing = await ctx.db
        .query("pages")
        .withIndex("by_slug", (q) => q.eq("slug", p.slug))
        .collect();
      if (existing.length > 0) continue;
      await ctx.db.insert("pages", {
        ...p,
        createdAt: now,
        updatedAt: now,
      });
      pageCount++;
    }
    results.pages = pageCount;

    // Seed subscribers
    let subscriberCount = 0;
    for (const s of subscribersSeed) {
      const existing = await ctx.db
        .query("subscribers")
        .withIndex("by_email", (q) => q.eq("email", s.email))
        .collect();
      if (existing.length > 0) continue;
      await ctx.db.insert("subscribers", {
        ...s,
        createdAt: now,
      });
      subscriberCount++;
    }
    results.subscribers = subscriberCount;

    // Seed notifications
    let notificationCount = 0;
    for (const n of notificationsSeed) {
      await ctx.db.insert("notifications", {
        ...n,
        createdAt: now - notificationCount * 60 * 60 * 1000,
      });
      notificationCount++;
    }
    results.notifications = notificationCount;

    // Seed reviews
    const reviewMessages = [
      "Exactly what we needed for our hospital admin team.",
      "Great value and easy to customize.",
      "Saved us hours of setup. Highly recommended.",
      "Clean design and useful formulas.",
      "Good template, but could use more documentation.",
      "Perfect for our NGO reporting needs.",
      "Works well in Google Sheets.",
      "We use this across our entire finance department.",
    ];
    let reviewCount = 0;
    for (let i = 0; i < 12; i++) {
      const product = productList[i % productList.length];
      const customer = customerList[i % customerList.length];
      const customerDoc = await ctx.db.get(customer);
      if (!customerDoc) continue;
      const existing = await ctx.db
        .query("reviews")
        .withIndex("by_productId", (q) => q.eq("productId", product))
        .collect();
      const alreadyReviewed = existing.some((r) => r.customerName === customerDoc.name);
      if (alreadyReviewed) continue;

      await ctx.db.insert("reviews", {
        productId: product,
        customerId: customer,
        customerName: customerDoc.name,
        rating: [4, 5, 5, 3, 4, 5, 4, 5, 5, 4, 3, 5][i],
        title: i % 2 === 0 ? "Excellent template" : "Very useful",
        content: reviewMessages[i % reviewMessages.length],
        status: i % 5 === 0 ? "pending" : "approved",
        featured: i === 1 || i === 5,
        createdAt: now - i * 12 * 60 * 60 * 1000,
      });
      reviewCount++;
    }
    results.reviews = reviewCount;

    // Seed analytics for the last 30 days
    let analyticsCount = 0;
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * oneDay);
      const dateStr = date.toISOString().split("T")[0];
      const existing = await ctx.db
        .query("analytics")
        .withIndex("by_date", (q) => q.eq("date", dateStr))
        .collect();
      if (existing.length > 0) continue;

      const baseRevenue = 200 + Math.random() * 300;
      const orders = Math.floor(Math.random() * 8) + 1;
      await ctx.db.insert("analytics", {
        date: dateStr,
        revenue: Math.round(baseRevenue * 100) / 100,
        orders,
        downloads: Math.floor(Math.random() * 20) + 5,
        visitors: Math.floor(Math.random() * 200) + 50,
        pageViews: Math.floor(Math.random() * 600) + 150,
        createdAt: now,
      });
      analyticsCount++;
    }
    results.analytics = analyticsCount;

    // Seed settings
    let settingCount = 0;
    for (const s of settingsSeed) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", s.key))
        .collect();
      if (existing.length > 0) continue;
      await ctx.db.insert("settings", {
        ...s,
        updatedAt: now,
      });
      settingCount++;
    }
    results.settings = settingCount;

    // Seed downloads for completed orders
    let downloadCount = 0;
    const orders = await ctx.db.query("orders").collect();
    for (const order of orders) {
      if (order.paymentStatus !== "completed") continue;
      for (const item of order.items) {
        const existing = await ctx.db
          .query("downloads")
          .withIndex("by_email", (q) => q.eq("email", order.customerEmail))
          .collect();
        const alreadyHasDownload = existing.some((d) => d.productId === item.productId);
        if (alreadyHasDownload) continue;

        const productDoc = await ctx.db.get(item.productId);
        const limit = productDoc?.downloadLimit ?? 5;
        await ctx.db.insert("downloads", {
          productId: item.productId,
          customerId: order.customerId,
          email: order.customerEmail,
          downloadCount: Math.floor(Math.random() * 3),
          remainingDownloads: Math.max(0, limit - Math.floor(Math.random() * 3)),
          expiresAt: now + 365 * oneDay,
          device: "Web",
          ipAddress: "127.0.0.1",
          status: "active",
          createdAt: now - Math.random() * 30 * oneDay,
        });
        downloadCount++;
      }
    }
    results.downloads = downloadCount;

    // Seed resources
    let resourceCount = 0;
    for (const r of resourcesSeed) {
      const existing = await ctx.db
        .query("resources")
        .withIndex("by_slug", (q) => q.eq("slug", r.slug))
        .collect();
      if (existing.length > 0) continue;
      await ctx.db.insert("resources", {
        ...r,
        createdAt: now - resourceCount * oneDay,
        updatedAt: now - resourceCount * oneDay,
      });
      resourceCount++;
    }
    results.resources = resourceCount;

    return results;
  },
});

export const clear = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results: Record<string, number> = {};

    const tables = [
      "categories",
      "products",
      "customers",
      "orders",
      "coupons",
      "pages",
      "subscribers",
      "notifications",
      "reviews",
      "analytics",
      "settings",
      "downloads",
      "mediaFiles",
      "resources",
    ] as const;

    for (const table of tables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      results[table] = docs.length;
    }

    return results;
  },
});
