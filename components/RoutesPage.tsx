
import React, { useState, useEffect } from 'react';
import { Route, User, UserRole, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Map, Plus, Edit, Trash2, Loader2, Link, Download, ArrowLeft } from 'lucide-react';

interface RoutesPageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const RoutesPage: React.FC<RoutesPageProps> = ({ currentUser, onNavigate, addToast }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);

  const isStaff = currentUser.role !== UserRole.STUDENT;

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const data = await SupabaseService.getRoutes();
        setRoutes(data);
      } catch (error: any) { addToast(`Erro ao carregar rotas.`, "error"); } finally { setLoading(false); }
    };
    fetchRoutes();
  }, [addToast]);

  if (loading) return <div className="flex justify-center items-center h-full min-h-[500px]"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;

  return (
    <div className="space-y-6 animate-fade-in printable-area">
      <button 
        onClick={() => onNavigate('DASHBOARD')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-2 transition-colors no-print"
      >
        <ArrowLeft size={14} /> Voltar ao Início
      </button>

      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Rotas & Mapas</h2>
          <p className="text-slate-400 text-sm">Explore novos percursos para seus treinos.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.length > 0 ? routes.map(route => (
          <div key={route.id} className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl space-y-3 hover:border-brand-500/30 transition-all">
            <h4 className="text-white font-bold text-lg flex items-center gap-2"><Map size={20} className="text-brand-500" /> {String(route.title)}</h4>
            <p className="text-slate-400 text-sm">{String(route.description)}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-800 text-xs text-slate-500">
              <span>Distância: <span className="text-white font-semibold">{String(route.distanceKm)} km</span></span>
              <a href={String(route.mapLink)} target="_blank" className="text-brand-500 font-bold hover:underline">Ver no Mapa</a>
            </div>
          </div>
        )) : <p className="text-slate-500 italic">Nenhuma rota cadastrada.</p>}
      </div>
    </div>
  );
};
