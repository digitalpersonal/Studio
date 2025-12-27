

import React, { useState, useEffect } from 'react';
import { PersonalizedWorkout, User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Dumbbell, Plus, Edit, Trash2, Loader2, Video, User as UserIcon } from 'lucide-react';

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
          // If staff, and a user is selected, filter by user. Otherwise, get all.
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
    // Update selectedUserId if initialStudentId changes (e.g., navigating from ManageUsersPage)
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
      // Re-fetch based on current filters/user role
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
          <h2 className="text-2xl font-bold text-white">Treinos Personalizados</h2>
          <p className="text-slate-400 text-sm">Acesse e gerencie treinos específicos para cada aluno.</p>
        </div>
        {isStaff && (
          <button
            onClick={() => { setEditingWorkout(null); setShowForm(true); }}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg shadow-brand-500/20"
          >
            <Plus size={16} className="mr-2" /> Novo Treino
          </button>
        )}
      </header>

      {isStaff && (
        <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl flex flex-col md:flex-row items-center gap-4">
          <label className="text-slate-400 text-[10px] font-bold uppercase shrink-0">Filtrar por Usuário:</label> 
          <select
            className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workouts.length > 0 ? (
          workouts.map(workout => (
            <div key={workout.id} className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl space-y-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-bold text-lg flex items-center gap-2">
                    <Dumbbell size={20} className="text-brand-500" /> {String(workout.title)}
                  </h4>
                  <p className="text-slate-500 text-xs">Criado em: {String(workout.createdAt)}</p>
                </div>
                {isStaff && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingWorkout(workout); setShowForm(true); }} className="p-2 bg-dark-800 text-slate-400 rounded-lg hover:text-white transition-colors" title="Editar Treino">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteWorkout(workout.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Excluir Treino">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-sm whitespace-pre-line">{String(workout.description)}</p>
              
              {workout.studentIds && workout.studentIds.length > 0 && isStaff && (
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                      <UserIcon size={14} /> Atribuído a: {getUserNamesForWorkout(workout.studentIds)}
                  </p>
              )}

              {workout.videoUrl && (
                <div className="mt-4 pt-4 border-t border-dark-800">
                  <a href={String(workout.videoUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20"
                >
                    <Video size={16} /> Assistir Vídeo
                  </a>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-slate-500 italic">Nenhum treino personalizado encontrado.</p>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, studentIds: selectedUserIds }); 
  };

  const handleUserSelection = (e: React.ChangeEvent<HTMLSelectElement>) => { 
    const options = Array.from(e.target.selectedOptions).map(option => (option as HTMLOptionElement).value);
    setSelectedUserIds(options); 
  };

  return (
    <div className="max-w-xl mx-auto bg-dark-950 p-8 rounded-3xl border border-dark-800 shadow-xl space-y-6 animate-fade-in">
      <h3 className="text-xl font-bold text-white border-b border-dark-800 pb-4">
        {workout ? 'Editar Treino' : 'Novo Treino Personalizado'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Título do Treino</label>
          <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.title)} onChange={e => setFormData({ ...formData, title: e.target.value })} />
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Descrição do Treino</label>
          <textarea required className="w-full h-32 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.description)} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Link do Vídeo (Opcional)</label>
          <input type="url" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.videoUrl || '')} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} />
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Atribuir a Usuário(s)</label> 
          <select
            multiple
            className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white min-h-[100px]"
            value={selectedUserIds} 
            onChange={handleUserSelection} 
          >
            {users.map(u => ( 
              <option key={u.id} value={u.id}>{String(u.name)}</option>
            ))}
          </select>
          <p className="text-slate-500 text-xs mt-1">Selecione um ou mais usuários (Ctrl/Cmd + clique para múltiplos).</p>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onCancel} className="px-6 py-3 bg-dark-800 text-white rounded-lg font-bold">Cancelar</button>
          <button type="submit" className="px-6 py-3 bg-brand-600 text-white rounded-lg font-bold shadow-lg shadow-brand-500/20">Salvar Treino</button>
        </div>
      </form>
    </div>
  );
};