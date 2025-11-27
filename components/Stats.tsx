import React from 'react';
import { DashboardStats } from '../types';
import { Users, UserCheck, Clock, UserX } from 'lucide-react';

interface StatsProps {
  stats: DashboardStats;
}

const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Total */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <div className="text-slate-400 mb-1">
            <Users size={18} />
          </div>
          <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Invités</span>
        </div>

        {/* Arrived */}
        <div className="bg-emerald-50 p-3 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-100 rounded-bl-full -mr-2 -mt-2"></div>
          <div className="text-emerald-500 mb-1">
            <UserCheck size={18} />
          </div>
          <span className="text-2xl font-bold text-emerald-700">{stats.arrived}</span>
          <span className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">Présents</span>
        </div>

        {/* Pending */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <div className="text-slate-400 mb-1">
            <Clock size={18} />
          </div>
          <span className="text-2xl font-bold text-slate-800">{stats.pending}</span>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">À venir</span>
        </div>

        {/* Absent */}
        <div className="bg-rose-50 p-3 rounded-2xl shadow-sm border border-rose-100 flex flex-col items-center justify-center">
          <div className="text-rose-400 mb-1">
            <UserX size={18} />
          </div>
          <span className="text-2xl font-bold text-rose-800">{stats.absent}</span>
          <span className="text-[10px] text-rose-600 font-medium uppercase tracking-wider">Absents</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5 px-1">
          <span>Taux de présence</span>
          <span className="font-semibold">{stats.percentage.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Stats;