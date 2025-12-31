
import React, { useState, useEffect, useMemo } from 'react';
import { ClassSession, User, UserRole, AttendanceRecord } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Calendar, Plus, Edit, Trash2, UserPlus, UserCheck, X, Check, Loader2, Info, UserMinus, ListOrdered, ClipboardList, Search } from 'lucide-react'; 
import { DAYS_OF_WEEK } from '../constants';
import { WORKOUT_TYPES } from '../constants'; 

interface SchedulePageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({ currentUser, addToast }) => {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<User[]>([]); 
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState<ClassSession | null>(null);
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayDateStr, setTodayDateStr] = useState(''); 

  const isStaff = currentUser.role !== UserRole.STUDENT;
  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;

  const refreshData = async () => {
    setLoading(true);
    try {
      const [classData, userData] = await Promise.all([
        SupabaseService.getClasses(),
        SupabaseService.getAllUsers()
      ]);
      setClasses(classData);
      setStudents(userData);
      setTodayDateStr(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      addToast(`Erro ao carregar dados: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  const classesGroupedByDay = useMemo(() => {
    return DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day] = classes
        .filter(c => c.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    }, {} as Record<string, ClassSession[]>);
  }, [classes]);

  const handleSaveClass = async (classData: Omit<ClassSession, 'id'>) => {
    setLoading(true);
    try {
      if (editingClass) {
        await SupabaseService.updateClass({ ...classData as ClassSession, id: editingClass.id });
        addToast("Aula atualizada com sucesso!", "success");
      } else {
        await SupabaseService.addClass(classData);
        addToast("Nova aula criada!", "success");
      }
      setShowForm(false);
      setEditingClass(null);
      refreshData();
    } catch (error: any) {
      addToast(`Erro ao salvar aula: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Excluir esta aula permanentemente?")) return;
    setLoading(true);
    try {
      await SupabaseService.deleteClass(id);
      addToast("Aula removida.", "success");
      refreshData();
    } catch (error: any) {
      addToast(`Erro ao excluir: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && classes.length === 0) {
    return <div className="flex justify-center items-center h-full min-h-[500px]"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;
  }

  if (showForm) {
    return (
      <ClassForm
        classSession={editingClass}
        onSave={handleSaveClass}
        onCancel={() => { setShowForm(false); setEditingClass(null); }}
        allStudents={students.filter(s => s.role === UserRole.STUDENT)}
        instructors={students.filter(s => s.role !== UserRole.STUDENT)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Agenda Studio</h2>
          <p className="text-slate-400 text-sm">Cronograma de aulas e eventos.</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingClass(null); setShowForm(true); }} className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center shadow-lg shadow-brand-500/20 hover:bg-brand-500">
            <Plus size={16} className="mr-2" /> Agendar Aula
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-white border-b border-dark-800 pb-3 uppercase tracking-tighter">{day}</h3>
            <div className="space-y-4">
              {classesGroupedByDay[day]?.map(cls => (
                <div key={cls.id} className="bg-dark-900 border border-dark-800 rounded-2xl p-4 space-y-3 relative group hover:border-brand-500/50 transition-all">
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingClass(cls); setShowForm(true); }} className="p-1.5 bg-dark-800 text-slate-400 rounded-lg hover:text-white transition-colors"><Edit size={12} /></button>
                      <button onClick={() => handleDeleteClass(cls.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={12} /></button>
                    </div>
                  )}
                  <div className="pr-12">
                    <h4 className="text-white font-bold text-sm leading-tight">{cls.title}</h4>
                    {cls.date && <p className="text-[10px] text-brand-500 font-bold uppercase mt-1">{new Date(cls.date).toLocaleDateString('pt-BR')}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold uppercase">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {cls.startTime}</span>
                    <span className="flex items-center gap-1"><UserCheck size={12}/> {cls.instructor.split(' ')[0]}</span>
                    <span className={`px-2 py-0.5 rounded-md ${cls.type === 'RUNNING' ? 'bg-blue-500/10 text-blue-500' : 'bg-brand-500/10 text-brand-500'}`}>{cls.type}</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-dark-800">
                    <span className="text-[10px] text-slate-500 font-bold">Vagas: <span className="text-white">{cls.enrolledStudentIds.length}/{cls.maxCapacity}</span></span>
                    {cls.enrolledStudentIds.includes(currentUser.id) ? (
                      <span className="text-[9px] text-emerald-500 font-black uppercase flex items-center gap-1"><Check size={12}/> Inscrito</span>
                    ) : (
                      cls.enrolledStudentIds.length < cls.maxCapacity && (
                        <button onClick={() => isAdmin ? setEditingClass(cls) : null} className="text-[9px] text-brand-500 font-black uppercase hover:underline">Ver Mais</button>
                      )
                    )}
                  </div>
                </div>
              ))}
              {(!classesGroupedByDay[day] || classesGroupedByDay[day].length === 0) && (
                <p className="text-slate-600 text-xs italic py-4">Vazio</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ClassForm = ({ classSession, onSave, onCancel, allStudents, instructors }: { classSession: ClassSession | null, onSave: (d: any) => void, onCancel: () => void, allStudents: User[], instructors: User[] }) => {
  const [formData, setFormData] = useState<Partial<ClassSession>>(classSession || {
    title: '', description: '', dayOfWeek: 'Segunda', date: '', startTime: '07:00',
    durationMinutes: 60, instructor: '', maxCapacity: 15, enrolledStudentIds: [],
    type: 'FUNCTIONAL', wod: '', workoutDetails: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleStudent = (id: string) => {
    const current = formData.enrolledStudentIds || [];
    if (current.includes(id)) {
      setFormData({ ...formData, enrolledStudentIds: current.filter(sid => sid !== id) });
    } else {
      if (current.length >= (formData.maxCapacity || 15)) return alert("Capacidade máxima atingida!");
      setFormData({ ...formData, enrolledStudentIds: [...current, id] });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl space-y-8 animate-fade-in mb-20">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter">
          {classSession ? 'Editar Aula' : 'Novo Agendamento'}
        </h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-white"><X size={24}/></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-5">
           <h4 className="text-brand-500 font-bold text-xs uppercase border-b border-dark-800 pb-2">Informações Básicas</h4>
           <div>
             <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Título</label>
             <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Dia Principal</label>
                <select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}>
                  {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Data Específica (Opcional)</label>
                <input type="date" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Início</label>
                <input type="time" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Vagas</label>
                <input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.maxCapacity} onChange={e => setFormData({ ...formData, maxCapacity: Number(e.target.value) })} />
              </div>
           </div>
           <div>
             <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Instrutor / Professor</label>
             <select required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.instructor} onChange={e => setFormData({ ...formData, instructor: e.target.value })}>
               <option value="">Selecione...</option>
               {instructors.map(inst => <option key={inst.id} value={inst.name}>{inst.name}</option>)}
             </select>
           </div>
           <div>
             <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Tipo</label>
             <select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
               {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
             </select>
           </div>
        </div>

        <div className="space-y-5 flex flex-col h-full">
           <h4 className="text-brand-500 font-bold text-xs uppercase border-b border-dark-800 pb-2">Matrículas ({formData.enrolledStudentIds?.length || 0})</h4>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14}/>
              <input 
                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 pl-10 text-white text-xs focus:border-brand-500 outline-none" 
                placeholder="Buscar aluno..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex-1 bg-dark-900 border border-dark-800 rounded-2xl overflow-y-auto max-h-[300px] p-2 custom-scrollbar">
              {filteredStudents.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => toggleStudent(s.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl mb-1 transition-all ${formData.enrolledStudentIds?.includes(s.id) ? 'bg-brand-600 text-white' : 'hover:bg-dark-800 text-slate-400'}`}
                >
                  <span className="text-xs font-bold">{s.name}</span>
                  {formData.enrolledStudentIds?.includes(s.id) ? <Check size={14}/> : <Plus size={14}/>}
                </button>
              ))}
           </div>
           <div className="pt-4 border-t border-dark-800 space-y-4">
              <button onClick={() => onSave(formData)} className="w-full bg-brand-600 text-white font-black py-4 rounded-xl uppercase text-xs tracking-widest shadow-xl shadow-brand-600/20">Salvar Agendamento</button>
              <button onClick={onCancel} className="w-full text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-white">Descartar Alterações</button>
           </div>
        </div>
      </div>
    </div>
  );
};
