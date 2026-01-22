
import React, { useState, useEffect, useMemo } from 'react';
import { ClassSession, User, UserRole, AttendanceRecord } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Calendar, Plus, Edit, Trash2, UserPlus, UserCheck, X, Check, Loader2, Info, UserMinus, ListOrdered, ClipboardList, Search, User as UserIcon } from 'lucide-react'; 
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
  const [loading, setLoading] = useState(true);

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
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Agenda Studio</h2>
          <p className="text-slate-400 text-sm">Cronograma de aulas e controle de presenças.</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingClass(null); setShowForm(true); }} className="bg-brand-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all">
            <Plus size={16} className="mr-2" /> Nova Aula
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
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isStaff && (
                      <button 
                        onClick={() => setShowAttendanceModal(cls)} 
                        className="p-1.5 bg-emerald-600/10 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                        title="Fazer Chamada"
                      >
                        <Check size={12} />
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        <button onClick={() => { setEditingClass(cls); setShowForm(true); }} className="p-1.5 bg-dark-800 text-slate-400 rounded-lg hover:text-white transition-colors"><Edit size={12} /></button>
                        <button onClick={() => handleDeleteClass(cls.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={12} /></button>
                      </>
                    )}
                  </div>
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
                      isStaff && (
                         <button onClick={() => setShowAttendanceModal(cls)} className="text-[9px] text-emerald-500 font-black uppercase hover:underline">Chamada</button>
                      )
                    )}
                  </div>
                </div>
              ))}
              {(!classesGroupedByDay[day] || classesGroupedByDay[day].length === 0) && (
                <p className="text-slate-600 text-xs italic py-4">Sem aulas</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAttendanceModal && (
        <AttendanceModal 
          classSession={showAttendanceModal} 
          students={students.filter(s => showAttendanceModal.enrolledStudentIds.includes(s.id))}
          onClose={() => setShowAttendanceModal(null)}
          addToast={addToast}
        />
      )}
    </div>
  );
};

