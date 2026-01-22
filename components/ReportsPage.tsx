
import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileBarChart, Loader2, DollarSign, Users, Calendar, ArrowLeft, BarChart3, PieChart as PieChartIcon, AlertTriangle } from 'lucide-react';

interface ReportsPageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ currentUser, onNavigate, addToast }) => {
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setSchemaError(null);
      try {
        const [financial, attendance] = await Promise.all([
          SupabaseService.getFinancialReport(currentYear),
          SupabaseService.getAttendanceReport(),
        ]);
        setFinancialData(financial || []);
        setAttendanceData(attendance || []);
      } catch (error: any) {
        console.error("Erro ao carregar relatórios:", error.message || JSON.stringify(error));
        if (error.message.includes("is_present") || error.message.includes("Esquema")) {
            setSchemaError("O banco de dados precisa de atualização. Coluna 'is_present' não encontrada na tabela 'attendance'.");
            addToast("Falha de esquema no banco de dados.", "error");
        } else {
            addToast(`Erro ao carregar relatórios. Verifique a conexão.`, "error");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [currentYear, addToast]);

  const totalRevenue = financialData.reduce((sum, item) => sum + item.revenue, 0);
  const totalStudentsPaid = financialData.reduce((sum, item) => sum + item.students, 0);
  const hasFinancialData = totalRevenue > 0;
  const hasAttendanceData = attendanceData.some(d => d.attendance > 0);

  const ATTENDANCE_COLORS = ['#f97316', '#a855f7', '#0ea5e9', '#84cc16', '#f59e0b', '#f43f5e', '#64748b'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <Loader2 className="animate-spin text-brand-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('DASHBOARD')} className="p-2.5 bg-dark-950 border border-dark-800 text-slate-500 rounded-full hover:text-brand-500 hover:border-brand-500/50 transition-all active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tighter uppercase">Relatórios & Insights</h2>
            <p className="text-slate-400 text-sm">Análises financeiras e de frequência para a gestão do studio.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Ano Base:</label>
          <select
            className="bg-dark-900 border border-dark-700 rounded-xl p-2 text-white text-xs font-bold"
            value={currentYear}
            onChange={e => setCurrentYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </header>

      {schemaError && (
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-[2rem] flex items-start gap-4">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <div>
                <p className="text-red-500 font-black text-sm uppercase tracking-tighter">Aviso de Banco de Dados</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">Alguns dados de frequência não puderam ser carregados porque a coluna 'is_present' ainda não existe no seu banco de dados Supabase.</p>
                <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase">Ação: Execute o comando SQL fornecido no suporte para habilitar esta função.</p>
            </div>
        </div>
      )}

      {/* Financial Report */}
      <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign size={20} className="text-emerald-500" /> Desempenho Financeiro ({String(currentYear)})
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-dark-800">
            <div className="bg-dark-900 p-4 rounded-xl border border-dark-700 text-center">
                <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Receita Total Acumulada</p>
                <p className="text-2xl font-black text-emerald-500">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-dark-900 p-4 rounded-xl border border-dark-700 text-center">
                <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Mensalidades Liquidadas</p>
                <p className="text-2xl font-black text-white">{totalStudentsPaid}</p>
            </div>
        </div>

        <div className="h-80 w-full mt-6 flex items-center justify-center">
          {hasFinancialData ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                <YAxis yAxisId="left" orientation="left" stroke="#64748b" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} />
                <Tooltip 
                    cursor={{ fill: 'rgba(249, 115, 22, 0.05)' }} 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                    labelStyle={{ color: '#f97316', fontWeight: 'black', marginBottom: '4px' }}
                    formatter={(value: any, name: any) => name === 'revenue' ? `R$ ${value.toLocaleString('pt-BR')}` : `${value} faturas`}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                <Bar yAxisId="left" dataKey="revenue" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="students" name="Pagamentos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center space-y-2 opacity-30">
                <BarChart3 size={48} className="mx-auto text-slate-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nenhum dado financeiro para o ano {currentYear}</p>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Report */}
      <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Users size={20} className="text-brand-500" /> Fluxo de Presenças por Dia da Semana
        </h3>
        <div className="h-80 w-full mt-6 flex items-center justify-center">
          {!schemaError && hasAttendanceData ? (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="attendance"
                    nameKey="name"
                >
                    {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} stroke="none" />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                    formatter={(value: any) => `${value} presenças`}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center space-y-2 opacity-30">
                <PieChartIcon size={48} className="mx-auto text-slate-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {schemaError ? "Módulo de frequência indisponível" : "Sem registros de chamada até o momento"}
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
