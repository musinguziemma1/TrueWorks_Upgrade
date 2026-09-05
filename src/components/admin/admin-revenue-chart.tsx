"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#0B2545" },
};

export default function AdminRevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  const chartData = data.length > 0 ? data : [{ month: "No data", revenue: 0 }];
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[300px]">
      <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E7EE" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5D6B7E" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#5D6B7E" }} axisLine={false} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#0B2545"
          strokeWidth={3}
          dot={{ fill: "#0B2545", strokeWidth: 2, r: 4, stroke: "#fff" }}
          activeDot={{ r: 6, fill: "#C9A227", stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
