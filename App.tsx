import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, RefreshCw, X, Settings, Utensils, Users } from 'lucide-react';
import { Guest, GuestFilter, DashboardStats } from './types';
import * as guestService from './services/guestService';
import Stats from './components/Stats';
import GuestCard from './components/GuestCard';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<GuestFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Initial Load
  useEffect(() => {
    loadGuests();
  }, []);

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

  const toggleGuestStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic UI Update
    const newStatus = !currentStatus;
    
    setGuests(prev => prev.map(g => 
      g.id === id 
        ? { 
            ...g, 
            hasArrived: newStatus, 
            isAbsent: newStatus ? false : g.isAbsent, // If arrived, cannot be absent
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

  // Derived State: Filtered Guests
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

  // Derived State: Unique values for Quick Filters
  const quickFilters = useMemo(() => {
    const tables = Array.from(new Set(guests.map(g => g.tableNumber))).sort();
    const inviters = Array.from(new Set(guests.map(g => g.inviter))).sort();
    return { tables, inviters };
  }, [guests]);

  // Derived State: Statistics
  const stats: DashboardStats = useMemo(() => {
    const total = guests.length;
    const arrived = guests.filter(g => g.hasArrived).length;
    const absent = guests.filter(g => g.isAbsent).length;
    // Pending is everyone else
    const pending = total - arrived - absent;
    
    return {
      total,
      arrived,
      pending: pending < 0 ? 0 : pending, // Safety check
      absent,
      percentage: total > 0 ? (arrived / total) * 100 : 0
    };
  }, [guests]);

  return (
    <div className="h-[100dvh] w-full max-w-md mx-auto bg-slate-50 flex flex-col shadow-2xl overflow-hidden relative text-slate-900">
      
      {/* 
        HEADER FIXE (Sticky)
        Contient: Titre, KPI (Stats), Recherche, Filtres
        Utilisation de z-index pour rester au dessus du contenu
      */}
      <header className="flex-none z-30 bg-slate-50/95 backdrop-blur-md shadow-sm border-b border-slate-200/50">
        <div className="px-5 pt-6 pb-2">
          {/* Top Bar: Titre + Actions */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="font-serif text-2xl text-slate-900 tracking-tight">Bienvenue</h1>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Contrôle des entrées</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-full bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-95 ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={18} />
              </button>
              <button 
                onClick={() => setShowAdmin(true)}
                className="p-2 rounded-full bg-slate-900 shadow-sm border border-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* KPI Stats */}
          <div className="mb-4">
            <Stats stats={stats} />
          </div>

          {/* Search Bar */}
          <div className="relative mb-3 group">
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

          {/* Quick Filters (Chips) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1 mask-linear-fade">
            {quickFilters.tables.map(table => (
               <button
                key={`t-${table}`}
                onClick={() => setSearchQuery(table.toString())}
                className={`
                  flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-colors
                  ${searchQuery === table.toString() 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }
                `}
              >
                <Utensils size={10} />
                Table {table}
              </button>
            ))}
            <div className="w-px h-6 bg-slate-200 flex-shrink-0 mx-1"></div>
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

          {/* Status Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto no-scrollbar">
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
        </div>
      </header>

      {/* 
        MAIN CONTENT (Scrollable) 
      */}
      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-xs">Chargement...</p>
          </div>
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
          <div className="space-y-1 pb-8">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {filteredGuests.length} Résultat{filteredGuests.length > 1 ? 's' : ''}
              </span>
            </div>

            {filteredGuests.map(guest => (
              <GuestCard 
                key={guest.id} 
                guest={guest} 
                onToggleStatus={toggleGuestStatus} 
              />
            ))}
            
            {/* End of list spacer */}
            <div className="h-4 text-center pt-4">
              <span className="text-[10px] text-slate-300">●</span>
            </div>
          </div>
        )}
      </main>

      {/* Admin Panel Overlay */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

export default App;