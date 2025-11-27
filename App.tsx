import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, RefreshCw, X, Settings, Utensils, Users, LayoutList, LayoutGrid, Plus, Lock, LogOut, ChevronRight, Download, CalendarClock, ListTodo, Crown, HeartHandshake, QrCode } from 'lucide-react';
import { Guest, GuestFilter, DashboardStats, UserRole, TimelineItem } from './types';
import * as guestService from './services/guestService';
import * as planningService from './services/planningService';
import Stats from './components/Stats';
import GuestCard from './components/GuestCard';
import AdminPanel from './components/AdminPanel';
import TableView from './components/TableView';
import GuestForm from './components/GuestForm';
import PlanningView from './components/PlanningView';
import PlanningForm from './components/PlanningForm';
import ShareQrModal from './components/ShareQrModal';

const App: React.FC = () => {
  // Auth State
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [pinError, setPinError] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [targetRole, setTargetRole] = useState<'admin' | 'planner' | 'hostess' | null>(null);
  const [isGuestLinkMode, setIsGuestLinkMode] = useState(false); // New state for restricted guest view

  // App State
  const [guests, setGuests] = useState<Guest[]>([]);
  const [planningItems, setPlanningItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [activeModule, setActiveModule] = useState<'checkin' | 'planning'>('checkin');
  
  // Check-in Module State
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<GuestFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tables'>('list');
  
  // Modal States
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Planning Modal States
  const [showPlanningForm, setShowPlanningForm] = useState(false);
  const [editingPlanningItem, setEditingPlanningItem] = useState<TimelineItem | null>(null);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // PWA Install Logic
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  // Check Local Storage for Session AND URL Params for Guest Mode
  useEffect(() => {
    // 1. Check URL for Guest Mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'guest') {
        setIsGuestLinkMode(true);
    }

    // 2. Check Session
    const savedRole = localStorage.getItem('wedding_app_role') as UserRole | null;
    if (savedRole) {
      setUserRole(savedRole);
      // Default view based on role
      if (savedRole === 'planner' || savedRole === 'guest') setActiveModule('planning');
    }
  }, []);

  // Initial Load
  useEffect(() => {
    if (userRole) {
      if (activeModule === 'checkin') loadGuests();
      if (activeModule === 'planning') loadPlanning();
    }
  }, [userRole, activeModule]);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const data = await guestService.fetchGuests();
      const sorted = data.sort((a, b) => a.lastName.localeCompare(b.lastName));
      setGuests(sorted);
    } catch (error) {
      console.error("Failed to load guests", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanning = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
        const data = await planningService.fetchPlanning();
        setPlanningItems(data);
    } catch (error) {
        console.error("Failed to load planning", error);
    } finally {
        if (showLoading) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeModule === 'checkin') await loadGuests();
    else await loadPlanning();
    setIsRefreshing(false);
  };

  // ------------------------------------------------------------------
  // AUTH HANDLERS
  // ------------------------------------------------------------------
  const checkPin = () => {
      let isValid = false;
      let role: UserRole = 'guest'; // default

      if (targetRole === 'admin') {
          if (pinInput === '2025') {
              role = 'admin';
              isValid = true;
          }
      } else if (targetRole === 'planner') {
          if (pinInput === '2026') {
              role = 'planner';
              isValid = true;
          }
      } else if (targetRole === 'hostess') {
          if (pinInput === '2024') {
              role = 'hostess';
              isValid = true;
          }
      }

      if (isValid) {
          setUserRole(role);
          localStorage.setItem('wedding_app_role', role);
          if (role === 'planner') setActiveModule('planning');
          else setActiveModule('checkin');
          
          setPinError(false);
          setTargetRole(null);
      } else {
          setPinError(true);
          setTimeout(() => setPinError(false), 2000);
      }
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem('wedding_app_role', role);
    if (role === 'planner' || role === 'guest') setActiveModule('planning');
    else setActiveModule('checkin');
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('wedding_app_role');
    setPinInput('');
    setTargetRole(null);
    setActiveModule('checkin');
  };

  // ------------------------------------------------------------------
  // GUEST LOGIC
  // ------------------------------------------------------------------
  const toggleGuestStatus = async (id: string, currentStatus: boolean) => {
    // Read only for guests
    if (userRole === 'guest') return;

    const newStatus = !currentStatus;
    setGuests(prev => prev.map(g => 
      g.id === id 
        ? { 
            ...g, 
            hasArrived: newStatus, 
            isAbsent: newStatus ? false : g.isAbsent, 
            arrivedAt: newStatus ? new Date().toISOString() : undefined 
          } 
        : g
    ));
    try {
      await guestService.updateGuestStatus(id, newStatus);
    } catch (error) {
      setGuests(prev => prev.map(g => g.id === id ? { ...g, hasArrived: currentStatus } : g));
    }
  };

  const handleToggleAbsent = async (id: string, currentAbsent: boolean) => {
    if (userRole === 'guest') return;
    
    const newAbsent = !currentAbsent;
    setGuests(prev => prev.map(g => 
      g.id === id 
        ? { 
            ...g, 
            isAbsent: newAbsent,
            hasArrived: newAbsent ? false : g.hasArrived,
            arrivedAt: newAbsent ? undefined : g.arrivedAt
          } 
        : g
    ));
    try {
      await guestService.setGuestAbsent(id, newAbsent);
    } catch (error) {
       loadGuests();
    }
  };

  const handleAddGuest = async (guestData: Omit<Guest, 'id'>) => {
    setIsSubmitting(true);
    try {
      const newGuest = await guestService.addGuest(guestData);
      setGuests(prev => [...prev, newGuest].sort((a, b) => a.lastName.localeCompare(b.lastName)));
      setShowGuestForm(false);
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const handleUpdateGuest = async (guestData: Omit<Guest, 'id'>) => {
    if (!editingGuest) return;
    setIsSubmitting(true);
    try {
      await guestService.updateGuestDetails(editingGuest.id, guestData);
      setGuests(prev => prev.map(g => g.id === editingGuest.id ? { ...g, ...guestData } : g));
      setEditingGuest(null);
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const handleDeleteGuest = async (id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
    try { await guestService.deleteGuest(id); } catch (error) { loadGuests(); }
  };

  // ------------------------------------------------------------------
  // PLANNING LOGIC
  // ------------------------------------------------------------------
  const togglePlanningItem = async (id: string, current: boolean) => {
      // Guests cannot toggle items
      if (userRole === 'guest') return;

      const newState = !current;
      setPlanningItems(prev => prev.map(i => i.id === id ? { ...i, completed: newState } : i));
      try {
          await planningService.toggleItemComplete(id, newState);
      } catch (e) {
          loadPlanning();
      }
  };

  const handleAddPlanning = async (item: Omit<TimelineItem, 'id'>) => {
      try {
          const newItem = await planningService.addPlanningItem(item);
          setPlanningItems(prev => [...prev, newItem].sort((a,b) => a.id.localeCompare(b.id))); // Rough sort
          setShowPlanningForm(false);
          loadPlanning(); // Reload to get proper order if backend sorted
      } catch (e) { console.error(e); }
  };

  const handleUpdatePlanning = async (item: Omit<TimelineItem, 'id'>) => {
      if (!editingPlanningItem) return;
      try {
          await planningService.updatePlanningItem(editingPlanningItem.id, item);
          setPlanningItems(prev => prev.map(i => i.id === editingPlanningItem.id ? { ...i, ...item } : i));
          setEditingPlanningItem(null);
      } catch (e) { console.error(e); }
  };

  const handleDeletePlanning = async (id: string) => {
      setPlanningItems(prev => prev.filter(i => i.id !== id));
      try { await planningService.deletePlanningItem(id); } catch (e) { loadPlanning(); }
  };

  // ------------------------------------------------------------------
  // DERIVED STATE
  // ------------------------------------------------------------------
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        guest.lastName.toLowerCase().includes(query) ||
        guest.firstName.toLowerCase().includes(query) ||
        guest.tableNumber.toString().toLowerCase().includes(query) ||
        guest.inviter.toLowerCase().includes(query);
      let matchesFilter = true;
      switch (filter) {
        case 'arrived': matchesFilter = guest.hasArrived; break;
        case 'pending': matchesFilter = !guest.hasArrived && !guest.isAbsent; break;
        case 'absent': matchesFilter = !!guest.isAbsent; break;
        default: matchesFilter = true; break;
      }
      return matchesSearch && matchesFilter;
    });
  }, [guests, searchQuery, filter]);

  const stats: DashboardStats = useMemo(() => {
    const total = guests.length;
    const arrived = guests.filter(g => g.hasArrived).length;
    const absent = guests.filter(g => g.isAbsent).length;
    const pending = total - arrived - absent;
    return { total, arrived, pending: pending < 0 ? 0 : pending, absent, percentage: total > 0 ? (arrived / total) * 100 : 0 };
  }, [guests]);

  // ------------------------------------------------------------------
  // LOGIN SCREEN RENDER
  // ------------------------------------------------------------------
  if (!userRole) {
    return (
      <div className="h-[100dvh] w-full bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 text-center bg-slate-900 text-white relative overflow-hidden">
             {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/5 rounded-full -translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-wedding-gold/10 rounded-full translate-x-10 translate-y-10"></div>
            
            <h1 className="font-serif text-2xl mb-1 relative z-10">Christiane & Serge</h1>
            <p className="text-wedding-gold text-xs italic font-serif mb-4 relative z-10">
                « Celui qui trouve une femme a trouvé le bonheur »
                <br/>
                <span className="opacity-70 text-[10px] not-italic sans-serif">Prov. 18:22</span>
            </p>
          </div>
          
          <div className="p-6 space-y-3">
            
            {!targetRole && (
                <>
                    {showInstallBtn && (
                    <button 
                        onClick={handleInstallClick}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-bold flex items-center justify-center gap-2 animate-pulse mb-4"
                    >
                        <Download size={20} />
                        Installer l'application
                    </button>
                    )}

                    {/* BOUTON INVITE */}
                    <button 
                    onClick={() => handleLogin('guest')}
                    className="w-full py-4 bg-white border-2 border-slate-100 hover:border-wedding-gold/50 rounded-xl flex items-center justify-between px-6 group transition-all shadow-sm"
                    >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-wedding-gold/20 text-yellow-700 rounded-full flex items-center justify-center">
                        <HeartHandshake size={20} />
                        </div>
                        <div className="text-left">
                        <p className="font-bold text-slate-800">Espace Invité</p>
                        <p className="text-xs text-slate-500">Voir le programme & Ma table</p>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-wedding-gold transition-colors" />
                    </button>

                    {/* HIDE THESE IF GUEST LINK MODE IS ACTIVE */}
                    {!isGuestLinkMode && (
                        <>
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-100"></div>
                                <span className="flex-shrink-0 mx-4 text-[10px] text-slate-300 font-bold uppercase tracking-wider">Staff & Admin</span>
                                <div className="flex-grow border-t border-slate-100"></div>
                            </div>

                            <button 
                            onClick={() => { setTargetRole('hostess'); setPinInput(''); }}
                            className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl flex items-center justify-between px-6 group transition-all"
                            >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                <Users size={16} />
                                </div>
                                <div className="text-left">
                                <p className="font-bold text-sm text-slate-800">Mode Accueil</p>
                                </div>
                            </div>
                            <Lock className="text-emerald-300 group-hover:text-emerald-500 transition-colors" size={16} />
                            </button>

                            <button 
                            onClick={() => { setTargetRole('planner'); setPinInput(''); }}
                            className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl flex items-center justify-between px-6 group transition-all"
                            >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                <CalendarClock size={16} />
                                </div>
                                <div className="text-left">
                                <p className="font-bold text-sm text-slate-800">Wedding Planner</p>
                                </div>
                            </div>
                            <Lock className="text-indigo-300 group-hover:text-indigo-500 transition-colors" size={16} />
                            </button>

                            <button 
                                onClick={() => { setTargetRole('admin'); setPinInput(''); }}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-between px-6 group transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center">
                                        <Crown size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-slate-800">Admin</p>
                                    </div>
                                </div>
                                <Lock className="text-slate-400 group-hover:text-slate-600 transition-colors" size={16} />
                            </button>
                        </>
                    )}
                </>
            )}

            {targetRole && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-10 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => { setTargetRole(null); setPinInput(''); }} className="text-slate-400 hover:text-slate-600">
                            <ChevronRight className="rotate-180" size={20}/>
                        </button>
                        <span className="font-bold text-slate-800">
                            {targetRole === 'admin' ? 'Code Organisateur' : targetRole === 'planner' ? 'Code Planner' : 'Code Hôtesse'}
                        </span>
                        <div className="w-5"></div>
                    </div>

                    <input 
                        type="password" 
                        inputMode="numeric"
                        autoFocus
                        placeholder="----"
                        maxLength={4}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        className={`w-full p-4 text-center tracking-[1em] font-bold text-2xl border rounded-xl outline-none focus:ring-2 transition-all ${pinError ? 'border-rose-300 ring-rose-100 bg-rose-50 text-rose-500' : 'border-slate-200 focus:ring-slate-200 text-slate-800'}`}
                    />
                    <button 
                        onClick={checkPin}
                        disabled={pinInput.length < 4}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all"
                    >
                        Valider
                    </button>
                </div>
            )}
            
            <p className="text-center text-[10px] text-slate-300 pt-4">© 2025 Wedding Check-In</p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // MAIN APP RENDER
  // ------------------------------------------------------------------
  return (
    <div className="h-[100dvh] w-full max-w-md mx-auto bg-slate-50 flex flex-col shadow-2xl overflow-hidden relative text-slate-900">
      
      <header className="flex-none z-30 bg-slate-50/95 backdrop-blur-md shadow-sm border-b border-slate-200/50">
        <div className="px-5 pt-6 pb-2">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="font-serif text-2xl text-slate-900 tracking-tight">Christiane & Serge</h1>
              <div className="flex items-center gap-2">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                  {userRole === 'admin' ? 'Espace Organisateur' : userRole === 'planner' ? 'Wedding Planner' : userRole === 'guest' ? 'Espace Invité' : 'Équipe d\'Accueil'}
                </p>
                <button 
                  onClick={handleLogout} 
                  className="ml-2 p-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 transition-colors active:scale-95"
                >
                  <LogOut size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              {/* QR Code Share Button (Staff only) */}
              {userRole !== 'guest' && (
                  <button 
                    onClick={() => setShowShareModal(true)} 
                    className="p-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 transition-all active:scale-95"
                  >
                    <QrCode size={18} />
                  </button>
              )}

              {showInstallBtn && (
                 <button onClick={handleInstallClick} className="p-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 animate-pulse">
                  <Download size={18} />
                </button>
              )}
              <button onClick={handleRefresh} disabled={isRefreshing} className={`p-2 rounded-full bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-95 ${isRefreshing ? 'animate-spin' : ''}`}>
                <RefreshCw size={18} />
              </button>
              {userRole === 'admin' && activeModule === 'checkin' && (
                <button onClick={() => setShowAdmin(true)} className="p-2 rounded-full bg-slate-900 shadow-sm border border-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95">
                  <Settings size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Module Switcher (Admin & Guest) */}
          {(userRole === 'admin' || userRole === 'guest') && (
              <div className="flex bg-slate-200 p-1 rounded-xl mb-4">
                  <button 
                    onClick={() => setActiveModule('planning')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeModule === 'planning' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                  >
                      <ListTodo size={14} />
                      Programme
                  </button>
                  <button 
                    onClick={() => setActiveModule('checkin')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeModule === 'checkin' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                  >
                      <Users size={14} />
                      {userRole === 'guest' ? 'Trouver ma place' : 'Liste Invités'}
                  </button>
              </div>
          )}

          {/* CHECKIN MODULE HEADER CONTENT */}
          {activeModule === 'checkin' && (
            <>
                <div className="mb-2">
                    {/* HIDE STATS FOR GUESTS */}
                    {userRole !== 'guest' && <Stats stats={stats} />}
                </div>
                <div className="bg-slate-100 p-1 rounded-lg flex mb-3">
                    <button onClick={() => setViewMode('list')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
                    <LayoutList size={14} /> Liste
                    </button>
                    <button onClick={() => setViewMode('tables')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'tables' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
                    <LayoutGrid size={14} /> Plan de Table
                    </button>
                </div>
                {viewMode === 'list' && (
                    <div className="relative mb-3 group animate-in fade-in zoom-in duration-300">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher nom, table..."
                        className="block w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                        <X size={14} />
                        </button>
                    )}
                    </div>
                )}
                {/* HIDE FILTERS FOR GUESTS */}
                {viewMode === 'list' && !searchQuery && userRole !== 'guest' && (
                    <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto no-scrollbar animate-in fade-in duration-700">
                    {(['all', 'pending', 'arrived', 'absent'] as GuestFilter[]).map((f) => (
                        <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all duration-200 capitalize whitespace-nowrap ${filter === f ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}>
                        {f === 'all' ? 'Tous' : f === 'pending' ? 'À venir' : f === 'arrived' ? 'Présents' : 'Absents'}
                        </button>
                    ))}
                    </div>
                )}
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scroll-smooth">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-xs">Chargement...</p>
          </div>
        ) : activeModule === 'planning' ? (
            <PlanningView 
                items={planningItems} 
                userRole={userRole}
                onToggle={togglePlanningItem}
                onAdd={() => { setEditingPlanningItem(null); setShowPlanningForm(true); }}
                onEdit={(item) => { setEditingPlanningItem(item); setShowPlanningForm(true); }}
                onDelete={handleDeletePlanning}
                onRefresh={() => loadPlanning(false)} 
            />
        ) : viewMode === 'tables' ? (
          <div className="p-4"><TableView guests={guests} /></div>
        ) : filteredGuests.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3"><Search size={20} /></div>
            <h3 className="text-sm font-medium text-slate-800 mb-1">Aucun résultat</h3>
            {searchQuery && <button onClick={() => setSearchQuery('')} className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">Effacer la recherche</button>}
          </div>
        ) : (
          <div className="p-4 space-y-1 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{filteredGuests.length} Résultat{filteredGuests.length > 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredGuests.map(guest => (
                <GuestCard 
                  key={guest.id} 
                  guest={guest} 
                  userRole={userRole}
                  onToggleStatus={toggleGuestStatus}
                  onToggleAbsent={handleToggleAbsent} 
                  onEdit={setEditingGuest}
                  onDelete={handleDeleteGuest}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FAB - ADD GUEST (ADMIN & CHECKIN) */}
      {userRole === 'admin' && activeModule === 'checkin' && (
        <button onClick={() => setShowGuestForm(true)} className="absolute bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 z-40">
          <Plus size={28} />
        </button>
      )}

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} guests={guests} />}
      {showShareModal && <ShareQrModal onClose={() => setShowShareModal(false)} />}
      
      {(showGuestForm || editingGuest) && (
        <GuestForm 
          initialData={editingGuest || undefined}
          isSubmitting={isSubmitting}
          onClose={() => { setShowGuestForm(false); setEditingGuest(null); }}
          onSubmit={editingGuest ? handleUpdateGuest : handleAddGuest}
        />
      )}

      {(showPlanningForm) && (
          <PlanningForm 
            initialData={editingPlanningItem || undefined}
            onClose={() => { setShowPlanningForm(false); setEditingPlanningItem(null); }}
            onSubmit={editingPlanningItem ? handleUpdatePlanning : handleAddPlanning}
          />
      )}
    </div>
  );
};

export default App;