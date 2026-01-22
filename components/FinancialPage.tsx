
import React, { useState, useEffect, useMemo } from 'react';
import { Payment, User, UserRole, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { MercadoPagoService } from '../services/mercadoPagoService';
import { Loader2, DollarSign, Receipt, Check, Download, CreditCard, MessageCircle, AlertTriangle, X, CheckCircle2, Info, Copy, QrCode, Smartphone, Wallet, Tag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast, WhatsAppAutomation } from '../App'; 

interface FinancialPageProps {
  user: User;
  onNavigate: (view: ViewState) => void;
  selectedStudentId?: string; 
}

export const FinancialPage = ({ user, onNavigate, selectedStudentId }: FinancialPageProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<User[]>([]); 
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<Payment | null>(null);
  const [showConfirmPayment, setShowConfirmPayment] = useState<Payment | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState<string | null>(null);
  const { addToast } = useToast();
  
  const isStaff = user.role !== UserRole.STUDENT;

  const refreshPayments = async () => {
    let studentIdToFetch = selectedStudentId;
    if (!isStaff && user.id) { 
      studentIdToFetch = user.id;
    }

    try { 
      const [p, u] = await Promise.all([
        SupabaseService.getPayments(studentIdToFetch),
        isStaff ? SupabaseService.getAllUsers() : Promise.resolve([]) 
      ]);
      setPayments(p || []);
      setStudents(isStaff ? u.filter((u: User) => u?.role === UserRole.STUDENT) : []);
    } catch (error: any) {
        addToast(`Erro ao carregar pagamentos.`, "error");
    }
  };

  useEffect(() => {
    refreshPayments();
  }, [user, isStaff, selectedStudentId]);

  const stats = useMemo(() => {
    return {
      total: payments.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0),
      paid: payments.filter(p => p?.status === 'PAID').reduce((acc, p) => acc + (Number(p?.amount) || 0), 0),
      overdue: payments.filter(p => p?.status === 'OVERDUE').reduce((acc, p) => acc + (Number(p?.amount) || 0), 0),
    };
  }, [payments]);

  const handleMarkPaid = async (paymentId?: string) => {
    const idToPay = paymentId || showConfirmPayment?.id;
    if (!idToPay) return;
    
    setIsProcessing(idToPay);
    try {
        await SupabaseService.markPaymentAsPaid(idToPay);
        addToast("Pagamento liquidado com sucesso!", "success");
        setShowConfirmPayment(null);
        setShowCheckoutModal(null);
        refreshPayments();
    } catch (error: any) {
        addToast(`Erro ao processar baixa.`, "error");
    } finally {
        setIsProcessing(null);
    }
  };

  const handlePayNow = (p: Payment) => {
    setShowCheckoutModal(p);
    setPixCopiaCola(`00020101021226850014br.gov.bcb.pix0123estudio@pix.com.br520400005303986540${Number(p.amount).toFixed(2)}5802BR5915STUDIO_FITNESS6009SAO_PAULO62070503***6304E1F4`);
  };

  const copyPix = () => {
    if (pixCopiaCola) {
        navigator.clipboard.writeText(pixCopiaCola);
        addToast("Código Pix copiado!", "success");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('DASHBOARD')} className="p-2.5 bg-dark-950 border border-dark-800 text-slate-500 rounded-full hover:text-brand-500 hover:border-brand-500/50 transition-all active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Fluxo Financeiro</h2>
            <p className="text-slate-400 text-sm">Gerencie faturas, recebimentos e inadimplência.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl border-l-4 border-l-emerald-500">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Recebido</p>
          <p className="text-3xl font-black text-emerald-500">R$ {stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl border-l-4 border-l-amber-500">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">A Receber</p>
          <p className="text-3xl font-black text-amber-500">R$ {(stats.total - stats.paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-brand-600 p-6 rounded-3xl shadow-xl shadow-brand-500/20 text-white relative overflow-hidden">
          <Wallet className="absolute -right-4 -bottom-4 text-brand-500 opacity-20" size={100}/>
          <p className="text-brand-100 text-[10px] font-black uppercase tracking-widest mb-1">Em Atraso</p>
          <p className="text-3xl font-black">R$ {stats.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-dark-950 rounded-[2.5rem] border border-dark-800 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-dark-800 flex flex-col sm:flex-row justify-between items-center bg-dark-950/50 gap-4">
           <h3 className="font-black uppercase tracking-tighter flex items-center gap-3 text-white"><Receipt size={20} className="text-brand-500"/> Gestão de Mensalidades</h3>
           <div className="flex gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
             {['ALL', 'PENDING', 'OVERDUE', 'PAID'].map(f => (
               <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'bg-brand-600 text-white shadow-lg' : 'bg-dark-900 text-slate-500 hover:text-white'}`}>
                 {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Pendentes' : f === 'OVERDUE' ? 'Atrasadas' : 'Pagas'}
               </button>
             ))}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400 min-w-[800px]">
            <thead className="bg-dark-900/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-8 py-6">Detalhes da Mensalidade</th>
                <th className="px-8 py-6">Vencimento</th>
                <th className="px-8 py-6">Valor</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {payments.filter(p => filter === 'ALL' || p?.status === filter).map(p => {
                const userForPayment = students.find(s => s?.id === p?.studentId) || user;
                const isPaid = p?.status === 'PAID';

                return (
                  <tr key={p.id} className={`hover:bg-dark-900/50 transition-colors group ${isPaid ? 'opacity-60' : ''}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={String(userForPayment?.avatarUrl || `https://ui-avatars.com/api/?name=${String(userForPayment?.name)}`)} className="w-10 h-10 rounded-xl border border-dark-800" />
                        <div>
                            <p className="text-white font-bold">{String(userForPayment?.name || 'Membro')}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{String(p.description || 'Mensalidade')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-mono text-xs font-bold">{String(p.dueDate || '').split('-').reverse().join('/')}</td>
                    <td className="px-8 py-6 font-black text-white text-base">R$ {Number(p.amount || 0).toFixed(2)}</td>
                    <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            p.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            p.status === 'OVERDUE' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                            {p.status === 'PAID' ? 'Liquidado' : p.status === 'OVERDUE' ? 'Atrasado' : 'Aberto'}
                        </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2">
                          {!isPaid && !isStaff && (
                             <button 
                                onClick={() => handlePayNow(p)} 
                                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-600/20"
                             >
                                <Smartphone size={14}/> Pagar
                             </button>
                          )}
                          {!isPaid && isStaff && (
                            <>
                                <button 
                                    onClick={() => setShowConfirmPayment(p)} 
                                    className="p-3 bg-emerald-600/10 text-emerald-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-500/20" 
                                >
                                    <Check size={16}/>
                                </button>
                                <button 
                                    onClick={() => userForPayment && WhatsAppAutomation.sendPaymentReminder(userForPayment, p)} 
                                    className="p-3 bg-dark-900 text-slate-400 rounded-xl hover:text-white transition-all border border-dark-800"
                                >
                                    <MessageCircle size={16}/>
                                </button>
                            </>
                          )}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showConfirmPayment && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
           <div className="bg-dark-900 border border-dark-700 rounded-[3rem] shadow-2xl max-w-sm w-full overflow-hidden">
              <div className="bg-emerald-600 p-8 text-center relative">
                  <button onClick={() => setShowConfirmPayment(null)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24}/></button>
                  <div className="bg-white p-3 rounded-3xl inline-block mb-4 shadow-xl">
                    <CheckCircle2 size={40} className="text-emerald-600"/>
                  </div>
                  <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Confirmar Recebimento</h3>
              </div>
              <div className="p-8 space-y-6">
                <button 
                    onClick={() => handleMarkPaid()}
                    disabled={!!isProcessing}
                    className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
                >
                    {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <><Check size={18}/> Confirmar Baixa</>}
                </button>
              </div>
           </div>
        </div>
      )}

      {showCheckoutModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
           <div className="bg-dark-900 border border-dark-700 rounded-[3rem] shadow-2xl max-sm w-full overflow-hidden">
              <div className="bg-brand-600 p-8 text-center relative">
                  <button onClick={() => setShowCheckoutModal(null)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24}/></button>
                  <div className="bg-white p-3 rounded-3xl inline-block mb-4 shadow-xl">
                    <QrCode size={40} className="text-brand-600"/>
                  </div>
                  <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Pagar via Pix</h3>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Código para Copiar</p>
                    <div className="relative">
                        <textarea 
                            readOnly 
                            className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-4 text-[10px] font-mono text-brand-500 h-24 resize-none"
                            value={pixCopiaCola || ''}
                        />
                        <button onClick={copyPix} className="absolute bottom-4 right-4 p-3 bg-brand-600 text-white rounded-xl"><Copy size={16}/></button>
                    </div>
                </div>
                <div className="pt-4 space-y-3">
                    <button 
                        onClick={() => handleMarkPaid(showCheckoutModal.id)}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                    >
                        <Check size={16}/> SIMULAR CONFIRMAÇÃO (TESTE)
                    </button>
                    <button onClick={() => setShowCheckoutModal(null)} className="w-full py-4 bg-dark-800 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
