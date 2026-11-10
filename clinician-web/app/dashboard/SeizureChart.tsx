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
      <div className="bg-[#EDE8DF] border border-[#D6CFC4] rounded-xl px-4 py-2.5 shadow-lg">
        <p className="text-[#3A5255] text-xs font-semibold mb-0.5">{label}</p>
        <p className="text-[#0C1F20] text-sm font-bold">{payload[0].value} event{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
}

export default function SeizureChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={32} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#D6CFC4" strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tick={{ fill: '#3A5255', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#3A5255', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(31,122,114,0.06)' }} />
        <Bar
          dataKey="count"
          fill="#1F7A72"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
