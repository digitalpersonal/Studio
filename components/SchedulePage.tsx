
import React, { useState, useEffect, useMemo } from 'react';
import { ClassSession, User, UserRole, AttendanceRecord } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { GeminiService } from '../services/geminiService';
import { Calendar, Plus, Edit, Trash2, UserPlus, UserCheck, X, Check, Loader2, Info, UserMinus, ListOrdered, ClipboardList, Search, User as UserIcon, Clock, AlertTriangle, CheckCheck, Save } from 'lucide-react'; 
import { DAYS_OF_WEEK, WORKOUT_TYPES, RUNNING_CYCLE_METHODOLOGY } from '../constants'; 

interface SchedulePageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({ currentUser, addToast }) => {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState<ClassSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Permissions check: Admins and Trainers can manage all aspects of the schedule.
  const canManageSchedule = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.TRAINER;
  
  const getNextOccurrenceDate = (dayOfWeek: string): string => {
    const today = new Date();
    const dayIndex = DAYS_OF_WEEK.indexOf(dayOfWeek);
    const todayIndex = (today.getDay() + 6) % 7; // Monday = 0

    let dayDifference = dayIndex - todayIndex;
    if (dayDifference < 0) {
        dayDifference += 7;
    }

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
      const payload = { 
        ...classData, 
        date: classData.date || undefined,
        cycleStartDate: classData.cycleStartDate || undefined
      };

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
    if (!window.confirm("Atenção! Você deseja excluir esta aula permanentemente? Esta ação não pode ser desfeita.")) return;
    setLoading(true);
    try {
      await SupabaseService.deleteClass(id);
      addToast("Aula excluída permanentemente.", "success");
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
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Agenda Studio</h2>
          <p className="text-slate-400 text-sm">Controle de aulas, das datas e presenças.</p>
        </div>
        {canManageSchedule && (
          <button onClick={() => { setEditingClass(null); setShowForm(true); }} className="bg-brand-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-brand-500/20 hover:bg-brand-500 transition-all">
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
                <div key={cls.id} className={`bg-dark-900 border border-dark-800 rounded-2xl p-4 space-y-3 relative group ${cls.type === 'RUNNING' ? 'hover:border-blue-500' : 'hover:border-brand-500'} transition-all overflow-hidden`}>
                  {cls.date && (
                    <div className="absolute top-0 left-0 bg-brand-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-br-lg">
                      Especial
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-1 z-10">
                    {canManageSchedule && (
                      <>
                        <button 
                          onClick={() => setShowAttendanceModal(cls)} 
                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 shadow-lg transition-colors"
                          title="Fazer Chamada"
                        >
                          <Check size={12} />
                        </button>
                        <button onClick={() => { setEditingClass(cls); setShowForm(true); }} className="p-1.5 bg-dark-800 text-white rounded-lg hover:bg-brand-600 shadow-lg transition-colors"><Edit size={12} /></button>
                        <button onClick={() => handleDeleteClass(cls.id)} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 shadow-lg transition-colors"><Trash2 size={12} /></button>
                      </>
                    )}
                  </div>
                  <div className="pr-12">
                    <h4 className="text-white font-bold text-sm leading-tight">{cls.title}</h4>
                     {cls.date ? (
                        <div className="flex items-center gap-1.5 mt-1 bg-brand-500/10 px-2 py-1 rounded-md w-fit">
                            <Calendar size={12} className="text-brand-500" />
                            <p className="text-[10px] text-brand-500 font-black uppercase">
                                {new Date(`${cls.date}T03:00:00`).toLocaleDateString('pt-BR', { weekday: 'long'})}, {new Date(`${cls.date}T03:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 mt-1 bg-dark-800 px-2 py-1 rounded-md w-fit">
                            <Calendar size={12} className="text-slate-400" />
                            <p className="text-[10px] text-slate-400 font-black uppercase">
                                Próxima em {getNextOccurrenceDate(cls.dayOfWeek)}
                            </p>
                        </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold uppercase">
                    <span className="flex items-center gap-1"><Clock size={12} className="text-slate-600"/> {cls.startTime}</span>
                    <span className="flex items-center gap-1"><UserCheck size={12} className="text-slate-600"/> {cls.instructor.split(' ')[0]}</span>
                    <span className={`px-2 py-0.5 rounded-md ${cls.type === 'RUNNING' ? 'bg-blue-500/10 text-blue-500' : 'bg-brand-500/10 text-brand-500'}`}>
                      {cls.type === 'RUNNING' ? 'Corrida' : 'Funcional'}
                    </span>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-dark-800">
                    <span className="text-[10px] text-slate-500 font-bold">Vagas: <span className="text-white">{cls.enrolledStudentIds.length}/{cls.maxCapacity}</span></span>
                    {cls.enrolledStudentIds.includes(currentUser.id) ? (
                      <span className="text-[9px] text-emerald-500 font-black uppercase flex items-center gap-1"><Check size={12}/> Inscrito</span>
                    ) : (
                      currentUser.role === UserRole.STUDENT && (
                         <span className="text-[9px] text-slate-600 font-black uppercase">Pendente</span>
                      )
                    )}
                  </div>
                </div>
              ))}
              {(!classesGroupedByDay[day] || classesGroupedByDay[day].length === 0) && (
                <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-dark-900 rounded-2xl">
                  <Clock className="text-dark-800 mb-2" size={24} />
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

const AttendanceModal = ({ classSession, students, onClose, addToast }: { classSession: ClassSession, students: User[], onClose: () => void, addToast: any }) => {
  const today = new Date().toISOString().split('T')[0];
  const [attendance, setAttendance] = useState<Record<string, Partial<AttendanceRecord>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const calculateAge = (birthDate?: string): number => {
      if (!birthDate) return 0;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
      }
      return age;
  };

  const getAgeGroup = (age: number): string => {
      if (age < 20) return "U20";
      if (age <= 29) return "20-29";
      if (age <= 39) return "30-39";
      if (age <= 49) return "40-49";
      if (age <= 59) return "50-59";
      return "60+";
  };
  
  const calculatePace = (seconds?: number, distanceKm?: number): string => {
      if (!seconds || !distanceKm || distanceKm <= 0 || seconds <= 0) return '00:00 /km';
      const paceDecimal = (seconds / 60) / distanceKm;
      const paceMinutes = Math.floor(paceDecimal);
      const paceSeconds = Math.round((paceDecimal - paceMinutes) * 60);
      return `${String(paceMinutes).padStart(2, '0')}:${String(paceSeconds).padStart(2, '0')} /km`;
  };

  useEffect(() => {
    const fetchExistingAttendance = async () => {
      setLoading(true);
      try {
        const records = await SupabaseService.getAttendanceByClassAndDate(classSession.id, today);
        const map: Record<string, Partial<AttendanceRecord>> = {};
        records.forEach(r => { map[r.studentId] = r; });
        students.forEach(s => {
          if (!map[s.id]) {
            map[s.id] = { isPresent: false };
          }
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
  
  const updateStudentAttendance = <K extends keyof AttendanceRecord>(studentId: string, field: K, value: AttendanceRecord[K]) => {
    setAttendance(prev => {
        const newAttendanceState = { ...prev };
        const currentStudentData: Partial<AttendanceRecord> = newAttendanceState[studentId] || {};
        const updatedStudentData: Partial<AttendanceRecord> = {
          ...currentStudentData,
          [field]: value,
        };

        if (field === 'totalTimeSeconds' && classSession.type === 'RUNNING' && typeof value === 'number') {
            updatedStudentData.averagePace = calculatePace(value, classSession.distanceKm);
        }

        newAttendanceState[studentId] = updatedStudentData;
        return newAttendanceState;
    });
  };

  const triggerCycleSummaryGeneration = async (student: User) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 28); // 4 weeks
        
        const cyclePerformance = await SupabaseService.getAttendanceForStudentInDateRange(student.id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
        
        if(cyclePerformance.length > 0) {
            const summaryText = await GeminiService.generateCycleSummary(student.name, cyclePerformance);
            
            await SupabaseService.addCycleSummary({
                studentId: student.id,
                cycleEndDate: endDate.toISOString().split('T')[0],
                summaryText: summaryText,
                startPace: cyclePerformance[0]?.averagePace,
                endPace: cyclePerformance[cyclePerformance.length - 1]?.averagePace,
                performanceData: cyclePerformance,
            });
            addToast(`Resumo do ciclo de ${student.name.split(' ')[0]} gerado com IA!`, 'success');
        }
    } catch (e) {
        console.error(`Falha ao gerar resumo para ${student.name}:`, e);
        addToast(`Erro na IA para ${student.name.split(' ')[0]}.`, 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsPromises = students.map(async (s) => {
        const studentAge = calculateAge(s.birthDate);
        const studentAttendance = attendance[s.id] as Partial<AttendanceRecord> | undefined;

        const record: Omit<AttendanceRecord, 'id'> = {
          classId: classSession.id,
          studentId: s.id,
          date: today,
          isPresent: !!studentAttendance?.isPresent,
          totalTimeSeconds: studentAttendance?.totalTimeSeconds || undefined,
          averagePace: studentAttendance?.averagePace || undefined,
          ageGroupClassification: getAgeGroup(studentAge),
          instructorNotes: studentAttendance?.instructorNotes || undefined,
        };

        if (record.isPresent && classSession.type === 'RUNNING' && record.totalTimeSeconds) {
          try {
            const feedback = await GeminiService.analyzeRunningPerformance(s, classSession, record as AttendanceRecord);
            record.generatedFeedback = feedback;
          } catch (e) {
            console.error("Error generating AI feedback for student " + s.id, e);
          }
        }
        return record;
      });

      const recordsToSave: Omit<AttendanceRecord, 'id'>[] = await Promise.all(recordsPromises);
      
      await SupabaseService.saveAttendance(recordsToSave);

      // Trigger challenge entry and cycle summary generation
      for (const record of recordsToSave) {
        if (record.isPresent) {
          const student = students.find(s => s.id === record.studentId);
          if (classSession.type === 'RUNNING' && classSession.distanceKm) {
            await SupabaseService.addChallengeEntry(record.studentId, classSession.distanceKm);
          }
          if (classSession.type === 'RUNNING' && classSession.weekOfCycle === 4 && student) {
            await triggerCycleSummaryGeneration(student);
          }
        }
      }

      addToast("Chamada salva com sucesso!", "success");
      onClose();
    } catch (e: any) {
      addToast(`Erro ao salvar chamada: ${e.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/95 backdrop-blur-md p-4 pt-6 md:pt-10 animate-fade-in">
      <div className="bg-dark-900 border border-dark-700 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-dark-800">
           <div className="flex justify-between items-start mb-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Chamada / Performance</h3>
              <button onClick={onClose} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full"><X size={20}/></button>
           </div>
           <p className="text-brand-500 font-bold text-[10px] uppercase tracking-widest">{classSession.title} • {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
           {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500" /></div>
           ) : students.length > 0 ? (
             students.map(s => (
                <div key={s.id} className={`p-4 rounded-2xl border transition-all ${attendance[s.id]?.isPresent ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-dark-950 border-dark-800'}`}>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-10 h-10 rounded-xl object-cover border border-dark-800" alt={s.name} />
                       <div className="text-left">
                          <p className={`text-sm font-bold ${attendance[s.id]?.isPresent ? 'text-emerald-500' : 'text-white'}`}>{String(s.name)}</p>
                          <p className="text-[9px] text-slate-500 uppercase font-black">{getAgeGroup(calculateAge(s.birthDate))}</p>
                       </div>
                     </div>
                     <button onClick={() => updateStudentAttendance(s.id, 'isPresent', !attendance[s.id]?.isPresent)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${attendance[s.id]?.isPresent ? 'bg-emerald-500 text-white' : 'bg-dark-800 text-slate-600'}`}>
                        {attendance[s.id]?.isPresent ? <Check size={18} strokeWidth={3}/> : <div className="w-2 h-2 rounded-full bg-slate-600"/>}
                     </button>
                   </div>

                   {classSession.type === 'RUNNING' && attendance[s.id]?.isPresent && (
                     <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-3 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[9px] text-slate-400 font-bold uppercase block mb-1">Tempo (segundos)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2 text-white text-sm" 
                                    value={attendance[s.id]?.totalTimeSeconds || ''}
                                    onChange={(e) => updateStudentAttendance(s.id, 'totalTimeSeconds', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] text-slate-400 font-bold uppercase block mb-1">Pace Médio</label>
                                <div className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2 text-brand-500 text-sm font-bold">
                                    {attendance[s.id]?.averagePace || '00:00 /km'}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[9px] text-slate-400 font-bold uppercase block mb-1">Observações do Treinador</label>
                            <input 
                                type="text"
                                placeholder="Desempenho, técnica, etc..."
                                className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2 text-white text-sm" 
                                value={attendance[s.id]?.instructorNotes || ''}
                                onChange={(e) => updateStudentAttendance(s.id, 'instructorNotes', e.target.value)}
                            />
                        </div>
                     </div>
                   )}
                </div>
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
              <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{Object.values(attendance).filter((v: Partial<AttendanceRecord>) => v.isPresent).length} Presentes</span>
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

const ClassForm = ({ classSession, onSave, onCancel, allStudents, instructors }: { classSession: ClassSession | null, onSave: (d: any) => void, onCancel: () => void, allStudents: User[], instructors: User[] }) => {
  const [formData, setFormData] = useState<Partial<ClassSession>>(classSession || {
    title: '', description: '', dayOfWeek: 'Segunda', date: '', startTime: '07:00',
    durationMinutes: 60, instructor: '', maxCapacity: 15, enrolledStudentIds: [],
    type: 'FUNCTIONAL', wod: '', workoutDetails: '',
    cycleStartDate: '',
    weekOfCycle: 1, distanceKm: undefined,
    estimatedVolumeMinutes: undefined,
    weekObjective: '',
    referenceWorkouts: '',
    mainWorkout: '',
    weekFocus: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (formData.type === 'RUNNING' && formData.weekOfCycle && RUNNING_CYCLE_METHODOLOGY[formData.weekOfCycle]) {
      const weekData = RUNNING_CYCLE_METHODOLOGY[formData.weekOfCycle];
      setFormData(prev => ({
        ...prev,
        weekFocus: weekData.weekFocus || prev.weekFocus,
        estimatedVolumeMinutes: weekData.estimatedVolumeMinutes || prev.estimatedVolumeMinutes,
        weekObjective: weekData.weekObjective || prev.weekObjective,
        referenceWorkouts: weekData.referenceWorkouts || prev.referenceWorkouts,
        mainWorkout: weekData.mainWorkout || prev.mainWorkout,
      }));
    }
  }, [formData.type, formData.weekOfCycle]);

  useEffect(() => {
    if (formData.date) {
      // Create a date object interpreting the date string as local time to avoid timezone shifts.
      const date = new Date(formData.date + 'T03:00:00'); // Use T03:00:00 for Brazil timezone
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
      const correctDayOfWeek = DAYS_OF_WEEK[dayIndex];
      
      if (formData.dayOfWeek !== correctDayOfWeek) {
        setFormData(prev => ({ ...prev, dayOfWeek: correctDayOfWeek }));
      }
    }
  }, [formData.date]);

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
    <div className="max-w-4xl mx-auto bg-dark-950 p-8 rounded-[3rem] border border-dark-800 shadow-2xl space-y-8 animate-fade-in mb-20 overflow-hidden">
      <div className="flex justify-between items-center border-b border-dark-800 pb-6">
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
            {classSession ? 'Editar Aula' : 'Novo Agendamento'}
          </h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Defina os parâmetros do treino e alunos inscritos.</p>
        </div>
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
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Tipo Treino</label>
                <select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                  {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t === 'RUNNING' ? 'CORRIDA' : 'FUNCIONAL'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Treinador</label>
                <select required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold" value={formData.instructor} onChange={e => setFormData({ ...formData, instructor: e.target.value })}>
                  <option value="">Selecione...</option>
                  {instructors.map(inst => <option key={inst.id} value={inst.name}>{inst.name}</option>)}
                </select>
              </div>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Dia da Semana</label>
                <select
                    required
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold disabled:bg-dark-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                    value={formData.dayOfWeek}
                    onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    disabled={!!formData.date}
                >
                    {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
                {!!formData.date && <p className="text-slate-600 text-[9px] mt-1">Definido automaticamente pela Data.</p>}
              </div>
              <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Horário</label>
                  <input
                      required
                      type="time"
                      className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold"
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  />
              </div>
              <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Data Específica</label>
                  <input
                      type="date"
                      className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold"
                      value={formData.date || ''}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                  <p className="text-slate-600 text-[9px] mt-1">Opcional (aula única).</p>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Duração (minutos)</label>
                  <input
                      required
                      type="number"
                      className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm"
                      value={formData.durationMinutes}
                      onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                  />
              </div>
              <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Máx. Vagas</label>
                  <input
                      required
                      type="number"
                      className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm"
                      value={formData.maxCapacity}
                      onChange={e => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                  />
              </div>
           </div>

           {formData.type === 'RUNNING' && (
              <div className="space-y-4 pt-4 border-t border-dark-800 animate-fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Início do Ciclo</label>
                        <input type="date" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.cycleStartDate || ''} onChange={e => setFormData({ ...formData, cycleStartDate: e.target.value })} />
                         <p className="text-slate-600 text-[9px] mt-1">Opcional. Ajuda a agrupar e visualizar o ciclo.</p>
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Semana (1-4)</label>
                        <input type="number" min="1" max="4" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.weekOfCycle} onChange={e => setFormData({ ...formData, weekOfCycle: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Distância (km)</label>
                        <input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.distanceKm || ''} onChange={e => setFormData({ ...formData, distanceKm: e.target.value ? Number(e.target.value) : undefined })} />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Volume Estimado (min)</label>
                        <input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.estimatedVolumeMinutes || ''} onChange={e => setFormData({ ...formData, estimatedVolumeMinutes: e.target.value ? Number(e.target.value) : undefined })} />
                      </div>
                  </div>
                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Foco da Semana</label>
                      <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.weekFocus || ''} onChange={e => setFormData({ ...formData, weekFocus: e.target.value })} />
                  </div>
                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Objetivo da Semana</label>
                      <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.weekObjective || ''} onChange={e => setFormData({ ...formData, weekObjective: e.target.value })} />
                  </div>
                   <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Treinos de Referência</label>
                      <textarea className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm h-24" value={formData.referenceWorkouts || ''} onChange={e => setFormData({ ...formData, referenceWorkouts: e.target.value })} />
                  </div>
                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Treino Principal da Aula</label>
                      <textarea className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm h-24" value={formData.mainWorkout || ''} onChange={e => setFormData({ ...formData, mainWorkout: e.target.value })} />
                  </div>
              </div>
           )}
        </div>

        <div className="space-y-5 flex flex-col h-full bg-dark-900/30 p-6 rounded-[2rem] border border-dark-800">
           <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><UserPlus size={18}/> Matrículas ({formData.enrolledStudentIds?.length || 0})</h4>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14}/>
              <input 
                className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 pl-10 text-white text-xs focus:border-brand-500 outline-none" 
                placeholder="Pesquisar aluno..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex-1 overflow-y-auto max-h-[250px] p-2 custom-scrollbar space-y-1">
              {filteredStudents.map(s => (
                <button 
                  key={s.id}
                  type="button"
                  onClick={() => toggleStudent(s.id)}
                  className={`w-full p-2 rounded-lg flex items-center gap-3 transition-colors ${formData.enrolledStudentIds?.includes(s.id) ? 'bg-brand-500/20' : 'hover:bg-dark-800/50'}`}
                >
                  <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-8 h-8 rounded-lg object-cover" />
                  <span className={`text-xs font-bold ${formData.enrolledStudentIds?.includes(s.id) ? 'text-white' : 'text-slate-400'}`}>{s.name}</span>
                  {formData.enrolledStudentIds?.includes(s.id) && <Check size={16} className="ml-auto text-brand-500"/>}
                </button>
              ))}
           </div>

           <div className="pt-6 border-t border-dark-800 flex flex-col sm:flex-row gap-4">
              <button type="button" onClick={onCancel} className="flex-1 py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-700">Cancelar</button>
              <button 
                type="button" 
                onClick={() => onSave(formData)}
                className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-600/30 hover:bg-brand-500 flex items-center justify-center gap-2"
              >
                 <Save size={16} /> Salvar Aula
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
