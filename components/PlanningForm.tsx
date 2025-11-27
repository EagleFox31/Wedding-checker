import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Type, Layout } from 'lucide-react';
import { TimelineItem, PlanningCategory } from '../types';

interface PlanningFormProps {
  initialData?: TimelineItem;
  onSubmit: (item: Omit<TimelineItem, 'id'>) => Promise<void>;
  onClose: () => void;
}

const PlanningForm: React.FC<PlanningFormProps> = ({ initialData, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    category: 'soiree' as PlanningCategory,
    time: '',
    title: '',
    description: '',
    isHighlight: false,
    completed: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category || 'soiree',
        time: initialData.time,
        title: initialData.title,
        description: initialData.description || '',
        isHighlight: initialData.isHighlight || false,
        completed: initialData.completed
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.time) return;
    onSubmit({ ...formData });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-serif text-xl font-bold text-slate-800">
            {initialData ? 'Modifier l\'étape' : 'Nouvelle étape'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Section du Mariage</label>
            <div className="relative">
              <Layout size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <select
                className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-800"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as PlanningCategory})}
              >
                  <option value="matin">1. Matin (Préparatifs)</option>
                  <option value="mairie">2. Mairie (Civil)</option>
                  <option value="cocktail">3. Cocktail</option>
                  <option value="eglise">4. Église (Religieux)</option>
                  <option value="soiree">5. Soirée Nuptiale</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horaire</label>
                <div className="relative">
                <Clock size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                    type="text"
                    required
                    className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                    placeholder="Ex: 20h00"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Titre</label>
                <div className="relative">
                <Type size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                    type="text"
                    required
                    className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ex: Ouverture"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                />
                </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Détails)</label>
            <textarea
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24 text-sm"
              placeholder="Détails du déroulé, musiques, intervenants..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="flex items-center gap-2 cursor-pointer bg-amber-50 p-3 rounded-lg border border-amber-100">
             <input
                type="checkbox"
                id="highlight"
                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                checked={formData.isHighlight}
                onChange={e => setFormData({...formData, isHighlight: e.target.checked})}
             />
             <label htmlFor="highlight" className="text-sm font-medium text-amber-900 cursor-pointer select-none">
                 Moment clé (Highlight)
             </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex justify-center items-center gap-2"
            >
               <Save size={20} />
               Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanningForm;