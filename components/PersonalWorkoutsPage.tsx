
import React, { useState, useEffect, useMemo } from 'react';
import { PersonalizedWorkout, User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Dumbbell, Plus, Edit, Trash2, Loader2, Video, User as UserIcon, Search, Check, X } from 'lucide-react';

interface PersonalWorkoutsPageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialStudentId?: string; 
}

export const PersonalWorkoutsPage: React.FC<PersonalWorkoutsPageProps> = ({ currentUser, addToast, initialStudentId }) => {
  const [workouts, setWorkouts] = useState<PersonalizedWorkout[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialStudentId || null); 
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<PersonalizedWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  const isStaff = currentUser.role !== UserRole.STUDENT;

  useEffect(() => {
    const fetchWorkouts = async () => {
      setLoading(true);
      try {
        const userData = isStaff ? await SupabaseService.getAllUsers() : []; 
        setUsers(userData);

        let workoutData: PersonalizedWorkout[] = [];
        if (currentUser.role === UserRole.STUDENT) {
          workoutData = await SupabaseService.getPersonalizedWorkouts(currentUser.id);
        } else {
          workoutData = await SupabaseService.getPersonalizedWorkouts(selectedUserId || undefined);
        }
        setWorkouts(workoutData);
      } catch (error: any) {
        console.error("Erro ao carregar treinos personalizados:", error.message || JSON.stringify(error));
        addToast(`Erro ao carregar treinos personalizados: ${error.message || JSON.stringify(error)}`, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, [currentUser, selectedUserId, addToast, isStaff]);

  useEffect(() => {
    if (initialStudentId !== undefined) {
      setSelectedUserId(initialStudentId);
    }
  }, [initialStudentId]);

  const handleSaveWorkout = async (workoutData: Omit<PersonalizedWorkout, 'id'>) => {
    setLoading(true);
    try {
      if (editingWorkout) {
        await SupabaseService.updatePersonalizedWorkout({ ...workoutData as PersonalizedWorkout, id: editingWorkout.id });
        addToast("Treino atualizado com sucesso!", "success");
      } else {
        await SupabaseService.addPersonalizedWorkout(workoutData);
        addToast("Novo treino criado com sucesso!", "success");
      }
      setShowForm(false);
      setEditingWorkout(null);
      const updatedWorkouts = await SupabaseService.getPersonalizedWorkouts(isStaff ? selectedUserId || undefined : currentUser.id);
      setWorkouts(updatedWorkouts);
    } catch (error: any) {
      console.error("Erro ao salvar treino personalizado:", error.message || JSON.stringify(error));
      addToast(`Erro ao salvar treino: ${error.message || 'Desconhecido'}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este treino?")) return;
    setLoading(true);
    try {
      await SupabaseService.deletePersonalizedWorkout(id);
      addToast("Treino excluído com sucesso!", "success");
      const updatedWorkouts = await SupabaseService.getPersonalizedWorkouts(isStaff ? selectedUserId || undefined : currentUser.id);
      setWorkouts(updatedWorkouts);
    } catch (error: any) {
      console.error("Erro ao excluir treino personalizado:", error.message || JSON.stringify(error));
      addToast(`Erro ao excluir treino: ${error.message || 'Desconhecido'}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const getUserNamesForWorkout = (userIds: string[]) => { 
    return users
      .filter(u => userIds.includes(u.id))
      .map(u => String(u.name).split(' ')[0])
      .join(', ');
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
      <PersonalWorkoutForm
        workout={editingWorkout}
        users={users} 
        onSave={handleSaveWorkout}
        onCancel={() => { setShowForm(false); setEditingWorkout(null); }}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Treinos Personalizados</h2>
          <p className="text-slate-400 text-sm font-medium">Acesse e gerencie treinos específicos para cada aluno.</p>
        </div>
        {isStaff && (
          <button
            onClick={() => { setEditingWorkout(null); setShowForm(true); }}
            className="bg-brand-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all"
          >
            <Plus size={16} className="mr-2" /> Novo Treino
          </button>
        )}
      </header>

      {isStaff && (
        <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl flex flex-col md:flex-row items-center gap-4">
          <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest shrink-0">Filtrar por Usuário:</label> 
          <select
            className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold text-sm"
            value={selectedUserId || ''}
            onChange={e => setSelectedUserId(e.target.value === '' ? null : e.target.value)}
          >
            <option value="">Todos os Usuários</option> 
            {users.map(u => ( 
              <option key={u.id} value={u.id}>{String(u.name)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts.length > 0 ? (
          workouts.map(workout => (
            <div key={workout.id} className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl space-y-4 hover:border-brand-500/30 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-bold text-lg flex items-center gap-2 group-hover:text-brand-500 transition-colors">
                    <Dumbbell size={20} className="text-brand-500" /> {String(workout.title)}
                  </h4>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Criado em: {String(workout.createdAt)}</p>
                </div>
                {isStaff && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingWorkout(workout); setShowForm(true); }} className="p-2 bg-dark-800 text-slate-400 rounded-xl hover:text-white transition-colors" title="Editar Treino">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteWorkout(workout.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors" title="Excluir Treino">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-sm whitespace-pre-line leading-relaxed">{String(workout.description)}</p>
              
              {workout.studentIds && workout.studentIds.length > 0 && isStaff && (
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter flex items-center gap-2 bg-dark-900/50 p-2 rounded-lg border border-dark-800">
                      <UserIcon size={12} className="text-brand-500" /> <span className="truncate">Atribuído a: {getUserNamesForWorkout(workout.studentIds)}</span>
                  </p>
              )}

              {workout.videoUrl && (
                <div className="mt-2 pt-4 border-t border-dark-800">
                  <a href={String(workout.videoUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20"
                >
                    <Video size={16} /> Assistir Vídeo Aula
                  </a>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-dark-950 rounded-[3rem] border border-dashed border-dark-800">
             <Dumbbell className="mx-auto text-dark-800 mb-4" size={48} />
             <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Nenhum treino personalizado encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface PersonalWorkoutFormProps {
  workout: PersonalizedWorkout | null;
  users: User[]; 
  onSave: (workoutData: Omit<PersonalizedWorkout, 'id'>) => void;
  onCancel: () => void;
  currentUser: User;
}

const PersonalWorkoutForm: React.FC<PersonalWorkoutFormProps> = ({ workout, users, onSave, onCancel, currentUser }) => {
  const [formData, setFormData] = useState<Omit<PersonalizedWorkout, 'id'>>(
    workout || {
      title: '',
      description: '',
      videoUrl: '',
      studentIds: [],
      createdAt: new Date().toISOString().split('T')[0],
      instructorName: String(currentUser.name),
    }
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(workout?.studentIds || []); 
  const [searchTerm, setSearchTerm] = useState('');

  // Filtro otimizado estritamente pelo campo 'name' conforme solicitado
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [users, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      alert("Por favor, selecione pelo menos um aluno para este treino.");
      return;
    }
    onSave({ ...formData, studentIds: selectedUserIds }); 
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  return (
    <div className="max-w-3xl mx-auto bg-dark-950 p-8 rounded-[3rem] border border-dark-800 shadow-2xl space-y-8 animate-fade-in mb-20 overflow-hidden">
      <div className="flex justify-between items-center border-b border-dark-800 pb-6">
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
            {workout ? 'Editar Treino' : 'Novo Treino Customizado'}
          </h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Prescreva treinos individuais para seus alunos.</p>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full transition-colors"><X size={24}/></button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">Conteúdo do Treino</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Título do Treino</label>
              <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-bold text-sm" placeholder="Ex: Treino de Férias - Nível 1" value={String(formData.title)} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Descrição Detalhada</label>
              <textarea required className="w-full h-48 bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none text-sm leading-relaxed scrollbar-thin" placeholder="Escreva os exercícios, séries e repetições..." value={String(formData.description)} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">URL do Vídeo (YouTube/Vimeo)</label>
              <div className="relative">
                <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="url" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 pl-12 text-white focus:border-brand-500 outline-none text-sm font-mono" placeholder="https://..." value={String(formData.videoUrl || '')} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-5 bg-dark-900/30 p-6 rounded-[2.5rem] border border-dark-800">
          <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">Alunos Destinatários ({selectedUserIds.length})</h4>
          
          {/* Campo de Busca Real-time (Filtro por Nome) */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              className="w-full bg-dark-950 border border-dark-700 rounded-xl p-4 pl-12 text-white focus:border-brand-500 outline-none text-sm placeholder:text-slate-600 transition-all border-brand-500/10 focus:border-brand-500" 
              placeholder="Buscar aluno por nome..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar space-y-1">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUserSelection(u.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                    selectedUserIds.includes(u.id) 
                      ? 'bg-brand-600/20 border-brand-500/50 text-white shadow-lg' 
                      : 'bg-dark-950 border-dark-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <img 
                      src={String(u.avatarUrl || `https://ui-avatars.com/api/?name=${String(u.name)}`)} 
                      className="w-8 h-8 rounded-lg object-cover border border-dark-800" 
                      alt={u.name}
                    />
                    <div>
                      <p className={`text-xs font-bold leading-tight ${selectedUserIds.includes(u.id) ? 'text-white' : 'text-slate-300'}`}>{u.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black">{u.role === UserRole.STUDENT ? 'Aluno' : 'Equipe'}</p>
                    </div>
                  </div>
                  {selectedUserIds.includes(u.id) && (
                    <div className="bg-brand-500 text-white p-1 rounded-full animate-scale-in">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="py-10 text-center flex flex-col items-center gap-2">
                <Search size={24} className="text-dark-800" />
                <p className="text-slate-600 font-bold uppercase text-[9px]">Nenhum aluno encontrado</p>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-dark-800 grid grid-cols-2 gap-4">
            <button type="button" onClick={onCancel} className="py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-dark-700">Descartar</button>
            <button type="submit" className="py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-600/30 hover:bg-brand-500 transition-all flex items-center justify-center gap-2">
              Gravar Treino
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
