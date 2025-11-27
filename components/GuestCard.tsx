import React, { useState, useRef, useEffect } from 'react';
import { Guest } from '../types';
import { Check, Utensils, Info, MoreVertical, Trash2, Edit } from 'lucide-react';

interface GuestCardProps {
  guest: Guest;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onEdit: (guest: Guest) => void;
  onDelete: (id: string) => void;
}

const GuestCard: React.FC<GuestCardProps> = ({ guest, onToggleStatus, onEdit, onDelete }) => {
  const isArrived = guest.hasArrived;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = (e: React.MouseEvent, action: 'edit' | 'delete') => {
    e.stopPropagation();
    setShowMenu(false);
    if (action === 'edit') onEdit(guest);
    if (action === 'delete') {
      if(window.confirm(`Supprimer ${guest.firstName} ${guest.lastName} ?`)) {
        onDelete(guest.id);
      }
    }
  };

  return (
    <div 
      className={`
        relative overflow-visible rounded-2xl border transition-all duration-300 mb-3
        ${isArrived 
          ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' 
          : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'
        }
      `}
    >
      <div className="p-4 flex items-center justify-between">
        {/* Left Info */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold text-lg truncate ${isArrived ? 'text-emerald-900' : 'text-slate-800'}`}>
              {guest.firstName} <span className="uppercase">{guest.lastName}</span>
            </h3>
            {guest.plusOne && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                +1
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            {guest.description && (
              <span className="flex items-center gap-1">
                <Info size={12} />
                {guest.description}
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400">
              via {guest.inviter}
            </span>
          </div>
        </div>

        {/* Right Info: Table Badge & Actions */}
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-1">
            <div className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm
              ${isArrived 
                ? 'bg-white text-emerald-700 border border-emerald-100' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
              }
            `}>
              <Utensils size={12} />
              <span className="whitespace-nowrap">Table {guest.tableNumber}</span>
            </div>
            
            {/* Context Menu Button */}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              >
                <MoreVertical size={16} />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                  <button 
                    onClick={(e) => handleMenuAction(e, 'edit')}
                    className="w-full text-left px-4 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                  >
                    <Edit size={14} />
                    Changer table
                  </button>
                  <button 
                    onClick={(e) => handleMenuAction(e, 'delete')}
                    className="w-full text-left px-4 py-3 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Désactiver
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => onToggleStatus(guest.id, isArrived)}
            className={`
              flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-90
              ${isArrived 
                ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' 
                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
              }
            `}
          >
            <Check size={24} strokeWidth={3} className={`transition-all duration-300 ${isArrived ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
            <div className={`absolute w-4 h-4 rounded-full bg-slate-300 transition-all duration-300 ${isArrived ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`} />
          </button>
        </div>
      </div>
      
      {/* Arrived Timestamp overlay (optional subtle detail) */}
      {isArrived && guest.arrivedAt && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 opacity-20"></div>
      )}
    </div>
  );
};

export default GuestCard;