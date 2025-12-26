
import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { Layout } from './components/Layout';
import { User, UserRole, ViewState, ClassSession, Assessment, Payment, Post, Anamnesis, Route, Challenge, PersonalizedWorkout, Address, AcademySettings } from './types';
import { MOCK_USER_ADMIN, DAYS_OF_WEEK, SUPER_ADMIN_CONFIG } from './constants';
import { 
  Dumbbell, UserPlus, Lock, ArrowRight, Check, X, Calendar, Camera, 
  Trash2, Edit, Plus, Filter, Download, User as UserIcon, Search,
  Users, Activity, DollarSign, UserCheck, CheckCircle2, XCircle, Clock,
  AlertTriangle, CreditCard, QrCode, Smartphone, Barcode, FileText,
  MessageCircle, Send, Cake, Gift, ExternalLink, Image as ImageIcon, Loader2,
  Building, Save, Settings, Repeat, Zap, Trophy, Medal, Crown, Star, Flame,
  ClipboardList, Stethoscope, Pill, AlertCircle, Phone, CheckCheck, ChevronDown,
  ArrowRightLeft, TrendingUp, TrendingDown, Minus, Diff, Map, MapPin, Flag, Globe,
  ArrowLeft, List, ChevronUp, Gauge, Video, CheckSquare, Share2, Copy, Ruler, Scale,
  Heart, Upload, FileCheck, FileSignature, CalendarCheck, PieChart, BarChart3,
  CalendarPlus, ShieldCheck, Eye, EyeOff, GraduationCap, MapPinned, CreditCard as CardIcon,
  Info, Sparkles, Target, ZapOff, ChevronRight, TrendingUp as TrendUp, Wallet, Receipt,
  BadgePercent, HandCoins, ExternalLink as LinkIcon, Copy as CopyIcon, Globe as GlobeIcon,
  Zap as ZapIcon
} from 'lucide-react';
import { SupabaseService } from './services/supabaseService';
import { GeminiService } from './services/geminiService';
import { ContractService } from './services/contractService';
import { SettingsService } from './services/settingsService';
import { MercadoPagoService } from './services/mercadoPagoService';

/* -------------------------------------------------------------------------- */
/*                                   NOTIFICATIONS                            */
/* -------------------------------------------------------------------------- */

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{
  addToast: (message: string, type?: ToastType) => void;
}>({ addToast: () => {} });

const useToast = () => useContext(ToastContext);

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: number) => void }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-fade-in min-w-[300px] ${
            toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
            toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
            'bg-brand-500/10 border-brand-500/20 text-brand-500'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 size={20} />}
          {toast.type === 'error' && <AlertCircle size={20} />}
          {toast.type === 'info' && <Info size={20} />}
          <span className="text-sm font-bold flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   SERVICES                                 */
/* -------------------------------------------------------------------------- */

