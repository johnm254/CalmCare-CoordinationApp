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
      <div className="bg-[#0F2040] border border-[#1A3265] rounded-xl px-4 py-2.5 shadow-lg">
        <p className="text-[#7AAAC8] text-xs font-semibold mb-0.5">{label}</p>
        <p className="text-[#EAF4FF] text-sm font-bold">{payload[0].value} event{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
}

export default function SeizureChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={32} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#1A3265" strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tick={{ fill: '#7AAAC8', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#3D5C80', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,191,166,0.06)' }} />
        <Bar
          dataKey="count"
          fill="#00BFA6"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
