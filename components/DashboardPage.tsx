
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, ClassSession, Payment, Challenge } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  Users, Calendar, AlertTriangle, DollarSign, ArrowRight, 
  CheckCircle2, Clock, Trophy, MessageCircle, Loader2,
  TrendingUp, Activity, Zap, Cake, UserPlus, Star, CreditCard, Wallet,
  Gift, PartyPopper
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

  const todayIndex = (new Date().getDay() + 6) % 7; 
  const todayName = DAYS_OF_WEEK[todayIndex];

  const dashboardStats = useMemo(() => {
    const students = allUsers.filter(u => u.role === UserRole.STUDENT);
    const todayClasses = classes.filter(c => c.dayOfWeek === todayName);
    
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;
    
    const birthdayBoys = students.filter(s => {
      if (!s.birthDate) return false;
      const bDate = new Date(s.birthDate);
      // Ajuste para lidar com timezone local e evitar erro de -1 dia
      const bDay = bDate.getUTCDate();
      const bMonth = bDate.getUTCMonth() + 1;
      return bDay === todayDay && bMonth === todayMonth;
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newStudents = students.filter(s => new Date(s.joinDate) >= thirtyDaysAgo);

    const overduePayments = payments.filter(p => p.status === 'OVERDUE');
    const totalOverdueAmount = overduePayments.reduce((acc, p) => acc + p.amount, 0);
    const uniqueOverdueStudents = new Set(overduePayments.map(p => p.studentId)).size;

    const nextInvoice = !isStaff ? payments
      .filter(p => p.status !== 'PAID')
      .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] : null;

    return {
      todayClasses,
      overduePayments,
      totalOverdueAmount,
      uniqueOverdueStudents,
      totalStudents: students.length,
      birthdayBoys,
      newStudentsCount: newStudents.length,
      nextInvoice
    };
  }, [allUsers, classes, payments, todayName, isStaff]);

  const sendBirthdayMsg = (student: User) => {
      const msg = `Parabéns, ${String(student.name).split(' ')[0]}! 🥳🎂 O Studio te deseja um dia incrível e cheio de energia! Que este novo ciclo seja de muita saúde, treinos e conquistas. Grande abraço! 🔥💪`;
      WhatsAppAutomation.sendGenericMessage(student, msg);
  };

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
        ) : (
          <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl relative overflow-hidden group hover:border-brand-500/50 transition-all">
             {dashboardStats.nextInvoice ? (
               <>
                <div className="flex justify-between items-start mb-2">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><Wallet size={24}/></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Próxima Fatura</span>
                </div>
                <p className="text-xl font-black text-white">R$ {dashboardStats.nextInvoice.amount.toFixed(2)}</p>
                <p className={`text-[10px] font-bold uppercase mt-1 ${dashboardStats.nextInvoice.status === 'OVERDUE' ? 'text-red-500' : 'text-slate-500'}`}>
                    Vence em: {new Date(dashboardStats.nextInvoice.dueDate).toLocaleDateString('pt-BR')}
                </p>
                <button onClick={() => onNavigate('FINANCIAL')} className="mt-4 w-full py-3 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2">
                    <CreditCard size={14}/> Pagar Agora
                </button>
               </>
             ) : (
               <div className="h-full flex flex-col justify-center items-center text-center space-y-2">
                  <CheckCircle2 size={32} className="text-emerald-500 mb-2"/>
                  <p className="text-white font-bold text-sm uppercase">Tudo em dia!</p>
                  <p className="text-slate-500 text-[10px] font-medium">Nenhuma fatura pendente encontrada.</p>
               </div>
             )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Aniversariantes */}
          {isStaff && dashboardStats.birthdayBoys.length > 0 && (
            <section className="bg-brand-500/10 border border-brand-500/20 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
                <PartyPopper className="absolute -right-6 -bottom-6 text-brand-500/10 rotate-12" size={150} />
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="p-4 bg-brand-500 text-white rounded-3xl shadow-lg">
                        <Cake size={32}/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Aniversariantes de Hoje!</h3>
                        <p className="text-brand-200 text-sm font-bold uppercase tracking-widest">Celebre com seus alunos</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 relative z-10">
                    {dashboardStats.birthdayBoys.map(s => (
                        <div key={s.id} className="bg-dark-950/80 backdrop-blur-sm p-4 rounded-3xl border border-brand-500/30 flex items-center gap-4 hover:border-brand-500 transition-all group">
                            <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-12 h-12 rounded-2xl border-2 border-brand-500" />
                            <div>
                                <p className="text-white font-bold text-sm">{String(s.name)}</p>
                                <button onClick={() => sendBirthdayMsg(s)} className="text-brand-500 text-[9px] font-black uppercase tracking-widest mt-1 flex items-center gap-1 group-hover:scale-105 transition-transform">
                                    <MessageCircle size={12}/> Dar Parabéns
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Clock className="text-brand-500" size={20}/> Agenda de Hoje ({todayName})
            </h3>
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
          </div>
        </div>

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
        </div>
      </div>
    </div>
  );
};
