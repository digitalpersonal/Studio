
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Payment, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  FileBarChart, Loader2, DollarSign, Users, Calendar, 
  TrendingUp, ArrowUpRight, ArrowDownRight, AlertTriangle, 
  PieChart as PieIcon, Receipt, MessageCircle, ChevronRight,
  ShieldCheck, Search, Filter, Download, Repeat, ArrowLeft
} from 'lucide-react';

interface ReportsPageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ currentUser, onNavigate, addToast }) => {
  const [financialHistory, setFinancialHistory] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [history, payments] = await Promise.all([
          SupabaseService.getFinancialReport(currentYear),
          SupabaseService.getPayments()
        ]);
        setFinancialHistory(history);
        setAllPayments(payments);
      } catch (e) { addToast(`Erro ao carregar dados.`, "error"); } finally { setLoading(false); }
    };
    fetchData();
  }, [currentYear, addToast]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20 printable-area">
      <button 
        onClick={() => onNavigate('DASHBOARD')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-2 transition-colors no-print"
      >
        <ArrowLeft size={14} /> Voltar ao Início
      </button>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Relatórios</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2">Controle Total</p>
        </div>
      </header>
      
      <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl h-96 flex items-center justify-center">
          <p className="text-slate-600 font-black uppercase text-xs">Visualização Gráfica de Receita</p>
      </div>
    </div>
  );
};
