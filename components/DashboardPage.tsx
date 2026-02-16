
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserRole, ClassSession, Payment, Challenge, AttendanceRecord, ViewState, Notice } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  Users, Calendar, AlertTriangle, DollarSign, ArrowRight, 
  CheckCircle2, Clock, Trophy, Loader2, TrendingUp, Activity, Zap, Cake, Bell, Gift, MessageCircle, Sparkles, ZapOff, Flag, Dumbbell,
  User as UserIcon, Download, List, CheckCheck, Award, Plus, Edit, Trash2, X, Info, Megaphone
} from 'lucide-react';
import { DAYS_OF_WEEK } from '../constants';
import { WhatsAppAutomation } from '../App';

interface DashboardPageProps {
  currentUser: User;
  onNavigate: (view: ViewState, params?: any) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onNavigate, addToast }) => {
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [challengeData, setChallengeData] = useState<{ challenge: Challenge | null, totalDistance: number }>({ challenge: null, totalDistance: 0 });
  const [isLive, setIsLive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;
  const isTrainer = currentUser.role === UserRole.TRAINER;
  const isStudent = currentUser.role === UserRole.STUDENT;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); 
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async (force: boolean = false) => {
    if (force) setLoading(true);
    try {
      const [uData, cData, pData, chalData, aData, nData] = await Promise.all([
        SupabaseService.getAllUsers(force),
        SupabaseService.getClasses(force),
        (isAdmin) ? SupabaseService.getPayments(undefined, force) : SupabaseService.getPayments(currentUser.id, force),
        SupabaseService.getGlobalChallengeProgress(force),
        isStudent ? SupabaseService.getAttendanceForStudent(currentUser.id) : Promise.resolve([]),
        SupabaseService.getNotices()
      ]);
      setAllUsers(uData || []);
      setClasses(cData || []);
      setPayments(pData || []);
      setChallengeData(chalData || { challenge: null, totalDistance: 0 });
      setAttendance(aData || []);
      setNotices(nData || []);
      setIsLive(true);
      setTimeout(() => setIsLive(false), 2000); 
    } catch (error: any) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, isAdmin, isStudent]);

  useEffect(() => {
    loadData(true);
    const unsubscribe = SupabaseService.subscribe(() => loadData(false));
    return () => unsubscribe();
  }, [loadData]);

  const handleSaveNotice = async (noticeData: any) => {
    try {
      if (editingNotice) {
        await SupabaseService.updateNotice({ ...noticeData, id: editingNotice.id });
        addToast("Aviso atualizado!", "success");
      } else {
        await SupabaseService.addNotice(noticeData);
        addToast("Aviso publicado!", "success");
      }
      setShowNoticeForm(false);
      setEditingNotice(null);
      loadData(false);
    } catch (e: any) {
      addToast(`Erro: ${e.message}`, "error");
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Excluir este aviso para todos?")) return;
    try {
      await SupabaseService.deleteNotice(id);
      addToast("Aviso removido.", "success");
      loadData(false);
    } catch (e) {
      addToast("Erro ao excluir aviso.", "error");
    }
  };

  const todayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];
  const currentMonthZeroBased = new Date().getMonth();

  const stats = useMemo(() => {
    const students = allUsers.filter(u => u.role === UserRole.STUDENT);
    const activeStudents = students.filter(u => u.status !== 'SUSPENDED');
    const todayClasses = classes.filter(c => c.dayOfWeek === todayName).sort((a,b) => a.startTime.localeCompare(b.startTime));
    const overdue = payments.filter(p => p.status === 'OVERDUE');
    
    const runningAttendance = attendance.filter(a => a.classDetails?.type === 'RUNNING');
    const lastRunPerformance = runningAttendance.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    // CORREÇÃO TIMEZONE: Filtra aniversários por manipulação de string para evitar erro de fuso
    const visibleBirthdays = allUsers
      .filter(u => {
        if (!u.birthDate) return false;
        // ISO format YYYY-MM-DD
        const parts = u.birthDate.split('-');
        if (parts.length < 3) return false;
        const month = parseInt(parts[1], 10) - 1;
        return month === currentMonthZeroBased;
      })
      .sort((a, b) => {
        const dayA = parseInt(a.birthDate!.split('-')[2], 10);
        const dayB = parseInt(b.birthDate!.split('-')[2], 10);
        return dayA - dayB;
      });
    
    const challengeProgressPercent = challengeData.challenge?.targetValue 
      ? Math.min(100, (challengeData.totalDistance / challengeData.challenge.targetValue) * 100)
      : 0;

    return {
      activeCount: activeStudents.length,
      todayClassesCount: todayClasses.length,
      overdueCount: overdue.length,
      todayClasses,
      visibleBirthdays,
      lastRunPerformance,
      totalAttendance: attendance.length,
      challengeProgressPercent
    };
  }, [allUsers, classes, payments, todayName, currentMonthZeroBased, attendance, challengeData]);

  if (loading && allUsers.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-brand-500" size={40} /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20 printable-area">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Início</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full no-print">
              <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isLive ? 'animate-ping' : ''}`} />
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={() => window.print()} className="p-3 bg-dark-950 border border-dark-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg group">
              <Download size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      {/* AVISOS */}
      <section className="space-y-5">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Megaphone className="text-brand-500" size={24}/> Comunicados
          </h3>
          {isAdmin && (
            <button 
              onClick={() => { setEditingNotice(null); setShowNoticeForm(true); }}
              className="bg-brand-600 text-white p-2 rounded-xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20 no-print flex items-center gap-2 px-4"
            >
              <Plus size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Criar</span>
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notices.length > 0 ? notices.map(notice => (
            <div key={notice.id} className={`p-6 rounded-[2.5rem] border relative group transition-all duration-300 transform hover:-translate-y-1 ${
              notice.priority === 'URGENT' ? 'bg-red-500/10 border-red-500/30' :
              notice.priority === 'WARNING' ? 'bg-amber-500/10 border-amber-500/30' :
              'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${
                  notice.priority === 'URGENT' ? 'bg-red-500 text-white' :
                  notice.priority === 'WARNING' ? 'bg-amber-500 text-white' :
                  'bg-blue-500 text-white'
                }`}>
                  {notice.priority === 'URGENT' ? <AlertTriangle size={18}/> : 
                   notice.priority === 'WARNING' ? <Bell size={18}/> : <Info size={18}/>}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                    <button onClick={() => { setEditingNotice(notice); setShowNoticeForm(true); }} className="p-2 bg-dark-800/80 text-slate-400 rounded-lg hover:text-white"><Edit size={14}/></button>
                    <button onClick={() => handleDeleteNotice(notice.id)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500"><Trash2 size={14}/></button>
                  </div>
                )}
              </div>
              <h4 className="text-white font-black text-base uppercase mb-2 tracking-tight line-clamp-1">{notice.title}</h4>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 min-h-[3rem]">{notice.content}</p>
              <div className="pt-4 border-t border-dark-800/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-slate-600" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{new Date(notice.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <span className="text-[9px] font-black uppercase text-slate-500">{notice.priority}</span>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center bg-dark-950/30 rounded-[3rem] border-2 border-dashed border-dark-800">
               <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Nenhum aviso importante hoje.</p>
            </div>
          )}
        </div>
      </section>

      {/* METRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <MetricCard icon={Users} label="Alunos Ativos" value={stats.activeCount} color="blue" />
            <MetricCard icon={Calendar} label="Aulas Hoje" value={stats.todayClassesCount} color="brand" />
            <MetricCard icon={AlertTriangle} label="Pendências" value={stats.overdueCount} color="red" />
            <MetricCard icon={TrendingUp} label="Eficiência" value={`${stats.challengeProgressPercent.toFixed(0)}%`} color="purple" />
          </>
        ) : (
          <>
            <MetricCard icon={CheckCircle2} label="Meus Treinos" value={stats.totalAttendance} color="blue" />
            <MetricCard icon={Calendar} label="Hoje" value={stats.todayClasses.length > 0 ? stats.todayClasses[0].startTime : '--:--'} color="brand" />
            <MetricCard icon={Flag} label="Último Pace" value={stats.lastRunPerformance?.averagePace || '--:--'} color="emerald" />
            <MetricCard icon={Trophy} label="Desafio" value={`${stats.challengeProgressPercent.toFixed(0)}%`} color="purple" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Clock className="text-brand-500" size={24}/> Agenda de Hoje
            </h3>
            <div className="space-y-4">
                {stats.todayClasses.length > 0 ? (
                  stats.todayClasses.map(c => (
                      <div key={c.id} className={`p-5 rounded-[2rem] border flex justify-between items-center transition-all ${c.type === 'RUNNING' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                        <div className="flex items-center gap-5">
                            <div className="px-5 py-3 rounded-2xl bg-dark-900 border border-dark-800 text-center min-w-[80px]">
                                <p className="text-brand-500 font-black text-lg">{c.startTime}</p>
                            </div>
                            <div>
                                <p className={`font-bold text-base ${c.type === 'RUNNING' ? 'text-emerald-400' : 'text-blue-400'}`}>{c.title}</p>
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Prof. {c.instructor?.split(' ')[0]}</p>
                            </div>
                        </div>
                        <button onClick={() => onNavigate('SCHEDULE')} className="p-3 bg-dark-900 rounded-2xl text-slate-400 no-print"><ArrowRight size={20}/></button>
                      </div>
                  ))
                ) : (
                  <div className="py-16 text-center bg-dark-950/20 rounded-[3rem] border border-dashed border-dark-800">
                      <p className="text-slate-600 font-bold uppercase text-[10px]">Sem aulas hoje.</p>
                  </div>
                )}
            </div>
        </div>

        <div className="bg-dark-950 border border-dark-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 relative z-10">
                <Gift size={16} className="text-brand-500"/> Aniversariantes
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
              {stats.visibleBirthdays.length > 0 ? stats.visibleBirthdays.map(u => (
                <div key={u.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name}`} className="w-10 h-10 rounded-xl border-2 border-dark-800 object-cover" />
                        <div>
                            <p className="text-white font-bold text-xs">{u.name.split(' ')[0]}</p>
                            {/* CORREÇÃO VISUAL: Exibe o dia lido diretamente da string do banco */}
                            <p className="text-[9px] text-brand-500 font-black uppercase">Dia {parseInt(u.birthDate!.split('-')[2], 10)}</p>
                        </div>
                    </div>
                    <button onClick={() => WhatsAppAutomation.sendGenericMessage(u, "Parabéns pelo seu aniversário! 🎉")} className="p-2 bg-brand-500/10 text-brand-500 rounded-xl hover:bg-brand-500 hover:text-white transition-all no-print">
                      <MessageCircle size={14} />
                    </button>
                </div>
              )) : (
                <p className="text-[10px] text-slate-600 font-bold uppercase text-center py-4">Sem aniversários no mês.</p>
              )}
            </div>
        </div>
      </div>

      {showNoticeForm && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/95 backdrop-blur-md p-4 pt-16 animate-fade-in no-print overflow-y-auto">
          <div className="bg-dark-900 border border-dark-700 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 mb-10">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white uppercase">Novo Comunicado</h3>
                <button onClick={() => setShowNoticeForm(false)} className="text-slate-500 p-2 bg-dark-800 rounded-full"><X size={20}/></button>
             </div>
             <NoticeForm initialData={editingNotice} onSave={handleSaveNotice} onCancel={() => setShowNoticeForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

const NoticeForm = ({ initialData, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState(initialData || { title: '', content: '', priority: 'INFO' });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Título</label>
        <input required className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-4 text-white outline-none font-bold" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
      </div>
      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Prioridade</label>
        <div className="grid grid-cols-3 gap-2">
          {['INFO', 'WARNING', 'URGENT'].map(p => (
            <button key={p} type="button" onClick={() => setFormData({ ...formData, priority: p })} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${formData.priority === p ? 'bg-brand-600 border-brand-500 text-white' : 'bg-dark-950 border-dark-800 text-slate-500'}`}>{p}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Conteúdo</label>
        <textarea required className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-4 text-white outline-none h-32 resize-none text-sm" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
      </div>
      <div className="flex gap-4">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
        <button type="submit" className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px]">Publicar</button>
      </div>
    </form>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => {
    const colors: any = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        brand: "bg-brand-500/10 text-brand-500 border-brand-500/20",
        red: "bg-red-500/10 text-red-500 border-red-500/20",
        purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    };
    return (
        <div className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-xl overflow-hidden relative">
            <div className={`p-3 rounded-2xl w-fit mb-4 ${colors[color]} border`}><Icon size={24}/></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
        </div>
    );
};
