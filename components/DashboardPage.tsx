
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, ClassSession, Payment, Challenge } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  Users, Calendar, AlertTriangle, DollarSign, ArrowRight, 
  CheckCircle2, Clock, Trophy, MessageCircle, Loader2,
  TrendingUp, Activity, Zap, Star, Wallet, Bell, Sparkles
} from 'lucide-react';
import { DAYS_OF_WEEK } from '../constants';

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

  const isManagement = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;
  const isStaff = currentUser?.role !== UserRole.STUDENT;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!currentUser?.id) return;
      setLoading(true);
      try {
        const [uData, cData, pData, chalData] = await Promise.all([
          SupabaseService.getAllUsers(),
          SupabaseService.getClasses(),
          isManagement ? SupabaseService.getPayments() : SupabaseService.getPayments(currentUser.id),
          SupabaseService.getGlobalChallengeProgress()
        ]);
        if (isMounted) {
            setAllUsers(uData || []);
            setClasses(cData || []);
            setPayments(pData || []);
            setChallengeData(chalData || { challenge: null, totalDistance: 0 });
        }
      } catch (error: any) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [isManagement, currentUser?.id]);

  const todayIndex = (new Date().getDay() + 6) % 7; 
  const todayName = DAYS_OF_WEEK[todayIndex];

  const dashboardStats = useMemo(() => {
    const students = (allUsers || []).filter(u => u?.role === UserRole.STUDENT);
    const todayClasses = (classes || []).filter(c => c?.dayOfWeek === todayName);
    
    const recentPixPayments = (payments || []).filter(p => p?.status === 'PAID').slice(0, 5);
    const overduePayments = (payments || []).filter(p => p?.status === 'OVERDUE');
    
    const totalOverdueAmount = overduePayments.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);
    const uniqueOverdueStudents = new Set(overduePayments.map(p => p?.studentId).filter(Boolean)).size;

    const nextInvoice = !isStaff ? (payments || [])
      .filter(p => p?.status !== 'PAID')
      .sort((a,b) => new Date(a?.dueDate || '').getTime() - new Date(b?.dueDate || '').getTime())[0] : null;

    return {
      todayClasses,
      overduePayments,
      totalOverdueAmount,
      uniqueOverdueStudents,
      totalStudents: students.length,
      recentPixPayments,
      nextInvoice
    };
  }, [allUsers, classes, payments, todayName, isStaff]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Olá, {String(currentUser?.name || 'Membro').split(' ')[0]}! 👋</h2>
        <p className="text-slate-400 text-sm font-medium">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>

      {isManagement && dashboardStats.recentPixPayments.length > 0 && (
        <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-xl animate-pulse">
                    <Bell size={24}/>
                </div>
                <div>
                    <h3 className="text-emerald-500 font-black text-sm uppercase tracking-widest">Recebimentos Pix</h3>
                    <p className="text-emerald-400/60 text-[10px] font-bold uppercase">Novos pagamentos hoje</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 relative z-10">
                {dashboardStats.recentPixPayments.map(p => {
                    const student = allUsers.find(u => u?.id === p?.studentId);
                    return (
                        <div key={p.id} className="bg-dark-950 border border-emerald-500/40 p-4 rounded-2xl flex items-center gap-4 group hover:border-emerald-500 transition-all cursor-pointer" onClick={() => onNavigate('FINANCIAL')}>
                            <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center border border-dark-700 overflow-hidden">
                                {student?.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover" /> : <Users size={16} className="text-slate-600"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-[11px] font-black uppercase truncate">{student?.name || 'Aluno'}</p>
                                <p className="text-emerald-500 text-sm font-black">R$ {Number(p?.amount || 0).toFixed(2)}</p>
                            </div>
                            <div className="px-2 py-1 bg-emerald-500 text-white text-[8px] font-black rounded-lg uppercase tracking-widest">PIX</div>
                        </div>
                    )
                })}
            </div>
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isManagement ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Users size={24}/></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alunos</span>
          </div>
          <p className="text-3xl font-black text-white">{dashboardStats.totalStudents}</p>
        </div>

        <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-500"><Calendar size={24}/></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aulas Hoje</span>
          </div>
          <p className="text-3xl font-black text-white">{dashboardStats.todayClasses.length}</p>
        </div>

        {isManagement ? (
          <>
            <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500"><AlertTriangle size={24}/></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atrasos</span>
              </div>
              <p className="text-3xl font-black text-white">{dashboardStats.uniqueOverdueStudents}</p>
            </div>
            <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl border-l-4 border-l-emerald-500">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><DollarSign size={24}/></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Aberto</span>
              </div>
              <p className="text-2xl font-black text-white">R$ {dashboardStats.totalOverdueAmount.toLocaleString('pt-BR')}</p>
            </div>
          </>
        ) : (
          <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl">
             {dashboardStats.nextInvoice ? (
               <>
                <div className="flex justify-between items-start mb-2">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><Wallet size={24}/></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Próximo Venc.</span>
                </div>
                <p className="text-xl font-black text-white">R$ {Number(dashboardStats.nextInvoice?.amount || 0).toFixed(2)}</p>
                <p className="text-[10px] font-bold uppercase mt-1 text-slate-500">{new Date(dashboardStats.nextInvoice?.dueDate || '').toLocaleDateString('pt-BR')}</p>
               </>
             ) : (
               <div className="h-full flex flex-col justify-center items-center text-center">
                  <CheckCircle2 size={32} className="text-emerald-500 mb-2"/>
                  <p className="text-white font-bold text-xs uppercase tracking-widest">Tudo em dia!</p>
               </div>
             )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Clock className="text-brand-500" size={20}/> Agenda do Dia
            </h3>
            <div className="space-y-3">
                {dashboardStats.todayClasses.length > 0 ? (
                dashboardStats.todayClasses.map(c => (
                    <div key={c.id} className="bg-dark-950 p-5 rounded-3xl border border-dark-800 flex justify-between items-center hover:border-brand-500/50 transition-all shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="text-center bg-dark-900 px-4 py-2 rounded-2xl border border-dark-800 min-w-[70px]">
                                <p className="text-brand-500 font-black text-sm">{c.startTime}</p>
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">{c.title}</p>
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                                    Prof. {String(c.instructor || 'Studio').split(' ')[0]}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => onNavigate('SCHEDULE')} className="p-2 bg-dark-900 rounded-xl text-slate-400 border border-dark-800">
                            <ArrowRight size={18}/>
                        </button>
                    </div>
                ))
                ) : (
                <div className="py-12 text-center bg-dark-950 rounded-[2.5rem] border border-dashed border-dark-800">
                    <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Nenhuma aula hoje</p>
                </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
