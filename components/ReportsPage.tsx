

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileBarChart, Loader2, DollarSign, Users, Calendar } from 'lucide-react';

interface ReportsPageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ currentUser, addToast }) => {
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [financial, attendance] = await Promise.all([
          SupabaseService.getFinancialReport(currentYear),
          SupabaseService.getAttendanceReport(),
        ]);
        setFinancialData(financial);
        setAttendanceData(attendance);
      } catch (error: any) {
        console.error("Erro ao carregar relatórios:", error.message || JSON.stringify(error));
        addToast(`Erro ao carregar relatórios: ${error.message || JSON.stringify(error)}`, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [currentYear, addToast]);

  const totalRevenue = financialData.reduce((sum, item) => sum + item.revenue, 0);
  const totalStudentsPaid = financialData.reduce((sum, item) => sum + item.students, 0);

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
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Relatórios & Insights</h2>
          <p className="text-slate-400 text-sm">Análises financeiras e de frequência para a gestão do studio.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-slate-500 text-[10px] font-bold uppercase">Ano:</label>
          <select
            className="bg-dark-900 border border-dark-700 rounded-xl p-2 text-white text-sm"
            value={currentYear}
            onChange={e => setCurrentYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Financial Report */}
      <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign size={20} className="text-emerald-500" /> Relatório Financeiro ({String(currentYear)})
        </h3>
        <p className="text-slate-400 text-sm">Visão geral da receita e matrículas pagas ao longo do ano.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-dark-800">
            <div className="bg-dark-900 p-4 rounded-xl border border-dark-700 text-center">
                <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Receita Total</p>
                <p className="text-2xl font-black text-emerald-500">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-dark-900 p-4 rounded-xl border border-dark-700 text-center">
                <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Alunos Pagantes</p>
                <p className="text-2xl font-black text-white">{totalStudentsPaid}</p>
            </div>
        </div>

        <div className="h-80 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis yAxisId="left" orientation="left" stroke="#64748b" />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
              <Tooltip 
                cursor={{ fill: 'rgba(249, 115, 22, 0.1)' }} 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #f97316', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#f97316', fontWeight: 'bold' }}
                formatter={(value: any, name: any) => name === 'revenue' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="revenue" name="Receita" fill="#f97316" />
              <Bar yAxisId="right" dataKey="students" name="Alunos" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance Report */}
      <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Users size={20} className="text-brand-500" /> Relatório de Frequência
        </h3>
        <p className="text-slate-400 text-sm">Total de presenças registradas por dia da semana.</p>
        <div className="h-80 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={attendanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="attendance"
                nameKey="name"
              >
                {attendanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #f97316', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#f97316', fontWeight: 'bold' }}
                formatter={(value: any) => `${value} presenças`}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};