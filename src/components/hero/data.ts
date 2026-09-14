export interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  theme: 'healthcare' | 'nonprofit' | 'education' | 'business';
  visualType: 'healthcare' | 'nonprofit' | 'education' | 'business';
  kpis: KPI[];
  modules: Module[];
}

export interface KPI {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

export interface Module {
  name: string;
  icon: string;
  status: 'active' | 'warning' | 'success';
  value?: string;
}

export const heroSlides: SlideData[] = [
  {
    id: 'hospital-kpi',
    title: 'Hospital KPIs.',
    subtitle: 'Ready in Excel.',
    description: 'Bed occupancy, revenue per bed, wait times and collections — a plug-and-play Excel dashboard for hospitals and clinics. Download today, deploy the same day.',
    theme: 'healthcare',
    visualType: 'healthcare',
    kpis: [
      { label: 'Bed Occupancy', value: '78%', change: 'Live tracking', trend: 'up', color: '#10B981' },
      { label: 'Revenue / Bed', value: '$2,400', change: 'Per month', trend: 'up', color: '#DAA520' },
      { label: 'Patients / Day', value: '142', change: 'Auto charted', trend: 'up', color: '#3B82F6' },
      { label: 'Collection Rate', value: '87%', change: '+9 pts', trend: 'up', color: '#8B5CF6' }
    ],
    modules: [
      { name: 'Bed Occupancy Tracker', icon: 'Heart', status: 'success', value: 'Excel' },
      { name: 'Revenue Dashboard', icon: 'BarChart3', status: 'active', value: 'Live' },
      { name: 'Patient Flow Log', icon: 'FileText', status: 'success', value: 'Included' },
      { name: 'Quick-Start Guide', icon: 'TrendingUp', status: 'success', value: 'PDF' }
    ]
  },
  {
    id: 'ngo-grant-tracker',
    title: 'Grants & Donors.',
    subtitle: 'Under Control.',
    description: 'Every grant, deliverable and donor report in one Excel system. Built for NGOs and non-profits — donor reporting goes from days to minutes.',
    theme: 'nonprofit',
    visualType: 'nonprofit',
    kpis: [
      { label: 'Active Grants', value: '12', change: 'Tracked', trend: 'up', color: '#10B981' },
      { label: 'Funds Disbursed', value: '$184K', change: 'Auto summed', trend: 'up', color: '#DAA520' },
      { label: 'Beneficiaries', value: '3,420', change: 'Counted', trend: 'up', color: '#3B82F6' },
      { label: 'Spend Rate', value: '64%', change: 'On track', trend: 'up', color: '#8B5CF6' }
    ],
    modules: [
      { name: 'Grant Register', icon: 'Users', status: 'success', value: '12 grants' },
      { name: 'Donor Reports', icon: 'Briefcase', status: 'active', value: '1-click' },
      { name: 'Budget vs Actual', icon: 'ShoppingCart', status: 'success', value: 'Auto' },
      { name: 'Deadline Alerts', icon: 'Package', status: 'success', value: 'Built-in' }
    ]
  },
  {
    id: 'school-fee-manager',
    title: 'School Fees.',
    subtitle: 'Collected Faster.',
    description: 'Fee collection, arrears and class enrolments in one workbook. Built for schools and colleges — cut arrears with instant parent balances.',
    theme: 'education',
    visualType: 'education',
    kpis: [
      { label: 'Students', value: '847', change: 'Enrolled', trend: 'up', color: '#10B981' },
      { label: 'Collected', value: '$214K', change: 'This term', trend: 'up', color: '#DAA520' },
      { label: 'Outstanding', value: '$32K', change: 'Flagged', trend: 'up', color: '#3B82F6' },
      { label: 'Collection Rate', value: '87%', change: '+12 pts', trend: 'up', color: '#8B5CF6' }
    ],
    modules: [
      { name: 'Fee Ledger', icon: 'Heart', status: 'success', value: '847 pupils' },
      { name: 'Arrears List', icon: 'FileText', status: 'active', value: 'Auto' },
      { name: 'Class Enrolment', icon: 'Package', status: 'success', value: 'Included' },
      { name: 'Receipts', icon: 'Calendar', status: 'success', value: 'Printable' }
    ]
  },
  {
    id: 'sme-cashflow',
    title: 'Cash Flow.',
    subtitle: 'A Year Ahead.',
    description: 'A 12-month cash-flow planner for founders and finance teams. Forecast runway, plan expenses and walk into investors with ready charts.',
    theme: 'business',
    visualType: 'business',
    kpis: [
      { label: 'Monthly Revenue', value: '$48K', change: 'Forecast', trend: 'up', color: '#10B981' },
      { label: 'Burn Rate', value: '$31K', change: 'Tracked', trend: 'up', color: '#DAA520' },
      { label: 'Runway', value: '9 mo', change: 'Projected', trend: 'up', color: '#3B82F6' },
      { label: 'Recurring', value: '62%', change: 'Share', trend: 'up', color: '#8B5CF6' }
    ],
    modules: [
      { name: '12-Month Forecast', icon: 'Target', status: 'success', value: 'Excel' },
      { name: 'Expense Planner', icon: 'BarChart3', status: 'active', value: 'Live' },
      { name: 'Runway Chart', icon: 'Shield', status: 'success', value: 'Auto' },
      { name: 'Investor Summary', icon: 'FileText', status: 'success', value: 'Ready' }
    ]
  }
];

export const featureIcons = [
  { name: 'Browse', icon: 'Target', description: 'Filter by sector, role or workflow' },
  { name: 'Download', icon: 'BarChart3', description: 'Pay once, own it forever' },
  { name: 'Deploy', icon: 'Brain', description: 'Excel + Google Sheets ready' },
  { name: 'Support', icon: 'Zap', description: 'Guide + real human help' }
] as const;