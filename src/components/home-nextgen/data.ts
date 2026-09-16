import {
  Banknote,
  Briefcase,
  Building2,
  Church,
  ClipboardCheck,
  Compass,
  Download,
  FileText,
  GraduationCap,
  Heart,
  HeartPulse,
  Landmark,
  LineChart,
  Rocket,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Media assets
 *
 * Every image lives at a predictable path so final artwork can be dropped
 * in without touching the UI. Until a file exists at that path, MediaFrame
 * renders a designed dashboard placeholder instead of a broken image.
 *
 *   /images/hero-business-systems.webp
 *   /images/products/executive-dashboard.webp
 *   /images/products/finance-dashboard.webp
 *   /images/products/sales-dashboard.webp
 *   /images/products/hr-dashboard.webp
 *   /images/products/healthcare-dashboard.webp
 *   /images/industries/healthcare.webp
 *   /images/industries/ngos.webp
 *   /images/industries/finance.webp
 *   /images/industries/education.webp
 *   /images/industries/sme.webp
 *   /images/free-hospital-kpi-dashboard.webp
 * ------------------------------------------------------------------ */

export interface MediaAsset {
  src: string;
  alt: string;
}

export const HERO_MEDIA: MediaAsset = {
  src: "/images/hero-business-systems.webp",
  alt: "A cinematic workspace showing the TrueWorks executive KPI dashboard, financial model and hospital operations dashboard open on a display",
};

/* ------------------------------------------------------------------ *
 * Navigation
 * ------------------------------------------------------------------ */

export interface NavItem {
  label: string;
  href: string;
}

/** In-page section navigation for the next-generation homepage. */
export const HOMEPAGE_NAV: NavItem[] = [
  { label: "Solutions", href: "#systems" },
  { label: "Templates", href: "/store" },
  { label: "Industries", href: "#industries" },
  { label: "Resources", href: "/resources" },
  { label: "About", href: "/about" },
];

/* ------------------------------------------------------------------ *
 * Hero
 * ------------------------------------------------------------------ */

export interface HeroKpi {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta: string;
  trend: "up" | "down" | "flat";
}

export interface FloatingDashboard {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  kpi: string;
  kpiLabel: string;
  /** Positioning + depth for the layered composition (desktop only). */
  position: string;
  delay: number;
}

export const HERO_KPIS: HeroKpi[] = [
  { label: "Operating margin", value: 18.4, suffix: "%", delta: "On target", trend: "up" },
  { label: "Cash on hand", value: 1.24, prefix: "$", suffix: "M", delta: "13 weeks cover", trend: "up" },
  { label: "Bed occupancy", value: 78, suffix: "%", delta: "Target 85%", trend: "up" },
  { label: "Collections rate", value: 92, suffix: "%", delta: "Aged debt down", trend: "up" },
];

export const FLOATING_DASHBOARDS: FloatingDashboard[] = [
  {
    title: "Financial Model",
    subtitle: "12-month forecast",
    icon: LineChart,
    kpi: "$1.24M",
    kpiLabel: "Projected closing cash",
    position: "-left-4 top-10 lg:-left-16 lg:top-16",
    delay: 0.55,
  },
  {
    title: "Hospital Operations",
    subtitle: "Clinical + finance",
    icon: Stethoscope,
    kpi: "78%",
    kpiLabel: "Bed occupancy",
    position: "-right-2 top-0 lg:-right-14 lg:top-6",
    delay: 0.7,
  },
  {
    title: "HR & Workforce",
    subtitle: "Headcount plan",
    icon: UsersRound,
    kpi: "146",
    kpiLabel: "Active staff",
    position: "-left-2 bottom-4 lg:-left-12 lg:bottom-10",
    delay: 0.85,
  },
  {
    title: "Sales Pipeline",
    subtitle: "Revenue tracking",
    icon: TrendingUp,
    kpi: "$412K",
    kpiLabel: "Weighted pipeline",
    position: "-right-3 bottom-8 lg:-right-16 lg:bottom-14",
    delay: 1,
  },
];
/* ------------------------------------------------------------------ *
 * Trust strip
 * ------------------------------------------------------------------ */

export interface Sector {
  name: string;
  icon: LucideIcon;
}

export const SECTORS: Sector[] = [
  { name: "Hospitals & Clinics", icon: Stethoscope },
  { name: "NGOs & Nonprofits", icon: Heart },
  { name: "SMEs", icon: Briefcase },
  { name: "Schools", icon: GraduationCap },
  { name: "Finance Teams", icon: Landmark },
  { name: "Churches & Ministries", icon: Church },
  { name: "Professional Services", icon: Building2 },
  { name: "Startups", icon: Rocket },
];

/* ------------------------------------------------------------------ *
 * Problem / solution
 * ------------------------------------------------------------------ */

export interface ApproachItem {
  title: string;
  detail: string;
}

export const TRADITIONAL_APPROACH: ApproachItem[] = [
  { title: "Blank spreadsheet", detail: "Every team starts from an empty sheet and a guess." },
  { title: "Manual formulas", detail: "Logic lives in one person's head and breaks silently." },
  { title: "Broken references", detail: "Errors surface days before board reporting." },
  { title: "Repeated data entry", detail: "The same figures are typed into three different files." },
  { title: "Manual reporting", detail: "Month-end packs are rebuilt by hand, every month." },
  { title: "Hours of staff time", detail: "Analyst capacity spent on formatting, not analysis." },
];

export const TRUEWORKS_APPROACH: ApproachItem[] = [
  { title: "Ready-to-use system", detail: "A complete, structured workbook built around the workflow." },
  { title: "Automated calculations", detail: "Validated formulas, named ranges and reconciliation checks." },
  { title: "Professional dashboard", detail: "KPIs and charts render the moment data is entered." },
  { title: "Documentation", detail: "A written quick-start guide and field-level guidance." },
  { title: "Validation", detail: "Input checks catch errors before they reach reporting." },
  { title: "Instant deployment", detail: "Open it, import your opening balances and run it today." },
];
/* ------------------------------------------------------------------ *
 * Product explorer
 * ------------------------------------------------------------------ */

export interface ProductKpi {
  label: string;
  value: string;
  trend?: "up" | "down";
}

export interface ProductCategory {
  id: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  kpis: ProductKpi[];
  media: MediaAsset;
  exploreHref: string;
}

const executiveCategory: ProductCategory = {
  id: "executive",
  label: "Executive Management",
  title: "Executive Management System",
  description:
    "KPI dashboards, management reporting and strategic planning in a single executive layer that consolidates finance, operations and people metrics.",
  bullets: [
    "Board-ready KPI dashboard with variance commentary",
    "Monthly management pack and rolling forecast",
    "Strategic initiative tracker with owner accountability",
  ],
  kpis: [
    { label: "Operating margin", value: "18.4%", trend: "up" },
    { label: "Budget variance", value: "-2.1%", trend: "down" },
    { label: "Initiatives on track", value: "14 / 17" },
  ],
  media: {
    src: "/images/products/executive-dashboard.webp",
    alt: "TrueWorks executive management dashboard showing KPI cards, revenue trend and a management reporting summary",
  },
  exploreHref: "/store?category=Executive%20Management%20Systems",
};

const financeCategory: ProductCategory = {
  id: "finance",
  label: "Finance & Treasury",
  title: "Finance & Treasury System",
  description:
    "Budgets, cash flow, financial models and financial reporting built on a single driver-based model your finance team can audit and defend.",
  bullets: [
    "Driver-based budget and quarterly reforecast",
    "13-week rolling cash-flow and treasury position",
    "Audit-ready financial statements and schedules",
  ],
  kpis: [
    { label: "Closing cash", value: "$1.24M", trend: "up" },
    { label: "Gross margin", value: "41.7%", trend: "up" },
    { label: "Days sales outstanding", value: "46 days", trend: "down" },
  ],
  media: {
    src: "/images/products/finance-dashboard.webp",
    alt: "TrueWorks finance dashboard showing a cash-flow waterfall, budget versus actual and treasury position charts",
  },
  exploreHref: "/store?category=Finance%20and%20Treasury%20Systems",
};

const salesCategory: ProductCategory = {
  id: "sales",
  label: "Sales & Customer Management",
  title: "Sales & Customer Management System",
  description:
    "Sales pipelines, CRM tools and customer tracking that keep revenue predictable, from first conversation to renewal and account health.",
  bullets: [
    "Weighted pipeline and forecast by stage",
    "Customer and contract register with renewal alerts",
    "Win/loss analysis and representative scorecards",
  ],
  kpis: [
    { label: "Weighted pipeline", value: "$412K", trend: "up" },
    { label: "Win rate", value: "38%" },
    { label: "Conversion cycle", value: "21 days", trend: "down" },
  ],
  media: {
    src: "/images/products/sales-dashboard.webp",
    alt: "TrueWorks sales dashboard showing pipeline stages, revenue forecast and customer account health",
  },
  exploreHref: "/store?category=Sales%20and%20Customer%20Management%20Systems",
};

const hrCategory: ProductCategory = {
  id: "hr",
  label: "Human Resources",
  title: "Human Resources System",
  description:
    "Workforce planning, HR dashboards and employee management covering establishment, payroll inputs, performance and compliance records.",
  bullets: [
    "Establishment and headcount plan versus actual",
    "Employee register, leave accrual and payroll inputs",
    "Performance cycle tracking and training records",
  ],
  kpis: [
    { label: "Headcount", value: "146" },
    { label: "Attrition", value: "6.9%", trend: "down" },
    { label: "Vacancies open", value: "4" },
  ],
  media: {
    src: "/images/products/hr-dashboard.webp",
    alt: "TrueWorks HR dashboard showing workforce plan, headcount by department and performance cycle trackers",
  },
  exploreHref: "/store?category=Human%20Resources%20and%20Workforce%20Systems",
};

const healthcareCategory: ProductCategory = {
  id: "healthcare",
  label: "Healthcare",
  title: "Healthcare Management System",
  description:
    "Hospital dashboards, clinical operations and healthcare management systems connecting patient throughput, revenue and clinical capacity.",
  bullets: [
    "Bed occupancy, theatre and patient-flow monitoring",
    "Revenue per bed, payer mix and ageing debt",
    "Pharmacy, stock and departmental cost reporting",
  ],
  kpis: [
    { label: "Bed occupancy", value: "78%", trend: "up" },
    { label: "Patients / day", value: "142" },
    { label: "Revenue / bed", value: "$2,400", trend: "up" },
  ],
  media: {
    src: "/images/products/healthcare-dashboard.webp",
    alt: "TrueWorks healthcare dashboard showing bed occupancy, patient throughput and revenue per bed indicators",
  },
  exploreHref: "/store?category=Hospital%20and%20Healthcare%20Systems",
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  executiveCategory,
  financeCategory,
  salesCategory,
  hrCategory,
  healthcareCategory,
];
/* ------------------------------------------------------------------ *
 * Data-to-decision demo
 * ------------------------------------------------------------------ */

export interface DemoStage {
  step: string;
  title: string;
  detail: string;
}

export const DEMO_STAGES: DemoStage[] = [
  {
    step: "01",
    title: "Raw data",
    detail: "Ledger, patient, sales and payroll extracts arrive exactly as they are.",
  },
  {
    step: "02",
    title: "Calculations process",
    detail: "Cleaning, mapping and driver logic run through validated formulas.",
  },
  {
    step: "03",
    title: "KPIs populate",
    detail: "Indicators update with trend, target and variance context.",
  },
  {
    step: "04",
    title: "Charts animate",
    detail: "Trends, composition and cash movements draw themselves in sequence.",
  },
  {
    step: "05",
    title: "Management summary",
    detail: "A decision-ready narrative replaces the spreadsheet walkthrough.",
  },
];

export const DEMO_RAW_ROWS: string[][] = [
  ["GL-1042", "Consulting revenue", "Jan", "482,000"],
  ["GL-2310", "Staff costs", "Jan", "-261,400"],
  ["GL-4551", "Supplier payments", "Jan", "-96,850"],
  ["GL-6203", "Utilities", "Jan", "-18,240"],
];

export const DEMO_SUMMARY_POINTS: string[] = [
  "Revenue ahead of budget by 4.2%, driven by consulting engagements.",
  "Cash cover at 13 weeks; supplier terms can fund Q3 capital spend.",
  "Collections improvement released working capital during the quarter.",
];

/* ------------------------------------------------------------------ *
 * How it works
 * ------------------------------------------------------------------ */

export interface WorkflowStep {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    number: "01",
    title: "Choose",
    description: "Find a system built for your workflow.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Download",
    description: "Securely purchase and instantly access your files.",
    icon: Download,
  },
  {
    number: "03",
    title: "Deploy",
    description: "Open, customise and start using the system immediately.",
    icon: Rocket,
  },
];

