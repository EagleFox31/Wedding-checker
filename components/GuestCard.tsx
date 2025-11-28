import React, { useState, useRef, useEffect } from 'react';
import { Guest, UserRole } from '../types';
import { Check, Utensils, Info, MoreVertical, Trash2, Edit, XCircle, UserX } from 'lucide-react';

interface GuestCardProps {
  guest: Guest;
  userRole: UserRole;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onToggleAbsent: (id: string, currentAbsent: boolean) => void;
  onEdit: (guest: Guest) => void;
  onDelete: (id: string) => void;
}

const GuestCard: React.FC<GuestCardProps> = ({ guest, userRole, onToggleStatus, onToggleAbsent, onEdit, onDelete }) => {
  const isArrived = guest.hasArrived;
  const isAbsent = guest.isAbsent;
  const isGuestRole = userRole === 'guest';
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

  const handleMenuAction = (e: React.MouseEvent, action: 'edit' | 'delete' | 'absent') => {
    e.stopPropagation();
    setShowMenu(false);
    if (action === 'edit') onEdit(guest);
    if (action === 'delete') {
      if(window.confirm(`Supprimer ${guest.firstName} ${guest.lastName} ?`)) {
        onDelete(guest.id);
      }
    }
    if (action === 'absent') {
      onToggleAbsent(guest.id, !!guest.isAbsent);
    }
  };

  return (
    <div 
      className={`
        relative overflow-visible rounded-2xl border transition-all duration-300 flex flex-col justify-between
        ${isArrived && !isGuestRole
          ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' 
          : isAbsent && !isGuestRole
            ? 'bg-rose-50/50 border-rose-200 shadow-sm opacity-80'
            : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'
        }
      `}
    >
      <div className="p-3">
        {/* Header: Name and Menu */}
        <div className="flex justify-between items-start mb-2">
           <div className="min-w-0 pr-1">
              <h3 className={`font-bold text-sm leading-tight truncate ${isArrived && !isGuestRole ? 'text-emerald-900' : isAbsent && !isGuestRole ? 'text-rose-900 line-through' : 'text-slate-800'}`}>
                {guest.firstName}
              </h3>
              <h3 className={`font-bold text-sm leading-tight uppercase truncate ${isArrived && !isGuestRole ? 'text-emerald-900' : isAbsent && !isGuestRole ? 'text-rose-900 line-through' : 'text-slate-800'}`}>
                {guest.lastName}
              </h3>
              {guest.plusOne && (
                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${isAbsent && !isGuestRole ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  +1
                </span>
              )}
           </div>

           {userRole === 'admin' && (
              <div className="relative -mt-1 -mr-1" ref={menuRef}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                >
                  <MoreVertical size={14} />
                </button>
                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden">
                    <button 
                      onClick={(e) => handleMenuAction(e, 'edit')}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                    >
                      <Edit size={12} />
                      Table
                    </button>
                    <button 
                      onClick={(e) => handleMenuAction(e, 'absent')}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                    >
                      {isAbsent ? <Check size={12} /> : <UserX size={12} />}
                      {isAbsent ? 'Annuler Absence' : 'Signaler Absent'}
                    </button>
                    <button 
                      onClick={(e) => handleMenuAction(e, 'delete')}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <Trash2 size={12} />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
        
        {/* Info Line */}
        <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 mb-3">
            {guest.description && (
              <span className={`flex items-center gap-1 truncate ${isAbsent && !isGuestRole ? 'text-rose-400' : ''}`}>
                <Info size={10} />
                {guest.description}
              </span>
            )}
            <span className={`truncate ${isAbsent && !isGuestRole ? 'text-rose-300' : 'text-slate-400'}`}>
              {guest.inviter}
            </span>
        </div>

        {/* Bottom Action Row */}
        <div className="flex items-end justify-between mt-auto">
             <div className={`
              flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm max-w-[60%]
              ${isArrived && !isGuestRole
                ? 'bg-white text-emerald-700 border border-emerald-100' 
                : isAbsent && !isGuestRole
                  ? 'bg-white text-rose-500 border border-rose-100 opacity-50'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }
            `}>
              <Utensils size={10} />
              <span className="truncate">
                  {guest.tableNumber}
                  {guest.tableName ? ` • ${guest.tableName}` : ''}
              </span>
            </div>

            {/* HIDE CHECK BUTTON FOR GUESTS - OR MAKE IT INACTIVE */}
            {!isGuestRole && (
                <button
                onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(guest.id, isArrived);
                }}
                className={`
                flex items-center justify-center rounded-full transition-all duration-200 active:scale-90
                ${isArrived 
                    ? 'w-9 h-9 bg-emerald-500 text-white shadow-emerald-200 shadow-md' 
                    : isAbsent
                    ? 'px-2 h-7 bg-rose-100 text-rose-600 text-[9px] font-bold border border-rose-200'
                    : 'w-9 h-9 bg-slate-100 text-slate-300 hover:bg-slate-200'
                }
                `}
            >
                {isAbsent ? (
                <span>ABSENT</span>
                ) : (
                <>
                    <Check size={18} strokeWidth={3} className={`transition-all duration-200 ${isArrived ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                    <div className={`absolute w-3 h-3 rounded-full bg-slate-300 transition-all duration-200 ${isArrived ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`} />
                </>
                )}
            </button>
            )}
        </div>
      </div>
      
      {/* Arrived Overlay */}
      {isArrived && !isGuestRole && (
        <div className="absolute inset-0 border-2 border-emerald-500 rounded-2xl pointer-events-none opacity-10"></div>
      )}
    </div>
  );
};

export default GuestCard;