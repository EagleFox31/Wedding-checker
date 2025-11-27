import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, RefreshCw, X, Settings, Utensils, Users, LayoutList, LayoutGrid, Plus, Lock, LogOut, ChevronRight } from 'lucide-react';
import { Guest, GuestFilter, DashboardStats, UserRole } from './types';
import * as guestService from './services/guestService';
import Stats from './components/Stats';
import GuestCard from './components/GuestCard';
import AdminPanel from './components/AdminPanel';
import TableView from './components/TableView';
import GuestForm from './components/GuestForm';

const App: React.FC = () => {
  // Auth State
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [pinError, setPinError] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // App State
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<GuestFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tables'>('list');
  
  // Modal States
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check Local Storage for Session
  useEffect(() => {
    const savedRole = localStorage.getItem('wedding_app_role') as UserRole | null;
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    if (userRole) {
      loadGuests();
    }
  }, [userRole]);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const data = await guestService.fetchGuests();
      // Sort alphabetically by last name by default
      const sorted = data.sort((a, b) => a.lastName.localeCompare(b.lastName));
      setGuests(sorted);
    } catch (error) {
      console.error("Failed to load guests", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadGuests();
    setIsRefreshing(false);
  };

  // ------------------------------------------------------------------
  // AUTH HANDLERS
  // ------------------------------------------------------------------
  const handleLogin = (role: UserRole) => {
    if (role === 'admin') {
      if (pinInput === '2025') {
        setUserRole('admin');
        localStorage.setItem('wedding_app_role', 'admin');
        setPinError(false);
        setPinInput('');
      } else {
        setPinError(true);
        setTimeout(() => setPinError(false), 2000);
      }
    } else {
      setUserRole('hostess');
      localStorage.setItem('wedding_app_role', 'hostess');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('wedding_app_role');
    setPinInput('');
  };

  const toggleGuestStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // Optimistic UI Update - INSTANT
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
      console.error("Failed to update status", error);
      // Revert if failed
      setGuests(prev => prev.map(g => g.id === id ? { ...g, hasArrived: currentStatus } : g));
    }
  };

  // ------------------------------------------------------------------
  // CRUD HANDLERS
  // ------------------------------------------------------------------
  
  const handleAddGuest = async (guestData: Omit<Guest, 'id'>) => {
    setIsSubmitting(true);
    try {
      const newGuest = await guestService.addGuest(guestData);
      setGuests(prev => [...prev, newGuest].sort((a, b) => a.lastName.localeCompare(b.lastName)));
      setShowGuestForm(false);
    } catch (error) {
      console.error("Failed to add guest", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGuest = async (guestData: Omit<Guest, 'id'>) => {
    if (!editingGuest) return;
    setIsSubmitting(true);
    try {
      await guestService.updateGuestDetails(editingGuest.id, guestData);
      setGuests(prev => prev.map(g => g.id === editingGuest.id ? { ...g, ...guestData } : g));
      setEditingGuest(null);
    } catch (error) {
      console.error("Failed to update guest", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    // Optimistic delete
    setGuests(prev => prev.filter(g => g.id !== id));
    try {
      await guestService.deleteGuest(id);
    } catch (error) {
      console.error("Failed to delete guest", error);
      loadGuests(); // Revert on error
    }
  };

  // ------------------------------------------------------------------
  // DERIVED STATE
  // ------------------------------------------------------------------

  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      // Normalisation pour la recherche (insensible à la casse)
      const query = searchQuery.toLowerCase();
      
      // Recherche sur Nom, Prénom, Table, Inviteur
      const matchesSearch = 
        guest.lastName.toLowerCase().includes(query) ||
        guest.firstName.toLowerCase().includes(query) ||
        guest.tableNumber.toString().toLowerCase().includes(query) ||
        guest.inviter.toLowerCase().includes(query);

      let matchesFilter = true;
      
      switch (filter) {
        case 'arrived':
          matchesFilter = guest.hasArrived;
          break;
        case 'pending':
          // Pending means not arrived AND not explicitly marked as absent
          matchesFilter = !guest.hasArrived && !guest.isAbsent;
          break;
        case 'absent':
          matchesFilter = !!guest.isAbsent;
          break;
        case 'all':
        default:
          matchesFilter = true;
          break;
      }

      return matchesSearch && matchesFilter;
    });
  }, [guests, searchQuery, filter]);

  const quickFilters = useMemo(() => {
    const inviters = Array.from(new Set(guests.map(g => g.inviter))).sort();
    return { inviters };
  }, [guests]);

  const stats: DashboardStats = useMemo(() => {
    const total = guests.length;
    const arrived = guests.filter(g => g.hasArrived).length;
    const absent = guests.filter(g => g.isAbsent).length;
    const pending = total - arrived - absent;
    
    return {
      total,
      arrived,
      pending: pending < 0 ? 0 : pending,
      absent,
      percentage: total > 0 ? (arrived / total) * 100 : 0
    };
  }, [guests]);

  // ------------------------------------------------------------------
  // LOGIN SCREEN RENDER
  // ------------------------------------------------------------------
  if (!userRole) {
    return (
      <div className="h-[100dvh] w-full bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 text-center bg-slate-900 text-white">
            <h1 className="font-serif text-3xl mb-2">Bienvenue</h1>
            <p className="text-slate-400 text-sm">Mariage de Serge & Christiane</p>
          </div>
          
          <div className="p-6 space-y-4">
            <button 
              onClick={() => handleLogin('hostess')}
              className="w-full py-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl flex items-center justify-between px-6 group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Mode Accueil</p>
                  <p className="text-xs text-slate-500">Pour les hôtes et hôtesses</p>
                </div>
              </div>
              <ChevronRight className="text-emerald-300 group-hover:text-emerald-500 transition-colors" />
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Ou espace organisateur</span>
              </div>
            </div>

            <div className="space-y-3">
              <input 
                type="password" 
                inputMode="numeric"
                placeholder="Code PIN Admin"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className={`w-full p-3 text-center tracking-[1em] font-bold text-lg border rounded-xl outline-none focus:ring-2 transition-all ${pinError ? 'border-rose-300 ring-rose-100 bg-rose-50 text-rose-500' : 'border-slate-200 focus:ring-slate-200 text-slate-800'}`}
              />
              <button 
                onClick={() => handleLogin('admin')}
                disabled={pinInput.length < 4}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                Accéder à l'Admin
              </button>
            </div>
            
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
              <h1 className="font-serif text-2xl text-slate-900 tracking-tight">Bienvenue</h1>
              <div className="flex items-center gap-2">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                  {userRole === 'admin' ? 'Espace Organisateur' : 'Équipe d\'Accueil'}
                </p>
                <button onClick={handleLogout} className="text-[10px] text-slate-300 hover:text-slate-500 underline flex items-center gap-1">
                   (Changer)
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-full bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-95 ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={18} />
              </button>
              
              {/* Settings only for Admin */}
              {userRole === 'admin' && (
                <button 
                  onClick={() => setShowAdmin(true)}
                  className="p-2 rounded-full bg-slate-900 shadow-sm border border-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95"
                >
                  <Settings size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="mb-2">
            <Stats stats={stats} />
          </div>

          <div className="bg-slate-100 p-1 rounded-lg flex mb-3">
             <button 
               onClick={() => setViewMode('list')}
               className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
             >
               <LayoutList size={14} />
               Liste
             </button>
             <button 
               onClick={() => setViewMode('tables')}
               className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'tables' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
             >
               <LayoutGrid size={14} />
               Tables
             </button>
          </div>

          {viewMode === 'list' && (
            <>
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
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1 mask-linear-fade animate-in fade-in slide-in-from-right-4 duration-500">
                {quickFilters.inviters.map(inviter => (
                  <button
                    key={`i-${inviter}`}
                    onClick={() => setSearchQuery(inviter)}
                    className={`
                      flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-colors
                      ${searchQuery === inviter 
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <Users size={10} />
                    {inviter}
                  </button>
                ))}
              </div>

              <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto no-scrollbar animate-in fade-in duration-700">
                {(['all', 'pending', 'arrived', 'absent'] as GuestFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`
                      flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all duration-200 capitalize whitespace-nowrap
                      ${filter === f 
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700'
                      }
                    `}
                  >
                    {f === 'all' ? 'Tous' : f === 'pending' ? 'À venir' : f === 'arrived' ? 'Présents' : 'Absents'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-xs">Chargement...</p>
          </div>
        ) : viewMode === 'tables' ? (
          <TableView guests={guests} />
        ) : filteredGuests.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
              <Search size={20} />
            </div>
            <h3 className="text-sm font-medium text-slate-800 mb-1">Aucun résultat</h3>
            <p className="text-slate-500 text-xs">
              {searchQuery ? `Aucun invité trouvé pour "${searchQuery}"` : "La liste est vide."}
            </p>
            {searchQuery && (
               <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm"
               >
                 Effacer la recherche
               </button>
            )}
          </div>
        ) : (
          <div className="space-y-1 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {filteredGuests.length} Résultat{filteredGuests.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Changed from simple list to grid-cols-2 for compact view */}
            <div className="grid grid-cols-2 gap-3">
              {filteredGuests.map(guest => (
                <GuestCard 
                  key={guest.id} 
                  guest={guest} 
                  userRole={userRole}
                  onToggleStatus={toggleGuestStatus} 
                  onEdit={setEditingGuest}
                  onDelete={handleDeleteGuest}
                />
              ))}
            </div>
            
            <div className="h-4 text-center pt-4 col-span-2">
              <span className="text-[10px] text-slate-300">●</span>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button - ONLY FOR ADMIN */}
      {userRole === 'admin' && (
        <button 
          onClick={() => setShowGuestForm(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 z-40"
        >
          <Plus size={28} />
        </button>
      )}

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      
      {(showGuestForm || editingGuest) && (
        <GuestForm 
          initialData={editingGuest || undefined}
          isSubmitting={isSubmitting}
          onClose={() => { setShowGuestForm(false); setEditingGuest(null); }}
          onSubmit={editingGuest ? handleUpdateGuest : handleAddGuest}
        />
      )}
    </div>
  );
};

export default App;