/* ------------------------------------------------------------------ *
 * Why TrueWorks
 * ------------------------------------------------------------------ */

export interface WhyFeature {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Metadata revealed on hover / focus. */
  meta: string;
}

export const WHY_FEATURES: WhyFeature[] = [
  {
    title: "Expert-built",
    description: "Created around real business workflows.",
    icon: Workflow,
    meta: "Finance, health, HR and operations practice",
  },
  {
    title: "Ready to deploy",
    description: "Designed to reduce implementation time.",
    icon: Rocket,
    meta: "Opens in Excel or Google Sheets",
  },
  {
    title: "Professionally documented",
    description: "Includes clear instructions and guidance.",
    icon: FileText,
    meta: "Quick-start guide and field notes",
  },
  {
    title: "Built for real organizations",
    description: "Designed around practical operational requirements.",
    icon: ShieldCheck,
    meta: "Multi-user, approval-aware, audit-friendly",
  },
];

/* ------------------------------------------------------------------ *
 * Business impact (conceptual directions only — no customer statistics)
 * ------------------------------------------------------------------ */

export interface ImpactMetric {
  label: string;
  direction: "up" | "down";
  detail: string;
}

export const IMPACT_METRICS: ImpactMetric[] = [
  { label: "Reporting time", direction: "down", detail: "Templates replace manual month-end assembly" },
  { label: "Manual work", direction: "down", detail: "Calculations run themselves once data is entered" },
  { label: "Decision visibility", direction: "up", detail: "One dashboard for finance, operations and people" },
  { label: "Operational clarity", direction: "up", detail: "Shared definitions, targets and variances" },
];

