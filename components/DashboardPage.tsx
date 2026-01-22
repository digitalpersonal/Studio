
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, ClassSession, Payment, Challenge } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  Users, Calendar, AlertTriangle, DollarSign, ArrowRight, 
  CheckCircle2, Clock, Trophy, MessageCircle, Loader2,
  TrendingUp, Activity, Zap, Cake, UserPlus, Star
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
  const [challengeData, setChallengeData] = useState<{ challenge: Challenge | null, totalDistance: number }>({ challenge: null, totalDistance: 0 });

  const isStaff = currentUser.role !== UserRole.STUDENT;
  const isManagement = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;
  const isTrainer = currentUser.role === UserRole.TRAINER;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [uData, cData, pData, chalData] = await Promise.all([
          SupabaseService.getAllUsers(),
          SupabaseService.getClasses(),
          isManagement ? SupabaseService.getPayments() : (isTrainer ? Promise.resolve([]) : SupabaseService.getPayments(currentUser.id)),
          SupabaseService.getGlobalChallengeProgress()
        ]);
        setAllUsers(uData);
        setClasses(cData);
        setPayments(pData);
        setChallengeData(chalData);
      } catch (error: any) {
        addToast("Erro ao carregar dados do dashboard", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isManagement, isTrainer, currentUser.id]);

  const todayIndex = (new Date().getDay() + 6) % 7; // Ajuste para Segunda=0
  const todayName = DAYS_OF_WEEK[todayIndex];

  const dashboardStats = useMemo(() => {
    const students = allUsers.filter(u => u.role === UserRole.STUDENT);
    const todayClasses = classes.filter(c => c.dayOfWeek === todayName);
    
    // Aniversariantes do dia
    const today = new Date();
    const todayDayMonth = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const birthdayBoys = students.filter(s => {
      if (!s.birthDate) return false;
      const bDate = new Date(s.birthDate);
      return `${String(bDate.getDate() + 1).padStart(2, '0')}-${String(bDate.getMonth() + 1).padStart(2, '0')}` === todayDayMonth;
    });

    // Novos alunos (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newStudents = students.filter(s => new Date(s.joinDate) >= thirtyDaysAgo);

    // Financeiro (Apenas Admin/SuperAdmin)
    const overduePayments = payments.filter(p => p.status === 'OVERDUE');
    const totalOverdueAmount = overduePayments.reduce((acc, p) => acc + p.amount, 0);
    const uniqueOverdueStudents = new Set(overduePayments.map(p => p.studentId)).size;

    return {
      todayClasses,
      overduePayments,
      totalOverdueAmount,
      uniqueOverdueStudents,
      totalStudents: students.length,
      birthdayBoys,
      newStudentsCount: newStudents.length
    };
  }, [allUsers, classes, payments, todayName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Bem-vindo, {String(currentUser.name).split(' ')[0]}! 👋</h2>
          <p className="text-slate-400 text-sm font-medium">Resumo do Studio: {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
        </div>
        {isStaff && (
          <div className="flex gap-2">
             <button onClick={() => onNavigate('MANAGE_USERS')} className="px-4 py-2 bg-dark-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-dark-700 transition-all">Ver Alunos</button>
             <button onClick={() => onNavigate('SCHEDULE')} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all">Agenda</button>
          </div>
        )}
      </header>

      {/* Grid de Métricas Inteligente */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isManagement ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl group hover:border-blue-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Users size={24}/></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Alunos</span>
          </div>
          <p className="text-3xl font-black text-white">{dashboardStats.totalStudents}</p>
          <div className="mt-2 flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase">
            <TrendingUp size={12}/> +{dashboardStats.newStudentsCount} no último mês
          </div>
        </div>

        <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl group hover:border-brand-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-500"><Calendar size={24}/></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aulas Hoje</span>
          </div>
          <p className="text-3xl font-black text-white">{dashboardStats.todayClasses.length}</p>
          <p className="mt-2 text-slate-500 text-[10px] font-bold uppercase">{todayName}</p>
        </div>

        {isManagement ? (
          <>
            <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl group hover:border-red-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500"><AlertTriangle size={24}/></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atrasos</span>
              </div>
              <p className="text-3xl font-black text-white">{dashboardStats.uniqueOverdueStudents}</p>
              <p className="mt-2 text-red-500 text-[10px] font-bold uppercase">Inadimplentes</p>
            </div>

            <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl border-l-4 border-l-emerald-500 group hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><DollarSign size={24}/></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pendente</span>
              </div>
              <p className="text-2xl font-black text-white">R$ {dashboardStats.totalOverdueAmount.toLocaleString('pt-BR')}</p>
              <p className="mt-2 text-slate-500 text-[10px] font-bold uppercase">Total em Aberto</p>
            </div>
          </>
        ) : isTrainer ? (
            <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl group hover:border-pink-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-500"><Cake size={24}/></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">B-Day</span>
              </div>
              <p className="text-3xl font-black text-white">{dashboardStats.birthdayBoys.length}</p>
              <p className="mt-2 text-pink-500 text-[10px] font-bold uppercase">Aniversariantes Hoje</p>
            </div>
        ) : (
          <div className="sm:col-span-1 bg-brand-600 p-6 rounded-[2rem] shadow-xl shadow-brand-600/20 text-white relative overflow-hidden">
             <Zap className="absolute -right-4 -bottom-4 text-brand-500/30" size={100} />
             <h4 className="text-sm font-black uppercase tracking-widest mb-1">Status Plano</h4>
             {payments.some(p => p.status === 'OVERDUE') ? (
               <p className="text-brand-100 font-bold text-xs flex items-center gap-2 mt-2"><AlertTriangle size={16}/> Pendência financeira.</p>
             ) : (
               <p className="text-brand-100 font-bold text-xs flex items-center gap-2 mt-2"><CheckCircle2 size={16}/> Plano Ativo</p>
             )}
             <button onClick={() => onNavigate('FINANCIAL')} className="mt-4 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/30 transition-all">Faturas</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Próximas Aulas (Operational Hub) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Clock className="text-brand-500" size={20}/> Agenda de Hoje ({todayName})
            </h3>
          </div>
          
          <div className="space-y-3">
            {dashboardStats.todayClasses.length > 0 ? (
              dashboardStats.todayClasses.map(c => (
                <div key={c.id} className="bg-dark-950 p-5 rounded-3xl border border-dark-800 flex justify-between items-center group hover:border-brand-500/50 transition-all shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-dark-900 px-4 py-2 rounded-2xl border border-dark-800 min-w-[70px]">
                      <p className="text-brand-500 font-black text-sm">{c.startTime}</p>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{c.title}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                        Prof. {c.instructor.split(' ')[0]} • <span className={c.type === 'RUNNING' ? 'text-blue-500' : 'text-brand-500'}>{c.type}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:block text-right">
                      <div className="w-24 h-1.5 bg-dark-900 rounded-full overflow-hidden border border-dark-800">
                        <div className="bg-brand-500 h-full transition-all duration-700" style={{ width: `${(c.enrolledStudentIds.length / c.maxCapacity) * 100}%` }}></div>
                      </div>
                      <p className="text-[8px] text-slate-600 font-black mt-1 uppercase tracking-widest">{c.enrolledStudentIds.length}/{c.maxCapacity} Alunos</p>
                    </div>
                    <button onClick={() => onNavigate('SCHEDULE')} className="p-2 bg-dark-900 rounded-xl text-slate-400 group-hover:text-brand-500 transition-colors border border-dark-800">
                      <ArrowRight size={18}/>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center bg-dark-950 rounded-[2.5rem] border border-dashed border-dark-800">
                <Calendar size={40} className="mx-auto text-dark-800 mb-2"/>
                <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Sem atividades agendadas para hoje</p>
              </div>
            )}
          </div>

          {/* Seção Extra para Trainers/Staff: Aniversariantes */}
          {isStaff && dashboardStats.birthdayBoys.length > 0 && (
            <div className="pt-6 space-y-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <Cake className="text-pink-500" size={20}/> Celebrando Hoje
              </h3>
              <div className="flex flex-wrap gap-3">
                {dashboardStats.birthdayBoys.map(s => (
                  <div key={s.id} className="bg-pink-500/5 border border-pink-500/20 px-4 py-3 rounded-2xl flex items-center gap-3">
                    <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-8 h-8 rounded-full border border-pink-500/20" />
                    <div>
                      <p className="text-white text-xs font-bold">{String(s.name)}</p>
                      <button onClick={() => WhatsAppAutomation.sendGenericMessage(s, "Parabéns pelo seu dia! Muita saúde, treinos e conquistas! 🎂🔥")} className="text-[9px] text-pink-500 font-black uppercase tracking-widest hover:underline">Parabenizar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Informativa (Financial for Management / Community for all) */}
        <div className="space-y-6">
          {isManagement && dashboardStats.overduePayments.length > 0 && (
            <section className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-6 space-y-4 shadow-xl">
              <h3 className="text-red-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={16}/> Cobrança Pendente
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {dashboardStats.overduePayments.slice(0, 5).map(p => {
                  const student = allUsers.find(u => u.id === p.studentId);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-dark-950 rounded-2xl border border-dark-800 hover:border-red-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <img src={String(student?.avatarUrl || `https://ui-avatars.com/api/?name=${String(student?.name)}`)} className="w-8 h-8 rounded-full border border-dark-800" />
                        <div className="overflow-hidden">
                          <p className="text-white text-[11px] font-bold truncate max-w-[100px]">{String(student?.name || 'Desconhecido')}</p>
                          <p className="text-[9px] text-red-500 font-mono">Vencido {p.dueDate}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => student && WhatsAppAutomation.sendPaymentReminder(student, p)}
                        className="p-2 bg-brand-600/10 text-brand-500 rounded-xl hover:bg-brand-600 hover:text-white transition-all"
                      >
                        <MessageCircle size={14}/>
                      </button>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => onNavigate('FINANCIAL')} className="w-full py-3 text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors border-t border-dark-800 mt-2">Fluxo Financeiro Completo</button>
            </section>
          )}

          {/* Social / Challenge Progress */}
          {challengeData.challenge && (
            <section className="bg-dark-950 border border-dark-800 rounded-[2rem] p-6 space-y-4 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Trophy size={80} className="text-amber-500"/>
               </div>
               <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Trophy size={16} className="text-amber-500"/> Meta da Comunidade
              </h3>
              <div className="relative z-10">
                <p className="text-white font-bold text-sm mb-1">{challengeData.challenge.title}</p>
                <p className="text-slate-500 text-[10px] mb-4 line-clamp-2">{challengeData.challenge.description}</p>
                
                <div className="w-full h-4 bg-dark-900 rounded-full overflow-hidden border border-dark-800 p-1">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (challengeData.totalDistance / challengeData.challenge.targetValue) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-3">
                   <div>
                      <p className="text-[10px] font-black text-white">{challengeData.totalDistance.toLocaleString()} <span className="text-slate-500">{challengeData.challenge.unit}</span></p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-brand-500 uppercase">Alvo: {challengeData.challenge.targetValue.toLocaleString()}</p>
                   </div>
                </div>
              </div>
              <button onClick={() => onNavigate('RANKING')} className="w-full py-4 bg-dark-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-dark-800 hover:text-brand-500 transition-all border border-dark-800 mt-2">Painel de Ranking</button>
            </section>
          )}

          {/* Quick Support / Feedback */}
          <div className="bg-brand-600/5 border border-brand-500/10 p-6 rounded-[2rem] flex items-center gap-4 group">
            <div className="p-3 bg-brand-600/20 rounded-2xl text-brand-500 group-hover:scale-110 transition-transform">
              <Activity size={24}/>
            </div>
            <div>
              <p className="text-white font-bold text-xs">Precisando de ajuda?</p>
              <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Suporte Multiplus</p>
              <a href="https://wa.me/5535991048020" target="_blank" className="text-brand-500 font-bold text-[9px] uppercase hover:underline mt-1 inline-block">Falar no WhatsApp</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
