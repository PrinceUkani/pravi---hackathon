import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

// Theme-tailored color schemes
const EMERALD_CHAMPAGNE_COLORS = [
  '#0d4f2e', // Deep emerald
  '#10b981', // Vivid emerald
  '#d4a347', // Champagne gold
  '#34d399', // Mint emerald
  '#edd59d', // Champagne pale
  '#065f46', // Forest
  '#f59e0b', // Amber
  '#3b82f6', // Slate blue
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-emeraldInk-950 text-white p-2.5 rounded-xl border border-emeraldInk-800 shadow-xl text-xs">
        <p className="font-semibold text-champagne-300">{label || payload[0]?.name}</p>
        <p className="text-slate-200 mt-0.5">
          {payload[0]?.value?.toLocaleString()} {payload[0]?.unit || 'units'}
        </p>
      </div>
    );
  }
  return null;
};

// 1. Assets by Category Bar Chart
export const CategoryBarChart = ({ data = [] }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#888888' }}
            interval={0}
            angle={-25}
            textAnchor="end"
          />
          <YAxis tick={{ fontSize: 11, fill: '#888888' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={EMERALD_CHAMPAGNE_COLORS[index % EMERALD_CHAMPAGNE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 2. Assets by Status Donut Chart
export const StatusPieChart = ({ data = [] }) => {
  const statusColors = {
    ACTIVE: '#10b981',
    ASSIGNED: '#059669',
    INSTALLED: '#0d9488',
    RECEIVED: '#0891b2',
    PROCUREMENT: '#2563eb',
    MAINTENANCE: '#f59e0b',
    REPAIR: '#ea580c',
    RETIRED: '#64748b',
    DISPOSED: '#475569',
    DAMAGED: '#e11d48',
  };

  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={statusColors[entry.name] || EMERALD_CHAMPAGNE_COLORS[index % EMERALD_CHAMPAGNE_COLORS.length]}
              />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 3. Maintenance Cost Trend (Area Chart)
export const MaintenanceCostTrendChart = ({ data = [] }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="emeraldCostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d4a347" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#d4a347" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888888' }} />
          <YAxis tick={{ fontSize: 11, fill: '#888888' }} tickFormatter={(val) => `$${val}`} />
          <Tooltip
            formatter={(value) => [`$${value.toLocaleString()}`, 'Maintenance Spend']}
            contentStyle={{ backgroundColor: '#042716', borderColor: '#0d4f2e', borderRadius: '12px', fontSize: '12px' }}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#d4a347"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#emeraldCostGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// 4. Warranty Expiration Buckets Chart
export const WarrantyDonutChart = ({ data = [] }) => {
  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || EMERALD_CHAMPAGNE_COLORS[index]} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 5. Asset Age Distribution Bar Chart
export const AgeDistributionBarChart = ({ data = [] }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888888' }} />
          <YAxis tick={{ fontSize: 11, fill: '#888888' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
