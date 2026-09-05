'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeroIllustrationProps {
  className?: string;
}

export default function HeroIllustration({ className }: HeroIllustrationProps) {
  return (
    <div className={cn('relative w-full h-full flex items-center justify-center', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl"
      >
        <svg
          viewBox="0 0 720 540"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto drop-shadow-[0_30px_60px_rgba(11,37,69,0.45)]"
          aria-hidden
        >
          <defs>
            <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B2545" />
              <stop offset="100%" stopColor="#04101F" />
            </linearGradient>
            <linearGradient id="cardLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#B8860B" />
              <stop offset="50%" stopColor="#DAA520" />
              <stop offset="100%" stopColor="#E8C547" />
            </linearGradient>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DAA520" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#DAA520" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="blueLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3E6990" />
              <stop offset="100%" stopColor="#5C8FB8" />
            </linearGradient>
            <radialGradient id="haloGold" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#DAA520" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#DAA520" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="haloBlue" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#3E6990" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3E6990" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Glow halos behind the laptop */}
          <circle cx="380" cy="280" r="260" fill="url(#haloGold)" opacity="0.7" />
          <circle cx="200" cy="380" r="180" fill="url(#haloBlue)" opacity="0.5" />

          {/* ─── Laptop body ────────────────────────────────────────── */}
          <g>
            {/* Laptop screen frame */}
            <rect
              x="150"
              y="110"
              width="420"
              height="270"
              rx="14"
              fill="url(#screen)"
              stroke="#1F3457"
              strokeWidth="2"
            />
            {/* Inner screen */}
            <rect x="160" y="120" width="400" height="250" rx="8" fill="#04101F" />

            {/* Camera notch */}
            <circle cx="360" cy="116" r="2" fill="#1F3457" />

            {/* Screen content — Dashboard */}
            <g>
              {/* Top bar */}
              <rect x="160" y="120" width="400" height="32" rx="8" fill="#0B2545" />
              <rect x="160" y="144" width="400" height="2" fill="#1F3457" />
              {/* Logo block in top bar */}
              <circle cx="178" cy="136" r="6" fill="#DAA520" />
              <text
                x="190"
                y="140"
                fill="#FFFFFF"
                fontFamily="Georgia, serif"
                fontSize="10"
                fontWeight="700"
              >
                TrueWorks
              </text>
              <text
                x="240"
                y="140"
                fill="#FFFFFF"
                opacity="0.6"
                fontFamily="Arial, sans-serif"
                fontSize="8"
                letterSpacing="1.2"
              >
                BUSINESS OPERATING SYSTEM
              </text>
              <circle cx="548" cy="136" r="3" fill="#10B981" />
              <text
                x="525"
                y="140"
                fill="#FFFFFF"
                opacity="0.6"
                fontFamily="Arial, sans-serif"
                fontSize="8"
                textAnchor="end"
              >
                Live
              </text>

              {/* KPI cards row */}
              <g>
                {[
                  { x: 172, label: 'Revenue', value: '$2.4M', change: '+12.3%', color: '#10B981' },
                  { x: 280, label: 'Operations', value: '94%', change: '+8.1%', color: '#DAA520' },
                  { x: 388, label: 'Customers', value: '1,247', change: '+24%', color: '#3E6990' },
                  { x: 496, label: 'EBITDA', value: '32%', change: '+5.2%', color: '#8B5CF6' },
                ].map((kpi, i) => (
                  <g key={i} transform={`translate(${kpi.x}, 164)`}>
                    <rect
                      x="0"
                      y="0"
                      width="92"
                      height="56"
                      rx="6"
                      fill="url(#cardLight)"
                      stroke="#FFFFFF"
                      strokeOpacity="0.08"
                    />
                    <text
                      x="8"
                      y="14"
                      fill="#FFFFFF"
                      opacity="0.6"
                      fontFamily="Arial, sans-serif"
                      fontSize="7"
                    >
                      {kpi.label}
                    </text>
                    <text
                      x="8"
                      y="32"
                      fill="#FFFFFF"
                      fontFamily="Georgia, serif"
                      fontSize="14"
                      fontWeight="700"
                    >
                      {kpi.value}
                    </text>
                    <rect x="8" y="42" width="6" height="2" rx="1" fill={kpi.color} />
                    <text
                      x="18"
                      y="46"
                      fill={kpi.color}
                      fontFamily="Arial, sans-serif"
                      fontSize="7"
                      fontWeight="600"
                    >
                      {kpi.change}
                    </text>
                  </g>
                ))}
              </g>

              {/* Chart card */}
              <g transform="translate(172, 232)">
                <rect
                  x="0"
                  y="0"
                  width="320"
                  height="120"
                  rx="6"
                  fill="url(#cardLight)"
                  stroke="#FFFFFF"
                  strokeOpacity="0.08"
                />
                <text
                  x="10"
                  y="14"
                  fill="#FFFFFF"
                  opacity="0.7"
                  fontFamily="Arial, sans-serif"
                  fontSize="8"
                  fontWeight="600"
                >
                  Operating Performance
                </text>
                <text
                  x="310"
                  y="14"
                  fill="#10B981"
                  fontFamily="Arial, sans-serif"
                  fontSize="8"
                  fontWeight="600"
                  textAnchor="end"
                >
                  ↑ 24.7%
                </text>

                {/* Chart area */}
                <g>
                  {/* Y-axis gridlines */}
                  {[0, 1, 2, 3].map((i) => (
                    <line
                      key={i}
                      x1="10"
                      y1={30 + i * 20}
                      x2="310"
                      y2={30 + i * 20}
                      stroke="#FFFFFF"
                      strokeOpacity="0.05"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Filled area under the line */}
                  <path
                    d="M 14 95 L 14 80 L 40 70 L 70 75 L 100 55 L 130 60 L 160 45 L 190 50 L 220 35 L 250 40 L 280 28 L 306 32 L 306 95 Z"
                    fill="url(#chartFill)"
                  />

                  {/* Animated gold line */}
                  <motion.path
                    d="M 14 80 L 40 70 L 70 75 L 100 55 L 130 60 L 160 45 L 190 50 L 220 35 L 250 40 L 280 28 L 306 32"
                    fill="none"
                    stroke="url(#goldLine)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.4, ease: 'easeOut', delay: 0.4 }}
                  />

                  {/* Animated blue line (secondary) */}
                  <motion.path
                    d="M 14 92 L 40 88 L 70 84 L 100 80 L 130 78 L 160 72 L 190 70 L 220 66 L 250 64 L 280 58 L 306 60"
                    fill="none"
                    stroke="url(#blueLine)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="3 3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.8, ease: 'easeOut', delay: 0.6 }}
                  />

                  {/* Data points on the gold line */}
                  {[
                    { x: 14, y: 80 },
                    { x: 70, y: 75 },
                    { x: 130, y: 60 },
                    { x: 190, y: 50 },
                    { x: 250, y: 40 },
                    { x: 306, y: 32 },
                  ].map((pt, i) => (
                    <motion.circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r="2.5"
                      fill="#E8C547"
                      stroke="#04101F"
                      strokeWidth="1"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.8 + i * 0.15 }}
                    />
                  ))}
                </g>
              </g>

              {/* Sidebar module list (small) */}
              <g transform="translate(500, 232)">
                <rect
                  x="0"
                  y="0"
                  width="60"
                  height="120"
                  rx="6"
                  fill="url(#cardLight)"
                  stroke="#FFFFFF"
                  strokeOpacity="0.08"
                />
                {[
                  { y: 14, label: 'Finance', color: '#10B981' },
                  { y: 38, label: 'Sales', color: '#3E6990' },
                  { y: 62, label: 'HR', color: '#DAA520' },
                  { y: 86, label: 'Ops', color: '#8B5CF6' },
                ].map((m, i) => (
                  <g key={i} transform={`translate(8, ${m.y})`}>
                    <rect width="6" height="14" rx="2" fill={m.color} opacity="0.85" />
                    <text
                      x="12"
                      y="10"
                      fill="#FFFFFF"
                      opacity="0.8"
                      fontFamily="Arial, sans-serif"
                      fontSize="7"
                    >
                      {m.label}
                    </text>
                  </g>
                ))}
              </g>
            </g>

            {/* Laptop base */}
            <path
              d="M 130 380 L 590 380 L 600 400 L 120 400 Z"
              fill="#1F3457"
            />
            <rect x="320" y="380" width="80" height="4" rx="2" fill="#0B2545" />
          </g>

          {/* ─── Floating KPI cards (around the laptop) ─────────────── */}
          {/* Card 1 — top right */}
          <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -6, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.6 },
              y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <rect
              x="560"
              y="80"
              width="120"
              height="64"
              rx="12"
              fill="#0B2545"
              stroke="#DAA520"
              strokeOpacity="0.35"
              strokeWidth="1"
              filter="drop-shadow(0 8px 16px rgba(0,0,0,0.4))"
            />
            <text
              x="572"
              y="100"
              fill="#FFFFFF"
              opacity="0.6"
              fontFamily="Arial, sans-serif"
              fontSize="8"
            >
              Patient Flow
            </text>
            <text
              x="572"
              y="122"
              fill="#FFFFFF"
              fontFamily="Georgia, serif"
              fontSize="18"
              fontWeight="700"
            >
              96.8%
            </text>
            <rect x="572" y="128" width="40" height="3" rx="1.5" fill="#DAA520" />
            <text
              x="616"
              y="132"
              fill="#10B981"
              fontFamily="Arial, sans-serif"
              fontSize="8"
              fontWeight="600"
            >
              +8.2%
            </text>
          </motion.g>

          {/* Card 2 — bottom left */}
          <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, 7, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.8 },
              y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
            }}
          >
            <rect
              x="40"
              y="320"
              width="120"
              height="64"
              rx="12"
              fill="#0B2545"
              stroke="#3E6990"
              strokeOpacity="0.45"
              strokeWidth="1"
              filter="drop-shadow(0 8px 16px rgba(0,0,0,0.4))"
            />
            <text
              x="52"
              y="340"
              fill="#FFFFFF"
              opacity="0.6"
              fontFamily="Arial, sans-serif"
              fontSize="8"
            >
              Cost Efficiency
            </text>
            <text
              x="52"
              y="362"
              fill="#FFFFFF"
              fontFamily="Georgia, serif"
              fontSize="18"
              fontWeight="700"
            >
              23.7%
            </text>
            <rect x="52" y="368" width="40" height="3" rx="1.5" fill="#3E6990" />
            <text
              x="96"
              y="372"
              fill="#10B981"
              fontFamily="Arial, sans-serif"
              fontSize="8"
              fontWeight="600"
            >
              +7.1%
            </text>
          </motion.g>

          {/* Card 3 — bottom right (small) */}
          <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -4, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 1.0 },
              y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
            }}
          >
            <rect
              x="560"
              y="420"
              width="110"
              height="50"
              rx="10"
              fill="#0B2545"
              stroke="#10B981"
              strokeOpacity="0.35"
              strokeWidth="1"
              filter="drop-shadow(0 6px 12px rgba(0,0,0,0.4))"
            />
            <text
              x="572"
              y="438"
              fill="#FFFFFF"
              opacity="0.6"
              fontFamily="Arial, sans-serif"
              fontSize="7"
            >
              Production Yield
            </text>
            <text
              x="572"
              y="458"
              fill="#FFFFFF"
              fontFamily="Georgia, serif"
              fontSize="14"
              fontWeight="700"
            >
              96.8%
            </text>
            <text
              x="658"
              y="458"
              fill="#10B981"
              fontFamily="Arial, sans-serif"
              fontSize="8"
              fontWeight="600"
              textAnchor="end"
            >
              ↑ 5.3%
            </text>
          </motion.g>

          {/* ─── Connection lines (data flow) ──────────────────────── */}
          <motion.g
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{ duration: 1.6, delay: 1.2 }}
          >
            <path
              d="M 560 200 Q 620 240 620 200"
              fill="none"
              stroke="#DAA520"
              strokeWidth="1.5"
              strokeDasharray="3 4"
            />
            <path
              d="M 160 350 Q 100 340 80 350"
              fill="none"
              stroke="#3E6990"
              strokeWidth="1.5"
              strokeDasharray="3 4"
            />
          </motion.g>

          {/* ─── Product icon chips (subtle accents) ────────────────── */}
          <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            <circle cx="80" cy="140" r="22" fill="#0B2545" stroke="#DAA520" strokeOpacity="0.3" />
            <path
              d="M 70 140 L 78 148 L 92 132"
              fill="none"
              stroke="#DAA520"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>

          <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.6 }}
          >
            <circle cx="640" cy="320" r="22" fill="#0B2545" stroke="#3E6990" strokeOpacity="0.3" />
            <rect x="630" y="312" width="20" height="2" rx="1" fill="#3E6990" />
            <rect x="630" y="318" width="14" height="2" rx="1" fill="#3E6990" opacity="0.7" />
            <rect x="630" y="324" width="18" height="2" rx="1" fill="#3E6990" opacity="0.85" />
            <rect x="630" y="330" width="10" height="2" rx="1" fill="#3E6990" opacity="0.5" />
          </motion.g>

          {/* ─── Subtle particle dots ────────────────────────────────── */}
          {[
            { x: 60, y: 80 },
            { x: 110, y: 240 },
            { x: 690, y: 100 },
            { x: 680, y: 220 },
            { x: 40, y: 460 },
            { x: 700, y: 480 },
            { x: 200, y: 60 },
            { x: 480, y: 50 },
          ].map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.5"
              fill="#DAA520"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}