const WhatsAppAutomation = {
  sendPlanSold: (student: User) => {
    const message = `Boas-vindas ao Studio, ${student.name.split(' ')[0]}! 🎉🔥 Seu plano de ${student.planDuration} meses foi ativado com sucesso! Valor mensal: R$ ${student.planValue?.toFixed(2)}. Estamos muito felizes em ter você conosco. Rumo à sua melhor versão! 💪🚀`;
    const url = `https://wa.me/${student.phoneNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },
  sendPaymentReminder: (student: User, payment: Payment) => {
    const message = `Olá ${student.name.split(' ')[0]}! 👋 Passando para lembrar que sua mensalidade vence em breve (${payment.dueDate}). Valor: R$ ${payment.amount.toFixed(2)}. Evite juros e mantenha seu acesso liberado! 🏃‍♂️💨`;
    const url = `https://wa.me/${student.phoneNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },
  sendConfirmation: (student: User, payment: Payment) => {
    const message = `Olá ${student.name.split(' ')[0]}! Recebemos seu pagamento de R$ ${payment.amount.toFixed(2)} referente a ${payment.description}. Obrigado e bom treino! 🔥`;
    const url = `https://wa.me/${student.phoneNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
};

/* -------------------------------------------------------------------------- */
/*                                    PAGES                                   */
/* -------------------------------------------------------------------------- */

const SettingsPage = () => {
  const [settings, setSettings] = useState<AcademySettings>(SettingsService.getSettings());
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const webhookUrl = `https://${settings.customDomain}/api/webhooks/mercadopago`;
  const isMPConfigured = !!(settings.mercadoPagoPublicKey && settings.mercadoPagoAccessToken);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    SettingsService.saveSettings(settings);
    addToast("Configurações salvas com sucesso!", "success");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    addToast("Link do Webhook copiado!", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Ajustes do Studio</h2>
          <p className="text-slate-400 text-sm">Controle de identidade visual, dados jurídicos e integrações.</p>
        </div>
      </header>

      <div className="bg-dark-950 p-8 rounded-3xl border border-dark-800 shadow-xl">
        <form onSubmit={handleSave} className="space-y-10">
          
          <section className="space-y-6">
            <h3 className="text-white font-bold flex items-center gap-2 border-b border-dark-800 pb-4">
               <Building className="text-brand-500" size={20}/> Dados da Academia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Domínio Próprio (Ex: studiosemovimento.com.br)</label>
                <div className="relative">
                  <GlobeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                  <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 pl-12 text-white focus:border-brand-500 outline-none font-medium" value={settings.customDomain} onChange={e => setSettings({...settings, customDomain: e.target.value})} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Nome da Academia / Razão Social</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CNPJ</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" value={settings.cnpj} onChange={e => setSettings({...settings, cnpj: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Representante Legal</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" value={settings.representativeName} onChange={e => setSettings({...settings, representativeName: e.target.value})} />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-white font-bold flex items-center gap-2 border-b border-dark-800 pb-4">
               <CreditCard className="text-brand-500" size={20}/> Gateway Mercado Pago
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Public Key</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-mono text-xs" placeholder="APP_USR-..." value={settings.mercadoPagoPublicKey} onChange={e => setSettings({...settings, mercadoPagoPublicKey: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Access Token</label>
                <input type="password" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-mono text-xs" placeholder="TEST-..." value={settings.mercadoPagoAccessToken} onChange={e => setSettings({...settings, mercadoPagoAccessToken: e.target.value})} />
              </div>
            </div>

            <div className="p-6 bg-brand-500/5 rounded-3xl border border-brand-500/10 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                {isMPConfigured ? (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">
                     <ZapIcon size={12}/> Chaves Ativas
                   </span>
                ) : (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-full border border-amber-500/20">
                     <AlertCircle size={12}/> Aguardando Chaves
                   </span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="bg-brand-600/20 p-3 rounded-2xl text-brand-500">
                  <GlobeIcon size={24}/>
                </div>
                <div>
                  <h4 className="text-white font-bold text-base">URL do Webhook</h4>
                  <p className="text-slate-500 text-xs">Aponte o Mercado Pago para este endereço para receber confirmações automáticas.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-dark-950 border border-dark-800 rounded-2xl p-4 text-brand-500 font-mono text-xs select-all break-all">
                  {webhookUrl}
                </div>
                <button 
                  type="button"
                  onClick={copyToClipboard}
                  className="px-6 py-4 bg-brand-600 text-white rounded-2xl hover:bg-brand-500 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shrink-0 shadow-lg shadow-brand-600/20"
                >
                  {copied ? <CheckCheck size={18}/> : <CopyIcon size={18}/>}
                  {copied ? 'Copiado' : 'Copiar URL'}
                </button>
              </div>
              
              <div className="mt-6 flex items-start gap-3 p-4 bg-dark-950/50 rounded-2xl border border-dark-800/50">
                <Info size={16} className="mt-0.5 shrink-0 text-brand-500"/>
                <span className="text-[11px] text-slate-400 leading-relaxed">
                  No <b>Painel do Desenvolvedor</b> do Mercado Pago, vá em integrações e adicione esta URL no campo "Notification URL". Certifique-se de selecionar os eventos de <b>payment</b> e <b>subscription</b> para automação completa.
                </span>
              </div>
            </div>
          </section>
          
          <div className="pt-6 border-t border-dark-800">
            <button type="submit" className="w-full md:w-auto px-16 py-5 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-600/25 hover:bg-brand-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
              <Save size={20}/> Salvar Configurações Gerais
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FinancialPage = ({ user }: { user: User }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<Payment | null>(null);
  const { addToast } = useToast();
  
  const isStaff = user.role !== UserRole.STUDENT;

  const refreshPayments = async () => {
    const [p, s] = await Promise.all([
      isStaff ? SupabaseService.getPayments() : SupabaseService.getPayments(user.id),
      isStaff ? SupabaseService.getAllStudents() : Promise.resolve([])
    ]);
    setPayments(p);
    setStudents(s);
  };

  useEffect(() => {
    refreshPayments();
  }, [user, isStaff]);

  const stats = useMemo(() => {
    return {
      total: payments.reduce((acc, p) => acc + p.amount, 0),
      paid: payments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0),
      overdue: payments.filter(p => p.status === 'OVERDUE').reduce((acc, p) => acc + p.amount, 0),
    };
  }, [payments]);

  const handleMarkPaid = async (p: Payment) => {
    if (!confirm("Confirmar recebimento manual?")) return;
    await SupabaseService.markPaymentAsPaid(p.id);
    const student = students.find(s => s.id === p.studentId);
    if (student) WhatsAppAutomation.sendConfirmation(student, p);
    addToast("Fatura marcada como paga!", "success");
    refreshPayments();
  };

  const handlePayWithMP = async (p: Payment) => {
    setIsProcessing(p.id);
    setShowCheckoutModal(p);
    
    setTimeout(async () => {
      try {
          const result = await MercadoPagoService.processPayment(p);
          if (result.init_point) {
              window.open(result.init_point, '_blank');
              addToast("Redirecionando para o Mercado Pago...", "info");
          }
      } catch (error) {
          addToast("Erro ao processar pagamento.", "error");
          setShowCheckoutModal(null);
      } finally {
          setIsProcessing(null);
      }
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Financeiro & Mensalidades</h2>
          <p className="text-slate-400 text-sm">Controle de pagamentos {user.role === UserRole.STUDENT ? 'do seu plano' : 'da academia'}.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 shadow-xl">
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total Pago</p>
          <p className="text-2xl font-black text-emerald-500">R$ {stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 shadow-xl">
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">A Receber</p>
          <p className="text-2xl font-black text-amber-500">R$ {(stats.total - stats.paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-brand-600 p-6 rounded-2xl shadow-xl shadow-brand-500/20 text-white">
          <p className="text-brand-100 text-[10px] font-bold uppercase mb-1">Em Atraso</p>
          <p className="text-2xl font-black">R$ {stats.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-dark-950 rounded-3xl border border-dark-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-dark-800 flex flex-col sm:flex-row justify-between items-center bg-dark-950/50 gap-4">
           <h3 className="font-bold flex items-center gap-2 text-white"><Receipt size={18}/> Faturas</h3>
           <div className="flex gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1">
             {['ALL', 'PENDING', 'OVERDUE', 'PAID'].map(f => (
               <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${filter === f ? 'bg-brand-600 text-white' : 'bg-dark-800 text-slate-500 hover:text-white'}`}>
                 {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Pendentes' : f === 'OVERDUE' ? 'Atrasadas' : 'Pagas'}
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
                const student = students.find(s => s.id === p.studentId) || user;
                return (
                  <tr key={p.id} className="hover:bg-dark-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={student.avatarUrl} className="w-8 h-8 rounded-full border border-dark-800" />
                        <div><p className="text-white font-bold">{student.name}</p><p className="text-[10px] text-slate-500">{p.description}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{p.dueDate}</td>
                    <td className="px-6 py-4 font-bold text-white">R$ {p.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
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
                                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all text-xs font-bold shadow-lg shadow-brand-500/20"
                             >
                                {isProcessing === p.id ? <Loader2 className="animate-spin" size={14}/> : <CreditCard size={14}/>}
                                Pagar
                             </button>
                          )}
                          {p.status !== 'PAID' && isStaff && (
                            <>
                                <button onClick={() => handleMarkPaid(p)} className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition-all" title="Baixa Manual"><Check size={16}/></button>
                                <button onClick={() => WhatsAppAutomation.sendPaymentReminder(student, p)} className="p-2 bg-brand-600/10 text-brand-500 rounded-lg hover:bg-brand-600 hover:text-white transition-all"><MessageCircle size={16}/></button>
                            </>
                          )}
                          {p.status === 'PAID' && (
                              <button className="p-2 bg-dark-800 text-slate-500 rounded-lg hover:text-white transition-all" title="Baixar Recibo"><Download size={16}/></button>
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
                <h3 className="text-white font-black text-xl mb-2">Conectando ao Mercado Pago</h3>
                <p className="text-slate-400 text-sm">Estamos gerando seu link de pagamento seguro para R$ {showCheckoutModal.amount.toFixed(2)}...</p>
              </div>
              <button onClick={() => setShowCheckoutModal(null)} className="w-full py-4 text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white">Cancelar</button>
           </div>
        </div>
      )}
    </div>
  );
};

const ManageUsersPage = ({ currentUser }: { currentUser: User }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [activeTab, setActiveTab] = useState<'basic' | 'plan' | 'anamnesis'>('basic');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const isSuper = currentUser.role === UserRole.SUPER_ADMIN;

    useEffect(() => { refreshList(); }, []);
    
    const refreshList = async () => {
        setIsLoading(true);
        const [uData, pData] = await Promise.all([
            SupabaseService.getAllUsers(),
            SupabaseService.getPayments()
        ]);
        setUsers(uData);
        setPayments(pData);
        setIsLoading(false);
    };

    const handleGenerateContract = (s: User) => {
      ContractService.generateContract(s);
      addToast(`Contrato de ${s.name.split(' ')[0]} gerado com sucesso!`, "success");
    };

    const handleGeneratePayments = async (student: User) => {
        if (!student.planValue || !student.planDuration) {
            addToast("Defina valor e duração do plano.", "error");
            return;
        }
        if (!confirm(`Gerar ${student.planDuration} faturas para este aluno?`)) return;

        setIsLoading(true);
        const billingDay = student.billingDay || 5;
        const startDate = new Date();
        
        for (let i = 1; i <= student.planDuration; i++) {
            const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i - 1, billingDay);
            const isoDate = dueDate.toISOString().split('T')[0].split('-').reverse().join('/');
            
            await SupabaseService.addPayment({
                studentId: student.id,
                amount: student.planValue,
                status: 'PENDING',
                dueDate: isoDate,
                description: `Mensalidade ${i}/${student.planDuration}`,
                installmentNumber: i,
                totalInstallments: student.planDuration
            });
        }
        
        WhatsAppAutomation.sendPlanSold(student);
        await refreshList();
        setIsLoading(false);
        addToast("Plano ativado e faturas geradas!", "success");
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { 
            ...formData, 
            role: formData.role || UserRole.STUDENT,
            avatarUrl: formData.avatarUrl || `https://ui-avatars.com/api/?name=${formData.name}`
        } as User;
        
        if (editingUser) {
          await SupabaseService.updateStudent(payload);
          addToast("Dados do aluno atualizados!", "success");
        } else {
          await SupabaseService.addStudent(payload);
          addToast("Novo aluno adicionado com sucesso!", "success");
        }
        
        setIsModalOpen(false); 
        refreshList();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-white">Alunos & Equipe</h2><p className="text-slate-400 text-sm">Gestão de acessos e planos recorrentes.</p></div>
                <button onClick={() => { setEditingUser(null); setFormData({ name: '', email: '', role: UserRole.STUDENT, planDuration: 12, planValue: 150, billingDay: 5, joinDate: new Date().toISOString().split('T')[0] }); setActiveTab('basic'); setIsModalOpen(true); }} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg shadow-brand-500/20">
                    <UserPlus size={16} className="mr-2" /> Novo Aluno
                </button>
            </div>

            <div className="bg-dark-950 rounded-2xl border border-dark-800 overflow-hidden overflow-x-auto shadow-2xl">
                <table className="w-full text-left text-sm text-slate-400 min-w-[900px]">
                    <thead className="bg-dark-900 font-bold uppercase text-[10px] tracking-widest text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Usuário / Plano</th>
                            <th className="px-6 py-4">Status Saúde</th>
                            <th className="px-6 py-4">Financeiro</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800">
                        {users.map(s => {
                            const isComplete = !!(s.cpf && s.rg && s.address?.zipCode);
                            const studentPayments = payments.filter(p => p.studentId === s.id);
                            const hasOverdue = studentPayments.some(p => p.status === 'OVERDUE');
                            const paidCount = studentPayments.filter(p => p.status === 'PAID').length;
                            const totalCount = s.planDuration || 0;

                            return (
                                <tr key={s.id} className="hover:bg-dark-900/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={s.avatarUrl} className="w-10 h-10 rounded-full border border-dark-800" />
                                            <div>
                                                <p className="text-white font-bold">{s.name}</p>
                                                <div className="flex items-center gap-2 text-[9px] text-brand-500 font-bold uppercase tracking-tighter">
                                                   <Repeat size={10}/> {s.planValue ? `R$ ${s.planValue} / ${s.planDuration} meses` : 'Sem Plano'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.anamnesis ? (
                                            <span className="text-emerald-500 font-bold text-[10px] uppercase flex items-center gap-1"><CheckCheck size={14}/> Avaliado</span>
                                        ) : (
                                            <span className="text-slate-600 font-bold text-[10px] uppercase flex items-center gap-1"><AlertCircle size={14}/> Pendente</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {hasOverdue ? (
                                                <span className="text-red-500 font-bold text-[9px] uppercase flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 w-fit"><AlertTriangle size={10}/> Inadimplente</span>
                                            ) : (
                                                <span className="text-emerald-500 font-bold text-[9px] uppercase flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-red-500/20 w-fit"><CheckCircle2 size={10}/> Em dia</span>
                                            )}
                                            <div className="text-[10px] text-slate-500 font-mono">
                                                Progresso: {paidCount}/{totalCount} parcelas
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="flex justify-end gap-2">
                                          <button onClick={() => { setEditingUser(s); setFormData(s); setActiveTab('basic'); setIsModalOpen(true); }} className="text-slate-400 hover:text-white p-2 hover:bg-dark-800 rounded transition-all"><Edit size={16} /></button>
                                          <button onClick={() => handleGenerateContract(s)} disabled={!isComplete} className={`p-2 rounded transition-all ${isComplete ? 'text-brand-500 hover:bg-brand-500/10' : 'text-slate-700 opacity-20'}`} title="Baixar Contrato"><FileText size={16}/></button>
                                          <button onClick={() => handleGeneratePayments(s)} className="text-brand-500 hover:bg-brand-500/10 p-2 rounded transition-all" title="Gerar Recorrência"><Receipt size={16} /></button>
                                       </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
                    <div className="bg-dark-900 border border-dark-700 w-full max-w-2xl rounded-2xl shadow-2xl relative my-auto">
                        <div className="p-6 border-b border-dark-800 flex justify-between items-center bg-dark-950 rounded-t-2xl">
                            <h3 className="text-white font-bold text-xl flex items-center gap-2">{editingUser ? <Edit size={24}/> : <UserPlus size={24}/>} {editingUser ? 'Editar' : 'Novo'} Registro</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white p-2"><X size={24}/></button>
                        </div>
                        <div className="flex border-b border-dark-800 bg-dark-950/50">
                            {[ 
                                { id: 'basic', label: 'Básico', icon: Info }, 
                                { id: 'plan', label: 'Plano / Recorrência', icon: Repeat },
                                { id: 'anamnesis', label: 'Saúde', icon: Stethoscope } 
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === tab.id ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-slate-500 hover:text-white'}`}><tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span></button>
                            ))}
                        </div>
                        <form onSubmit={handleSave} className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
                            {activeTab === 'basic' && (
                                <div className="space-y-4 animate-fade-in grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2"><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Nome Completo</label><input required className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">E-mail</label><input required type="email" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">WhatsApp</label><input required className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" placeholder="(00) 00000-0000" value={formData.phoneNumber || ''} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} /></div>
                                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CPF</label><input className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} /></div>
                                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">RG</label><input className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.rg || ''} onChange={e => setFormData({...formData, rg: e.target.value})} /></div>
                                </div>
                            )}

                            {activeTab === 'plan' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-brand-500/5 p-6 rounded-2xl border border-brand-500/10">
                                        <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><HandCoins size={18} className="text-brand-500"/> Configuração do Plano Recorrente</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Mensalidade (R$)</label>
                                                <input type="number" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white font-bold" value={formData.planValue || 0} onChange={e => setFormData({...formData, planValue: Number(e.target.value)})} />
                                            </div>
                                            <div>
                                                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Duração (Meses)</label>
                                                <select className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white" value={formData.planDuration || 12} onChange={e => setFormData({...formData, planDuration: Number(e.target.value)})}>
                                                    {[1, 3, 6, 12, 24].map(m => <option key={m} value={m}>{m} meses</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Dia Vencimento</label>
                                                <input type="number" min="1" max="31" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white" value={formData.billingDay || 5} onChange={e => setFormData({...formData, billingDay: Number(e.target.value)})} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'anamnesis' && (
                                <div className="space-y-4 animate-fade-in">
                                    <label className="flex items-center gap-3 cursor-pointer group bg-dark-950 p-4 rounded-xl border border-dark-800">
                                        <input type="checkbox" checked={formData.anamnesis?.hasInjury} onChange={e => setFormData({...formData, anamnesis: { ...formData.anamnesis as any, hasInjury: e.target.checked }})} className="w-5 h-5 accent-brand-500" />
                                        <span className="text-slate-300 text-sm">Possui alguma lesão ou restrição médica?</span>
                                    </label>
                                    <textarea placeholder="Observações de saúde..." className="w-full h-32 bg-dark-950 border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none" value={formData.anamnesis?.notes || ''} onChange={e => setFormData({...formData, anamnesis: { ...formData.anamnesis as any, notes: e.target.value }})} />
                                </div>
                            )}
                        </form>
                        <div className="p-6 border-t border-dark-800 flex gap-4 bg-dark-950 rounded-b-2xl">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-dark-800 text-white font-bold rounded-xl uppercase text-[10px] tracking-widest">Cancelar</button>
                            <button onClick={handleSave} className="flex-1 py-4 bg-brand-600 text-white font-bold rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-brand-600/20">Salvar Dados</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Dashboard = ({ user, onNavigate }: { user: User, onNavigate: (v: ViewState) => void }) => {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            if (user.role !== UserRole.STUDENT) {
                const allS = await SupabaseService.getAllStudents();
                const allP = await SupabaseService.getPayments();
                const overdue = allP.filter(p => p.status === 'OVERDUE').length;
                setStats({ totalStudents: allS.length, overdue });
            }
        };
        loadData();
    }, [user]);

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-white tracking-tighter">Olá, {user.name.split(' ')[0]}!</h1>
                <div className="bg-dark-950 p-2 rounded-full border border-dark-800 text-brand-500 shadow-xl shadow-brand-500/10"><Zap size={24}/></div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => onNavigate('MANAGE_USERS')} className="bg-dark-950 p-8 rounded-3xl border border-dark-800 shadow-xl cursor-pointer hover:border-brand-500 transition-all group relative overflow-hidden">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-2 tracking-widest">Alunos Ativos</p>
                    <p className="text-5xl font-black text-white">{stats?.totalStudents || 0}</p>
                    <div className="mt-6 flex items-center gap-1 text-emerald-500 text-xs font-bold uppercase"><TrendingUp size={14}/> Gestão em Dia</div>
                    <Users size={80} className="absolute -right-4 -bottom-4 text-white opacity-[0.03]" />
                </div>
                
                <div onClick={() => onNavigate('FINANCIAL')} className="bg-dark-950 p-8 rounded-3xl border border-dark-800 shadow-xl cursor-pointer hover:border-red-500 transition-all group relative overflow-hidden">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-2 tracking-widest">Inadimplência</p>
                    <p className="text-5xl font-black text-red-500">{stats?.overdue || 0}</p>
                    <div className="mt-6 flex items-center gap-1 text-slate-500 text-xs font-bold uppercase underline">Ver Cobranças</div>
                    <AlertTriangle size={80} className="absolute -right-4 -bottom-4 text-red-500 opacity-[0.03]" />
                </div>

                <div onClick={() => onNavigate('SETTINGS')} className="bg-brand-600 p-8 rounded-3xl shadow-2xl shadow-brand-500/20 text-white cursor-pointer hover:bg-brand-500 transition-all relative overflow-hidden">
                    <h3 className="font-bold text-xl mb-1">Ajustes Studio</h3>
                    <p className="text-brand-100 text-xs mb-8">Dados jurídicos e contratos.</p>
                    <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest">Configurar <ArrowRight size={18}/></div>
                    <Settings size={80} className="absolute -right-4 -bottom-4 text-white opacity-10" />
                </div>
            </div>
        </div>
    );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const handleLogin = (u: User) => { setUser(u); setView('DASHBOARD'); };
  const handleLogout = () => { setUser(null); setView('LOGIN'); };

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;
  
  return (
    <ToastContext.Provider value={{ addToast }}>
      <Layout currentUser={user} currentView={view} onNavigate={setView} onLogout={handleLogout}>
        {view === 'DASHBOARD' && <Dashboard user={user} onNavigate={setView} />}
        {view === 'MANAGE_USERS' && <ManageUsersPage currentUser={user} />}
        {view === 'FINANCIAL' && <FinancialPage user={user} />}
        {view === 'SETTINGS' && <SettingsPage />}
        {['SCHEDULE', 'ASSESSMENTS', 'RANKING', 'ROUTES', 'PERSONAL_WORKOUTS', 'FEED', 'REPORTS'].includes(view) && (
          <div className="bg-dark-950 p-12 rounded-3xl border border-dark-800 text-center animate-pulse">
            <p className="text-slate-500 font-bold uppercase tracking-widest">Módulo {view} em Desenvolvimento</p>
          </div>
        )}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </Layout>
    </ToastContext.Provider>
  );
};

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === SUPER_ADMIN_CONFIG.email && password === SUPER_ADMIN_CONFIG.password) {
            onLogin(SUPER_ADMIN_CONFIG as any);
        }
    };
    return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
            <div className="bg-dark-900 p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-dark-800 text-center animate-fade-in">
                <div className="bg-brand-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/20 rotate-12">
                   <Dumbbell className="text-white" size={40} />
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter mb-10">Studio</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" required className="w-full bg-dark-950 border border-dark-700 rounded-2xl p-5 text-white focus:border-brand-500 outline-none text-lg" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
                    <input type="password" required className="w-full bg-dark-950 border border-dark-700 rounded-2xl p-5 text-white focus:border-brand-500 outline-none text-lg" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="submit" className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all text-sm">Acessar Plataforma</button>
                </form>
            </div>
        </div>
    );
};

export default App;
