
import React, { useState, useEffect, useMemo } from 'react';
import { Payment, User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { MercadoPagoService } from '../services/mercadoPagoService';
import { Loader2, DollarSign, Receipt, Check, Download, CreditCard, MessageCircle, AlertTriangle, X, CheckCheck, Info } from 'lucide-react';
import { useToast, WhatsAppAutomation } from '../App'; 

interface FinancialPageProps {
  user: User;
  selectedStudentId?: string; 
}

export const FinancialPage = ({ user, selectedStudentId }: FinancialPageProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<User[]>([]); 
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<Payment | null>(null);
  const { addToast } = useToast();
  
  const isStaff = user.role !== UserRole.STUDENT;

  const refreshPayments = async () => {
    let studentIdToFetch = selectedStudentId;
    if (!isStaff && user.id) { 
      studentIdToFetch = user.id;
    }

    try { 
      const [p, s] = await Promise.all([
        SupabaseService.getPayments(studentIdToFetch),
        isStaff ? SupabaseService.getAllUsers() : Promise.resolve([]) 
      ]);
      setPayments(p);
      setStudents(s);
    } catch (error: any) {
        console.error("Erro ao carregar pagamentos:", error.message || JSON.stringify(error));
        addToast(`Erro ao carregar pagamentos: ${error.message}`, "error");
    }
  };

  useEffect(() => {
    refreshPayments();
  }, [user, isStaff, selectedStudentId, addToast]);

  const stats = useMemo(() => {
    return {
      total: payments.reduce((acc, p) => acc + p.amount, 0),
      paid: payments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0),
      overdue: payments.filter(p => p.status === 'OVERDUE').reduce((acc, p) => acc + p.amount, 0),
    };
  }, [payments]);

  const handleMarkPaid = async (p: Payment) => {
    if (!confirm("Confirmar recebimento manual deste valor?")) return;
    try {
        await SupabaseService.markPaymentAsPaid(p.id);
        const student = students.find(s => s.id === p.studentId) || user; 
        if (student) WhatsAppAutomation.sendConfirmation(student, p);
        addToast("Pagamento registrado com sucesso!", "success");
        refreshPayments();
    } catch (error: any) {
        console.error("Erro ao marcar pagamento:", error.message || JSON.stringify(error));
        addToast(`Erro ao processar baixa: ${error.message}`, "error");
    }
  };

  const handlePayWithMP = async (p: Payment) => {
    setIsProcessing(p.id);
    setShowCheckoutModal(p);
    
    setTimeout(async () => {
      try {
          const result = await MercadoPagoService.processPayment(p);
          if (result.init_point) {
              window.open(result.init_point, '_blank');
              addToast("Redirecionando para o ambiente seguro do Mercado Pago...", "info");
          }
      } catch (error: any) { 
          console.error("Erro ao processar pagamento:", error.message || JSON.stringify(error)); 
          addToast(`Erro na integração com Mercado Pago: ${error.message}`, "error");
          setShowCheckoutModal(null);
      } finally {
          setIsProcessing(null);
      }
    }, 2000);
  };

  const currentStudentName = useMemo(() => { 
    return selectedStudentId 
      ? students.find(s => s.id === selectedStudentId)?.name || 'Usuário Desconhecido'
      : '';
  }, [selectedStudentId, students]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Financeiro & Mensalidades</h2>
          <p className="text-slate-400 text-sm">Controle de pagamentos {selectedStudentId ? `de ${currentStudentName}` : (user.role === UserRole.STUDENT ? 'do seu plano' : 'da academia')}.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 shadow-xl">
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total Recebido</p>
          <p className="text-2xl font-black text-emerald-500">R$ {stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 shadow-xl">
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total a Receber</p>
          <p className="text-2xl font-black text-amber-500">R$ {(stats.total - stats.paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-brand-600 p-6 rounded-2xl shadow-xl shadow-brand-500/20 text-white">
          <p className="text-brand-100 text-[10px] font-bold uppercase mb-1">Total em Atraso</p>
          <p className="text-2xl font-black">R$ {stats.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-dark-950 rounded-3xl border border-dark-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-dark-800 flex flex-col sm:flex-row justify-between items-center bg-dark-950/50 gap-4">
           <h3 className="font-bold flex items-center gap-2 text-white"><Receipt size={18}/> Faturas</h3>
           <div className="flex gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1">
             {[
               { id: 'ALL', label: 'Todas' },
               { id: 'PENDING', label: 'Pendentes' },
               { id: 'OVERDUE', label: 'Atrasadas' },
               { id: 'PAID', label: 'Pagas' }
             ].map(f => (
               <button key={f.id} onClick={() => setFilter(f.id as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap tracking-widest ${filter === f.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'bg-dark-800 text-slate-500 hover:text-white'}`}>
                 {f.label}
               </button>
             ))}
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-dark-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">Fatura / Aluno</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {payments.filter(p => filter === 'ALL' || p.status === filter).map(p => {
                const userForPayment = students.find(s => s.id === p.studentId) || user;
                if (!userForPayment) return null;

                const student: User = userForPayment; 
                
                return (
                  <tr key={p.id} className="hover:bg-dark-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={String(userForPayment.avatarUrl || `https://ui-avatars.com/api/?name=${String(userForPayment.name)}`)} className="w-8 h-8 rounded-full border border-dark-800" />
                        <div><p className="text-white font-bold">{String(userForPayment.name)}</p><p className="text-[10px] text-slate-500">{String(p.description)}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{String(p.dueDate)}</td>
                    <td className="px-6 py-4 font-bold text-white">R$ {p.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
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
                             <button 
                                onClick={() => handlePayWithMP(p)} 
                                disabled={isProcessing === p.id}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-500/20"
                             >
                                {isProcessing === p.id ? <Loader2 className="animate-spin" size={14}/> : <CreditCard size={14}/>}
                                Pagar Agora
                             </button>
                          )}
                          {p.status !== 'PAID' && isStaff && (
                            <>
                                <button onClick={() => handleMarkPaid(p)} className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition-all" title="Registrar Recebimento Manual"><Check size={16}/></button>
                                <button onClick={() => WhatsAppAutomation.sendPaymentReminder(student, p)} className="p-2 bg-brand-600/10 text-brand-500 rounded-lg hover:bg-brand-600 hover:text-white transition-all" title="Lembrar via WhatsApp"><MessageCircle size={16}/></button>
                            </>
                          )}
                          {p.status === 'PAID' && (
                              <button className="p-2 bg-dark-800 text-slate-500 rounded-lg hover:text-white transition-all" title="Baixar Recibo de Pagamento"><Download size={16}/></button>
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

      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
           <div className="bg-dark-900 border border-dark-700 p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6">
              <div className="bg-brand-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-brand-500/30">
                 {isProcessing ? <Loader2 className="text-white animate-spin" size={48}/> : <CheckCheck className="text-white" size={48}/>}
              </div>
              <div>
                <h3 className="text-white font-black text-xl mb-2">Processando Pagamento Seguro</h3>
                <p className="text-slate-400 text-sm">Estamos conectando você ao Mercado Pago para realizar o pagamento de R$ {showCheckoutModal.amount.toFixed(2)} com total segurança.</p>
              </div>
              <button onClick={() => setShowCheckoutModal(null)} className="w-full py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white">Cancelar e Voltar</button>
           </div>
        </div>
      )}
    </div>
  );
};
