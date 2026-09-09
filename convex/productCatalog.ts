import { internalMutation, internalQuery } from "./_generated/server";

const catalog = [
  ["TW-EXE", "Executive Management Systems", "Business", "Executive management dashboards, planning, reporting, and decision systems.", [
    "Executive Management Dashboard|Annual Operating Plan System|Strategic Plan Execution System|Board Performance Pack|Monthly Management Reporting System|Executive Decision Register|Organisational Performance Scorecard|Business Health Monitoring System|Management Action Tracking System|Quarterly Business Review System|Balanced Scorecard Management System|Branch Performance Consolidation System|Executive Risk and Opportunity Dashboard|Management Meeting and Resolution System|Corporate Performance Operating System",
  ]],
  ["TW-FIN", "Finance and Treasury Systems", "Finance", "Budgeting, cash flow, accounting, profitability, consolidation, and finance control systems.", [
    "Budget Management System|Accounts Receivable and Payable System|Cash Flow Planner|13-Week Cash Flow Forecast|Daily Cash Position System|Bank Reconciliation System|Petty Cash Control System|Working Capital Management System|Cash Runway and Liquidity Planner|Debt and Covenant Management System|Financial Close Management System|Balance Sheet Reconciliation System|Fixed Asset Management System|Prepayment and Accrual Management System|Journal Entry Control System|Chart of Accounts Builder|Financial Statement Preparation System|Departmental Cost Allocation System|Product Profitability Analyzer|Service-Line Profitability Analyzer|Customer Profitability Analyzer|Branch Profitability System|Break-Even and Margin Analyzer|Pricing and Contribution Model|Expense Management System|Capital Expenditure Management System|Multi-Entity Financial Consolidation System|Financial Ratio and Sustainability System|Revenue Integrity and Leakage System|Finance Executive Command Centre",
  ]],
  ["TW-SAL", "Sales and Customer Management Systems", "Business", "Sales pipelines, customer management, retention, service, commissions, and forecasting.", [
    "Daily Revenue Management System|Sales Pipeline CRM|Lead and Prospect Management System|Sales Target and Performance System|Quotation and Proposal Tracker|Customer Follow-Up System|Key Account Management System|Customer Retention Dashboard|Customer Complaint Resolution System|Sales Commission Management System|Customer Lifetime Value Analyzer|Subscription Revenue Management System|Sales Territory Performance System|Customer Service Performance System|Sales Forecasting and Intelligence System",
  ]],
  ["TW-HRM", "Human Resources and Workforce Systems", "Business", "Employee information, attendance, leave, payroll, performance, workforce planning, and HR compliance.", [
    "Employee Master Information System|Attendance and Timesheet System|Leave Management System|Payroll Management System|Recruitment Pipeline System|Employee Onboarding System|Performance Appraisal System|Training and Development System|Disciplinary Case Management System|Employee Turnover Intelligence System|Manpower Planning System|Salary and Benefits Management System|Staff Loan and Advance System|Shift and Duty Roster System|Employee Contract Management System|Succession Planning System|Employee Engagement System|HR Compliance and Licence Tracker|Workforce Cost and Productivity System|Human Capital Command Centre",
  ]],
  ["TW-PRC", "Procurement and Supplier Systems", "Operations", "Procurement planning, purchasing, supplier evaluation, contracts, savings, and compliance.", [
    "Procurement Planning System|Purchase Requisition System|Purchase Order Management System|Supplier Master and Evaluation System|Quotation Comparison System|Tender and Bid Management System|Contract Management System|Supplier Payment Tracking System|Goods Received Management System|Procurement Savings Dashboard|Supplier Risk Monitoring System|Procure-to-Pay Operating System|Purchase Price Variance Analyzer|Procurement Compliance System|Procurement Executive Command Centre",
  ]],
  ["TW-INV", "Inventory, Assets and Logistics Systems", "Operations", "Inventory, warehouse, assets, maintenance, fleet, fuel, equipment, and logistics management.", [
    "Inventory Management System|Stock Reorder Planning System|Stock Count and Variance System|Slow-Moving and Obsolete Stock Analyzer|Warehouse Bin Card System|Fixed Asset Register|Asset Maintenance System|Asset Disposal Management System|Consumables Usage System|Fleet and Vehicle Management System|Fuel Consumption Management System|Equipment Utilisation System|Warehouse Operations Dashboard|Stock Transfer Management System|Inventory Intelligence Command Centre",
  ]],
  ["TW-PRJ", "Project and Programme Management Systems", "Operations", "Project planning, budgets, risks, resources, milestones, governance, and portfolio oversight.", [
    "Project Management System|Project Budget and Cost Control System|Project Portfolio Dashboard|Work Breakdown Structure Planner|Project Risk Management System|Issue and Action Management System|Change Request Management System|Project Resource Allocation System|Milestone and Deliverables System|Construction Project Management System|Project Monitoring and Evaluation System|Project Close-Out System|Project Benefits Realisation System|Project Governance System|Project Management Command Centre",
  ]],
  ["TW-RSK", "Risk, Compliance and Governance Systems", "Governance", "Enterprise risk, internal controls, audits, compliance obligations, incidents, and governance actions.", [
    "Enterprise Risk Management System|Internal Controls Management System|Compliance Obligations Register|Audit Findings Management System|Fraud Risk Assessment System|Incident Reporting System|Policy Management System|Business Continuity Management System|Data Protection Compliance System|Conflict of Interest Register|Insurance Policy Management System|Regulatory Licence Management System|Governance Action Tracker|Control Self-Assessment System|Risk and Compliance Command Centre",
  ]],
  ["TW-OPS", "General Operations and Quality Systems", "Operations", "Standard operating procedures, service delivery, quality, capacity, incidents, and continuous improvement.", [
    "Standard Operating Procedure Register|Daily Operations Management System|Service Delivery Monitoring System|Quality Improvement Management System|Corrective and Preventive Action System|Operational Incident Management System|Equipment Maintenance Planner|Capacity Planning System|Turnaround Time Monitoring System|Root Cause Analysis System|Continuous Improvement Register|Facilities Management System|Work Order Management System|Service-Level Agreement Monitoring System|Operations Command Centre",
  ]],
  ["TW-HSP", "Hospital and Healthcare Systems", "Healthcare", "Hospital, clinical, patient flow, revenue cycle, workforce, quality, and healthcare command systems.", [
    "Hospital Master Operating System|Hospital KPI Dashboard|Hospital Executive Dashboard|Corporate Accounts Management System|Insurance Claims Management System|Outpatient Department Register|Inpatient and Ward Management System|Pharmacy Stock and Sales System|Laboratory Operations System|Imaging and Radiology Register|Maternity Management System|Theatre Scheduling and Utilisation System|Emergency and Accident Register|Dental Clinic Management System|Specialist Clinic Management System|Doctor Referral Management System|Doctor Performance Management System|Patient Flow Management System|Bed Management Dashboard|Hospital Revenue Cycle Management System|Claims Rejection and Resubmission System|Hospital Tariff and Price Master|Patient Deposit Management System|Discharge Billing Control System|Hospital Revenue Leakage Analyzer|Payor Contract Performance System|Clinical Incident Management System|Patient Safety Dashboard|Mortality and Morbidity Review System|Infection Prevention and Control System|Medication Error Management System|Clinical Audit Management System|Patient Complaint Resolution System|Staff Credential and Licence System|Continuing Medical Education System|Biomedical Equipment Management System|Ambulance Dispatch Management System|Medical Gas Consumption System|Laundry and Linen Management System|Hospital Kitchen and Patient Meals System|Mortuary Management System|Hospital Budget Management System|Hospital Service-Line Profitability System|Hospital Workforce Planning System|Hospital Quality Command Centre|Hospital Finance Command Centre|Hospital Operations Command Centre|Hospital Executive Command Centre",
  ]],
  ["TW-SAC", "SACCO, Credit and Member Systems", "Financial Services", "Member management, savings, loans, credit risk, collections, liquidity, and SACCO governance.", [
    "SACCO Member Management System|Savings Management System|Share Capital Management System|Loan Application and Appraisal System|Loan Repayment Management System|Loan Portfolio Dashboard|Delinquency and Arrears Management System|Guarantor Exposure Management System|Dividend Calculation System|Member Statement Generator|SACCO Liquidity Management System|Credit Risk Scoring System|Loan Provisioning System|Credit Committee Management Pack|SACCO Financial Sustainability System|Member Loan Limit Calculator|Loan Restructuring Management System|Collections and Recovery System|SACCO Governance Dashboard|SACCO Executive Command Centre",
  ]],
  ["TW-NGO", "NGO and Grant Management Systems", "Nonprofit", "Grant budgets, donor reporting, restricted funds, beneficiaries, programme delivery, and impact.", [
    "Grant Budget Management System|Donor Reporting System|Restricted Funds Management System|Beneficiary Management System|Monitoring and Evaluation System|Logical Framework Management System|Activity and Output Tracking System|Grant Compliance Management System|Donor Pipeline Management System|Programme Cost Allocation System|Field Visit Management System|Impact Measurement Dashboard|Proposal Development Tracker|Partnership Management System|NGO Executive Command Centre",
  ]],
  ["TW-AGR", "Agriculture and Agribusiness Systems", "Agriculture", "Farm budgets, production, livestock, inputs, harvests, profitability, and agribusiness operations.", [
    "Farm Budget Management System|Crop Production Management System|Livestock Management System|Poultry Flock Management System|Feed Consumption and Cost System|Farm Input Inventory System|Harvest and Yield Management System|Farm Profitability Analyzer|Out-Grower Farmer Management System|Milk Production Management System|Agricultural Loan Appraisal System|Agro-Processing Costing System|Farm Equipment Management System|Agricultural Sales and Market System|Agribusiness Command Centre",
  ]],
  ["TW-EDU", "Education Management Systems", "Education", "Student information, school fees, attendance, academics, teachers, budgets, and education reporting.", [
    "Student Information Management System|School Fees Management System|Attendance Management System|Academic Performance System|Teacher Workload Management System|School Budget Management System|School Inventory Management System|Examination Management System|Student Discipline Management System|Education Executive Dashboard",
  ]],
  ["TW-PRO", "Property and Facilities Systems", "Property", "Rental property, tenants, rent collection, maintenance, leases, inspections, and portfolios.", [
    "Rental Property Management System|Tenant Management System|Rent Collection Management System|Property Maintenance System|Lease Management System|Property Expense Management System|Property Profitability Analyzer|Occupancy Management Dashboard|Property Inspection System|Property Portfolio Command Centre",
  ]],
  ["TW-PER", "Personal Financial Systems", "Personal Finance", "Personal and household budgeting, debt, savings, school fees, assets, and net worth planning.", [
    "Personal Budget Management System|Family Expense Management System|Debt Repayment Planner|Savings Goal Management System|School Fees Planning System|Household Asset Register|Personal Cash Flow System|Personal Net Worth Tracker|Wedding Budget Management System|Personal Finance Command Centre",
  ]],
  ["TW-SME", "Small Business Operating Systems", "Small Business", "Practical operating, sales, finance, inventory, and management systems for small businesses.", [
    "Small Business Operating System|Retail Shop Sales and Stock System|Freelancer Business Management System|Service Business Management System|Restaurant Operations System|Salon and Beauty Business System|Church Finance Management System|Event Management System|Small Business Finance System|SME Executive Command Centre",
  ]],
] as const;

