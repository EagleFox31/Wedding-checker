import React, { useMemo, useState } from 'react';
import { Guest } from '../types';
import { User, ChevronDown, ChevronUp } from 'lucide-react';

interface TableViewProps {
  guests: Guest[];
}

interface TableGroup {
  id: string | number;
  name: string;
  description?: string;
  guests: Guest[];
  total: number;
  arrived: number;
  percentage: number;
}

const TableView: React.FC<TableViewProps> = ({ guests }) => {
  const [expandedTable, setExpandedTable] = useState<string | number | null>(null);

  const tables = useMemo(() => {
    const groups: { [key: string]: TableGroup } = {};

    guests.forEach(guest => {
      const tableId = guest.tableNumber;
      if (!groups[tableId]) {
        groups[tableId] = {
          id: tableId,
          name: `Table ${tableId}`,
          description: guest.description, // Often the table description is shared among guests or at least one has it
          guests: [],
          total: 0,
          arrived: 0,
          percentage: 0
        };
      }
      groups[tableId].guests.push(guest);
      groups[tableId].total += 1; // +1 for guest
      if (guest.plusOne) groups[tableId].total += 1; // +1 for plus one if applicable (logic depends on if plusOne is a separate record or not, assuming flag here)
      
      if (guest.hasArrived) {
        groups[tableId].arrived += 1;
        if (guest.plusOne) groups[tableId].arrived += 1;
      }
    });

    // Calculate percentages
    Object.values(groups).forEach(group => {
      group.percentage = Math.round((group.arrived / group.total) * 100);
    });

    // Sort: Numeric tables first, then named tables
    return Object.values(groups).sort((a, b) => {
      const numA = parseInt(a.id.toString());
      const numB = parseInt(b.id.toString());
      
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return a.id.toString().localeCompare(b.id.toString());
    });
  }, [guests]);

  const toggleExpand = (id: string | number) => {
    if (expandedTable === id) {
      setExpandedTable(null);
    } else {
      setExpandedTable(id);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 pb-8 animate-in fade-in zoom-in duration-300">
      {tables.map((table) => {
        const isComplete = table.percentage === 100;
        const isEmpty = table.percentage === 0;
        const isExpanded = expandedTable === table.id;

        return (
          <div 
            key={table.id}
            onClick={() => toggleExpand(table.id)}
            className={`
              flex flex-col relative rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer
              ${isExpanded ? 'col-span-2 order-first' : 'col-span-1'}
              ${isComplete 
                ? 'bg-emerald-50 border-emerald-200' 
                : isEmpty 
                  ? 'bg-white border-slate-200' 
                  : 'bg-white border-emerald-500 shadow-md shadow-emerald-100 ring-1 ring-emerald-500/20'
              }
            `}
          >
            {/* Progress Bar Background (Vertical fill effect) */}
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-emerald-100/30 transition-all duration-1000 ease-out z-0`}
              style={{ height: isExpanded ? '0%' : `${table.percentage}%` }} // Hide background fill when expanded to keep text readable
            />

            <div className="relative z-10 p-4 flex flex-col h-full justify-between">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className={`font-bold text-lg leading-none mb-1 ${isComplete ? 'text-emerald-800' : 'text-slate-800'}`}>
                    {table.id}
                  </h3>
                  {table.guests[0].description && !isExpanded && (
                     <p className="text-[10px] text-slate-500 truncate max-w-[80px]">
                        {table.guests[0].description}
                     </p>
                  )}
                </div>
                
                {/* Badge Status */}
                <div className={`
                  px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1
                  ${isComplete ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}
                `}>
                  <User size={10} />
                  {table.arrived}/{table.total}
                </div>
              </div>

              {/* Guests List (Only when expanded) */}
              {isExpanded && (
                <div className="mt-2 space-y-2 animate-in slide-in-from-top-2">
                  <div className="h-px bg-slate-100 w-full mb-2"></div>
                  {table.guests.map(guest => (
                    <div key={guest.id} className="flex items-center justify-between text-sm">
                      <span className={`${guest.hasArrived ? 'text-emerald-700 line-through decoration-emerald-500/30' : 'text-slate-700'}`}>
                        {guest.firstName} {guest.lastName}
                      </span>
                      {guest.hasArrived && <span className="text-emerald-500 text-xs">✓</span>}
                    </div>
                  ))}
                  <div className="flex justify-center pt-2 text-slate-300">
                    <ChevronUp size={16} />
                  </div>
                </div>
              )}

              {/* Click instruction (Only when collapsed) */}
              {!isExpanded && (
                <div className="mt-2 flex justify-between items-end">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-emerald-400'}`} 
                            style={{ width: `${table.percentage}%` }}
                        />
                    </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TableView;