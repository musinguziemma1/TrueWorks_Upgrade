export interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  theme: 'finance' | 'operations' | 'healthcare' | 'manufacturing' | 'government';
  visualType: 'executive' | 'operations' | 'analytics' | 'manufacturing' | 'monitoring';
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
    id: 'executive-finance',
    title: 'Smarter Systems.',
    subtitle: 'Stronger Decisions.',
    description: 'Comprehensive enterprise operating systems that transform how Fortune 500 organizations plan, execute, and scale globally.',
    theme: 'finance',
    visualType: 'executive',
    kpis: [
      { label: 'Revenue Growth', value: '24.7%', change: '+12.3%', trend: 'up', color: '#10B981' },
      { label: 'Operating Margin', value: '18.5%', change: '+5.2%', trend: 'up', color: '#E3BC3F' },
      { label: 'Cash Flow', value: '$2.8B', change: '+$340M', trend: 'up', color: '#3B82F6' },
      { label: 'EBITDA', value: '32.1%', change: '+8.9%', trend: 'up', color: '#8B5CF6' }
    ],
    modules: [
      { name: 'Finance & Accounting', icon: 'DollarSign', status: 'success', value: '99.8%' },
      { name: 'Executive Reporting', icon: 'BarChart3', status: 'active', value: 'Live' },
      { name: 'Business Intelligence', icon: 'Brain', status: 'success', value: 'AI Active' },
      { name: 'Performance Analytics', icon: 'TrendingUp', status: 'success', value: 'Real-time' }
    ]
  },
  {
    id: 'corporate-operations',
    title: 'Intelligent Operations.',
    subtitle: 'Seamless Integration.',
    description: 'Unified business operating platform that connects every department, process, and decision across your entire organization.',
    theme: 'operations',
    visualType: 'operations',
    kpis: [
      { label: 'Operational Efficiency', value: '94.2%', change: '+15.8%', trend: 'up', color: '#10B981' },
      { label: 'Process Automation', value: '87%', change: '+23%', trend: 'up', color: '#E3BC3F' },
      { label: 'Cost Reduction', value: '31%', change: '+12%', trend: 'up', color: '#3B82F6' },
      { label: 'Time Savings', value: '450hrs', change: '+180hrs', trend: 'up', color: '#8B5CF6' }
    ],
    modules: [
      { name: 'CRM & Sales', icon: 'Users', status: 'success', value: '2.4K Leads' },
      { name: 'Project Management', icon: 'Briefcase', status: 'active', value: '45 Projects' },
      { name: 'Procurement', icon: 'ShoppingCart', status: 'success', value: '$1.2M Savings' },
      { name: 'Asset Management', icon: 'Package', status: 'success', value: '15K Assets' }
    ]
  },
  {
    id: 'healthcare-analytics',
    title: 'Advanced Healthcare.',
    subtitle: 'Better Outcomes.',
    description: 'Enterprise-grade healthcare management systems that improve patient care while optimizing operational efficiency and regulatory compliance.',
    theme: 'healthcare',
    visualType: 'analytics',
    kpis: [
      { label: 'Patient Satisfaction', value: '96.8%', change: '+8.2%', trend: 'up', color: '#10B981' },
      { label: 'Bed Utilization', value: '89.3%', change: '+12%', trend: 'up', color: '#E3BC3F' },
      { label: 'Revenue per Bed', value: '$3,420', change: '+$456', trend: 'up', color: '#3B82F6' },
      { label: 'Cost Efficiency', value: '23.7%', change: '+7.1%', trend: 'up', color: '#8B5CF6' }
    ],
    modules: [
      { name: 'Patient Management', icon: 'Heart', status: 'success', value: '1,847 Patients' },
      { name: 'Medical Records', icon: 'FileText', status: 'active', value: 'HIPAA Compliant' },
      { name: 'Inventory Control', icon: 'Package', status: 'success', value: '95% Stock' },
      { name: 'Staff Scheduling', icon: 'Calendar', status: 'success', value: '340 Staff' }
    ]
  },
  {
    id: 'manufacturing-ops',
    title: 'Smart Manufacturing.',
    subtitle: 'Optimized Production.',
    description: 'Industrial-strength operating systems that maximize productivity, minimize waste, and ensure quality across global manufacturing operations.',
    theme: 'manufacturing',
    visualType: 'manufacturing',
    kpis: [
      { label: 'Overall Equipment Effectiveness', value: '87.4%', change: '+14.2%', trend: 'up', color: '#10B981' },
      { label: 'Production Yield', value: '96.8%', change: '+5.3%', trend: 'up', color: '#E3BC3F' },
      { label: 'Waste Reduction', value: '34.7%', change: '+18%', trend: 'up', color: '#3B82F6' },
      { label: 'Quality Score', value: '99.2%', change: '+2.1%', trend: 'up', color: '#8B5CF6' }
    ],
    modules: [
      { name: 'Production Planning', icon: 'Factory', status: 'success', value: '24/7 Active' },
      { name: 'Supply Chain', icon: 'Truck', status: 'active', value: '340 Suppliers' },
      { name: 'Quality Control', icon: 'CheckCircle', status: 'success', value: '99.8%' },
      { name: 'Inventory Management', icon: 'Package', status: 'success', value: '$45M Stock' }
    ]
  },
  {
    id: 'government-monitoring',
    title: 'Government Excellence.',
    subtitle: 'Transparent Impact.',
    description: 'Comprehensive monitoring and evaluation systems that ensure accountability, transparency, and measurable impact in public sector operations.',
    theme: 'government',
    visualType: 'monitoring',
    kpis: [
      { label: 'Program Efficiency', value: '91.6%', change: '+18.4%', trend: 'up', color: '#10B981' },
      { label: 'Citizen Satisfaction', value: '88.2%', change: '+12.7%', trend: 'up', color: '#E3BC3F' },
      { label: 'Budget Utilization', value: '94.1%', change: '+8.3%', trend: 'up', color: '#3B82F6' },
      { label: 'Impact Score', value: '8.7/10', change: '+1.2', trend: 'up', color: '#8B5CF6' }
    ],
    modules: [
      { name: 'Program Management', icon: 'Target', status: 'success', value: '127 Programs' },
      { name: 'Impact Analytics', icon: 'BarChart3', status: 'active', value: 'Real-time' },
      { name: 'Compliance Tracking', icon: 'Shield', status: 'success', value: '100%' },
      { name: 'Public Reporting', icon: 'FileText', status: 'success', value: 'Transparent' }
    ]
  }
];

export const featureIcons = [
  { name: 'Plan', icon: 'Target', description: 'Strategic Planning & Forecasting' },
  { name: 'Track', icon: 'BarChart3', description: 'Real-time Monitoring & Analytics' },
  { name: 'Analyze', icon: 'Brain', description: 'AI-Powered Business Intelligence' },
  { name: 'Act', icon: 'Zap', description: 'Automated Optimization & Execution' }
] as const;