import { slugify } from "@/lib/utils";

export interface ProductFaq {
  q: string;
  a: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  price: number;
  salePrice: number | null;
  rating: number;
  reviews: number;
  gradient: string;
  featured: boolean;
  whatIncluded: string[];
  compatibility: string[];
  faq: ProductFaq[];
}

export const productCategories = [
  "Healthcare",
  "Business",
  "Finance",
  "NGO",
  "HR",
  "Schools",
  "Churches",
  "Agriculture",
] as const;

export const products: Product[] = [
  {
    id: "hospital-kpi-dashboard",
    name: "Hospital KPI Dashboard",
    category: "Healthcare",
    tagline: "Complete dashboard with bed occupancy, wait times, revenue per bed, and department KPIs.",
    description:
      "A comprehensive hospital KPI dashboard built in Excel that gives healthcare administrators real-time visibility into critical performance metrics. Track bed occupancy, patient wait times, revenue per bed and departmental performance from a single, presentation-ready workbook.",
    price: 85000,
    salePrice: null,
    rating: 4.8,
    reviews: 124,
    gradient: "from-emerald-600 to-teal-700",
    featured: true,
    whatIncluded: [
      "Main KPI Dashboard Sheet",
      "Department Performance Tracker",
      "Monthly Trends Analysis",
      "Data Entry Template",
      "User Guide (PDF)",
    ],
    compatibility: ["Microsoft Excel 2016+", "Google Sheets", "Office 365"],
    faq: [
      { q: "How do I customize the dashboard for my hospital?", a: "The dashboard comes with a dedicated data entry sheet. Simply input your hospital's data, and all charts and KPIs will update automatically." },
      { q: "Does this work on Google Sheets?", a: "Yes, the template is compatible with Google Sheets." },
      { q: "Can I add more departments?", a: "Absolutely. The template is designed to be easily scalable." },
      { q: "Is there a refund policy?", a: "Yes, we offer a 30-day money-back guarantee." },
    ],
  },
  {
    id: "financial-model-bundle",
    name: "Financial Model Bundle",
    category: "Finance",
    tagline: "3-statement model, DCF valuation, sensitivity analysis, and investor-ready charts.",
    description:
      "A professional financial modeling bundle designed for startups and SMEs seeking investment. Includes a fully-linked three-statement model, DCF valuation, sensitivity tables and investor-ready summary charts.",
    price: 120000,
    salePrice: 95000,
    rating: 4.9,
    reviews: 89,
    gradient: "from-blue-600 to-indigo-700",
    featured: true,
    whatIncluded: [
      "3-Statement Financial Model",
      "DCF Valuation Calculator",
      "Sensitivity Analysis Tables",
      "Investor Summary Dashboard",
      "Chart Pack for Presentations",
    ],
    compatibility: ["Microsoft Excel 2016+", "Office 365"],
    faq: [
      { q: "Is this suitable for fundraising?", a: "Yes, the model is built to investor standards." },
      { q: "How long does it take to set up?", a: "Most users complete data entry within 1-2 hours." },
      { q: "Can I change the currency?", a: "Yes, all formulas are currency-agnostic." },
    ],
  },
  {
    id: "ngo-grant-tracker",
    name: "NGO Grant Tracker",
    category: "NGO",
    tagline: "Track grants, donor commitments, expenditures, and reporting all in one workbook.",
    description:
      "An all-in-one grant management system for NGOs and non-profits. Monitor donor commitments, track expenditure against budgets and produce donor-ready reports in minutes.",
    price: 65000,
    salePrice: null,
    rating: 4.7,
    reviews: 56,
    gradient: "from-rose-500 to-pink-600",
    featured: true,
    whatIncluded: [
      "Grant Portfolio Dashboard",
      "Donor Commitment Tracker",
      "Budget vs Actual per Grant",
      "Disbursement Schedule",
      "Grant Reporting Template",
    ],
    compatibility: ["Microsoft Excel 2016+", "Google Sheets", "Office 365"],
    faq: [
      { q: "Can I track multiple donors?", a: "Yes, the tracker supports unlimited donors and grants." },
      { q: "Does it handle multi-currency?", a: "Yes, you can enter amounts in different currencies." },
    ],
  },
  {
    id: "school-fee-management-system",
    name: "School Fee Management System",
    category: "Schools",
    tagline: "Student fee tracking, arrears management, receipts, and termly financial summaries.",
    description:
      "A complete school fee management solution for primary and secondary schools. Track payments, manage arrears, issue receipts and produce termly financial summaries with ease.",
    price: 55000,
    salePrice: null,
    rating: 4.6,
    reviews: 203,
    gradient: "from-amber-500 to-orange-600",
    featured: true,
    whatIncluded: [
      "Student Fee Ledger",
      "Arrears Management Sheet",
      "Receipt Generator",
      "Termly Summary Report",
      "Class-wise Fee Collection Dashboard",
    ],
    compatibility: ["Microsoft Excel 2016+", "Google Sheets", "Office 365"],
    faq: [
      { q: "Can I use this for multiple terms?", a: "Yes, the system handles multiple terms and academic years." },
      { q: "Can I generate individual student statements?", a: "Absolutely. Each student has a dedicated ledger sheet." },
    ],
  },
  {
    id: "church-tithe-offering-tracker",
    name: "Church Tithe & Offering Tracker",
    category: "Churches",
    tagline: "Track tithes, offerings, pledges, and generate monthly stewardship reports.",
    description:
      "A simple yet powerful church finance management tool. Record tithes, offerings and pledges, and generate monthly stewardship reports for your leadership and congregation.",
    price: 45000,
    salePrice: 35000,
    rating: 4.5,
    reviews: 78,
    gradient: "from-violet-500 to-purple-600",
    featured: true,
    whatIncluded: [
      "Member Giving Register",
      "Pledge Tracker",
      "Monthly Stewardship Report",
      "Annual Giving Summary",
      "Offering Deposit Slip",
    ],
    compatibility: ["Microsoft Excel 2016+", "Google Sheets", "Office 365"],
    faq: [
      { q: "Can I track anonymous donations?", a: "Yes, there is an option for anonymous donations." },
      { q: "Is it suitable for multiple service collections?", a: "Yes, you can track collections from multiple services." },
    ],
  },
  {
    id: "sme-cash-flow-manager",
    name: "SME Cash Flow Manager",
    category: "Business",
    tagline: "Daily cash flow forecasting, expense tracking, and working capital management.",
    description:
      "A practical cash flow management tool for small and medium enterprises. Forecast daily cash positions up to 12 months ahead, categorize expenses and stay ahead of working capital gaps.",
    price: 75000,
    salePrice: null,
    rating: 4.7,
    reviews: 145,
    gradient: "from-cyan-500 to-blue-600",
    featured: true,
    whatIncluded: [
      "Daily Cash Flow Forecast",
      "Expense Tracker",
      "Working Capital Dashboard",
      "Scenario Planning Tool",
      "Cash Flow Alert System",
    ],
    compatibility: ["Microsoft Excel 2016+", "Google Sheets", "Office 365"],
    faq: [
      { q: "How far ahead can I forecast?", a: "The template supports up to 12 months of daily forecasting." },
      { q: "Can I categorize expenses?", a: "Yes, expenses are fully categorizable." },
    ],
  },
  {
    id: "hr-leave-attendance-tracker",
    name: "HR Leave & Attendance Tracker",
    category: "HR",
    tagline: "Employee leave balances, attendance records, approvals, and annual leave calendar.",
    description:
      "Streamline your HR operations with this comprehensive leave and attendance management system. Accruals are calculated automatically and every leave type is tracked separately.",
    price: 50000,
    salePrice: null,
    rating: 4.4,
    reviews: 67,
    gradient: "from-sky-500 to-blue-600",
    featured: false,
    whatIncluded: [
      "Employee Leave Ledger",
      "Leave Approval Tracker",
      "Attendance Register",
      "Annual Leave Calendar",
      "Leave Balance Report",
    ],
    compatibility: ["Microsoft Excel 2016+", "Google Sheets", "Office 365"],
    faq: [
      { q: "Does it calculate leave accruals automatically?", a: "Yes, leave accruals are calculated automatically." },
      { q: "Can I track sick leave separately?", a: "Yes, the system distinguishes between leave types." },
    ],
  },
  {
    id: "farm-produce-inventory-system",
    name: "Farm Produce Inventory System",
    category: "Agriculture",
    tagline: "Track harvest yields, inventory levels, sales, and supplier payments for agribusinesses.",
    description:
      "A complete inventory management solution for agribusinesses. Track harvest yields, inventory levels, sales and supplier payments across multiple farm locations.",
    price: 60000,
    salePrice: 48000,
    rating: 4.3,
    reviews: 42,
    gradient: "from-green-600 to-emerald-700",
    featured: false,
    whatIncluded: [
      "Harvest Yield Tracker",
      "Inventory Management Sheet",
      "Sales & Delivery Log",
      "Supplier Payment Register",
      "Seasonal Comparison Dashboard",
    ],
    compatibility: ["Microsoft Excel 2016+", "Google Sheets", "Office 365"],
    faq: [
      { q: "Can I track multiple farm locations?", a: "Yes, you can set up multiple locations." },
      { q: "Does it include spoilage tracking?", a: "Yes, spoilage and wastage can be recorded." },
    ],
  },
  {
    id: "ngo-budget-vs-actual-report",
    name: "NGO Budget vs Actual Report",
    category: "NGO",
    tagline: "Compare budgeted vs actual expenditure across projects with variance analysis.",
    description:
      "A professional budget monitoring tool for NGOs. Compare budgeted versus actual expenditure across projects and funders, with variance analysis formatted to donor standards.",
    price: 55000,
    salePrice: null,
    rating: 4.6,
    reviews: 38,
    gradient: "from-pink-500 to-rose-600",
    featured: false,
    whatIncluded: [
      "Budget vs Actual Dashboard",
      "Project Budget Sheets",
      "Variance Analysis Report",
      "Funder Budget Tracker",
      "Monthly Expenditure Summary",
    ],
    compatibility: ["Microsoft Excel 2016+", "Google Sheets", "Office 365"],
    faq: [
      { q: "Can I have multiple funders per project?", a: "Yes, each project can have multiple funders." },
      { q: "Are the reports donor-ready?", a: "Yes, they are formatted to donor standards." },
    ],
  },
  {
    id: "school-student-performance-tracker",
    name: "School Student Performance Tracker",
    category: "Schools",
    tagline: "Track student grades, attendance, termly performance trends, and generate report cards.",
    description:
      "A comprehensive student performance tracking system for schools. Record grades and attendance, analyze termly trends and generate professional report cards for up to 500 students.",
    price: 48000,
    salePrice: null,
    rating: 4.5,
    reviews: 112,
    gradient: "from-yellow-500 to-amber-600",
    featured: false,
    whatIncluded: [
      "Student Grade Register",
      "Attendance Tracker",
      "Termly Performance Report",
      "Report Card Generator",
      "Subject Performance Analysis",
    ],
    compatibility: ["Microsoft Excel 2016+", "Google Sheets", "Office 365"],
    faq: [
      { q: "How many students can I track?", a: "The system supports up to 500 students per workbook." },
      { q: "Can I customize the grading scale?", a: "Yes, the grading scale is fully configurable." },
    ],
  },
  {
    id: "hospital-patient-billing-system",
    name: "Hospital Patient Billing System",
    category: "Healthcare",
    tagline: "Patient invoicing, insurance claims tracking, payment plans, and revenue reconciliation.",
    description:
      "A complete patient billing solution for hospitals and clinics. Generate invoices, track insurance claims, manage payment plans and reconcile daily revenue with confidence.",
    price: 95000,
    salePrice: 78000,
    rating: 4.8,
    reviews: 94,
    gradient: "from-teal-500 to-emerald-600",
    featured: false,
    whatIncluded: [
      "Patient Invoice Generator",
      "Insurance Claim Tracker",
      "Payment Plan Manager",
      "Daily Revenue Reconciliation",
      "Monthly Billing Report",
    ],
    compatibility: ["Microsoft Excel 2016+", "Office 365"],
    faq: [
      { q: "Can I track multiple insurance companies?", a: "Yes, you can manage multiple insurance companies." },
      { q: "Does it handle partial payments?", a: "Yes, the system supports partial payments and payment plans." },
    ],
  },
  {
    id: "church-membership-database",
    name: "Church Membership Database",
    category: "Churches",
    tagline: "Member profiles, attendance tracking, groups, and communication management.",
    description:
      "A comprehensive church membership management system. Maintain member profiles, track attendance, manage groups and keep your communications organized.",
    price: 40000,
    salePrice: null,
    rating: 4.4,
    reviews: 61,
    gradient: "from-purple-500 to-violet-600",
    featured: false,
    whatIncluded: [
      "Member Profile Database",
      "Attendance Tracker",
      "Group Management Sheet",
      "Member Directory",
      "Communication List Generator",
    ],
    compatibility: ["Microsoft Excel 2016+", "Google Sheets", "Office 365"],
    faq: [
      { q: "How many members can I store?", a: "The database supports up to 2,000 member records." },
      { q: "Can I export the member list?", a: "Yes, you can export member data to CSV." },
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => slugify(p.name) === slug || p.id === slug);
}

export function getRelatedProducts(product: Product, count = 3): Product[] {
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, count);
}

export function getFeaturedProducts(count = 6): Product[] {
  return products.filter((p) => p.featured).slice(0, count);
}

export function getCategoryCount(category: string): number {
  return products.filter((p) => p.category === category).length;
}
