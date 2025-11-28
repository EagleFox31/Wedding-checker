import React, { useState, useEffect } from 'react';
import { X, Save, Utensils } from 'lucide-react';
import { Guest, Table } from '../types';

interface GuestFormProps {
  initialData?: Guest;
  tables: Table[]; // Pass existing tables to select
  onSubmit: (guestData: Omit<Guest, 'id'>) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

const GuestForm: React.FC<GuestFormProps> = ({ initialData, tables, onSubmit, onClose, isSubmitting }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    tableId: '', // Selected Table ID
    inviter: 'Serge',
    description: '',
    plusOne: false,
    hasArrived: false,
    isAbsent: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        tableId: initialData.tableId || '',
        inviter: initialData.inviter,
        description: initialData.description || '',
        plusOne: initialData.plusOne || false,
        hasArrived: initialData.hasArrived,
        isAbsent: initialData.isAbsent || false
      });
    } else if (tables.length > 0) {
        // Default to first table if creating new
        const sortedTables = [...tables].sort((a,b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));
        if(sortedTables.length > 0) {
             setFormData(prev => ({...prev, tableId: sortedTables[0].id}));
        }
    }
  }, [initialData, tables]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.tableId) return;

    // Find table info for fallback data
    const selectedTable = tables.find(t => t.id === formData.tableId);
    
    onSubmit({
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      tableNumber: selectedTable?.number || 0, // Fallback
      tableName: selectedTable?.name || '', // Fallback
      description: formData.description.trim()
    });
  };

  const isEdit = !!initialData;

  return (
    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-serif text-xl font-bold text-slate-800">
            {isEdit ? 'Modifier invité' : 'Ajouter un invité'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prénom</label>
              <input
                type="text"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Ex: Jean"
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom</label>
              <input
                type="text"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Ex: Dupont"
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Table</label>
             <div className="relative">
                <Utensils size={16} className="absolute left-2.5 top-3 text-slate-400" />
                <select
                    required
                    className="w-full pl-8 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-800 appearance-none"
                    value={formData.tableId}
                    onChange={e => setFormData({...formData, tableId: e.target.value})}
                >
                    <option value="" disabled>Choisir une table...</option>
                    {tables.sort((a,b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true })).map(table => (
                        <option key={table.id} value={table.id}>
                            Table {table.number} {table.name ? `- ${table.name}` : ''}
                        </option>
                    ))}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Invité par</label>
              <select
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.inviter}
                onChange={e => setFormData({...formData, inviter: e.target.value})}
              >
                <option value="Serge">Serge (Marié)</option>
                <option value="Christiane">Christiane (Mariée)</option>
                <option value="Parents">Parents</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            
            <div className="flex flex-col justify-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  checked={formData.plusOne}
                  onChange={e => setFormData({...formData, plusOne: e.target.checked})}
                />
                <span className="text-xs font-medium text-slate-700">Vient avec +1</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                  checked={formData.isAbsent}
                  onChange={e => setFormData({
                    ...formData, 
                    isAbsent: e.target.checked,
                    hasArrived: e.target.checked ? false : formData.hasArrived 
                  })}
                />
                <span className="text-xs font-medium text-rose-600">Absent</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Note / Relation</label>
            <input
              type="text"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Ex: Ami d'enfance"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
              ) : (
                <>
                  <Save size={20} />
                  {isEdit ? 'Enregistrer' : 'Ajouter'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestForm;