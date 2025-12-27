
import React, { useState, useEffect, useMemo } from 'react';
import { ClassSession, User, UserRole, AttendanceRecord } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Calendar, Plus, Edit, Trash2, UserPlus, UserCheck, X, Check, Loader2, Info, UserMinus, ListOrdered, ClipboardList } from 'lucide-react'; 
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

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [classData, userData] = await Promise.all([
          SupabaseService.getClasses(),
          isStaff ? SupabaseService.getAllUsers() : Promise.resolve([])
        ]);
        setClasses(classData);
        setStudents(userData);

        // Set today's date for attendance (YYYY-MM-DD)
        setTodayDateStr(new Date().toISOString().split('T')[0]);
      } catch (error: any) {
        console.error("Erro ao carregar dados da agenda:", error.message || JSON.stringify(error));
        addToast(`Erro ao carregar a agenda: ${error.message || JSON.stringify(error)}`, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [addToast, isStaff]);

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
        await SupabaseService.addClass({ ...classData, enrolledStudentIds: [], waitlistStudentIds: [] });
        addToast("Nova aula criada com sucesso!", "success");
      }
      setShowForm(false);
      setEditingClass(null);
      const updatedClasses = await SupabaseService.getClasses();
      setClasses(updatedClasses);
    } catch (error: any) {
      console.error("Erro ao salvar aula:", error.message || JSON.stringify(error));
      addToast(`Erro ao salvar aula: ${error.message || JSON.stringify(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aula?")) return;
    setLoading(true);
    try {
      await SupabaseService.deleteClass(id);
      addToast("Aula excluída com sucesso!", "success");
      const updatedClasses = await SupabaseService.getClasses();
      setClasses(updatedClasses);
    } catch (error: any) {
      console.error("Erro ao excluir aula:", error.message || JSON.stringify(error));
      addToast(`Erro ao excluir aula: ${error.message || JSON.stringify(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async (classId: string, studentId: string) => {
    setLoading(true);
    try {
      await SupabaseService.enrollStudent(classId, studentId);
      addToast("Matrícula realizada com sucesso!", "success");
      const updatedClasses = await SupabaseService.getClasses();
      setClasses(updatedClasses);
    } catch (error: any) {
      console.error("Erro na matrícula:", error.message || JSON.stringify(error));
      addToast(`Erro na matrícula: ${error.message || JSON.stringify(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnenrollment = async (classId: string, studentId: string) => {
    setLoading(true);
    try {
      await SupabaseService.removeStudentFromClass(classId, studentId);
      addToast("Matrícula cancelada com sucesso!", "info");
      const updatedClasses = await SupabaseService.getClasses();
      setClasses(updatedClasses);
    } catch (error: any) {
      console.error("Erro ao cancelar matrícula:", error.message || JSON.stringify(error));
      addToast(`Erro ao cancelar matrícula: ${error.message || JSON.stringify(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async (classId: string, studentId: string) => {
    setLoading(true);
    try {
      await SupabaseService.joinWaitlist(classId, studentId);
      addToast("Entrou na lista de espera!", "info");
      const updatedClasses = await SupabaseService.getClasses();
      setClasses(updatedClasses);
    } catch (error: any) {
      console.error("Erro ao entrar na lista de espera:", error.message || JSON.stringify(error));
      addToast(`Erro ao entrar na lista de espera: ${error.message || JSON.stringify(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWaitlist = async (classId: string, studentId: string) => {
    setLoading(true);
    try {
      await SupabaseService.leaveWaitlist(classId, studentId);
      addToast("Saiu da lista de espera!", "info");
      const updatedClasses = await SupabaseService.getClasses();
      setClasses(updatedClasses);
    } catch (error: any) {
      console.error("Erro ao sair da lista de espera:", error.message || JSON.stringify(error));
      addToast(`Erro ao sair da lista de espera: ${error.message || JSON.stringify(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceOpen = async (classSession: ClassSession) => {
    setLoading(true);
    try {
      const attendance = await SupabaseService.getClassAttendance(classSession.id, todayDateStr);
      setCurrentAttendance(attendance);
      setShowAttendanceModal(classSession);
    } catch (error: any) {
      console.error("Erro ao carregar presença:", error.message || JSON.stringify(error));
      addToast(`Erro ao carregar presença: ${error.message || JSON.stringify(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async (classId: string, date: string, presentStudentIds: string[]) => {
    setLoading(true);
    try {
      await SupabaseService.saveAttendance(classId, date, presentStudentIds);
      addToast("Presença registrada com sucesso!", "success");
      setShowAttendanceModal(null);
    } catch (error: any) {
      console.error("Erro ao salvar presença:", error.message || JSON.stringify(error));
      addToast(`Erro ao salvar presença: ${error.message || JSON.stringify(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Desconhecido';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <Loader2 className="animate-spin text-brand-500" size={48} />
      </div>
    );
  }

  if (showForm) {
    return (
      <ClassForm
        classSession={editingClass}
        onSave={handleSaveClass}
        onCancel={() => { setShowForm(false); setEditingClass(null); }}
        instructors={students.filter(s => s.role === UserRole.ADMIN || s.role === UserRole.TRAINER)}
      />
    );
  }

  if (showAttendanceModal) {
    return (
      <AttendanceModal
        classSession={showAttendanceModal}
        students={students.filter(s => showAttendanceModal.enrolledStudentIds.includes(s.id))}
        currentAttendance={currentAttendance}
        todayDateStr={todayDateStr}
        onSave={handleSaveAttendance}
        onCancel={() => setShowAttendanceModal(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Agenda de Aulas</h2>
          <p className="text-slate-400 text-sm">Gerencie suas aulas e matrículas dos alunos.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditingClass(null); setShowForm(true); }}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg shadow-brand-500/20"
          >
            <Plus size={16} className="mr-2" /> Nova Aula
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-dark-800 pb-3">{day}</h3>
            {classesGroupedByDay[day] && classesGroupedByDay[day].length > 0 ? (
              classesGroupedByDay[day].map(cls => (
                <div key={cls.id} className="bg-dark-900 border border-dark-700 rounded-2xl p-4 space-y-3 relative">
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button onClick={() => { setEditingClass(cls); setShowForm(true); }} className="p-1 bg-dark-800 text-slate-400 rounded-md hover:text-white transition-colors" title="Editar Aula">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDeleteClass(cls.id)} className="p-1 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors" title="Excluir Aula">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <h4 className="text-white font-bold text-lg">{String(cls.title)}</h4>
                  <p className="text-slate-400 text-sm">{String(cls.description)}</p>
                  {cls.wod && ( 
                    <p className="text-slate-500 text-xs flex items-center gap-1">
                      <ClipboardList size={12} /> WOD: {String(cls.wod)}
                    </p>
                  )}
                  {cls.workoutDetails && ( 
                    <p className="text-slate-500 text-xs flex items-center gap-1">
                      <Info size={12} /> Detalhes: {String(cls.workoutDetails)}
                    </p>
                  )}
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <Calendar size={12} /> {String(cls.startTime)} ({String(cls.durationMinutes)}min)
                  </p>
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <UserCheck size={12} /> Instrutor: {String(cls.instructor)}
                  </p>
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <UserPlus size={12} /> Vagas: {String(cls.enrolledStudentIds.length)}/{String(cls.maxCapacity)}
                  </p>

                  <div className="mt-4 pt-4 border-t border-dark-800 flex flex-col gap-2">
                    {currentUser.role === UserRole.STUDENT && (
                      <>
                        {cls.enrolledStudentIds.includes(currentUser.id) ? (
                          <button
                            onClick={() => handleUnenrollment(cls.id, currentUser.id)}
                            className="w-full bg-red-500/10 text-red-500 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <UserMinus size={14} className="mr-2" /> Desmatricular
                          </button>
                        ) : cls.enrolledStudentIds.length < cls.maxCapacity ? (
                          <button
                            onClick={() => handleEnrollment(cls.id, currentUser.id)}
                            className="w-full bg-brand-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center shadow-lg shadow-brand-500/20 hover:bg-brand-500 transition-colors"
                          >
                            <UserPlus size={14} className="mr-2" /> Matricular
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinWaitlist(cls.id, currentUser.id)}
                            disabled={cls.waitlistStudentIds?.includes(currentUser.id)}
                            className="w-full bg-amber-500/10 text-amber-500 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-500 hover:text-white transition-colors"
                          >
                            {cls.waitlistStudentIds?.includes(currentUser.id) ? 'Na Fila de Espera' : 'Entrar na Fila de Espera'}
                          </button>
                        )}
                        {cls.waitlistStudentIds?.includes(currentUser.id) && (
                           <button
                             onClick={() => handleLeaveWaitlist(cls.id, currentUser.id)}
                             className="w-full bg-dark-800 text-slate-400 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center hover:text-white transition-colors"
                           >
                             Sair da Fila de Espera
                           </button>
                        )}
                      </>
                    )}

                    {isStaff && (
                      <button
                        onClick={() => handleAttendanceOpen(cls)}
                        className="w-full bg-dark-800 text-slate-400 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center hover:text-white transition-colors"
                      >
                        <ListOrdered size={14} className="mr-2" /> Registrar Presença
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic">Nenhuma aula agendada para este dia.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


// -------------------------------------------------------------------------- //
//                       ClassForm Component (Inferred)                       //
// -------------------------------------------------------------------------- //
interface ClassFormProps {
  classSession: ClassSession | null;
  onSave: (classData: Omit<ClassSession, 'id'>) => void;
  onCancel: () => void;
  instructors: User[];
}

const ClassForm: React.FC<ClassFormProps> = ({ classSession, onSave, onCancel, instructors }) => {
  const [formData, setFormData] = useState<Omit<ClassSession, 'id'>>(
    classSession || {
      title: '',
      description: '',
      dayOfWeek: DAYS_OF_WEEK[0],
      startTime: '07:00',
      durationMinutes: 60,
      instructor: '',
      maxCapacity: 15,
      enrolledStudentIds: [],
      waitlistStudentIds: [],
      type: 'FUNCTIONAL',
      wod: '', 
      workoutDetails: '', 
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-xl mx-auto bg-dark-950 p-8 rounded-3xl border border-dark-800 shadow-xl space-y-6 animate-fade-in">
      <h3 className="text-xl font-bold text-white border-b border-dark-800 pb-4">
        {classSession ? 'Editar Aula' : 'Nova Aula'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Título</label>
          <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.title)} onChange={e => setFormData({ ...formData, title: e.target.value })} />
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Descrição</label>
          <textarea required className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.description)} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </div>
        <div> 
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Detalhes do Treino (Opcional)</label>
          <textarea 
            className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" 
            placeholder="Informações adicionais sobre o treino, equipamentos, aquecimento, etc."
            value={String(formData.workoutDetails || '')} 
            onChange={e => setFormData({ ...formData, workoutDetails: e.target.value })} 
          />
        </div>
        <div> 
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">WOD (Workout of the Day) (Opcional)</label>
          <textarea 
            className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" 
            placeholder="Descreva o treino do dia aqui..."
            value={String(formData.wod || '')} 
            onChange={e => setFormData({ ...formData, wod: e.target.value })} 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Dia da Semana</label>
            <select required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.dayOfWeek)} onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}>
              {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Horário</label>
            <input required type="time" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.startTime)} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Duração (min)</label>
            <input required type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.durationMinutes)} onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Capacidade Máxima</label>
            <input required type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.maxCapacity)} onChange={e => setFormData({ ...formData, maxCapacity: Number(e.target.value) })} />
          </div>
          <div className="col-span-2">
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Instrutor</label>
            <select required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.instructor)} onChange={e => setFormData({ ...formData, instructor: e.target.value })}>
              <option value="">Selecione um instrutor</option>
              {instructors.map(inst => <option key={inst.id} value={String(inst.name)}>{String(inst.name)}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Tipo de Aula</label>
            <select required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.type)} onChange={e => setFormData({ ...formData, type: e.target.value as 'FUNCTIONAL' | 'RUNNING' })}>
              {WORKOUT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onCancel} className="px-6 py-3 bg-dark-800 text-white rounded-lg font-bold">Cancelar</button>
          <button type="submit" className="px-6 py-3 bg-brand-600 text-white rounded-lg font-bold shadow-lg shadow-brand-500/20">Salvar Aula</button>
        </div>
      </form>
    </div>
  );
};


// -------------------------------------------------------------------------- //
//                      AttendanceModal Component (Inferred)                  //
// -------------------------------------------------------------------------- //
interface AttendanceModalProps {
  classSession: ClassSession;
  students: User[];
  currentAttendance: AttendanceRecord[];
  todayDateStr: string;
  onSave: (classId: string, date: string, presentStudentIds: string[]) => Promise<void>;
  onCancel: () => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ classSession, students, currentAttendance, todayDateStr, onSave, onCancel }) => {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(() => {
    // Refactored for better bundler compatibility and conciseness
    const presentIds = new Set(
      currentAttendance.filter(record => record.isPresent).map(record => record.studentId)
    );
    return presentIds;
  });

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    await onSave(classSession.id, todayDateStr, Array.from(selectedStudents));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
      <div className="bg-dark-900 border border-dark-700 p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full space-y-6">
        <div className="flex justify-between items-center border-b border-dark-800 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar size={20} className="text-brand-500" /> Presença: {String(classSession.title)}
          </h3>
          <button onClick={onCancel} className="text-slate-500 hover:text-white p-2"><X size={24} /></button>
        </div>

        <p className="text-slate-400 text-sm">Selecione os alunos presentes para a aula de hoje ({String(todayDateStr)}):</p>

        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
          {students.length > 0 ? (
            students.map(student => (
              <label key={student.id} className="flex items-center gap-3 p-3 bg-dark-950 rounded-xl border border-dark-800 cursor-pointer hover:border-brand-500 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedStudents.has(student.id)}
                  onChange={() => handleToggleStudent(student.id)}
                  className="w-5 h-5 accent-brand-500"
                />
                <img src={String(student.avatarUrl || `https://ui-avatars.com/api/?name=${String(student.name)}`)} className="w-8 h-8 rounded-full border border-dark-800" alt={String(student.name)} />
                <span className="text-white font-medium">{String(student.name)}</span>
              </label>
            ))
          ) : (
            <p className="text-slate-500 italic">Nenhum aluno matriculado nesta aula.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 border-t border-dark-800 pt-4">
          <button type="button" onClick={onCancel} className="px-6 py-3 bg-dark-800 text-white rounded-lg font-bold">Cancelar</button>
          <button type="button" onClick={handleSave} className="px-6 py-3 bg-brand-600 text-white rounded-lg font-bold shadow-lg shadow-brand-500/20">
            <Check size={16} className="inline mr-2" /> Salvar Presença
          </button>
        </div>
      </div>
    </div>
  );
};
