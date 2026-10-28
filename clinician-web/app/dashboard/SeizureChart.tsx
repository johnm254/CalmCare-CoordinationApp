'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  day: string;
  count: number;
}

interface Props {
  data: DataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1C1A35] border border-[#2E2B50] rounded-xl px-4 py-2.5 shadow-lg">
        <p className="text-[#9B96C0] text-xs font-semibold mb-0.5">{label}</p>
        <p className="text-[#F5F0FF] text-sm font-bold">{payload[0].value} event{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
}

export default function SeizureChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={32} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#2E2B50" strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tick={{ fill: '#9B96C0', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#504C78', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
        <Bar
          dataKey="count"
          fill="#8B5CF6"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
