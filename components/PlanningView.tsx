import React, { useState, useEffect, useMemo } from 'react';
import { TimelineItem, UserRole, PlanningCategory } from '../types';
import { CheckCircle2, Clock, Edit2, Trash2, Plus, AlertCircle, Timer, Play, Flag, RotateCcw, AlertTriangle, Sun, Building2, Wine, Church, MoonStar, Eye } from 'lucide-react';
import * as planningService from '../services/planningService';

interface PlanningViewProps {
  items: TimelineItem[];
  userRole: UserRole;
  onToggle: (id: string, current: boolean) => void;
  onEdit: (item: TimelineItem) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onRefresh: () => Promise<void>;
}

const PlanningView: React.FC<PlanningViewProps> = ({ items, userRole, onToggle, onEdit, onDelete, onAdd, onRefresh }) => {
  const isAdmin = userRole === 'admin';
  const isGuest = userRole === 'guest';
  const canEdit = userRole === 'admin' || userRole === 'planner';

  const [now, setNow] = useState(new Date());
  const [isPartyStarted, setIsPartyStarted] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [activeTab, setActiveTab] = useState<PlanningCategory>('soiree'); // Default to Soirée as it's the main event
  
  // Reset Confirmation State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Party Status
  useEffect(() => {
    const checkStatus = async () => {
        const started = await planningService.getPartyStatus();
        setIsPartyStarted(started);
        setLoadingStatus(false);
    };
    checkStatus();
  }, []);

  const handleStartParty = () => {
      setIsPartyStarted(true);
      planningService.setPartyStarted(true).catch(err => {
          console.error("Erreur de sauvegarde en background", err);
      });
  };

  const confirmStopParty = async () => {
      setIsResetting(true);
      try {
          await planningService.setPartyStarted(false);
          await planningService.resetPlanningProgress();
          setIsPartyStarted(false);
          await onRefresh();
      } catch (e) {
          console.error(e);
          alert("Une erreur est survenue lors de la réinitialisation.");
      } finally {
          setIsResetting(false);
          setShowResetConfirm(false);
      }
  };

  // Stats Globales
  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Filter items by category
  const filteredItems = useMemo(() => {
      return items.filter(i => (i.category || 'soiree') === activeTab);
  }, [items, activeTab]);

  // Find active index relative to full list (for global logic) but visually highlighting needs context
  const activeItem = items.find(i => !i.completed);

  // Tabs Configuration
  const tabs: { id: PlanningCategory; label: string; icon: React.ReactNode }[] = [
      { id: 'matin', label: 'Matin', icon: <Sun size={14} /> },
      { id: 'mairie', label: 'Mairie', icon: <Building2 size={14} /> },
      { id: 'cocktail', label: 'Cocktail', icon: <Wine size={14} /> },
      { id: 'eglise', label: 'Église', icon: <Church size={14} /> },
      { id: 'soiree', label: 'Soirée', icon: <MoonStar size={14} /> },
  ];

  return (
    <div className="pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Progress Bar Header */}
      <div className="bg-white p-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-end mb-2">
            <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Flag size={14} className="text-blue-600"/>
                    Avancement Global
                </h3>
            </div>
            <div className="flex items-center gap-3">
                {isAdmin && isPartyStarted && (
                    <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-rose-200 transition-colors animate-in fade-in"
                    >
                        <RotateCcw size={12} />
                        RÉINITIALISER
                    </button>
                )}
                {isGuest && isPartyStarted && (
                   <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold animate-pulse">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      EN DIRECT
                   </div>
                )}
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{completedCount}/{totalCount}</span>
            </div>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
            />
        </div>
      </div>

      <div className="px-4 py-3 mt-4 bg-slate-100/50 mb-2 rounded-lg mx-4 flex items-center gap-3 border border-slate-100">
        <Clock className="text-slate-400" size={20} />
        <div>
           <h3 className="font-bold text-slate-800 text-sm">Programme - 29 Novembre 2025</h3>
           <p className="text-[10px] text-slate-500">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {isPartyStarted ? ' • Célébration en cours' : ' • En attente'}
           </p>
        </div>
      </div>

      {!loadingStatus && !isPartyStarted && canEdit && (
          <div className="px-4 mb-4 animate-in zoom-in duration-300">
              <button 
                onClick={handleStartParty}
                className="w-full py-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all group"
              >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Play size={16} fill="currentColor" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-sm leading-tight">LANCER LE MARIAGE</span>
                  </div>
              </button>
          </div>
      )}

      {/* Category Tabs */}
      <div className="px-4 mb-4">
          <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar gap-1">
              {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        flex-1 py-2 px-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 min-w-[60px]
                        ${activeTab === tab.id 
                            ? 'bg-white text-blue-800 shadow-sm border border-slate-100' 
                            : 'text-slate-500 hover:text-slate-700'
                        }
                    `}
                  >
                      {tab.icon}
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      <div className="relative px-4 pb-12">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>

        {filteredItems.length === 0 ? (
            <div className="text-center py-10 pl-8">
                <p className="text-slate-400 text-sm">Aucune étape dans cette section.</p>
            </div>
        ) : (
            filteredItems.map((item) => {
            // Status logic
            const isCompleted = item.completed;
            const isActive = isPartyStarted && item.id === activeItem?.id;
            
            // Punctuality Logic
            let delayBadge = null;
            let containerClass = "bg-white border-slate-100 shadow-sm";

            if (isActive) {
                containerClass = "bg-white border-blue-200 shadow-md ring-1 ring-blue-50";
                
                const startTime = planningService.getStartTimeFromString(item.time);
                if (startTime) {
                    const diffMs = now.getTime() - startTime.getTime();
                    const delayMinutes = Math.floor(diffMs / 60000);

                    if (delayMinutes > 15) {
                        delayBadge = (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 animate-pulse">
                                <AlertCircle size={10} />
                                +{delayMinutes} min
                            </div>
                        );
                    } else if (delayMinutes > 5) {
                        delayBadge = (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                <Timer size={10} />
                                +{delayMinutes} min
                            </div>
                        );
                    }
                }
            } else if (isCompleted) {
                containerClass = "bg-slate-50 border-slate-100 opacity-60 grayscale";
            }

            return (
                <div 
                    key={item.id} 
                    className={`relative mb-6 pl-10 group transition-all duration-500 animate-in slide-in-from-right-2`}
                >
                    {/* Checkbox / Status Indicator */}
                    <button
                        onClick={() => canEdit && onToggle(item.id, item.completed)}
                        disabled={!canEdit}
                        className={`
                            absolute left-2.5 -translate-x-1/2 top-0 
                            w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center z-10 transition-all
                            ${isCompleted 
                                ? 'border-emerald-500 text-emerald-500' 
                                : isActive 
                                    ? 'border-blue-500 text-blue-500 ring-4 ring-blue-50' 
                                    : 'border-slate-300 text-transparent'
                            }
                            ${!canEdit ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                        `}
                    >
                        {isCompleted ? <CheckCircle2 size={16} fill="currentColor" className="text-white" /> : <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500' : 'bg-transparent'}`} />}
                    </button>

                    {/* Content Card */}
                    <div className={`p-4 rounded-xl border transition-all ${containerClass}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col items-start gap-1">
                                <span className={`text-xs font-bold tracking-wide px-2 py-0.5 rounded-full ${item.isHighlight && !isCompleted ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {item.time}
                                </span>
                                {isActive && delayBadge && (
                                    <div className="mt-1">{delayBadge}</div>
                                )}
                            </div>
                            
                            {isAdmin && (
                                <div className="flex gap-2">
                                    <button onClick={() => onEdit(item)} className="p-1 text-slate-400 hover:text-blue-600">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => { if(confirm('Supprimer ?')) onDelete(item.id) }} className="p-1 text-slate-400 hover:text-rose-600">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                            {isActive && (
                                <span className="text-[9px] font-black uppercase tracking-wider text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                    En cours
                                </span>
                            )}
                            <h4 className={`font-bold text-base leading-tight ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                {item.title}
                            </h4>
                        </div>
                        
                        {item.description && (
                            <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed">
                                {item.description}
                            </p>
                        )}
                    </div>
                </div>
            );
            })
        )}
      </div>

      {canEdit && (
          <div className="px-4 mt-4">
              <button 
                onClick={onAdd}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 font-bold text-sm"
              >
                  <Plus size={18} />
                  Ajouter dans "{tabs.find(t => t.id === activeTab)?.label}"
              </button>
          </div>
      )}

      {/* Confirmation Modal */}
      {showResetConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Réinitialiser le programme ?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Cela arrêtera le mode "Direct" et <b>décoche toutes les étapes</b>. Cette action est irréversible.
                    </p>
                    <div className="flex w-full gap-3">
                        <button 
                            onClick={() => setShowResetConfirm(false)}
                            disabled={isResetting}
                            className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Annuler
                        </button>
                        <button 
                            onClick={confirmStopParty}
                            disabled={isResetting}
                            className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-rose-200"
                        >
                            {isResetting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirmer'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PlanningView;