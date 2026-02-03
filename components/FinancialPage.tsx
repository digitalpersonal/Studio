
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Payment, User, UserRole, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { MercadoPagoService } from '../services/mercadoPagoService';
import { 
  Loader2, DollarSign, Receipt, Check, Download, CreditCard, 
  MessageCircle, AlertTriangle, X, CheckCheck, Info, BadgePercent,
  QrCode, Copy, Smartphone, ArrowRight, Edit, Plus, Save, Trash2, Search, ArrowLeft
} from 'lucide-react';
import { useToast, WhatsAppAutomation } from '../App'; 

interface FinancialPageProps {
  user: User;
  onNavigate: (view: ViewState) => void;
  selectedStudentId?: string; 
}

export const FinancialPage = ({ user, onNavigate, selectedStudentId }: FinancialPageProps) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<User[]>([]); 
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Partial<Payment> | null>(null);
  const [manualPaymentModal, setManualPaymentModal] = useState<any | null>(null);
  const [pixData, setPixData] = useState<{ qr_code: string, copy_paste: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();
  
  const isStaff = user.role !== UserRole.STUDENT;
  const isGlobalAdminView = isStaff && !selectedStudentId;

  const refreshData = useCallback(async () => {
    setIsProcessing('loading');
    const studentIdToFetch = isGlobalAdminView ? undefined : (selectedStudentId || user.id);
    try { 
      const [p, s] = await Promise.all([
        SupabaseService.getPayments(studentIdToFetch),
        isStaff ? SupabaseService.getAllStudents() : Promise.resolve([]) 
      ]);
      setPayments(p);
      setStudents(s);
    } catch (error: any) {
        addToast(`Erro ao carregar dados: ${error.message}`, "error");
    } finally {
        setIsProcessing(null);
    }
  }, [user.id, isStaff, selectedStudentId, isGlobalAdminView, addToast]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => filter === 'ALL' || p.status === filter)
      .filter(p => isGlobalAdminView ? p.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) : true);
  }, [payments, filter, isGlobalAdminView, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
      <button 
        onClick={() => onNavigate('DASHBOARD')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-2 transition-colors no-print"
      >
        <ArrowLeft size={14} /> Voltar ao Início
      </button>

      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">{isGlobalAdminView ? 'Financeiro Geral' : 'Financeiro'}</h2>
          <p className="text-slate-400 text-sm">Controle de faturas e mensalidades.</p>
        </div>
      </header>

      <div className="bg-dark-950 rounded-3xl border border-dark-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-dark-800 flex flex-col sm:flex-row justify-between items-center bg-dark-950/50 gap-4">
           <h3 className="font-bold flex items-center gap-2 text-white uppercase tracking-tighter"><Receipt size={18} className="text-brand-500" /> Histórico</h3>
           <div className="flex items-center gap-2">
              {['ALL', 'PENDING', 'OVERDUE', 'PAID'].map(f => (
                 <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filter === f ? 'bg-brand-600 text-white' : 'bg-dark-800 text-slate-500'}`}>
                   {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Pend' : f === 'OVERDUE' ? 'Atras' : 'Pagas'}
                 </button>
              ))}
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-dark-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isProcessing === 'loading' ? <tr><td colSpan={5} className="text-center p-10"><Loader2 className="animate-spin text-brand-500 mx-auto" /></td></tr> : filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-dark-900/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{String(p.studentName || user.name)}</td>
                  <td className="px-6 py-4 font-mono text-xs">{String(p.dueDate)}</td>
                  <td className="px-6 py-4 font-bold">R$ {p.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${p.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2">{p.status === 'PAID' ? <Download size={16} className="text-slate-500 cursor-pointer"/> : <CreditCard size={16} className="text-brand-500 cursor-pointer"/>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
