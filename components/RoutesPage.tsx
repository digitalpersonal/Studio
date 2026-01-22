
import React, { useState, useEffect } from 'react';
import { Route, User, UserRole, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  Map, Plus, Edit, Trash2, Loader2, Link, ExternalLink, 
  MapPinned, Navigation, Mountain, Timer, X, Check, Search,
  Compass, ArrowLeft
} from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

  const isStaff = currentUser.role !== UserRole.STUDENT;

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const data = await SupabaseService.getRoutes();
      setRoutes(data);
    } catch (error: any) {
      addToast(`Erro ao carregar rotas.`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoute = async (routeData: Omit<Route, 'id'>) => {
    setLoading(true);
    try {
      if (editingRoute) {
        await SupabaseService.updateRoute({ ...routeData as Route, id: editingRoute.id });
        addToast("Rota atualizada!", "success");
      } else {
        await SupabaseService.addRoute(routeData);
        addToast("Nova rota disponível para os alunos!", "success");
      }
      setShowForm(false);
      setEditingRoute(null);
      fetchRoutes();
    } catch (error: any) {
      addToast(`Erro ao salvar rota.`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm("Excluir esta rota permanentemente?")) return;
    setLoading(true);
    try {
      await SupabaseService.deleteRoute(id);
      addToast("Rota removida.", "success");
      fetchRoutes();
    } catch (error: any) {
      addToast(`Erro ao excluir.`, "error");
    } finally {
      setLoading(false);
    }
  };

  const getLinkInfo = (url: string) => {
    if (url.includes('strava.com')) return { label: 'Abrir no Strava', color: 'bg-[#FC4C02]', icon: Compass };
    if (url.includes('google.com/maps')) return { label: 'Google Maps', color: 'bg-emerald-600', icon: MapPinned };
    if (url.includes('wikiloc.com')) return { label: 'Wikiloc', color: 'bg-lime-600', icon: Mountain };
    return { label: 'Ver Mapa', color: 'bg-brand-600', icon: Navigation };
  };

  const filteredRoutes = routes.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !showForm) {
    return <div className="flex justify-center items-center h-full min-h-[500px]"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;
  }

  if (showForm) {
    return <RouteForm route={editingRoute} onSave={handleSaveRoute} onCancel={() => { setShowForm(false); setEditingRoute(null); }} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('DASHBOARD')} className="p-2.5 bg-dark-950 border border-dark-800 text-slate-500 rounded-full hover:text-brand-500 hover:border-brand-500/50 transition-all active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Rotas & Exploração</h2>
            <p className="text-slate-400 text-sm">Os melhores percursos mapeados para seu treino.</p>
          </div>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14}/>
                <input 
                    type="text" 
                    placeholder="Buscar rota..." 
                    className="bg-dark-950 border border-dark-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white focus:border-brand-500 outline-none w-full md:w-64 transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            {isStaff && (
                <button onClick={() => { setEditingRoute(null); setShowForm(true); }} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-brand-600/20 active:scale-95 transition-all shrink-0">
                    <Plus size={16} className="mr-2" /> Cadastrar Rota
                </button>
            )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutes.length > 0 ? filteredRoutes.map(route => {
          const linkInfo = getLinkInfo(String(route.mapLink || ''));
          const LinkIconComp = linkInfo.icon;

          return (
            <div key={route.id} className="bg-dark-950 rounded-[2.5rem] border border-dark-800 shadow-xl overflow-hidden group hover:border-brand-500/30 transition-all">
              {/* Card Header/Map Preview */}
              <div className="h-32 bg-dark-900 relative overflow-hidden flex items-center justify-center border-b border-dark-800">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy-dark.png')]"></div>
                  <Map className="text-dark-800 group-hover:text-brand-500/20 group-hover:scale-110 transition-all duration-700" size={80} />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        route.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-500' :
                        route.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                        {route.difficulty === 'EASY' ? 'Iniciante' : route.difficulty === 'MEDIUM' ? 'Moderado' : 'Desafiador'}
                    </span>
                  </div>
                  {isStaff && (
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingRoute(route); setShowForm(true); }} className="p-2 bg-dark-950/80 text-slate-300 rounded-lg hover:text-white backdrop-blur-md"><Edit size={14}/></button>
                      <button onClick={() => handleDeleteRoute(route.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white backdrop-blur-md"><Trash2 size={14}/></button>
                    </div>
                  )}
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-white font-black text-lg uppercase tracking-tighter leading-tight">{String(route.title)}</h4>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{String(route.description)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-dark-900/50 p-3 rounded-2xl border border-dark-800">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Navigation size={10}/> Distância</p>
                        <p className="text-white font-black text-base">{String(route.distanceKm)} <span className="text-[10px] text-slate-500">km</span></p>
                    </div>
                    <div className="bg-dark-900/50 p-3 rounded-2xl border border-dark-800">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Mountain size={10}/> Elevação</p>
                        <p className="text-white font-black text-base">+{String(route.elevationGain)} <span className="text-[10px] text-slate-500">m</span></p>
                    </div>
                </div>

                {route.mapLink && (
                  <a 
                    href={String(route.mapLink)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`flex items-center justify-center gap-3 w-full py-4 ${linkInfo.color} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/20`}
                  >
                    <LinkIconComp size={18} /> {linkInfo.label}
                  </a>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 text-center bg-dark-950 rounded-[3rem] border border-dashed border-dark-800">
             <MapPinned className="mx-auto text-dark-800 mb-4" size={48} />
             <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Nenhuma rota encontrada para este filtro.</p>
          </div>
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
      difficulty: 'MEDIUM',
      elevationGain: 0,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.distanceKm <= 0) return alert("Distância deve ser maior que zero.");
    onSave(formData);
  };

  return (
    <div className="max-w-2xl mx-auto bg-dark-950 p-10 rounded-[3rem] border border-dark-800 shadow-2xl space-y-8 animate-fade-in mb-20">
      <div className="flex justify-between items-center border-b border-dark-800 pb-6">
        <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{route ? 'Editar Rota' : 'Nova Rota Mapeada'}</h3>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Insira os detalhes técnicos do percurso</p>
        </div>
        <button onClick={onCancel} className="p-2 bg-dark-800 rounded-full text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Nome do Percurso</label>
                <input required className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 text-white focus:border-brand-500 outline-none font-bold" placeholder="Ex: Volta da Lagoa / Trilha dos Pinheiros" value={String(formData.title)} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            
            <div className="md:col-span-2">
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Instruções / Descrição</label>
                <textarea required className="w-full h-24 bg-dark-900 border border-dark-700 rounded-2xl p-4 text-white text-sm focus:border-brand-500 outline-none resize-none" placeholder="Ex: Terreno misto, subida íngreme no km 4..." value={String(formData.description)} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Distância Total (km)</label>
                <div className="relative">
                    <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18}/>
                    <input required type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 pl-12 text-white focus:border-brand-500 outline-none font-black" value={formData.distanceKm || ''} onChange={e => setFormData({ ...formData, distanceKm: Number(e.target.value) })} />
                </div>
            </div>

            <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Ganho de Elevação (m)</label>
                <div className="relative">
                    <Mountain className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18}/>
                    <input required type="number" className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 pl-12 text-white focus:border-brand-500 outline-none font-black" value={formData.elevationGain || ''} onChange={e => setFormData({ ...formData, elevationGain: Number(e.target.value) })} />
                </div>
            </div>

            <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Nível de Dificuldade</label>
                <select required className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 text-white text-sm font-black uppercase tracking-widest" value={String(formData.difficulty)} onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}>
                    <option value="EASY">Fácil / Iniciante</option>
                    <option value="MEDIUM">Moderado</option>
                    <option value="HARD">Difícil / Pro</option>
                </select>
            </div>

            <div className="md:col-span-1">
                 <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Link Externo (Strava/Maps)</label>
                 <div className="relative">
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18}/>
                    <input type="url" className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 pl-12 text-white text-xs focus:border-brand-500 outline-none" placeholder="https://www.strava.com/routes/..." value={String(formData.mapLink)} onChange={e => setFormData({ ...formData, mapLink: e.target.value })} />
                 </div>
            </div>
        </div>
        
        <div className="flex gap-4 pt-6">
          <button type="button" onClick={onCancel} className="flex-1 py-5 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-700 transition-all">Cancelar</button>
          <button type="submit" className="flex-1 py-5 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-brand-600/30 hover:bg-brand-500 transition-all active:scale-95">Salvar Percurso</button>
        </div>
      </form>
    </div>
  );
};