const legacySlugs: Record<string, string> = {
  "TW-FIN": "finance-accounting",
  "TW-SAL": "sales-crm",
  "TW-PRJ": "project-management",
  "TW-HSP": "hospital-healthcare",
  "TW-NGO": "ngo-grants",
  "TW-EDU": "education-elearning",
};

const icons: Record<string, string> = {
  "TW-EXE": "BriefcaseBusiness",
  "TW-FIN": "BarChart3",
  "TW-SAL": "Users",
  "TW-HRM": "UsersRound",
  "TW-PRC": "ShoppingCart",
  "TW-INV": "Package",
  "TW-PRJ": "Kanban",
  "TW-RSK": "ShieldCheck",
  "TW-OPS": "Settings2",
  "TW-HSP": "Hospital",
  "TW-SAC": "Landmark",
  "TW-NGO": "HeartHandshake",
  "TW-AGR": "Sprout",
  "TW-EDU": "GraduationCap",
  "TW-PRO": "Building2",
  "TW-PER": "WalletCards",
  "TW-SME": "Store",
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function tagsFor(name: string, code: string, industry: string): string[] {
  return [code.toLowerCase(), industry.toLowerCase().replace(/\s+/g, "-"), ...name.toLowerCase().split(/\s+/).slice(0, 3)];
}

export const importDraftCatalog = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let created = 0;
    let existing = 0;
    let total = 0;

    const existingCategories = await ctx.db.query("categories").collect();
    for (const [code, category, industry, description] of catalog) {
      const legacySlug = legacySlugs[code];
      const categoryDoc = existingCategories.find((item) => item.code === code || item.slug === slugify(category) || item.slug === legacySlug);
      const categoryData = {
        name: category,
        slug: slugify(category),
        code,
        description,
        industry,
        icon: icons[code],
      };
      if (categoryDoc) {
        await ctx.db.patch(categoryDoc._id, categoryData);
      } else {
        await ctx.db.insert("categories", { ...categoryData, productCount: 0, createdAt: now });
      }
    }

    for (const [code, category, industry, familyDescription, productGroups] of catalog) {
      const products = productGroups.flatMap((group) => group.split("|"));
      for (const [index, name] of products.entries()) {
        total += 1;
        const sku = `${code}-${String(index + 1).padStart(3, "0")}`;
        const slug = slugify(`${sku}-${name}`);
        const found = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", slug)).collect();
        if (found.length > 0) {
          existing += 1;
          continue;
        }
        await ctx.db.insert("products", {
          name,
          slug,
          sku,
          shortDescription: `${name} for ${category.toLowerCase()}.`,
          description: `${familyDescription} This draft product is ready for your pricing, screenshots, files, and final copy.`,
          price: 0,
          category,
          industry,
          fileType: "To be defined",
          tags: tagsFor(name, code, industry),
          galleryImages: [],
          thumbnail: "",
          faqs: [],
          featured: false,
          status: "draft",
          totalSales: 0,
          rating: 0,
          reviewCount: 0,
          createdAt: now,
          updatedAt: now,
        });
        created += 1;
      }
    }

    const refreshedCategories = await ctx.db.query("categories").collect();
    for (const [code, category] of catalog) {
      const categoryDoc = refreshedCategories.find((item) => item.code === code);
      if (!categoryDoc) continue;
      const publishedProducts = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", category))
        .collect();
      await ctx.db.patch(categoryDoc._id, {
        productCount: publishedProducts.filter((product) => product.status === "published").length,
      });
    }

    return { total, created, existing, status: "draft" as const };
  },
});

export const verifyDraftCatalog = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allProducts = await ctx.db.query("products").collect();
    const allCategories = await ctx.db.query("categories").collect();
    const catalogCodes = new Set(catalog.map(([code]) => code));
    const catalogProducts = allProducts.filter((product) => [...catalogCodes].some((code) => product.sku.startsWith(`${code}-`)));
    const statusCounts = catalogProducts.reduce<Record<string, number>>((counts, product) => {
      counts[product.status] = (counts[product.status] ?? 0) + 1;
      return counts;
    }, {});
    const familyCounts = Object.fromEntries(
      catalog.map(([code]) => [code, catalogProducts.filter((product) => product.sku.startsWith(`${code}-`)).length])
    );
    return {
      catalogProducts: catalogProducts.length,
      catalogCategories: allCategories.filter((category) => category.code && catalog.some(([code]) => code === category.code)).length,
      statusCounts,
      familyCounts,
      expectedProducts: catalog.reduce((total, [, , , , groups]) => total + groups.flatMap((group) => group.split("|")).length, 0),
    };
  },
});