/* ------------------------------------------------------------------ *
 * Industries
 * ------------------------------------------------------------------ */

export interface Industry {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  media: MediaAsset;
  exploreHref: string;
}

export const INDUSTRIES: Industry[] = [
  {
    id: "healthcare",
    label: "Healthcare",
    title: "Hospital operations, KPIs and financial visibility.",
    description:
      "Occupancy, theatre utilisation, revenue per bed and payer mix consolidated for clinical and finance leadership.",
    icon: Stethoscope,
    media: {
      src: "/images/industries/healthcare.webp",
      alt: "Healthcare leadership reviewing hospital occupancy and revenue dashboards",
    },
    exploreHref: "/store?category=Hospital%20and%20Healthcare%20Systems",
  },
  {
    id: "ngos",
    label: "NGOs",
    title: "Programme monitoring, reporting and management.",
    description:
      "Grant tracking, deliverable schedules and donor reporting structures that hold up under audit and review.",
    icon: HeartPulse,
    media: {
      src: "/images/industries/ngos.webp",
      alt: "Programme team working through grant tracking and donor reporting schedules",
    },
    exploreHref: "/store?category=NGO%20and%20Grant%20Management%20Systems",
  },
  {
    id: "finance",
    label: "Finance",
    title: "Budgeting, cash flow and financial analysis.",
    description:
      "Driver-based budgets, rolling cash-flow forecasting and board reporting built on one reconciling model.",
    icon: Banknote,
    media: {
      src: "/images/industries/finance.webp",
      alt: "Finance team analysing budget, cash-flow and variance reports",
    },
    exploreHref: "/store?category=Finance%20and%20Treasury%20Systems",
  },
  {
    id: "education",
    label: "Education",
    title: "School administration and performance tracking.",
    description:
      "Fee collection, arrears, enrolment and academic performance held in one administrative system.",
    icon: GraduationCap,
    media: {
      src: "/images/industries/education.webp",
      alt: "School administrators reviewing enrolment, fee collection and performance reports",
    },
    exploreHref: "/store?category=Education%20Management%20Systems",
  },
  {
    id: "sme",
    label: "SMEs",
    title: "Sales, operations and business performance.",
    description:
      "Sales pipelines, stock, cost control and owner dashboards for growing businesses without a finance department.",
    icon: Building2,
    media: {
      src: "/images/industries/sme.webp",
      alt: "Business owner reviewing sales, stock and cash-flow performance dashboards",
    },
    exploreHref: "/store?category=Small%20Business%20Operating%20Systems",
  },
];

