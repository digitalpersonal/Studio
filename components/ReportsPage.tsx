
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
  ShieldCheck, Search, Filter, Download
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
  const [searchTerm, setSearchTerm] = useState('');

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

  // Cálculos de Controle Administrativo
  const stats = useMemo(() => {
    const activeStudents = students.length;
    const paidPayments = allPayments.filter(p => p.status === 'PAID');
    const overduePayments = allPayments.filter(p => p.status === 'OVERDUE');
    
    const totalRevenue = paidPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalOverdue = overduePayments.reduce((acc, p) => acc + p.amount, 0);
    const mrr = students.reduce((acc, s) => acc + (s.planValue || 0), 0);
    const avgTicket = activeStudents > 0 ? mrr / activeStudents : 0;
    
    // Eficiência: Pagos / (Pagos + Atrasados + Pendentes do mês atual)
    const efficiency = totalRevenue > 0 ? (totalRevenue / (totalRevenue + totalOverdue)) * 100 : 0;

    return {
      totalRevenue,
      totalOverdue,
      mrr,
      activeStudents,
      avgTicket,
      efficiency,
      overdueList: overduePayments.slice(0, 5) // Top 5 inadimplentes para ação rápida
    };
  }, [allPayments, students]);

  const COLORS = ['#f97316', '#a855f7', '#0ea5e9', '#84cc16', '#f59e0b', '#f43f5e', '#64748b'];

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header com Filtros */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Command Center Financeiro</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500"/> Controle Total de Receita e Inadimplência
          </p>
        </div>
        <div className="flex items-center gap-3 bg-dark-950 p-2 rounded-2xl border border-dark-800">
          <Calendar size={18} className="text-slate-500 ml-2" />
          <select
            className="bg-transparent text-white text-sm font-black uppercase outline-none cursor-pointer pr-4"
            value={currentYear}
            onChange={e => setCurrentYear(Number(e.target.value))}
          >
            {[2025, 2024, 2023].map(y => <option key={y} value={y} className="bg-dark-900">{y}</option>)}
          </select>
          <button className="p-2 bg-dark-800 text-slate-400 rounded-xl hover:text-white transition-colors">
            <Download size={18}/>
          </button>
        </div>
      </header>

      {/* KPIs de Gestão Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIBox 
          label="MRR (Faturamento Previsto)" 
          value={`R$ ${stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          sub="Receita mensal recorrente ativa"
          icon={RepeatIcon}
          color="blue"
        />
        <KPIBox 
          label="Receita Realizada (Ano)" 
          value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          sub="Total efetivamente pago"
          icon={TrendingUp}
          color="emerald"
        />
        <KPIBox 
          label="Ticket Médio" 
          value={`R$ ${stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          sub="Valor médio por aluno ativo"
          icon={Users}
          color="purple"
        />
        <KPIBox 
          label="Eficiência de Cobrança" 
          value={`${stats.efficiency.toFixed(1)}%`} 
          sub="Relação Pago vs. Inadimplente"
          icon={ShieldCheck}
          color={stats.efficiency > 90 ? 'emerald' : stats.efficiency > 70 ? 'amber' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Fluxo de Caixa Mensal */}
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

        {/* Inadimplência Crítica */}
        <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl space-y-6 flex flex-col">
            <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    <AlertTriangle className="text-red-500" size={24}/> Alerta de Risco
                </h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Inadimplência acumulada: R$ {stats.totalOverdue.toLocaleString('pt-BR')}</p>
            </div>
            
            <div className="flex-1 space-y-4">
                {stats.overdueList.length > 0 ? stats.overdueList.map((p: any, idx: number) => (
                    <div key={idx} className="bg-dark-900/50 p-4 rounded-2xl border border-dark-800 flex items-center justify-between group hover:border-red-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <img src={p.studentAvatar || `https://ui-avatars.com/api/?name=${p.studentName}`} className="w-10 h-10 rounded-xl border border-dark-800" />
                            <div>
                                <p className="text-white font-bold text-xs">{p.studentName}</p>
                                <p className="text-red-500 text-[9px] font-black uppercase">Vencido em {new Date(p.dueDate).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => WhatsAppAutomation.sendPaymentReminder({ name: p.studentName, phoneNumber: p.studentPhone } as any, p)}
                            className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
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

            <button className="w-full py-4 bg-dark-900 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl border border-dark-800 hover:text-white transition-all">
                Ver Todos os Atrasos
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saúde da Base de Alunos */}
        <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Retenção e Engajamento</h3>
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-dark-900/50 p-6 rounded-3xl border border-dark-800 text-center">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Total de Alunos</p>
                    <p className="text-4xl font-black text-white">{stats.activeStudents}</p>
                    <div className="mt-3 flex items-center justify-center gap-1 text-emerald-500 font-black text-[10px]">
                        <ArrowUpRight size={12}/> +4 novos esse mês
                    </div>
                </div>
                <div className="bg-dark-900/50 p-6 rounded-3xl border border-dark-800 text-center">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Ticket Médio</p>
                    <p className="text-4xl font-black text-brand-500">R$ {Math.round(stats.avgTicket)}</p>
                    <div className="mt-3 flex items-center justify-center gap-1 text-slate-500 font-black text-[10px]">
                        Baseado em planos ativos
                    </div>
                </div>
            </div>
        </div>

        {/* Gráfico de Distribuição */}
        <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Status de Pagamento</h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'Pagas', value: stats.totalRevenue },
                                { name: 'Pendentes', value: 1000 },
                                { name: 'Atrasadas', value: stats.totalOverdue },
                            ]}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                        >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

// Componentes Auxiliares
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

const RepeatIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>;
