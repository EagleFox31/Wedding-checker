import React from 'react';
import { DashboardStats } from '../types';

interface StatsProps {
  stats: DashboardStats;
}

const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="mb-4">
      <div className="grid grid-cols-4 gap-2 mb-2">
        {/* Total */}
        <div className="bg-white py-2 px-1 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-800 leading-tight">{stats.total}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Invités</span>
        </div>

        {/* Arrived */}
        <div className="bg-emerald-50 py-2 px-1 rounded-xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-emerald-700 leading-tight">{stats.arrived}</span>
          <span className="text-[9px] text-emerald-600/80 font-bold uppercase tracking-wide">Présents</span>
        </div>

        {/* Pending */}
        <div className="bg-white py-2 px-1 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-800 leading-tight">{stats.pending}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">À venir</span>
        </div>

        {/* Absent */}
        <div className="bg-rose-50 py-2 px-1 rounded-xl shadow-sm border border-rose-100 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-rose-800 leading-tight">{stats.absent}</span>
          <span className="text-[9px] text-rose-600/80 font-bold uppercase tracking-wide">Absents</span>
        </div>
      </div>
      
      {/* Progress Bar Compact */}
      <div className="w-full flex items-center gap-2">
        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-emerald-600 w-8 text-right">{stats.percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default Stats;