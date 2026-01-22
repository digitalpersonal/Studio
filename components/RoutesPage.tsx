

import React, { useState, useEffect } from 'react';
import { Route, User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Map, Plus, Edit, Trash2, Loader2, Link } from 'lucide-react';

interface RoutesPageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const RoutesPage: React.FC<RoutesPageProps> = ({ currentUser, addToast }) => {
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
      } catch (error: any) {
        console.error("Erro ao carregar rotas:", error.message || JSON.stringify(error));
        addToast(`Erro ao carregar rotas: ${error.message || JSON.stringify(error)}`, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, [addToast]);

  const handleSaveRoute = async (routeData: Omit<Route, 'id'>) => {
    setLoading(true);
    try {
      if (editingRoute) {
        await SupabaseService.updateRoute({ ...routeData as Route, id: editingRoute.id });
        addToast("Rota atualizada com sucesso!", "success");
      } else {
        await SupabaseService.addRoute(routeData);
        addToast("Nova rota criada com sucesso!", "success");
      }
      setShowForm(false);
      setEditingRoute(null);
      const updatedRoutes = await SupabaseService.getRoutes();
      setRoutes(updatedRoutes);
    } catch (error: any) {
      console.error("Erro ao salvar rota:", error.message || JSON.stringify(error));
      addToast(`Erro ao salvar rota: ${error.message || 'Desconhecido'}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta rota?")) return;
    setLoading(true);
    try {
      await SupabaseService.deleteRoute(id);
      addToast("Rota excluída com sucesso!", "success");
      const updatedRoutes = await SupabaseService.getRoutes();
      setRoutes(updatedRoutes);
    } catch (error: any) {
      console.error("Erro ao excluir rota:", error.message || JSON.stringify(error));
      addToast(`Erro ao excluir rota: ${error.message || 'Desconhecido'}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <Loader2 className="animate-spin text-brand-500" size={48} />
      </div>
    );
  }

  if (showForm) {
    return (
      <RouteForm
        route={editingRoute}
        onSave={handleSaveRoute}
        onCancel={() => { setShowForm(false); setEditingRoute(null); }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Rotas & Mapas</h2>
          <p className="text-slate-400 text-sm">Explore e cadastre novos percursos para seus treinos.</p>
        </div>
        {isStaff && (
          <button
            onClick={() => { setEditingRoute(null); setShowForm(true); }}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg shadow-brand-500/20"
          >
            <Plus size={16} className="mr-2" /> Nova Rota
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.length > 0 ? (
          routes.map(route => (
            <div key={route.id} className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl space-y-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-bold text-lg flex items-center gap-2">
                    <Map size={20} className="text-brand-500" /> {String(route.title)}
                  </h4>
                  <p className={`text-xs font-bold uppercase ${
                    route.difficulty === 'EASY' ? 'text-emerald-500' :
                    route.difficulty === 'MEDIUM' ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {route.difficulty === 'EASY' ? 'Fácil' : route.difficulty === 'MEDIUM' ? 'Média' : 'Difícil'}
                  </p>
                </div>
                {isStaff && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingRoute(route); setShowForm(true); }} className="p-2 bg-dark-800 text-slate-400 rounded-lg hover:text-white transition-colors" title="Editar Rota">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteRoute(route.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Excluir Rota">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-sm">{String(route.description)}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-800 text-xs text-slate-500">
                <span>Distância: <span className="text-white font-semibold">{String(route.distanceKm)} km</span></span>
                <span>Elevação: <span className="text-white font-semibold">{String(route.elevationGain)} m</span></span>
              </div>
              {route.mapLink && (
                <a 
                  href={String(route.mapLink)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20"
                >
                  <Link size={16} /> Ver no Mapa
                </a>
              )}
            </div>
          ))
        ) : (
          <p className="text-slate-500 italic">Nenhuma rota cadastrada.</p>
        )}
      </div>
    </div>
  );
};

interface RouteFormProps {
  route: Route | null;
  onSave: (routeData: Omit<Route, 'id'>) => void;
  onCancel: () => void;
}

const RouteForm: React.FC<RouteFormProps> = ({ route, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Route, 'id'>>(
    route || {
      title: '',
      description: '',
      distanceKm: 0,
      mapLink: '',
      difficulty: 'EASY',
      elevationGain: 0,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-xl mx-auto bg-dark-950 p-8 rounded-3xl border border-dark-800 shadow-xl space-y-6 animate-fade-in">
      <h3 className="text-xl font-bold text-white border-b border-dark-800 pb-4">
        {route ? 'Editar Rota' : 'Nova Rota'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Título da Rota</label>
          <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.title)} onChange={e => setFormData({ ...formData, title: e.target.value })} />
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Descrição</label>
          <textarea required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.description)} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Distância (km)</label>
            <input required type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.distanceKm)} onChange={e => setFormData({ ...formData, distanceKm: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Elevação (metros)</label>
            <input required type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.elevationGain)} onChange={e => setFormData({ ...formData, elevationGain: Number(e.target.value) })} />
          </div>
          <div className="col-span-2">
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Link do Mapa (Google Maps, Strava, etc.)</label>
            <input type="url" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.mapLink)} onChange={e => setFormData({ ...formData, mapLink: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Dificuldade</label>
            <select required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.difficulty)} onChange={e => setFormData({ ...formData, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })}>
              <option value="EASY">Fácil</option>
              <option value="MEDIUM">Média</option>
              <option value="HARD">Difícil</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onCancel} className="px-6 py-3 bg-dark-800 text-white rounded-lg font-bold">Cancelar</button>
          <button type="submit" className="px-6 py-3 bg-brand-600 text-white rounded-lg font-bold shadow-lg shadow-brand-500/20">Salvar Rota</button>
        </div>
      </form>
    </div>
  );
};