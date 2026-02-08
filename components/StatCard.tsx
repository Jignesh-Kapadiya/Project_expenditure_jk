
import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subLabel?: string;
  colorClass: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subLabel, colorClass, icon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
    <div className={`p-3 rounded-xl ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      {subLabel && <p className="text-xs text-gray-400 mt-1">{subLabel}</p>}
    </div>
  </div>
);

export default StatCard;
