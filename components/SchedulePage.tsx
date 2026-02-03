
import React, { useState, useEffect, useMemo } from 'react';
import { ClassSession, User, UserRole, AttendanceRecord, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { GeminiService } from '../services/geminiService';
import { Calendar, Plus, Edit, Trash2, UserPlus, UserCheck, X, Check, Loader2, Info, UserMinus, ListOrdered, ClipboardList, Search, User as UserIcon, Clock, AlertTriangle, CheckCheck, Save, Flag, Dumbbell, ArrowLeft } from 'lucide-react'; 
import { DAYS_OF_WEEK, WORKOUT_TYPES, RUNNING_CYCLE_METHODOLOGY } from '../constants'; 

interface SchedulePageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({ currentUser, onNavigate, addToast }) => {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState<ClassSession | null>(null);
  const [loading, setLoading] = useState(true);

  const canManageSchedule = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.TRAINER;
  
  const getNextOccurrenceDate = (dayOfWeek: string): string => {
    const today = new Date();
    const dayIndex = DAYS_OF_WEEK.indexOf(dayOfWeek);
    const todayIndex = (today.getDay() + 6) % 7; 

    let dayDifference = dayIndex - todayIndex;
    if (dayDifference < 0) dayDifference += 7;

    const nextDate = new Date();
    nextDate.setDate(today.getDate() + dayDifference);
    return nextDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [classData, userData] = await Promise.all([
        SupabaseService.getClasses(),
        SupabaseService.getAllUsers()
      ]);
      setClasses(classData);
      setAllUsers(userData);
    } catch (error: any) {
      addToast(`Erro ao carregar dados: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);
  
  const students = useMemo(() => allUsers.filter(u => u.role === UserRole.STUDENT), [allUsers]);
  const instructors = useMemo(() => allUsers.filter(u => u.role !== UserRole.STUDENT), [allUsers]);

  const classesGroupedByDay = useMemo(() => {
    return DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day] = classes
        .filter(c => c.dayOfWeek === day)
        .sort((a, b) => {
          if (a.date && b.date && a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        });
      return acc;
    }, {} as Record<string, ClassSession[]>);
  }, [classes]);

  const handleSaveClass = async (classData: Omit<ClassSession, 'id'>) => {
    setLoading(true);
    try {
      const payload = { ...classData, date: classData.date || undefined, cycleStartDate: classData.cycleStartDate || undefined };
      if (editingClass) {
        await SupabaseService.updateClass({ ...payload as ClassSession, id: editingClass.id });
        addToast("Aula atualizada com sucesso!", "success");
      } else {
        await SupabaseService.addClass(payload);
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
    if (!window.confirm("Ação irreversível. Excluir aula?")) return;
    setLoading(true);
    try {
      await SupabaseService.deleteClass(id);
      addToast("Aula excluída.", "success");
      setShowForm(false);
      setEditingClass(null);
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
        allStudents={students}
        instructors={instructors}
        onDelete={handleDeleteClass}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <button 
        onClick={() => onNavigate('DASHBOARD')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-2 transition-colors no-print"
      >
        <ArrowLeft size={14} /> Voltar ao Início
      </button>

      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Agenda Studio</h2>
          <p className="text-slate-400 text-sm">Controle de aulas, datas e presenças.</p>
        </div>
        {canManageSchedule && (
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
                <div key={cls.id} className={`rounded-2xl p-4 space-y-3 relative group border ${cls.type === 'RUNNING' ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500' : 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500'} transition-all overflow-hidden`}>
                  {cls.date && <div className="absolute top-0 left-0 bg-brand-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-br-lg">Especial</div>}
                  <div className="absolute top-3 right-3 flex gap-1 z-10">
                    {canManageSchedule && (
                      <>
                        <button onClick={() => setShowAttendanceModal(cls)} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 shadow-lg transition-colors" title="Fazer Chamada"><Check size={12} /></button>
                        <button onClick={() => { setEditingClass(cls); setShowForm(true); }} className="p-1.5 bg-dark-800 text-white rounded-lg hover:bg-brand-600 shadow-lg transition-colors"><Edit size={12} /></button>
                        <button onClick={() => handleDeleteClass(cls.id)} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 shadow-lg transition-colors"><Trash2 size={12} /></button>
                      </>
                    )}
                  </div>
                  <div className="pr-12">
                    <h4 className={`font-bold text-sm leading-tight flex items-center gap-2 ${cls.type === 'RUNNING' ? 'text-emerald-400' : 'text-blue-400'}`}>
                      {cls.type === 'RUNNING' ? <Flag size={14} /> : <Dumbbell size={14} />}
                      <span>{cls.title}</span>
                    </h4>
                     {cls.date ? (
                        <div className="flex items-center gap-1.5 mt-1 bg-brand-500/10 px-2 py-1 rounded-md w-fit">
                            <Calendar size={12} className="text-brand-500" />
                            <p className="text-[10px] text-brand-500 font-black uppercase">{new Date(`${cls.date}T03:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 mt-1 bg-dark-800 px-2 py-1 rounded-md w-fit">
                            <Calendar size={12} className="text-slate-400" />
                            <p className="text-[10px] text-slate-400 font-black uppercase">Próxima {getNextOccurrenceDate(cls.dayOfWeek)}</p>
                        </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold uppercase">
                    <span className="flex items-center gap-1"><Clock size={12}/> {cls.startTime}</span>
                    <span className="flex items-center gap-1"><UserCheck size={12}/> {cls.instructor.split(' ')[0]}</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-dark-800">
                    <span className="text-[10px] text-slate-500 font-bold">Vagas: <span className="text-white">{cls.enrolledStudentIds.length}/{cls.maxCapacity}</span></span>
                    {cls.enrolledStudentIds.includes(currentUser.id) && <span className="text-[9px] text-emerald-500 font-black uppercase flex items-center gap-1"><Check size={12}/> Inscrito</span>}
                  </div>
                </div>
              ))}
              {(!classesGroupedByDay[day] || classesGroupedByDay[day].length === 0) && (
                <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-dark-900 rounded-2xl">
                  <p className="text-slate-700 text-[10px] font-black uppercase">Sem Aulas</p>
                </div>
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

const AttendanceModal = ({ classSession, students, onClose, addToast }: any) => {
  const today = new Date().toISOString().split('T')[0];
  const [attendance, setAttendance] = useState<Record<string, Partial<AttendanceRecord>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchExistingAttendance = async () => {
      setLoading(true);
      try {
        const records = await SupabaseService.getAttendanceByClassAndDate(classSession.id, today);
        const map: Record<string, Partial<AttendanceRecord>> = {};
        records.forEach(r => { map[r.studentId] = r; });
        students.forEach((s: any) => { if (!map[s.id]) map[s.id] = { isPresent: false }; });
        setAttendance(map);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchExistingAttendance();
  }, [classSession.id, today, students]);
  
  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsPromises = students.map(async (s: any) => {
        const studentAttendance = attendance[s.id] || {};
        return {
          classId: classSession.id, studentId: s.id, date: today,
          isPresent: !!studentAttendance.isPresent,
          totalTimeSeconds: studentAttendance.totalTimeSeconds || undefined,
          averagePace: studentAttendance.averagePace || undefined,
        };
      });
      const recordsToSave = await Promise.all(recordsPromises);
      await SupabaseService.saveAttendance(recordsToSave as any);
      addToast("Chamada salva!", "success");
      onClose();
    } catch (e: any) { addToast(`Erro: ${e.message}`, "error"); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-dark-900 border border-dark-700 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-dark-800">
           <div className="flex justify-between items-start mb-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Chamada</h3>
              <button onClick={onClose} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full"><X size={20}/></button>
           </div>
           <p className="text-brand-500 font-bold text-[10px] uppercase tracking-widest">{classSession.title}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
           {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500" /></div> : students.map((s: any) => (
             <div key={s.id} className={`p-4 rounded-2xl border transition-all ${attendance[s.id]?.isPresent ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-dark-950 border-dark-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={s.avatarUrl || `https://ui-avatars.com/api/?name=${s.name}`} className="w-10 h-10 rounded-xl object-cover" />
                    <p className={`text-sm font-bold ${attendance[s.id]?.isPresent ? 'text-emerald-500' : 'text-white'}`}>{String(s.name)}</p>
                  </div>
                  <button onClick={() => setAttendance({...attendance, [s.id]: {...attendance[s.id], isPresent: !attendance[s.id]?.isPresent}})} className={`w-8 h-8 rounded-full flex items-center justify-center ${attendance[s.id]?.isPresent ? 'bg-emerald-500 text-white' : 'bg-dark-800 text-slate-600'}`}>
                     {attendance[s.id]?.isPresent ? <Check size={18} strokeWidth={3}/> : <div className="w-2 h-2 rounded-full bg-slate-600"/>}
                  </button>
                </div>
             </div>
           ))}
        </div>
        <div className="p-8 border-t border-dark-800 bg-dark-900/50">
           <button onClick={handleSave} disabled={saving} className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-brand-600/20 flex items-center justify-center gap-2">
             {saving ? <Loader2 size={16} className="animate-spin"/> : <CheckCheck size={16}/>} Finalizar Chamada
           </button>
        </div>
      </div>
    </div>
  );
};

const ClassForm = ({ classSession, onSave, onCancel, allStudents, instructors, onDelete }: any) => {
  const [formData, setFormData] = useState<Partial<ClassSession>>(classSession || {
    title: '', dayOfWeek: 'Segunda', startTime: '07:00', durationMinutes: 60, instructor: '', maxCapacity: 15, enrolledStudentIds: [], type: 'FUNCTIONAL'
  });

  return (
    <div className="max-w-4xl mx-auto bg-dark-950 p-8 rounded-[3rem] border border-dark-800 shadow-2xl space-y-8 animate-fade-in mb-20 overflow-hidden">
      <div className="flex justify-between items-center border-b border-dark-800 pb-6">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{classSession ? 'Editar Aula' : 'Nova Aula'}</h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full"><X size={24}/></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
           <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1 text-white">Título</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm font-bold" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
           <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1 text-white">Tipo</label><select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}><option value="RUNNING">CORRIDA</option><option value="FUNCTIONAL">FUNCIONAL</option></select></div>
              <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1 text-white">Treinador</label><select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={formData.instructor} onChange={e => setFormData({ ...formData, instructor: e.target.value })}><option value="">Selecione...</option>{instructors.map((inst: any) => <option key={inst.id} value={inst.name}>{inst.name}</option>)}</select></div>
           </div>
        </div>
        <div className="pt-6 border-t border-dark-800 flex gap-4">
            <button type="button" onClick={onCancel} className="flex-1 py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            <button type="button" onClick={() => onSave(formData)} className="flex-1 bg-brand-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Salvar</button>
        </div>
      </div>
    </div>
  );
};