/* ------------------------------------------------------------------ *
 * Free resource
 * ------------------------------------------------------------------ */

export interface FreeDashboardKpi {
  label: string;
  value: string;
  icon: LucideIcon;
  trend: string;
}

export interface FreeDashboard {
  title: string;
  description: string;
  demoDataNote: string;
  media: MediaAsset;
  kpis: FreeDashboardKpi[];
  primaryCta: NavItem;
  secondaryCta: NavItem;
}

export const FREE_DASHBOARD: FreeDashboard = {
  title: "Hospital KPI Dashboard",
  description:
    "A complete healthcare performance dashboard covering bed occupancy, revenue per bed, patient throughput and billing, free to download.",
  demoDataNote:
    "Figures shown are demonstration values from the sample dataset shipped with the template, not live customer data.",
  media: {
    src: "/images/free-hospital-kpi-dashboard.webp",
    alt: "Preview of the free TrueWorks Hospital KPI Dashboard showing bed occupancy, revenue per bed and patient indicators",
  },
  kpis: [
    { label: "Bed Occupancy", value: "78%", icon: Stethoscope, trend: "Target 85%" },
    { label: "Revenue / Bed", value: "$2,400", icon: Banknote, trend: "Rolling 30 days" },
    { label: "Patients / Day", value: "142", icon: Users, trend: "Inpatient + outpatient" },
    { label: "Average Bill", value: "$85", icon: Wallet, trend: "Weighted average" },
  ],
  primaryCta: { label: "Get the Free Dashboard", href: "/store?q=hospital" },
  secondaryCta: { label: "Explore Premium Systems", href: "/store" },
};