const AttendanceModal = ({ classSession, students, onClose, addToast }: { classSession: ClassSession, students: User[], onClose: () => void, addToast: any }) => {
  const today = new Date().toISOString().split('T')[0];
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchExistingAttendance = async () => {
      setLoading(true);
      try {
        const records = await SupabaseService.getAttendanceByClassAndDate(classSession.id, today);
        const map: Record<string, boolean> = {};
        records.forEach(r => { map[r.studentId] = r.isPresent; });
        
        // Inicializa com false para quem ainda não tem registro
        // Fix: Changed s.studentId to s.id as studentId does not exist on User type
        students.forEach(s => {
          if (map[s.id] === undefined) map[s.id] = false;
        });
        
        setAttendance(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchExistingAttendance();
  }, [classSession.id, today, students]);

  const togglePresence = (studentId: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fix: Cast isPresent to boolean and explicitly type records to fix "unknown" type error
      const records: Omit<AttendanceRecord, 'id'>[] = Object.entries(attendance).map(([studentId, isPresent]) => ({
        classId: classSession.id,
        studentId,
        date: today,
        isPresent: isPresent as boolean
      }));
      await SupabaseService.saveAttendance(records);
      addToast("Chamada salva com sucesso!", "success");
      onClose();
    } catch (e: any) {
      addToast("Erro ao salvar chamada.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-dark-900 border border-dark-700 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-dark-800">
           <div className="flex justify-between items-start mb-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Chamada / Check-in</h3>
              <button onClick={onClose} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full"><X size={20}/></button>
           </div>
           <p className="text-brand-500 font-bold text-[10px] uppercase tracking-widest">{classSession.title} • {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
           {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500" /></div>
           ) : students.length > 0 ? (
             students.map(s => (
               <button 
                 key={s.id} 
                 onClick={() => togglePresence(s.id)}
                 className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${attendance[s.id] ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-dark-950 border-dark-800 hover:border-slate-700'}`}
               >
                 <div className="flex items-center gap-3">
                   <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-10 h-10 rounded-xl object-cover border border-dark-800" />
                   <div className="text-left">
                      <p className={`text-sm font-bold ${attendance[s.id] ? 'text-emerald-500' : 'text-white'}`}>{String(s.name)}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black">Aluno Matriculado</p>
                   </div>
                 </div>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${attendance[s.id] ? 'bg-emerald-500 text-white' : 'bg-dark-800 text-slate-600'}`}>
                    {attendance[s.id] ? <Check size={18} strokeWidth={3}/> : <div className="w-2 h-2 rounded-full bg-slate-600"/>}
                 </div>
               </button>
             ))
           ) : (
             <div className="py-20 text-center">
               <p className="text-slate-600 font-bold uppercase text-[10px]">Nenhum aluno matriculado nesta aula.</p>
             </div>
           )}
        </div>

        <div className="p-8 border-t border-dark-800 bg-dark-900/50 flex flex-col gap-3">
           <div className="flex justify-between items-center mb-2">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Resumo:</span>
              <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{Object.values(attendance).filter(v => v).length} Presentes</span>
           </div>
           <button 
             onClick={handleSave} 
             disabled={saving || loading}
             className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all flex items-center justify-center gap-2"
           >
             {saving ? <Loader2 size={16} className="animate-spin"/> : <CheckCheck size={16}/>}
             Finalizar Chamada
           </button>
        </div>
      </div>
    </div>
  );
};

const CheckCheck = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5"></path><path d="m22 10-7.5 7.5L13 16"></path></svg>;

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
    <div className="max-w-4xl mx-auto bg-dark-950 p-8 rounded-[3rem] border border-dark-800 shadow-2xl space-y-8 animate-fade-in mb-20">
      <div className="flex justify-between items-center border-b border-dark-800 pb-6">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
          {classSession ? 'Editar Aula' : 'Novo Agendamento'}
        </h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full transition-colors"><X size={24}/></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
           <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><ClipboardList size={18}/> Informações Básicas</h4>
           <div>
             <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Título do Treino</label>
             <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm font-bold" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Dia Fixo</label>
                <select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold" value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}>
                  {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Início</label>
                <input type="time" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Capacidade</label>
                <input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold" value={formData.maxCapacity} onChange={e => setFormData({ ...formData, maxCapacity: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Modalidade</label>
                <select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                  {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
           </div>
           <div>
             <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Responsável pela Aula</label>
             <select required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold" value={formData.instructor} onChange={e => setFormData({ ...formData, instructor: e.target.value })}>
               <option value="">Selecione o treinador...</option>
               {instructors.map(inst => <option key={inst.id} value={inst.name}>{inst.name}</option>)}
             </select>
           </div>
        </div>

        <div className="space-y-5 flex flex-col h-full bg-dark-900/30 p-6 rounded-[2rem] border border-dark-800">
           <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><UserPlus size={18}/> Alunos Inscritos ({formData.enrolledStudentIds?.length || 0})</h4>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14}/>
              <input 
                className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 pl-10 text-white text-xs focus:border-brand-500 outline-none" 
                placeholder="Buscar por nome..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex-1 overflow-y-auto max-h-[300px] p-2 custom-scrollbar space-y-1">
              {filteredStudents.map(s => (
                <button 
                  key={s.id} 
                  type="button"
                  onClick={() => toggleStudent(s.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${formData.enrolledStudentIds?.includes(s.id) ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'hover:bg-dark-800 text-slate-400 bg-dark-950/50'}`}
                >
                  <div className="flex items-center gap-2">
                     <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-6 h-6 rounded-lg" />
                     <span className="text-xs font-bold truncate max-w-[150px]">{s.name}</span>
                  </div>
                  {formData.enrolledStudentIds?.includes(s.id) ? <Check size={14} strokeWidth={3}/> : <Plus size={14}/>}
                </button>
              ))}
           </div>
           <div className="pt-6 mt-4 border-t border-dark-800 flex gap-3">
              <button onClick={onCancel} className="flex-1 py-4 bg-dark-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">Cancelar</button>
              <button onClick={() => onSave(formData)} className="flex-1 py-4 bg-brand-600 text-white font-black rounded-xl uppercase text-[10px] tracking-widest shadow-xl shadow-brand-600/30 hover:bg-brand-500 transition-all">Salvar Aula</button>
           </div>
        </div>
      </div>
    </div>
  );
};
