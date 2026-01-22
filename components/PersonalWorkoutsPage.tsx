
import React, { useState, useEffect } from 'react';
import { PersonalizedWorkout, User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Dumbbell, Plus, Edit, Trash2, Loader2, Video, User as UserIcon, X } from 'lucide-react';

interface PersonalWorkoutsPageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialStudentId?: string; 
}

export const PersonalWorkoutsPage: React.FC<PersonalWorkoutsPageProps> = ({ currentUser, addToast, initialStudentId }) => {
  const [workouts, setWorkouts] = useState<PersonalizedWorkout[]>([]);
  const [students, setStudents] = useState<User[]>([]); 
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialStudentId || null); 
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<PersonalizedWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  const isStaff = currentUser.role !== UserRole.STUDENT;

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const allUsers = await SupabaseService.getAllUsers();
        const onlyStudents = allUsers.filter(u => u.role === UserRole.STUDENT);
        setStudents(onlyStudents);

        let workoutData: PersonalizedWorkout[] = [];
        if (!isStaff) {
          workoutData = await SupabaseService.getPersonalizedWorkouts(currentUser.id);
        } else {
          // Se for staff, respeita o filtro inicial de aluno vindo da navegação
          workoutData = await SupabaseService.getPersonalizedWorkouts(selectedUserId || undefined);
        }
        setWorkouts(workoutData);
      } catch (error: any) {
        addToast(`Erro ao carregar treinos: ${error.message}`, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [currentUser, isStaff, addToast]);

  // Efeito secundário para quando o filtro manual mudar
  useEffect(() => {
    const fetchFilteredWorkouts = async () => {
      if (!isStaff) return;
      setLoading(true);
      try {
        const data = await SupabaseService.getPersonalizedWorkouts(selectedUserId || undefined);
        setWorkouts(data);
      } catch (error: any) {
        addToast("Erro ao filtrar treinos.", "error");
      } finally {
        setLoading(false);
      }
    };
    if (students.length > 0) fetchFilteredWorkouts();
  }, [selectedUserId, isStaff]);

  const handleSaveWorkout = async (workoutData: Omit<PersonalizedWorkout, 'id'>) => {
    setLoading(true);
    try {
      if (editingWorkout) {
        await SupabaseService.updatePersonalizedWorkout({ ...workoutData as PersonalizedWorkout, id: editingWorkout.id });
        addToast("Treino atualizado!", "success");
      } else {
        await SupabaseService.addPersonalizedWorkout(workoutData);
        addToast("Novo treino criado!", "success");
      }
      setShowForm(false);
      setEditingWorkout(null);
      const updated = await SupabaseService.getPersonalizedWorkouts(isStaff ? selectedUserId || undefined : currentUser.id);
      setWorkouts(updated);
    } catch (error: any) {
      addToast("Erro ao salvar treino.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm("Excluir este treino?")) return;
    setLoading(true);
    try {
      await SupabaseService.deletePersonalizedWorkout(id);
      addToast("Treino removido.", "success");
      const updated = await SupabaseService.getPersonalizedWorkouts(isStaff ? selectedUserId || undefined : currentUser.id);
      setWorkouts(updated);
    } catch (error: any) {
      addToast("Erro ao excluir.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getUserNamesForWorkout = (userIds: string[]) => { 
    if (!userIds || !Array.isArray(userIds)) return 'Não atribuído';
    return students
      .filter(u => userIds.includes(u.id))
      .map(u => String(u.name).split(' ')[0])
      .join(', ') || 'Desconhecido';
  };

  if (loading && workouts.length === 0 && students.length === 0) {
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
        users={students} 
        onSave={handleSaveWorkout}
        onCancel={() => { setShowForm(false); setEditingWorkout(null); }}
        currentUser={currentUser}
        initialSelectedId={selectedUserId}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Treinos Individuais</h2>
          <p className="text-slate-400 text-sm">Fichas técnicas e rotinas personalizadas.</p>
        </div>
        {isStaff && (
          <button
            onClick={() => { setEditingWorkout(null); setShowForm(true); }}
            className="bg-brand-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all active:scale-95"
          >
            <Plus size={16} className="mr-2" /> Novo Treino
          </button>
        )}
      </header>

      {isStaff && (
        <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl flex flex-col md:flex-row items-center gap-4">
          <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest shrink-0">Filtrar por Aluno:</label> 
          <select
            className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold"
            value={selectedUserId || ''}
            onChange={e => setSelectedUserId(e.target.value === '' ? null : e.target.value)}
          >
            <option value="">Todos os Treinos</option> 
            {students.map(u => ( 
              <option key={u.id} value={u.id}>{String(u.name)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts.length > 0 ? (
          workouts.map(workout => (
            <div key={workout.id} className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl space-y-4 group hover:border-brand-500/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-600/10 rounded-2xl text-brand-500">
                    <Dumbbell size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-tighter">{String(workout.title)}</h4>
                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{new Date(workout.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                {isStaff && (
                  <div className="flex gap-1.5">
                    <button onClick={() => { setEditingWorkout(workout); setShowForm(true); }} className="p-2 bg-dark-900 text-slate-400 rounded-xl hover:text-white transition-colors border border-dark-800">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteWorkout(workout.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-800">
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line line-clamp-4">{String(workout.description)}</p>
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                {isStaff && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-dark-900 rounded-xl border border-dark-800">
                        <UserIcon size={12} className="text-brand-500" />
                        <span className="text-[10px] text-slate-400 font-bold truncate">Alunos: {getUserNamesForWorkout(workout.studentIds)}</span>
                    </div>
                )}
                {workout.videoUrl && (
                  <a href={String(workout.videoUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-brand-600/10 text-brand-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-all shadow-lg border border-brand-500/20">
                    <Video size={14} /> Ver Vídeo Explicativo
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-dark-950 rounded-[3rem] border border-dashed border-dark-800">
             <Dumbbell className="mx-auto text-dark-800 mb-4" size={48} />
             <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Nenhuma ficha técnica para este filtro.</p>
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
  initialSelectedId?: string | null;
}

const PersonalWorkoutForm: React.FC<PersonalWorkoutFormProps> = ({ workout, users, onSave, onCancel, currentUser, initialSelectedId }) => {
  const [formData, setFormData] = useState<Omit<PersonalizedWorkout, 'id'>>(
    workout || {
      title: '',
      description: '',
      videoUrl: '',
      studentIds: initialSelectedId ? [initialSelectedId] : [],
      createdAt: new Date().toISOString().split('T')[0],
      instructorName: String(currentUser.name),
    }
  );
  
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    workout?.studentIds || (initialSelectedId ? [initialSelectedId] : [])
  ); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return alert("Selecione ao menos um aluno.");
    onSave({ ...formData, studentIds: selectedUserIds }); 
  };

  const toggleUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(prev => prev.filter(uid => uid !== id));
    } else {
      setSelectedUserIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-dark-950 p-8 rounded-[3rem] border border-dark-800 shadow-2xl space-y-8 animate-fade-in mb-20 overflow-hidden">
      <div className="flex justify-between items-center border-b border-dark-800 pb-6">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
          {workout ? 'Editar Ficha' : 'Criar Nova Ficha'}
        </h3>
        <button onClick={onCancel} className="p-2 bg-dark-800 rounded-full text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Título do Treino</label>
            <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={String(formData.title)} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Conteúdo Técnico / Exercícios</label>
            <textarea required className="w-full h-48 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none resize-none" value={String(formData.description)} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Vídeo de Apoio (URL)</label>
            <input type="url" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-xs" value={String(formData.videoUrl || '')} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} />
          </div>
        </div>
        <div className="space-y-6 flex flex-col h-full bg-dark-900/30 p-6 rounded-[2.5rem] border border-dark-800">
          <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest">Alunos Atribuídos ({selectedUserIds.length})</h4>
          <div className="flex-1 overflow-y-auto max-h-[400px] p-2 custom-scrollbar space-y-2">
            {users.map(u => (
               <button 
                  key={u.id} 
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedUserIds.includes(u.id) ? 'bg-brand-600 border-brand-500 text-white shadow-lg' : 'bg-dark-950 border-dark-800 text-slate-500'}`}
               >
                 <span className="text-xs font-bold truncate">{String(u.name)}</span>
                 {selectedUserIds.includes(u.id) && <Plus size={14} className="rotate-45" />}
               </button>
            ))}
          </div>
          <div className="pt-6 border-t border-dark-800 flex flex-col gap-3">
            <button type="submit" className="w-full py-5 bg-brand-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-brand-600/30 hover:bg-brand-500 transition-all active:scale-95">Salvar Ficha Técnica</button>
            <button type="button" onClick={onCancel} className="w-full py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
          </div>
        </div>
      </form>
    </div>
  );
};
