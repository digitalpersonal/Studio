import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Payment } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  FileBarChart, Loader2, DollarSign, Users, Calendar, 
  TrendingUp, ArrowUpRight, ArrowDownRight, AlertTriangle, 
  PieChart as PieIcon, Receipt, MessageCircle, ChevronRight,
  ShieldCheck, Search, Filter, Download, Repeat
} from 'lucide-react';
import { WhatsAppAutomation } from '../App';

interface ReportsPageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ currentUser, addToast }) => {
  const [financialHistory, setFinancialHistory] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const availableYears = useMemo(() => {
    const year = new Date().getFullYear();
    return [year + 1, year];
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [history, payments, users] = await Promise.all([
          SupabaseService.getFinancialReport(currentYear),
          SupabaseService.getPayments(),
          SupabaseService.getAllStudents()
        ]);
        setFinancialHistory(history);
        setAllPayments(payments);
        setStudents(users);
      } catch (error: any) {
        addToast(`Erro ao carregar dados financeiros.`, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentYear, addToast]);

  // Cálculos de Controle Administrativo Reais
  const stats = useMemo(() => {
    const activeStudents = students.length;
    const paidPayments = allPayments.filter(p => p.status === 'PAID');
    const overduePayments = allPayments.filter(p => p.status === 'OVERDUE');
    const pendingPayments = allPayments.filter(p => p.status === 'PENDING');
    
    const totalRevenue = paidPayments.reduce((acc, p) => acc + (p.amount - (p.discount || 0)), 0);
    const totalOverdue = overduePayments.reduce((acc, p) => acc + p.amount, 0);
    const totalPending = pendingPayments.reduce((acc, p) => acc + p.amount, 0);
    
    const mrr = students.reduce((acc, s) => acc + (s.planValue || 0), 0);
    const avgTicket = activeStudents > 0 ? mrr / activeStudents : 0;
    
    const efficiency = (totalRevenue + totalOverdue) > 0 ? (totalRevenue / (totalRevenue + totalOverdue)) * 100 : 0;

    return {
      totalRevenue,
      totalOverdue,
      totalPending,
      mrr,
      activeStudents,
      avgTicket,
      efficiency,
      overdueList: overduePayments.slice(0, 5)
    };
  }, [allPayments, students]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20 printable-area">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Command Center Financeiro</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500"/> Controle Total de Receita e Inadimplência
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-dark-950 p-2 rounded-2xl border border-dark-800 no-print">
            <Calendar size={18} className="text-slate-500 ml-2" />
            <select
              className="bg-transparent text-white text-sm font-black uppercase outline-none cursor-pointer pr-4"
              value={currentYear}
              onChange={e => setCurrentYear(Number(e.target.value))}
            >
              {availableYears.map(y => <option key={y} value={y} className="bg-dark-900">{y}</option>)}
            </select>
          </div>
          <button onClick={() => window.print()} className="bg-dark-950 text-slate-400 px-4 py-3 rounded-2xl text-sm font-bold flex items-center shadow-lg border border-dark-800 hover:bg-dark-800 hover:text-white transition-all no-print">
            <Download size={18} className="mr-2" /> Imprimir Relatório
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIBox 
          label="MRR (Mensalidade Ativa)" 
          value={`R$ ${stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          sub="Faturamento recorrente base"
          icon={Repeat}
          color="blue"
        />
        <KPIBox 
          label="Receita Líquida (Pago)" 
          value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          sub="Total efetivamente em caixa"
          icon={TrendingUp}
          color="emerald"
        />
        <KPIBox 
          label="Ticket Médio" 
          value={`R$ ${stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          sub="Valor médio por aluno"
          icon={Users}
          color="purple"
        />
        <KPIBox 
          label="Eficiência de Cobrança" 
          value={`${stats.efficiency.toFixed(1)}%`} 
          sub="Sucesso de recebimento"
          icon={ShieldCheck}
          color={stats.efficiency > 90 ? 'emerald' : stats.efficiency > 70 ? 'amber' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Fluxo de Caixa Mensal</h3>
                <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 text-emerald-500"><div className="w-2 h-2 bg-emerald-500 rounded-full"/> Recebido</span>
                    <span className="flex items-center gap-1.5 text-red-500"><div className="w-2 h-2 bg-red-500 rounded-full"/> Atrasado</span>
                </div>
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialHistory}>
                        <defs>
                            <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v}`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px' }}
                            itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="revenue" name="Recebido" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPaid)" />
                        <Area type="monotone" dataKey="overdue" name="Em Atraso" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorOverdue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl space-y-6 flex flex-col">
            <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    <AlertTriangle className="text-red-500" size={24}/> Inadimplência Crítica
                </h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Total em aberto: R$ {stats.totalOverdue.toLocaleString('pt-BR')}</p>
            </div>
            
            <div className="flex-1 space-y-4">
                {stats.overdueList.length > 0 ? stats.overdueList.map((p: any, idx: number) => (
                    <div key={idx} className="bg-dark-900/50 p-4 rounded-2xl border border-dark-800 flex items-center justify-between group hover:border-red-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <img src={p.studentAvatar || `https://ui-avatars.com/api/?name=${p.studentName}`} className="w-10 h-10 rounded-xl border border-dark-800" />
                            <div>
                                <p className="text-white font-bold text-xs">{p.studentName}</p>
                                <p className="text-red-500 text-[9px] font-black uppercase">Desde {new Date(p.dueDate).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => WhatsAppAutomation.sendOverdueNotice({ name: p.studentName, phoneNumber: p.studentPhone } as any, p)}
                            className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg no-print"
                        >
                            <MessageCircle size={18} />
                        </button>
                    </div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale space-y-4">
                        <ShieldCheck size={64} className="text-emerald-500"/>
                        <p className="text-xs font-black uppercase tracking-widest">Nenhuma inadimplência<br/>detectada no período.</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Retenção de Base</h3>
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-dark-900/50 p-6 rounded-3xl border border-dark-800 text-center">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Total de Alunos</p>
                    <p className="text-4xl font-black text-white">{stats.activeStudents}</p>
                </div>
                <div className="bg-dark-900/50 p-6 rounded-3xl border border-dark-800 text-center">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Ticket Médio</p>
                    <p className="text-4xl font-black text-brand-500">R$ {Math.round(stats.avgTicket)}</p>
                </div>
            </div>
        </div>

        <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Distribuição de Status</h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'Recebido', value: stats.totalRevenue },
                                { name: 'Pendente', value: stats.totalPending },
                                { name: 'Atrasado', value: stats.totalOverdue },
                            ]}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                        >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                           formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                        />
                        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

const KPIBox = ({ label, value, sub, icon: Icon, color }: { label: string, value: string, sub: string, icon: any, color: string }) => {
    const colors: any = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        red: "bg-red-500/10 text-red-500 border-red-500/20"
    };

    return (
        <div className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-xl relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity ${colors[color]}`}>
                <Icon size={120} />
            </div>
            <div className={`p-3 rounded-2xl w-fit mb-4 ${colors[color]} border`}>
                <Icon size={24} />
            </div>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
            <p className="text-slate-600 text-[10px] font-medium mt-1">{sub}</p>
        </div>
    );
};
