import React, { useMemo, useState } from 'react';
import { Guest, UserRole, Table } from '../types';
import { User, ChevronUp, Pencil, Save, X } from 'lucide-react';

interface TableViewProps {
  guests: Guest[];
  tables: Table[]; // New prop: list of real table objects
  userRole?: UserRole | null;
  onUpdateTable?: (tableId: string, newNumber: string, newName: string) => Promise<void>;
}

interface TableGroup {
  id: string; // The Real Table ID (ex: t_1)
  number: string | number; // Display Number
  displayName: string; // Display Name
  guests: Guest[];
  total: number;
  arrived: number;
  percentage: number;
}

const TableView: React.FC<TableViewProps> = ({ guests, tables, userRole, onUpdateTable }) => {
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<{id: string, number: string, name: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const tableGroups = useMemo(() => {
    // 1. Initialize groups for ALL tables (even empty ones)
    const groups: { [key: string]: TableGroup } = {};

    tables.forEach(t => {
        groups[t.id] = {
            id: t.id,
            number: t.number,
            displayName: t.name,
            guests: [],
            total: 0,
            arrived: 0,
            percentage: 0
        };
    });

    // 2. Distribute Guests
    guests.forEach(guest => {
        // Find matching table by ID, or fallback to number matches (for legacy data)
        let tableId = guest.tableId;
        
        if (!tableId || !groups[tableId]) {
             // Fallback: try to find a table with matching number
             const match = tables.find(t => t.number.toString() === guest.tableNumber.toString());
             if (match) tableId = match.id;
        }

        if (tableId && groups[tableId]) {
            const group = groups[tableId];
            group.guests.push(guest);
            group.total += 1;
            if (guest.plusOne) group.total += 1;
            if (guest.hasArrived) {
                group.arrived += 1;
                if (guest.plusOne) group.arrived += 1;
            }
        } else {
            // Orphan guests? We might want to handle them, but for now we ignore or put in "No Table"
        }
    });

    // 3. Calculate percentages
    Object.values(groups).forEach(group => {
      group.percentage = group.total > 0 ? Math.round((group.arrived / group.total) * 100) : 0;
    });

    // 4. Sort
    return Object.values(groups).sort((a, b) => {
      const numA = parseInt(a.number.toString());
      const numB = parseInt(b.number.toString());
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.number.toString().localeCompare(b.number.toString());
    });
  }, [guests, tables]);

  const toggleExpand = (id: string) => {
    if (editingTable) return; 
    setExpandedTable(expandedTable === id ? null : id);
  };

  const startEditing = (e: React.MouseEvent, table: TableGroup) => {
      e.stopPropagation();
      setEditingTable({
          id: table.id,
          number: table.number.toString(),
          name: table.displayName
      });
  };

  const handleSaveTable = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTable || !onUpdateTable) return;

      setIsSaving(true);
      try {
          await onUpdateTable(editingTable.id, editingTable.number, editingTable.name);
          setEditingTable(null);
      } catch (err) {
          console.error(err);
          alert("Erreur lors de la mise à jour");
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="grid grid-cols-2 gap-3 pb-8 animate-in fade-in zoom-in duration-300">
      {tableGroups.map((table) => {
        const isComplete = table.total > 0 && table.percentage === 100;
        const isEmpty = table.total === 0;
        const isExpanded = expandedTable === table.id;
        const isEditing = editingTable?.id === table.id;

        if (isEditing) {
            return (
                <div key={`edit-${table.id}`} className="col-span-2 bg-white rounded-2xl border-2 border-blue-500 shadow-xl p-4 z-10 animate-in zoom-in duration-200">
                    <form onSubmit={handleSaveTable} className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="font-bold text-sm text-blue-600 flex items-center gap-2">
                                <Pencil size={14} />
                                Modifier la table
                             </h3>
                             <button type="button" onClick={() => setEditingTable(null)} className="p-1.5 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
                                 <X size={16} />
                             </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Numéro</label>
                                <input 
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editingTable?.number ?? ''}
                                    onChange={(e) => setEditingTable(prev => prev ? {...prev, number: e.target.value} : null)}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nom</label>
                                <input 
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Les Mariés"
                                    value={editingTable?.name ?? ''}
                                    onChange={(e) => setEditingTable(prev => prev ? {...prev, name: e.target.value} : null)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md shadow-blue-200"
                        >
                            {isSaving ? <span className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full"/> : <Save size={14} />}
                            Enregistrer (Met à jour tous les invités)
                        </button>
                    </form>
                </div>
            );
        }

        return (
          <div 
            key={table.id}
            onClick={() => toggleExpand(table.id)}
            className={`
              flex flex-col relative rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer group
              ${isExpanded ? 'col-span-2 order-first' : 'col-span-1'}
              ${isComplete 
                ? 'bg-emerald-50 border-emerald-200' 
                : isEmpty 
                  ? 'bg-white border-slate-200' 
                  : 'bg-white border-emerald-500 shadow-md shadow-emerald-100 ring-1 ring-emerald-500/20'
              }
            `}
          >
            {/* Progress Bar Background */}
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-emerald-100/30 transition-all duration-1000 ease-out z-0`}
              style={{ height: isExpanded ? '0%' : `${table.percentage}%` }}
            />

            <div className="relative z-10 p-4 flex flex-col h-full justify-between">
              
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1">
                      <h3 className={`font-bold text-lg leading-none ${isComplete ? 'text-emerald-800' : 'text-slate-800'}`}>
                        {table.number}
                      </h3>
                      {userRole === 'admin' && (
                          <button 
                             onClick={(e) => startEditing(e, table)}
                             className="p-1.5 bg-white rounded-full text-slate-400 hover:text-blue-600 border border-slate-100 transition-all shadow-sm"
                          >
                              <Pencil size={12} />
                          </button>
                      )}
                  </div>
                  {table.displayName && (
                     <p className={`text-xs font-semibold truncate mt-0.5 ${isComplete ? 'text-emerald-700' : 'text-blue-600'}`}>
                        {table.displayName}
                     </p>
                  )}
                </div>
                
                <div className={`
                  px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0
                  ${isComplete ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}
                `}>
                  <User size={10} />
                  {table.arrived}/{table.total}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-2 space-y-2 animate-in slide-in-from-top-2">
                  <div className="h-px bg-slate-100 w-full mb-2"></div>
                  {table.guests.length === 0 && <p className="text-xs text-slate-300 italic">Table vide</p>}
                  {table.guests.map(guest => (
                    <div key={guest.id} className="flex items-center justify-between text-sm">
                      <span className={`truncate mr-2 ${guest.hasArrived ? 'text-emerald-700 line-through decoration-emerald-500/30' : 'text-slate-700'}`}>
                        {guest.firstName} {guest.lastName}
                      </span>
                      {guest.hasArrived && <span className="text-emerald-500 text-xs shrink-0">✓</span>}
                    </div>
                  ))}
                  <div className="flex justify-center pt-2 text-slate-300">
                    <ChevronUp size={16} />
                  </div>
                </div>
              )}

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