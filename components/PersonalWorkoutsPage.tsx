
import React, { useState, useEffect, useMemo } from 'react';
import { PersonalizedWorkout, User, UserRole, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Dumbbell, Plus, Edit, Trash2, Loader2, Video, User as UserIcon, Search, Check, X, ArrowLeft } from 'lucide-react';

interface PersonalWorkoutsPageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialStudentId?: string; 
}

export const PersonalWorkoutsPage: React.FC<PersonalWorkoutsPageProps> = ({ currentUser, onNavigate, addToast, initialStudentId }) => {
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
        const workoutData = await SupabaseService.getPersonalizedWorkouts(isStaff ? selectedUserId || undefined : currentUser.id);
        setWorkouts(workoutData);
      } catch (e) { addToast(`Erro ao carregar treinos.`, "error"); } finally { setLoading(false); }
    };
    fetchWorkouts();
  }, [currentUser, selectedUserId, addToast, isStaff]);

  if (loading) return <div className="flex justify-center items-center h-full min-h-[500px]"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <button 
        onClick={() => onNavigate('DASHBOARD')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-2 transition-colors"
      >
        <ArrowLeft size={14} /> Voltar ao Início
      </button>

      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Treinos Personalizados</h2>
          <p className="text-slate-400 text-sm font-medium">Acesse seus treinos específicos.</p>
        </div>
        {isStaff && <button onClick={() => setShowForm(true)} className="bg-brand-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Novo Treino</button>}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts.length > 0 ? workouts.map(workout => (
          <div key={workout.id} className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl space-y-4">
              <h4 className="text-white font-bold text-lg flex items-center gap-2"><Dumbbell size={20} className="text-brand-500" /> {String(workout.title)}</h4>
              <p className="text-slate-400 text-sm whitespace-pre-line leading-relaxed line-clamp-3">{String(workout.description)}</p>
              {workout.videoUrl && <a href={String(workout.videoUrl)} target="_blank" className="block text-center bg-brand-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Assistir Vídeo</a>}
          </div>
        )) : <div className="col-span-full py-20 text-center"><Dumbbell className="mx-auto text-dark-800 mb-4" size={48} /><p className="text-slate-600 font-bold uppercase text-[10px]">Nenhum treino disponível.</p></div>}
      </div>
    </div>
  );
};
