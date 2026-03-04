
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Payment, User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { SettingsService } from '../services/settingsService';
import { 
  Loader2, DollarSign, Receipt, Check, Download, CreditCard, 
  MessageCircle, AlertTriangle, X, CheckCheck, Info, BadgePercent,
  QrCode, Copy, Smartphone, ArrowRight, Edit, Plus, Save, Trash2, Search, Repeat,
  Calendar, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useToast, WhatsAppAutomation } from '../App'; 

interface FinancialPageProps {
  user: User;
  selectedStudentId?: string; 
}

export const FinancialPage = ({ user, selectedStudentId }: FinancialPageProps) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<User[]>([]); 
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [dateFilterType, setDateFilterType] = useState<'ALL' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'>('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<Partial<Payment> | null>(null);
  const [manualPaymentModal, setManualPaymentModal] = useState<any | null>(null);
  const [showPixModal, setShowPixModal] = useState<boolean>(false);
  const [academyPixKey, setAcademyPixKey] = useState<string>('');
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
        addToast(`Erro ao carregar dados financeiros: ${error.message}`, "error");
    } finally {
        setIsProcessing(null);
    }
  }, [user.id, isStaff, selectedStudentId, isGlobalAdminView, addToast]);

  useEffect(() => {
    refreshData();
    SettingsService.getSettings().then(s => setAcademyPixKey(s.pixKey));
  }, [refreshData]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    const currentMonthPayments = payments.filter(p => {
      const d = new Date(p.dueDate);
      return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
    });

    return {
      total: payments.reduce((acc, p) => acc + p.amount, 0),
      paid: payments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + (p.amount - (p.discount || 0)), 0),
      overdue: payments.filter(p => p.status === 'OVERDUE').reduce((acc, p) => acc + p.amount, 0),
      currentMonth: {
        total: currentMonthPayments.reduce((acc, p) => acc + p.amount, 0),
        paid: currentMonthPayments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + (p.amount - (p.discount || 0)), 0),
        pending: currentMonthPayments.filter(p => p.status !== 'PAID').reduce((acc, p) => acc + p.amount, 0),
      }
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => filter === 'ALL' || p.status === filter)
      .filter(p => {
        if (dateFilterType === 'ALL') return true;
        
        const pDate = new Date(p.dueDate);
        const sDate = new Date(selectedDate);

        if (dateFilterType === 'DAY') {
          return p.dueDate === selectedDate;
        }

        if (dateFilterType === 'WEEK') {
          // Início da semana (Domingo)
          const startOfWeek = new Date(sDate);
          startOfWeek.setUTCDate(sDate.getUTCDate() - sDate.getUTCDay());
          startOfWeek.setUTCHours(0, 0, 0, 0);

          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
          endOfWeek.setUTCHours(23, 59, 59, 999);

          return pDate >= startOfWeek && pDate <= endOfWeek;
        }

        if (dateFilterType === 'MONTH') {
          return pDate.getUTCMonth() === sDate.getUTCMonth() && pDate.getUTCFullYear() === sDate.getUTCFullYear();
        }

        if (dateFilterType === 'YEAR') {
          return pDate.getUTCFullYear() === sDate.getUTCFullYear();
        }

        if (dateFilterType === 'CUSTOM') {
          if (!customRange.start || !customRange.end) return true;
          return p.dueDate >= customRange.start && p.dueDate <= customRange.end;
        }

        return true;
      })
      .filter(p => 
        isGlobalAdminView 
          ? (p as any).studentName?.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [payments, filter, dateFilterType, selectedDate, customRange, isGlobalAdminView, searchTerm]);

  const handleMarkPaidWithDiscount = async (payment: Payment, discount: number) => {
    setIsProcessing(payment.id);
    try {
        await SupabaseService.markPaymentAsPaid(payment.id, discount);
        const student = students.find(s => s.id === payment.studentId);
        if (student) {
            WhatsAppAutomation.sendConfirmation(student, {...payment, discount});
        }
        addToast("Baixa realizada e aluno notificado!", "success");
        setManualPaymentModal(null);
        await refreshData();
    } catch (e: any) {
        addToast(`Erro ao dar baixa no pagamento: ${e.message}`, "error");
    } finally {
        setIsProcessing(null);
    }
  };

  const handleSavePayment = async (paymentData: Partial<Payment>) => {
    setIsProcessing(paymentData.id || 'new');
    try {
      if (paymentData.id) {
        await SupabaseService.updatePayment(paymentData as Payment);
        addToast("Fatura atualizada com sucesso!", "success");
      } else {
        if (!paymentData.studentId) throw new Error("É necessário selecionar um aluno para criar a fatura.");
        await SupabaseService.addPayment(paymentData as Omit<Payment, 'id'>);
        addToast("Nova fatura criada com sucesso!", "success");
      }
      setEditingPayment(null);
      refreshData();
    } catch (e: any) {
      addToast(`Erro ao salvar fatura: ${e.message}`, "error");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Atenção! Deseja excluir esta fatura permanentemente? A ação não pode ser desfeita.")) return;
    setIsProcessing(paymentId);
    try {
      await SupabaseService.deletePayment(paymentId);
      addToast("Fatura removida do sistema.", "success");
      refreshData();
    } catch (e: any) {
      addToast(`Erro ao excluir fatura: ${e.message}`, "error");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCopyAcademyPix = () => {
      if (!academyPixKey) return;
      navigator.clipboard.writeText(academyPixKey);
      setCopied(true);
      addToast("Chave Pix copiada!", "success");
      setTimeout(() => setCopied(false), 3000);
  };

  const currentStudentName = useMemo(() => { 
    return selectedStudentId 
      ? students.find(s => s.id === selectedStudentId)?.name || '...'
      : '';
  }, [selectedStudentId, students]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">{isGlobalAdminView ? 'Financeiro Geral' : 'Financeiro'}</h2>
          <p className="text-slate-400 text-sm">Controle de pagamentos {selectedStudentId ? `de ${currentStudentName}` : (user.role === UserRole.STUDENT ? 'do seu plano' : 'da academia')}.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={48} />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Total Recebido (Geral)</p>
          <p className="text-2xl font-black text-emerald-500">R$ {stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        
        <div className="bg-dark-950 p-6 rounded-2xl border-2 border-brand-500/30 shadow-xl shadow-brand-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 text-brand-500">
            <Calendar size={48} />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-brand-400 text-[10px] font-bold uppercase tracking-widest">Este Mês ({new Date().toLocaleString('pt-BR', { month: 'long' })})</p>
            <span className="bg-brand-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black animate-pulse">DESTAQUE</span>
          </div>
          <p className="text-2xl font-black text-white">R$ {stats.currentMonth.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-500 mt-1 font-bold italic">Previsto: R$ {stats.currentMonth.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 shadow-xl relative overflow-hidden group">
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 tracking-widest">A Receber (Total)</p>
          <p className="text-2xl font-black text-amber-500">R$ {(stats.total - stats.paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-brand-600 p-6 rounded-2xl shadow-xl shadow-brand-500/20 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-20">
            <AlertTriangle size={48} />
          </div>
          <p className="text-brand-100 text-[10px] font-bold uppercase mb-1 tracking-widest">Total em Atraso</p>
          <p className="text-2xl font-black">R$ {stats.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* FILTROS AVANÇADOS */}
      <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <Filter size={14} className="text-brand-500 shrink-0" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 shrink-0">Filtrar por:</span>
            {[
              { id: 'ALL', label: 'Tudo' },
              { id: 'DAY', label: 'Dia' },
              { id: 'WEEK', label: 'Semana' },
              { id: 'MONTH', label: 'Mês' },
              { id: 'YEAR', label: 'Ano' },
              { id: 'CUSTOM', label: 'Período' }
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setDateFilterType(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${dateFilterType === t.id ? 'bg-brand-600 text-white' : 'bg-dark-900 text-slate-500 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {dateFilterType !== 'ALL' && dateFilterType !== 'CUSTOM' && (
              <div className="flex items-center bg-dark-900 rounded-xl border border-dark-800 p-1">
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    if (dateFilterType === 'DAY') d.setUTCDate(d.getUTCDate() - 1);
                    if (dateFilterType === 'WEEK') d.setUTCDate(d.getUTCDate() - 7);
                    if (dateFilterType === 'MONTH') d.setUTCMonth(d.getUTCMonth() - 1);
                    if (dateFilterType === 'YEAR') d.setUTCFullYear(d.getUTCFullYear() - 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  className="p-1.5 text-slate-500 hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <input 
                  type={dateFilterType === 'MONTH' ? 'month' : dateFilterType === 'YEAR' ? 'number' : 'date'}
                  value={dateFilterType === 'YEAR' ? new Date(selectedDate).getUTCFullYear() : (dateFilterType === 'MONTH' ? selectedDate.substring(0, 7) : selectedDate)}
                  onChange={(e) => {
                    if (dateFilterType === 'YEAR') {
                      const d = new Date(selectedDate);
                      d.setUTCFullYear(Number(e.target.value));
                      setSelectedDate(d.toISOString().split('T')[0]);
                    } else if (dateFilterType === 'MONTH') {
                      setSelectedDate(`${e.target.value}-01`);
                    } else {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  className="bg-transparent text-white text-xs font-bold px-2 outline-none w-28 text-center"
                />

                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    if (dateFilterType === 'DAY') d.setUTCDate(d.getUTCDate() + 1);
                    if (dateFilterType === 'WEEK') d.setUTCDate(d.getUTCDate() + 7);
                    if (dateFilterType === 'MONTH') d.setUTCMonth(d.getUTCMonth() + 1);
                    if (dateFilterType === 'YEAR') d.setUTCFullYear(d.getUTCFullYear() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  className="p-1.5 text-slate-500 hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {dateFilterType === 'CUSTOM' && (
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={customRange.start}
                  onChange={e => setCustomRange({...customRange, start: e.target.value})}
                  className="bg-dark-900 border border-dark-800 rounded-xl p-2 text-white text-xs outline-none focus:border-brand-500"
                />
                <span className="text-slate-600 text-xs">até</span>
                <input 
                  type="date" 
                  value={customRange.end}
                  onChange={e => setCustomRange({...customRange, end: e.target.value})}
                  className="bg-dark-900 border border-dark-800 rounded-xl p-2 text-white text-xs outline-none focus:border-brand-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-dark-950 rounded-3xl border border-dark-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-dark-800 flex flex-col sm:flex-row justify-between items-center bg-dark-950/50 gap-4">
           <h3 className="font-bold flex items-center gap-2 text-white uppercase tracking-tighter"><Receipt size={18} className="text-brand-500" /> Faturas e Mensalidades</h3>
           <div className="flex items-center gap-2 w-full sm:w-auto">
             {isGlobalAdminView && (
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14}/>
                    <input 
                        type="text"
                        placeholder="Buscar por aluno..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-900 border border-dark-700 rounded-xl p-2 pl-9 text-white text-xs"
                    />
                </div>
             )}
             <div className="flex gap-2">
               {isStaff && selectedStudentId && (
                 <button 
                    onClick={async () => {
                        const student = students.find(s => s.id === selectedStudentId);
                        if (student) {
                            setIsProcessing('sync');
                            try {
                                const MIN_DATE_STR = '2026-02-01';
                                const isSameMonthYear = (d1: string, d2: string) => {
                                    const date1 = new Date(d1);
                                    const date2 = new Date(d2);
                                    return date1.getUTCMonth() === date2.getUTCMonth() && date1.getUTCFullYear() === date2.getUTCFullYear();
                                };

                                // 1. LIMPEZA: 
                                // - Remover parcelas PENDING/OVERDUE de Janeiro/2026 ou anterior
                                // - Remover parcelas PENDING/OVERDUE em meses que já possuem uma parcela PAID
                                const paidPayments = payments.filter(p => p.status === 'PAID');
                                const duplicatesToRemove = payments.filter(p => {
                                    if (p.status === 'PAID') return false;
                                    
                                    const isBeforeFeb = p.dueDate < MIN_DATE_STR;
                                    const isAlreadyPaidMonth = paidPayments.some(pp => isSameMonthYear(pp.dueDate, p.dueDate));
                                    
                                    return isBeforeFeb || isAlreadyPaidMonth;
                                });

                                for (const dup of duplicatesToRemove) {
                                    await SupabaseService.deletePayment(dup.id);
                                }

                                // Atualizar lista local para geração
                                const updatedPayments = payments.filter(p => !duplicatesToRemove.find(d => d.id === p.id));

                                // 2. GERAÇÃO
                                let baseDate = new Date(student.planStartDate || student.joinDate || new Date().toISOString());
                                const minDate = new Date(MIN_DATE_STR + 'T12:00:00Z');
                                
                                if (baseDate < minDate) {
                                    baseDate = minDate;
                                }

                                const paymentsToCreate: Omit<Payment, 'id'>[] = [];
                                const existingInstallmentNumbers = updatedPayments.map(p => p.installmentNumber || 0);
                                const existingDates = updatedPayments.map(p => p.dueDate);

                                for (let i = 0; i < (student.planDuration || 0); i++) {
                                    const installmentNum = i + 1;
                                    const dueDate = new Date(baseDate.getTime());
                                    dueDate.setMonth(baseDate.getMonth() + i);
                                    const dueDateStr = dueDate.toISOString().split('T')[0];

                                    const alreadyExists = existingInstallmentNumbers.includes(installmentNum) || 
                                                        existingDates.some(d => isSameMonthYear(d, dueDateStr));

                                    if (alreadyExists) continue;

                                    const finalAmount = (student.planValue || 0) - (student.planDiscount || 0);
                                    
                                    paymentsToCreate.push({
                                        studentId: student.id,
                                        amount: finalAmount,
                                        status: 'PENDING',
                                        dueDate: dueDateStr,
                                        description: `Mensalidade ${installmentNum}/${student.planDuration}`,
                                        installmentNumber: installmentNum,
                                        total_installments: student.planDuration
                                    });
                                }

                                if (paymentsToCreate.length > 0) {
                                    await SupabaseService.addMultiplePayments(paymentsToCreate);
                                    addToast(`${paymentsToCreate.length} novas parcelas geradas.`, "success");
                                }
                                
                                if (duplicatesToRemove.length > 0) {
                                    addToast(`${duplicatesToRemove.length} cobranças duplicadas corrigidas.`, "success");
                                }

                                if (paymentsToCreate.length === 0 && duplicatesToRemove.length === 0) {
                                    addToast("O plano já está sincronizado e correto.", "info");
                                }

                                refreshData();
                            } catch (e: any) {
                                addToast(`Erro ao sincronizar: ${e.message}`, "error");
                            } finally {
                                setIsProcessing(null);
                            }
                        }
                    }}
                    disabled={isProcessing === 'sync'}
                    className="px-3 py-1.5 bg-dark-800 text-slate-400 rounded-lg text-[10px] font-black uppercase border border-dark-700 hover:text-white transition-all flex items-center gap-2"
                 >
                    {isProcessing === 'sync' ? <Loader2 size={12} className="animate-spin" /> : <Repeat size={12} />}
                    Sincronizar Plano
                 </button>
               )}
               {['ALL', 'PENDING', 'OVERDUE', 'PAID'].map(f => (
                 <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${filter === f ? 'bg-brand-600 text-white' : 'bg-dark-800 text-slate-500 hover:text-white'}`}>
                   {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Pendentes' : f === 'OVERDUE' ? 'Atrasadas' : 'Pagas'}
                 </button>
               ))}
             </div>
             {isStaff && (
               <button onClick={() => setEditingPayment({ studentId: selectedStudentId, status: 'PENDING' })} className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors"><Plus size={16}/></button>
             )}
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-dark-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">Fatura / Usuário</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Valor Original</th>
                <th className="px-6 py-4 text-emerald-500">Líquido Pago</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isProcessing === 'loading' && <tr><td colSpan={6} className="text-center p-10"><Loader2 className="animate-spin text-brand-500 mx-auto" /></td></tr>}
              {filteredPayments.map(p => {
                const paidValue = p.status === 'PAID' ? (p.amount - (p.discount || 0)) : 0;
                
                return (
                  <tr key={p.id} className="hover:bg-dark-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={String(p.studentAvatar || `https://ui-avatars.com/api/?name=${String(p.studentName)}`)} className="w-8 h-8 rounded-full border border-dark-800" />
                        <div>
                          <p className="text-white font-bold">{String(p.studentName || user.name)}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-500">{String(p.description)}</p>
                            {p.installmentNumber && (
                              <span className="text-[8px] bg-dark-800 text-slate-400 px-1.5 py-0.5 rounded border border-dark-700 font-black uppercase tracking-widest">
                                Parcela {p.installmentNumber}/{p.total_installments}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold">{String(p.dueDate)}</td>
                    <td className="px-6 py-4 text-slate-500 font-bold">R$ {p.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 font-black text-white">
                        {p.status === 'PAID' ? (
                            <div className="flex flex-col">
                                <span>R$ {paidValue.toFixed(2)}</span>
                                {p.discount ? <span className="text-[8px] text-emerald-500 uppercase font-black tracking-widest">Desc. R$ {p.discount.toFixed(2)}</span> : null}
                            </div>
                        ) : '--'}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            p.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            p.status === 'OVERDUE' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                            {p.status === 'PAID' ? 'Pago' : p.status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          {p.status !== 'PAID' && !isStaff && (
                             <button onClick={() => setShowPixModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 text-[10px] font-black uppercase shadow-lg shadow-emerald-600/20"><QrCode size={14}/> Pagar com Pix</button>
                          )}
                          {isStaff && (
                              <>
                                {p.status !== 'PAID' && (
                                    <button onClick={() => setManualPaymentModal(p)} disabled={isProcessing === p.id} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white" title="Dar Baixa no Pagamento">
                                        {isProcessing === p.id ? <Loader2 className="animate-spin" size={16}/> : <CheckCheck size={16}/>}
                                    </button>
                                )}
                                <button onClick={() => setEditingPayment(p)} disabled={isProcessing === p.id} className="p-2 bg-dark-800 text-slate-500 rounded-lg hover:text-white"><Edit size={16}/></button>
                                <button onClick={() => handleDeletePayment(p.id)} disabled={isProcessing === p.id} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white">{isProcessing === p.id ? <Loader2 className="animate-spin"/> : <Trash2 size={16}/>}</button>
                              </>
                          )}
                          {p.status === 'PAID' && (<button className="p-2 bg-dark-800 text-slate-500 rounded-lg hover:text-white" title="Baixar Recibo"><Download size={16}/></button>)}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showPixModal && ( 
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/95 backdrop-blur-md p-6 pt-12 animate-fade-in overflow-y-auto">
           <div className="bg-dark-900 border border-dark-700 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6 relative overflow-hidden h-auto mb-10">
              <button onClick={() => setShowPixModal(false)} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white bg-dark-800 rounded-full"><X size={20}/></button>
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-center gap-2 mb-2"><div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500"><QrCode size={18}/></div><h3 className="text-white font-black text-xl uppercase tracking-tighter">Pagamento via Pix</h3></div>
                
                <div className="space-y-2">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Chave Pix da Academia:</p>
                  <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 relative group">
                    <p className="text-white text-sm font-mono break-all text-center select-all">{academyPixKey || "Chave não cadastrada"}</p>
                    <button onClick={handleCopyAcademyPix} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-dark-800 text-slate-400 hover:text-white'}`}>{copied ? <Check size={16}/> : <Copy size={16}/>}</button>
                  </div>
                </div>

                <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 flex gap-3 items-start text-left">
                  <Info size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-100 font-bold leading-relaxed">
                    Faça a transferência usando a chave acima e envie o comprovante para a administração para que a baixa seja realizada.
                  </p>
                </div>
                <button onClick={() => setShowPixModal(false)} className="w-full py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-700 transition-all">Fechar Janela</button>
              </div>
           </div>
        </div>
      )}
      {editingPayment && ( <PaymentFormModal payment={editingPayment} students={students} onSave={handleSavePayment} onCancel={() => setEditingPayment(null)} isProcessing={!!isProcessing} /> )}
      {manualPaymentModal && (
          <ManualPaymentModal 
              payment={manualPaymentModal}
              onConfirm={handleMarkPaidWithDiscount}
              onCancel={() => setManualPaymentModal(null)}
              isProcessing={isProcessing === manualPaymentModal.id}
          />
      )}
    </div>
  );
};

const ManualPaymentModal = ({ payment, onConfirm, onCancel, isProcessing }: { payment: any, onConfirm: (p: Payment, discount: number) => void, onCancel: () => void, isProcessing: boolean }) => {
    const [discount, setDiscount] = useState(payment.discount || 0);
    const finalAmount = Math.max(0, payment.amount - discount);

    return (
        <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/95 backdrop-blur-md p-6 pt-10 animate-fade-in overflow-y-auto">
            <div className="bg-dark-900 border border-dark-700 p-8 rounded-[3rem] shadow-2xl max-w-md w-full space-y-6 relative overflow-hidden h-auto mb-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <BadgePercent size={22} className="text-brand-500" /> Receber Pagamento
                        </h3>
                        <p className="text-slate-500 text-[10px] mt-1 uppercase font-black tracking-widest">{String(payment.studentName)}</p>
                    </div>
                    <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 flex justify-between items-center">
                        <span className="text-slate-400 text-xs font-bold uppercase">Valor da Fatura:</span>
                        <span className="text-white font-black">R$ {payment.amount.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Aplicar Desconto (R$)</label>
                        <input type="number" step="0.01" className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-4 text-white font-black text-lg focus:border-brand-500 outline-none" placeholder="0.00" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} />
                    </div>
                    <div className="bg-brand-600/10 p-5 rounded-2xl border border-brand-500/20 flex justify-between items-center animate-pulse">
                        <span className="text-brand-500 text-xs font-black uppercase">Total a Receber:</span>
                        <span className="text-white font-black text-xl">R$ {finalAmount.toFixed(2)}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onCancel} className="py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-700">Cancelar</button>
                    <button onClick={() => onConfirm(payment, discount)} disabled={isProcessing} className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 flex items-center justify-center gap-2">
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
                        Confirmar Baixa
                    </button>
                </div>
            </div>
        </div>
    );
};

// MODAIS
const PaymentFormModal = ({ payment, students, onSave, onCancel, isProcessing }: { payment: Partial<Payment>, students: User[], onSave: (p: Partial<Payment>) => void, onCancel: () => void, isProcessing: boolean }) => {
  const [formData, setFormData] = useState(payment);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/95 backdrop-blur-md p-6 pt-10 animate-fade-in overflow-y-auto">
        <div className="bg-dark-900 border border-dark-700 p-8 rounded-[3rem] shadow-2xl max-w-md w-full space-y-6 relative overflow-hidden h-auto mb-10">
            <div className="flex justify-between items-center"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Receipt size={22} className="text-brand-500" /> {payment.id ? 'Editar Fatura' : 'Nova Fatura'}</h3><button onClick={onCancel} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full"><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
                {!formData.id && !formData.studentId && (
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Aluno</label>
                    <select required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.studentId || ''} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                      <option value="">Selecione um aluno...</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição</label><input type="text" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vencimento</label><input type="date" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor (R$)</label><input type="number" step="0.01" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} /></div>
                </div>
                <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label><select className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.status || 'PENDING'} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="PENDING">Pendente</option><option value="OVERDUE">Atrasado</option><option value="PAID">Pago</option></select></div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                    <button type="button" onClick={onCancel} className="py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-700">Cancelar</button>
                    <button type="submit" disabled={isProcessing} className="py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 flex items-center justify-center gap-2">{isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar</button>
                </div>
            </form>
        </div>
    </div>
  );
};
