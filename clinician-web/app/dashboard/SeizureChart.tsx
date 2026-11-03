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
      <div className="bg-[#F1F5FA] border border-[#E6ECF2] rounded-xl px-4 py-2.5 shadow-lg">
        <p className="text-[#5B6B7F] text-xs font-semibold mb-0.5">{label}</p>
        <p className="text-[#0F1B2D] text-sm font-bold">{payload[0].value} event{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
}

export default function SeizureChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={32} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#E6ECF2" strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tick={{ fill: '#5B6B7F', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#8C9AAB', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20,184,166,0.06)' }} />
        <Bar
          dataKey="count"
          fill="#14B8A6"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
