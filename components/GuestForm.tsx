import React, { useState, useEffect } from 'react';
import { X, Save, User, Utensils, Tag } from 'lucide-react';
import { Guest } from '../types';

interface GuestFormProps {
  initialData?: Guest;
  onSubmit: (guestData: Omit<Guest, 'id'>) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

const GuestForm: React.FC<GuestFormProps> = ({ initialData, onSubmit, onClose, isSubmitting }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    tableNumber: '',
    tableName: '',
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
        tableNumber: initialData.tableNumber.toString(),
        tableName: initialData.tableName || '',
        inviter: initialData.inviter,
        description: initialData.description || '',
        plusOne: initialData.plusOne || false,
        hasArrived: initialData.hasArrived,
        isAbsent: initialData.isAbsent || false
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.tableNumber) return;

    onSubmit({
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      tableNumber: formData.tableNumber, 
      tableName: formData.tableName.trim(),
      description: formData.description.trim()
    });
  };

  const isEdit = !!initialData;

  return (
    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-serif text-xl font-bold text-slate-800">
            {isEdit ? 'Modifier invité' : 'Ajouter un invité'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
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

          <div className="grid grid-cols-3 gap-3">
             <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Table N°</label>
                <div className="relative">
                <Utensils size={16} className="absolute left-2.5 top-3 text-slate-400" />
                <input
                    type="text"
                    required
                    className="w-full pl-8 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                    placeholder="1"
                    value={formData.tableNumber}
                    onChange={e => setFormData({...formData, tableNumber: e.target.value})}
                />
                </div>
             </div>
             <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom Table (Optionnel)</label>
                <div className="relative">
                <Tag size={16} className="absolute left-2.5 top-3 text-slate-400" />
                <input
                    type="text"
                    className="w-full pl-8 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ex: Honneur"
                    value={formData.tableName}
                    onChange={e => setFormData({...formData, tableName: e.target.value})}
                />
                </div>
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
                    hasArrived: e.target.checked ? false : formData.hasArrived // Force not arrived if absent
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
                  {isEdit ? 'Enregistrer les modifications' : 'Ajouter à la liste'}
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