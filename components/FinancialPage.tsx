import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Payment, User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { MercadoPagoService } from '../services/mercadoPagoService';
import { 
  Loader2, Receipt, Check, Download, CreditCard, 
  MessageCircle, X, CheckCheck, Info, BadgePercent,
  QrCode, Copy, Search, Edit, Plus, Save, Trash2, Calendar
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
  const [monthFilter, setMonthFilter] = useState<number>(new Date().getMonth());
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
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
        SupabaseService.getPayments(studentIdToFetch, true), // force refresh
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
  }, [refreshData]);

  const stats = useMemo(() => {
    return {
      total: payments.reduce((acc, p) => acc + p.amount, 0),
      paid: payments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + (p.amount - (p.discount || 0)), 0),
      overdue: payments.filter(p => p.status === 'OVERDUE').reduce((acc, p) => acc + p.amount, 0),
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => filter === 'ALL' || p.status === filter)
      .filter(p => {
          const pDate = new Date(p.dueDate);
          return pDate.getMonth() === monthFilter && pDate.getFullYear() === yearFilter;
      })
      .filter(p => 
        isGlobalAdminView 
          ? (p as any).studentName?.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      )
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [payments, filter, isGlobalAdminView, searchTerm, monthFilter, yearFilter]);

  const handlePayWithMP = async (p: Payment, method: 'CARD' | 'PIX' = 'CARD') => {
    setIsProcessing(p.id);
    if (method === 'CARD') {
        setShowCheckoutModal(p);
    } else {
        setPixData(null); 
        setShowCheckoutModal(p);
    }
    
    setTimeout(async () => {
      try {
          const result = await MercadoPagoService.processPayment(p);
          if (method === 'CARD' && result.init_point) {
              window.open(result.init_point, '_blank');
              addToast("Redirecionando para o Mercado Pago...", "info");
              setShowCheckoutModal(null);
          } else if (method === 'PIX' && result.pix_copy_paste) {
              setPixData({ 
                  qr_code: result.pix_qr_code || "", 
                  copy_paste: result.pix_copy_paste 
              });
          }
      } catch (error: any) { 
          addToast(`Erro ao processar pagamento: ${error.message}`, "error");
          setShowCheckoutModal(null);
      } finally {
          setIsProcessing(null);
      }
    }, 1500);
  };

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
        addToast("Fatura atualizada!", "success");
      } else {
        if (!paymentData.studentId) throw new Error("Selecione um aluno.");
        await SupabaseService.addPayment(paymentData as Omit<Payment, 'id'>);
        addToast("Nova fatura criada!", "success");
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
    if (!confirm("Deseja EXCLUIR permanentemente esta fatura? Isso apagará o registro do banco de dados e os valores sumirão dos relatórios.")) return;
    setIsProcessing(paymentId);
    try {
      await SupabaseService.deletePayment(paymentId);
      addToast("Fatura removida com sucesso.", "success");
      refreshData();
    } catch (e: any) {
      addToast(`Erro ao excluir: ${e.message}`, "error");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCopyPix = () => {
      if (!pixData) return;
      navigator.clipboard.writeText(pixData.copy_paste);
      setCopied(true);
      addToast("Código Pix copiado!", "success");
      setTimeout(() => setCopied(false), 3000);
  };

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">{isGlobalAdminView ? 'Centro de Custos Geral' : 'Meu Financeiro'}</h2>
        <p className="text-slate-400 text-sm">Gerenciamento de faturas, baixas e auditoria de recebimentos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 shadow-xl">
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Recebido (Auditado)</p>
          <p className="text-2xl font-black text-emerald-500">R$ {stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 shadow-xl">
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Pendente no Mês</p>
          <p className="text-2xl font-black text-amber-500">R$ {(stats.total - stats.paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-red-600/10 p-6 rounded-2xl border border-red-500/20 shadow-xl text-red-500">
          <p className="text-red-400 text-[10px] font-bold uppercase mb-1 tracking-widest">Inadimplência Total</p>
          <p className="text-2xl font-black">R$ {stats.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-dark-950 rounded-[2.5rem] border border-dark-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-dark-800 bg-dark-950/50 space-y-4">
           <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
               <h3 className="font-bold flex items-center gap-2 text-white uppercase tracking-tighter">
                   <Receipt size={18} className="text-brand-500" /> Histórico de Lançamentos
               </h3>
               <div className="flex items-center gap-2">
                    <select 
                        value={monthFilter} 
                        onChange={e => setMonthFilter(Number(e.target.value))}
                        className="bg-dark-900 border border-dark-700 rounded-xl p-2 text-white text-xs font-bold outline-none"
                    >
                        {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select 
                        value={yearFilter} 
                        onChange={e => setYearFilter(Number(e.target.value))}
                        className="bg-dark-900 border border-dark-700 rounded-xl p-2 text-white text-xs font-bold outline-none"
                    >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>
               </div>
           </div>

           <div className="flex flex-col sm:flex-row items-center gap-2">
             {isGlobalAdminView && (
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14}/>
                    <input 
                        type="text"
                        placeholder="Buscar por nome do aluno..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-900 border border-dark-700 rounded-xl p-2 pl-9 text-white text-xs"
                    />
                </div>
             )}
             <div className="flex gap-1 w-full sm:w-auto">
               {['ALL', 'PENDING', 'OVERDUE', 'PAID'].map(f => (
                 <button key={f} onClick={() => setFilter(f as any)} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${filter === f ? 'bg-brand-600 text-white' : 'bg-dark-800 text-slate-500 hover:text-white'}`}>
                   {f === 'ALL' ? 'Tudo' : f === 'PENDING' ? 'Pend.' : f === 'OVERDUE' ? 'Atraso' : 'Pago'}
                 </button>
               ))}
             </div>
             {isStaff && (
               <button onClick={() => setEditingPayment({ studentId: selectedStudentId, status: 'PENDING', dueDate: new Date().toISOString().split('T')[0] })} className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors shadow-lg"><Plus size={16}/></button>
             )}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-dark-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">Fatura / Aluno</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Valor Bruto</th>
                <th className="px-6 py-4 text-emerald-500">Líquido</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isProcessing === 'loading' ? (
                  <tr><td colSpan={6} className="text-center p-12"><Loader2 className="animate-spin text-brand-500 mx-auto" size={32} /></td></tr>
              ) : filteredPayments.length > 0 ? filteredPayments.map(p => {
                const paidValue = p.status === 'PAID' ? (p.amount - (p.discount || 0)) : 0;
                return (
                  <tr key={p.id} className="hover:bg-dark-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={String(p.studentAvatar || `https://ui-avatars.com/api/?name=${String(p.studentName)}`)} className="w-8 h-8 rounded-lg border border-dark-800" />
                        <div><p className="text-white font-bold text-xs">{String(p.studentName || user.name)}</p><p className="text-[10px] text-slate-500 truncate max-w-[120px]">{String(p.description)}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] font-bold">{String(p.dueDate).split('-').reverse().join('/')}</td>
                    <td className="px-6 py-4 text-slate-500 font-bold text-xs">R$ {p.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 font-black text-white text-xs">
                        {p.status === 'PAID' ? (
                            <div className="flex flex-col">
                                <span>R$ {paidValue.toFixed(2)}</span>
                                {p.discount > 0 && <span className="text-[8px] text-emerald-500 uppercase font-black">Desc: -R${p.discount.toFixed(2)}</span>}
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
                             <div className="flex gap-2">
                                <button onClick={() => handlePayWithMP(p, 'PIX')} disabled={isProcessing === p.id} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 shadow-md"><QrCode size={14}/></button>
                                <button onClick={() => handlePayWithMP(p, 'CARD')} disabled={isProcessing === p.id} className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 shadow-md"><CreditCard size={14}/></button>
                             </div>
                          )}
                          {isStaff && (
                              <>
                                {p.status !== 'PAID' && (
                                    <button onClick={() => setManualPaymentModal(p)} disabled={isProcessing === p.id} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white" title="Dar Baixa">
                                        <CheckCheck size={16}/>
                                    </button>
                                )}
                                <button onClick={() => setEditingPayment(p)} className="p-2 bg-dark-800 text-slate-500 rounded-lg hover:text-white"><Edit size={16}/></button>
                                <button onClick={() => handleDeletePayment(p.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-lg" title="APAGAR FATURA">
                                    <Trash2 size={16}/>
                                </button>
                              </>
                          )}
                       </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="text-center p-20 text-slate-600 font-bold uppercase text-[10px] tracking-widest">Nenhuma fatura encontrada neste período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCheckoutModal && ( <CheckoutModal payment={showCheckoutModal} pixData={pixData} copied={copied} onCopyPix={handleCopyPix} onClose={() => setShowCheckoutModal(null)} /> )}
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

const ManualPaymentModal = ({ payment, onConfirm, onCancel, isProcessing }: any) => {
    const [discount, setDiscount] = useState(payment.discount || 0);
    const finalAmount = Math.max(0, payment.amount - discount);
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
            <div className="bg-dark-900 border border-dark-700 p-8 rounded-[3rem] shadow-2xl max-w-md w-full space-y-6 relative overflow-hidden">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><BadgePercent size={22} className="text-brand-500" /> Baixa Manual</h3>
                        <p className="text-slate-500 text-[10px] mt-1 uppercase font-black">{String(payment.studentName)}</p>
                    </div>
                    <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 flex justify-between items-center"><span className="text-slate-400 text-xs font-bold uppercase">Valor Bruto:</span><span className="text-white font-black">R$ {payment.amount.toFixed(2)}</span></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Desconto Aplicado (R$)</label><input type="number" step="0.01" className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-4 text-white font-black text-lg focus:border-brand-500 outline-none" value={discount} onChange={e => setDiscount(Number(e.target.value))} /></div>
                    <div className="bg-brand-600/10 p-5 rounded-2xl border border-brand-500/20 flex justify-between items-center"><span className="text-brand-500 text-xs font-black uppercase">Total Recebido:</span><span className="text-white font-black text-xl">R$ {finalAmount.toFixed(2)}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onCancel} className="py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                    <button onClick={() => onConfirm(payment, discount)} disabled={isProcessing} className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">{isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />} Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const CheckoutModal = ({ payment, pixData, copied, onCopyPix, onClose }: any) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
       <div className="bg-dark-900 border border-dark-700 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white bg-dark-800 rounded-full"><X size={20}/></button>
          {!pixData ? ( <> <div className="bg-brand-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto"><Loader2 className="text-white animate-spin" size={32}/></div><h3 className="text-white font-black text-xl uppercase">Gerando Checkout...</h3></> ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-2"><QrCode size={18} className="text-emerald-500"/><h3 className="text-white font-black text-xl uppercase">Pagar via Pix</h3></div>
                <div className="bg-white p-4 rounded-3xl mx-auto w-fit"><img src={pixData.qr_code} alt="QR Code" className="w-44 h-44" /></div>
                <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 relative"><p className="text-slate-400 text-[10px] font-mono break-all line-clamp-2 text-left">{pixData.copy_paste}</p><button onClick={onCopyPix} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl ${copied ? 'bg-emerald-500 text-white' : 'bg-dark-800 text-slate-400'}`}>{copied ? <Check size={14}/> : <Copy size={14}/>}</button></div>
                <button onClick={onClose} className="w-full py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px]">Fechar</button>
              </div>
          )}
       </div>
    </div>
);

const PaymentFormModal = ({ payment, students, onSave, onCancel, isProcessing }: any) => {
  const [formData, setFormData] = useState(payment);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
        <div className="bg-dark-900 border border-dark-700 p-8 rounded-[3rem] shadow-2xl max-w-md w-full space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Receipt size={22} className="text-brand-500" /> Fatura</h3>
            <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
                {!formData.id && (
                  <select required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.studentId || ''} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                    <option value="">Aluno...</option>
                    {students.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
                <input type="text" required placeholder="Descrição" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                    <input type="date" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                    <input type="number" step="0.01" required placeholder="Valor" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                </div>
                <select className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white" value={formData.status || 'PENDING'} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="PENDING">Pendente</option><option value="OVERDUE">Atrasado</option><option value="PAID">Pago</option></select>
                <div className="grid grid-cols-2 gap-3 pt-4">
                    <button type="button" onClick={onCancel} className="py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
                    <button type="submit" disabled={isProcessing} className="py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2">{isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar</button>
                </div>
            </form>
        </div>
    </div>
  );
};
