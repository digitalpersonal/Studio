import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserRole, ClassSession, Payment, Challenge, AttendanceRecord } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  Users, Calendar, AlertTriangle, DollarSign, ArrowRight, 
  CheckCircle2, Clock, Trophy, Loader2, TrendingUp, Activity, Zap, Cake, Bell, Gift, MessageCircle, Sparkles, ZapOff, Flag, Dumbbell,
  User as UserIcon
} from 'lucide-react';
import { DAYS_OF_WEEK } from '../constants';
import { WhatsAppAutomation } from '../App';

interface DashboardPageProps {
  currentUser: User;
  onNavigate: (view: any, params?: any) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onNavigate, addToast }) => {
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [challengeData, setChallengeData] = useState<{ challenge: Challenge | null, totalDistance: number }>({ challenge: null, totalDistance: 0 });
  const [isLive, setIsLive] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentActivities, setRecentActivities] = useState<(AttendanceRecord & { classDetails?: ClassSession })[]>([]);

  const isManagement = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;
  const isStudent = currentUser.role === UserRole.STUDENT;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada minuto para verificar o status da aula
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async (force: boolean = false) => {
    if (force) setLoading(true);
    try {
      const [uData, cData, pData, chalData, aData] = await Promise.all([
        SupabaseService.getAllUsers(force),
        SupabaseService.getClasses(force),
        isManagement ? SupabaseService.getPayments(undefined, force) : SupabaseService.getPayments(currentUser.id, force),
        SupabaseService.getGlobalChallengeProgress(force),
        isStudent ? SupabaseService.getAttendanceByClassAndDate('', '') : Promise.resolve([]) // Simplificado, ideal seria buscar por studentId
      ]);
      setAllUsers(uData || []);
      setClasses(cData || []);
      setPayments(pData || []);
      setChallengeData(chalData || { challenge: null, totalDistance: 0 });
      setAttendance(aData || []);
      setIsLive(true);
      setTimeout(() => setIsLive(false), 2000); 
    } catch (error: any) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, isManagement, isStudent]);

  useEffect(() => {
    loadData(true);
    const unsubscribe = SupabaseService.subscribe((table) => {
      loadData(false); 
    });
    return () => unsubscribe();
  }, [loadData]);

  useEffect(() => {
    if (!selectedStudentId) {
        setRecentActivities([]);
        return;
    }

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const activities = await SupabaseService.getAttendanceForStudent(selectedStudentId);
            setRecentActivities(activities.slice(0, 5));
        } catch (error) {
            addToast("Erro ao buscar atividades recentes do aluno.", "error");
        } finally {
            setLoading(false);
        }
    };

    fetchActivities();
  }, [selectedStudentId, addToast]);

  const todayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];
  const currentMonth = new Date().getMonth();

  const isClassInProgress = (cls: ClassSession, now: Date): boolean => {
    const [startHour, startMinute] = cls.startTime.split(':').map(Number);
    const classStartDate = new Date(now);
    classStartDate.setHours(startHour, startMinute, 0, 0);
    const classEndDate = new Date(classStartDate.getTime() + cls.durationMinutes * 60000);
    return now >= classStartDate && now < classEndDate;
  };

  const stats = useMemo(() => {
    const students = allUsers.filter(u => u.role === UserRole.STUDENT);
    const activeStudents = students.filter(u => u.status !== 'SUSPENDED');
    const suspendedCount = students.filter(u => u.status === 'SUSPENDED').length;
    const todayClasses = classes.filter(c => c.dayOfWeek === todayName);
    const overdue = payments.filter(p => p.status === 'OVERDUE');
    const totalOverdue = overdue.reduce((acc, p) => acc + (p.amount || 0), 0);
    
    const lastRunPerformance = attendance
      .filter(a => a.studentId === currentUser.id && a.totalTimeSeconds)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const birthdays = allUsers
      .filter(u => {
        if (!u.birthDate) return false;
        const bDate = new Date(u.birthDate);
        return bDate.getMonth() === currentMonth;
      })
      .sort((a, b) => {
        const dayA = new Date(a.birthDate!).getDate();
        const dayB = new Date(b.birthDate!).getDate();
        return dayA - dayB;
      });

    return {
      activeCount: activeStudents.length,
      suspendedCount,
      todayClassesCount: todayClasses.length,
      overdueCount: new Set(overdue.map(p => p.studentId)).size,
      totalOverdueAmount: totalOverdue,
      todayClasses,
      birthdays,
      lastRunPerformance
    };
  }, [allUsers, classes, payments, todayName, currentMonth, attendance, currentUser.id]);

  if (loading && allUsers.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-brand-500" size={40} /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Visão Geral</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isLive ? 'animate-ping' : ''}`} />
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Realtime</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadData(true)} className="p-3 bg-dark-950 border border-dark-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg group">
            <TrendingUp size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Alunos Ativos" value={stats.activeCount} color="blue" />
        <MetricCard icon={Calendar} label="Aulas Hoje" value={stats.todayClassesCount} color="brand" />
        {isManagement ? (
          <>
            <MetricCard icon={AlertTriangle} label="Alunos Devedores" value={stats.overdueCount} color="red" />
            <MetricCard icon={ZapOff} label="Alunos Suspensos" value={stats.suspendedCount} color="purple" />
          </>
        ) : stats.lastRunPerformance ? (
           <MetricCard 
             icon={Flag} 
             label="Última Corrida" 
             value={stats.lastRunPerformance.averagePace || 'N/A'} 
             subValue={new Date(stats.lastRunPerformance.date).toLocaleDateString('pt-BR')}
             color="emerald"
           />
        ) : (
          <div className="bg-brand-600 p-6 rounded-[2.5rem] text-white flex flex-col justify-center shadow-xl shadow-brand-600/20 relative overflow-hidden group">
             <Sparkles className="absolute -right-4 -top-4 text-white/10 group-hover:rotate-12 transition-transform" size={100} />
             <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Próxima Meta</p>
             <p className="text-xl font-black mt-1">Vença o seu ontem!</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <Clock className="text-brand-500" size={24}/> Agenda de Hoje
              </h3>
              <button onClick={() => onNavigate('SCHEDULE')} className="text-brand-500 text-[10px] font-black uppercase tracking-widest hover:underline">Ver Detalhes</button>
            </div>
            <div className="space-y-4">
                {stats.todayClasses.length > 0 ? (
                  stats.todayClasses.map(c => {
                    const inProgress = isClassInProgress(c, currentTime);
                    return (
                      <div 
                        key={c.id} 
                        className={`bg-dark-950 p-5 rounded-[2rem] border flex justify-between items-center group transition-all duration-300 relative ${
                          inProgress 
                            ? (c.type === 'RUNNING' ? 'border-blue-500 shadow-xl shadow-blue-500/20' : 'border-brand-500 shadow-xl shadow-brand-500/20')
                            : (c.type === 'RUNNING' ? 'border-blue-500/30 hover:border-blue-500' : 'border-brand-500/30 hover:border-brand-500')
                        }`}
                      >
                        {inProgress && (
                          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full animate-fade-in">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">AO VIVO</span>
                          </div>
                        )}
                        <div className="flex items-center gap-5">
                            <div className={`px-5 py-3 rounded-2xl border text-center min-w-[80px] transition-colors ${
                                inProgress ? 'bg-brand-600/10 border-brand-500/20' : 'bg-dark-900 border-dark-800 group-hover:bg-brand-600/10'
                            }`}>
                                <p className="text-brand-500 font-black text-lg">{c.startTime}</p>
                            </div>
                            <div>
                                <p className={`font-bold text-base flex items-center gap-2 ${c.type === 'RUNNING' ? 'text-blue-400' : 'text-brand-500'}`}>
                                  {c.type === 'RUNNING' ? <Flag size={16} /> : <Dumbbell size={16} />}
                                  <span>{c.title}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest bg-dark-900 px-2 py-0.5 rounded border border-dark-800">Prof. {c.instructor?.split(' ')[0]}</span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${c.type === 'RUNNING' ? 'bg-blue-500/10 text-blue-500' : 'bg-brand-500/10 text-brand-500'}`}>
                                    {c.type === 'RUNNING' ? 'Corrida' : 'Funcional'}
                                  </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => onNavigate('SCHEDULE')} className="p-3 bg-dark-900 rounded-2xl text-slate-400 group-hover:text-brand-500 group-hover:bg-brand-500/10 transition-all"><ArrowRight size={20}/></button>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-20 text-center bg-dark-950 rounded-[3rem] border border-dashed border-dark-800">
                      <Calendar className="mx-auto text-dark-800 mb-4" size={48} />
                      <p className="text-slate-600 font-bold uppercase text-[11px] tracking-widest">Nenhuma aula programada para hoje.</p>
                  </div>
                )}
            </div>

            {isManagement && (
              <div className="mt-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    <UserIcon className="text-brand-500" size={24}/> Atividade Recente do Aluno
                  </h3>
                </div>
                <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800">
                  <select
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm font-bold"
                    value={selectedStudentId || ''}
                    onChange={e => setSelectedStudentId(e.target.value || null)}
                  >
                    <option value="">Selecione um aluno para ver suas últimas atividades...</option>
                    {allUsers
                      .filter(u => u.role === UserRole.STUDENT)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                </div>
                {selectedStudentId && (
                  <div className="space-y-4">
                    {loading ? <div className="flex justify-center py-4"><Loader2 className="animate-spin text-brand-500" /></div> : recentActivities.length > 0 ? (
                      recentActivities.map(activity => {
                        const c = activity.classDetails;
                        if (!c) return null;
                        return (
                          <div key={activity.id} className="bg-dark-950 p-5 rounded-[2rem] border border-dark-800 flex justify-between items-center hover:border-brand-500/40 transition-all group">
                            <div className="flex items-center gap-5">
                              <div className="bg-dark-900 px-5 py-3 rounded-2xl border border-dark-800 text-center min-w-[80px]">
                                <p className="text-brand-500 font-black text-sm">{new Date(activity.date + 'T03:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})}</p>
                                <p className="text-slate-400 font-bold text-xs">{new Date(activity.date + 'T03:00:00').toLocaleDateString('pt-BR', {weekday: 'short'})}</p>
                              </div>
                              <div>
                                <p className="text-white font-bold text-base">{c.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${ c.type === 'RUNNING' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' : 'text-brand-500 bg-brand-500/10 border-brand-500/20' }`}>
                                    {c.type}
                                  </span>
                                  {activity.averagePace && (
                                    <span className="text-[9px] text-emerald-500 uppercase font-black tracking-widest bg-dark-900 px-2 py-0.5 rounded border border-dark-800">
                                      {activity.averagePace}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button onClick={() => c.type === 'RUNNING' ? onNavigate('RUNNING_EVOLUTION', { studentId: selectedStudentId }) : onNavigate('SCHEDULE')} className="p-3 bg-dark-900 rounded-2xl text-slate-400 group-hover:text-brand-500 group-hover:bg-brand-500/10 transition-all"><ArrowRight size={20}/></button>
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-10 text-center bg-dark-950 rounded-[2rem] border border-dashed border-dark-800">
                        <Activity className="mx-auto text-dark-800 mb-2" size={32} />
                        <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Nenhuma atividade recente encontrada para este aluno.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="space-y-8">
            <div className="bg-dark-950 border border-dark-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-3xl -z-10" />
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                    <Gift size={16} className="text-brand-500"/> Aniversariantes
                  </h3>
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {stats.birthdays.length > 0 ? stats.birthdays.map(u => (
                    <div key={u.id} className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-3">
                            <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name}`} className="w-10 h-10 rounded-xl border-2 border-dark-800 group-hover/item:border-brand-500 transition-all object-cover" />
                            <div>
                                <p className="text-white font-bold text-xs">{u.name.split(' ')[0]} {u.name.split(' ')[1] || ''}</p>
                                <p className="text-[9px] text-brand-500 font-black uppercase">Dia {new Date(u.birthDate!).getDate()}</p>
                            </div>
                        </div>
                        <button 
                          onClick={() => WhatsAppAutomation.sendGenericMessage(u, "Parabéns pelo seu dia! 🎉 O Studio te deseja muita saúde, força e conquistas! Vamos com tudo! 💪🔥")}
                          className="p-2 bg-brand-500/10 text-brand-500 rounded-xl hover:bg-brand-500 hover:text-white transition-all shadow-lg"
                        >
                          <MessageCircle size={14} />
                        </button>
                    </div>
                  )) : (
                    <p className="text-[10px] text-slate-600 font-bold uppercase text-center py-4">Nenhum aniversário este mês.</p>
                  )}
                </div>
            </div>

            {challengeData.challenge && (
                <div className="bg-brand-600 border border-brand-500 rounded-[2.5rem] p-8 space-y-5 shadow-2xl shadow-brand-600/30 relative overflow-hidden group">
                    <Trophy className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition-transform" size={140} />
                    <div className="flex justify-between items-center relative z-10">
                      <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                        <Trophy size={16}/> Desafio Global
                      </h3>
                    </div>
                    <div className="relative z-10">
                      <p className="text-white font-black text-lg leading-tight mb-2">{challengeData.challenge.title}</p>
                      <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden border border-white/10 p-0.5">
                          <div 
                            className="h-full bg-white rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${Math.min(100, (challengeData.totalDistance / (challengeData.challenge.targetValue || 1)) * 100)}%` }}
                          ></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase mt-3 text-brand-100">
                          <span>{challengeData.totalDistance?.toLocaleString() || 0} {challengeData.challenge.unit}</span>
                          <span>Meta: {challengeData.challenge.targetValue?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, color, subValue }: { icon: any, label: string, value: string | number, color: string, subValue?: string }) => {
    const colors: any = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        brand: "bg-brand-500/10 text-brand-500 border-brand-500/20",
        red: "bg-red-500/10 text-red-500 border-red-500/20",
        purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    };
    return (
        <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl hover:translate-y-[-4px] transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colors[color]} border`}><Icon size={24}/></div>
                <div className="w-2 h-2 rounded-full bg-dark-800" />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
            {subValue && <p className="text-slate-600 text-[10px] font-bold mt-1">{subValue}</p>}
        </div>
    );
};