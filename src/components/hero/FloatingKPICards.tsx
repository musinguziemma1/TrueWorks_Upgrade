'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, DollarSign, Activity, Gauge, BarChart3, Target, Users, HeartPulse, Factory, Shield, CheckCircle, Zap, Clock } from 'lucide-react';
import { KPI } from './data';
import { floatingCard } from './animations';

interface FloatingKPICardsProps {
  kpis: KPI[];
  isVisible: boolean;
}

const iconMap = {
  DollarSign,
  Activity,
  Gauge,
  BarChart3,
  Target,
  Users,
  HeartPulse,
  Factory,
  Shield,
  CheckCircle,
  Zap,
  Clock
} as const;

type IconKey = keyof typeof iconMap;

const iconByLabel: Record<string, IconKey> = {
  'Revenue Growth': 'DollarSign',
  'Operating Margin': 'BarChart3',
  'Cash Flow': 'DollarSign',
  'EBITDA': 'Gauge',
  'Operational Efficiency': 'Zap',
  'Process Automation': 'Activity',
  'Cost Reduction': 'Target',
  'Time Savings': 'Clock',
  'Patient Satisfaction': 'HeartPulse',
  'Bed Utilization': 'Activity',
  'Revenue per Bed': 'DollarSign',
  'Cost Efficiency': 'Gauge',
  'Overall Equipment Effectiveness': 'Gauge',
  'Production Yield': 'Factory',
  'Waste Reduction': 'Target',
  'Quality Score': 'CheckCircle',
  'Program Efficiency': 'Activity',
  'Citizen Satisfaction': 'Users',
  'Budget Utilization': 'Target',
  'Impact Score': 'Shield'
};

function getIcon(label: string) {
  const key = iconByLabel[label] || 'BarChart3';
  return iconMap[key];
}

function getTrendIcon(trend: KPI['trend']) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-3 h-3" />;
    case 'down':
      return <TrendingDown className="w-3 h-3" />;
    default:
      return <Minus className="w-3 h-3" />;
  }
}

const trendChip: Record<KPI['trend'], string> = {
  up: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  down: 'bg-red-500/15 text-red-300 ring-red-400/30',
  neutral: 'bg-white/10 text-white/70 ring-white/20'
};

export default function FloatingKPICards({ kpis, isVisible }: FloatingKPICardsProps) {
  const renderCard = (kpi: KPI | undefined, index: number, size: 'sm' | 'md' | 'lg', position: string) => {
    if (!kpi) return null;
    const Icon = getIcon(kpi.label);
    const valueSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-base';
    const labelSize = size === 'sm' ? 'text-[11px]' : 'text-sm';
    const padding = size === 'lg' ? 'p-4' : size === 'md' ? 'p-3.5' : 'p-3';
    const gap = size === 'lg' ? 'gap-3' : 'gap-2';

    return (
      <motion.div
        className={`absolute ${position} ${size === 'sm' ? 'w-52' : 'w-64'} ${padding} rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/20`}
        variants={floatingCard}
        initial="initial"
        animate={isVisible ? "animate" : "initial"}
        transition={{ delay: index * 0.15 }}
        style={{ translateZ: 0 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center ${gap} min-w-0`}>
            <div className={`relative flex items-center justify-center shrink-0 rounded-xl bg-[#DAA520]/15 ring-1 ring-[#DAA520]/25 ${size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'}`}>
              <Icon className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#DAA520]`} />
            </div>
            <h4 className={`${labelSize} font-medium text-white/75 truncate`}>{kpi.label}</h4>
          </div>
          <span className={`flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${trendChip[kpi.trend]}`}>
            {getTrendIcon(kpi.trend)}
            {kpi.change}
          </span>
        </div>

        <motion.div
          className={`${valueSize} font-bold text-white tracking-tight`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
        >
          {kpi.value}
        </motion.div>

        <div
          className={`h-1 rounded-full mt-3 opacity-70 ${size === 'sm' ? 'w-2/3' : ''}`}
          style={{ backgroundColor: kpi.color }}
        />
      </motion.div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {renderCard(kpis[0], 0, 'lg', 'top-12 right-8')}
      {renderCard(kpis[1], 1, 'md', 'top-1/2 -translate-y-1/2 left-8')}
      {renderCard(kpis[2], 2, 'lg', 'bottom-16 right-12')}
      {renderCard(kpis[3], 3, 'sm', 'top-20 left-12')}
    </div>
  );
}
