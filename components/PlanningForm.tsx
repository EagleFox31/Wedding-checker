import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Type } from 'lucide-react';
import { TimelineItem } from '../types';

interface PlanningFormProps {
  initialData?: TimelineItem;
  onSubmit: (item: Omit<TimelineItem, 'id'>) => Promise<void>;
  onClose: () => void;
}

const PlanningForm: React.FC<PlanningFormProps> = ({ initialData, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    time: '',
    title: '',
    description: '',
    isHighlight: false,
    completed: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
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
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horaire</label>
            <div className="relative">
              <Clock size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                placeholder="Ex: 20h00 - 20h30"
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
                placeholder="Ex: Ouverture du Bal"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Détails)</label>
            <textarea
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24"
              placeholder="Détails du déroulé, musiques, intervenants..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="flex items-center gap-2 cursor-pointer bg-indigo-50 p-3 rounded-lg border border-indigo-100">
             <input
                type="checkbox"
                id="highlight"
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={formData.isHighlight}
                onChange={e => setFormData({...formData, isHighlight: e.target.checked})}
             />
             <label htmlFor="highlight" className="text-sm font-medium text-indigo-900 cursor-pointer select-none">
                 Marquer comme moment clé (Highlight)
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