/* ------------------------------------------------------------------ *
 * Credibility (qualitative — no invented numbers)
 * ------------------------------------------------------------------ */

export interface CredibilitySignal {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const CREDIBILITY_SIGNALS: CredibilitySignal[] = [
  {
    title: "Instant, secure delivery",
    description: "Files are released through protected download links as soon as payment settles.",
    icon: Download,
  },
  {
    title: "Local and international payment",
    description: "Cards and mobile money, so teams in any market can buy without friction.",
    icon: Banknote,
  },
  {
    title: "Documented and supported",
    description: "Every system ships with guidance, and support is available during business hours EAT.",
    icon: ClipboardCheck,
  },
  {
    title: "Reconciling, auditable systems",
    description: "Figures agree across sheets, and inputs are validated before they reach reporting.",
    icon: ShieldCheck,
  },
];

export const PAYMENT_METHODS: string[] = [
  "Visa",
  "Mastercard",
  "MTN Mobile Money",
  "Airtel Money",
];

/* ------------------------------------------------------------------ *
 * Section anchors
 * ------------------------------------------------------------------ */

export const SECTION_IDS = {
  hero: "top",
  trust: "trusted-by",
  problem: "problem-solution",
  systems: "systems",
  demo: "in-action",
  workflow: "how-it-works",
  why: "why-trueworks",
  impact: "impact",
  industries: "industries",
  free: "free-resource",
  testimonials: "testimonials",
  cta: "get-started",
} as const;

/** Anchor targets highlighted by the sticky navigation. */
export const NAV_SECTION_TARGETS = [
  SECTION_IDS.systems,
  SECTION_IDS.industries,
  SECTION_IDS.why,
  SECTION_IDS.demo,
] as const;
