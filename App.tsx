
import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { Layout } from './components/Layout';
import { User, UserRole, ViewState, ClassSession, Assessment, Payment, Post, Anamnesis, Route, Challenge, PersonalizedWorkout, Address, AcademySettings, AppNavParams } from './types';
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
import { UserFormPage } from './components/UserFormPage';
import { SchedulePage } from './components/SchedulePage';
import { AssessmentsPage } from './components/AssessmentsPage.tsx';
import { RankingPage } from './components/RankingPage.tsx';
import { RoutesPage } from './components/RoutesPage.tsx';
import { PersonalWorkoutsPage } from './components/PersonalWorkoutsPage.tsx';
import { FeedPage } from './components/FeedPage.tsx';
import { ReportsPage } from './components/ReportsPage.tsx';
import { ManageUsersPage } from './components/ManageUsersPage';
import { RegistrationPage } from './components/RegistrationPage';
import { CompleteProfilePage } from './components/CompleteProfilePage'; 


/* -------------------------------------------------------------------------- */
/*                                   NOTIFICAÇÕES                             */
/* -------------------------------------------------------------------------- */

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export const ToastContext = createContext<{
  addToast: (message: string, type?: ToastType) => void;
}>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

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
/*                                   SERVIÇOS                                 */
/* -------------------------------------------------------------------------- */

export const WhatsAppAutomation = {
  sendPlanSold: (student: User) => {
    const message = `Boas-vindas ao Studio, ${String(student.name).split(' ')[0]}! 🎉🔥 Seu plano de ${student.planDuration} meses foi ativado com sucesso! Valor mensal: R$ ${student.planValue?.toFixed(2)}. Estamos muito felizes em ter você conosco. Rumo à sua melhor versão! 💪🚀`;
    const url = `https://wa.me/${String(student.phoneNumber)?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },
  sendPaymentReminder: (student: User, payment: Payment) => {
    const message = `Olá ${String(student.name).split(' ')[0]}! 👋 Passando para lembrar que sua mensalidade vence em breve (${payment.dueDate}). Valor: R$ ${payment.amount.toFixed(2)}. Evite juros e mantenha seu acesso liberado! 🏃‍♂️💨`;
    const url = `https://wa.me/${String(student.phoneNumber)?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },
  sendConfirmation: (student: User, payment: Payment) => {
    const message = `Olá ${String(student.name).split(' ')[0]}! Recebemos seu pagamento de R$ ${payment.amount.toFixed(2)} referente a ${payment.description}. Obrigado e bom treino! 🔥`;
    const url = `https://wa.me/${String(student.phoneNumber)?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },
  sendGenericMessage: (student: User, customMessage: string) => {
    const message = `Olá ${String(student.name).split(' ')[0]}! 👋\n\n${customMessage}`;
    const url = `https://wa.me/${String(student.phoneNumber)?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
};

/* -------------------------------------------------------------------------- */
/*                                   PÁGINAS                                  */
/* -------------------------------------------------------------------------- */

const SettingsPage = ({ currentUser }: { currentUser: User }) => { 
  const [settings, setSettings] = useState<AcademySettings>(SettingsService.getSettings());
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const webhookUrl = `https://${settings.customDomain}/api/webhooks/mercadopago`;
  const isMPConfigured = !!(settings.mercadoPagoPublicKey && settings.mercadoPagoAccessToken);
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN; 

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      SettingsService.saveSettings(settings);
      addToast("Configurações salvas com sucesso!", "success");
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error.message || JSON.stringify(error));
      addToast(`Erro ao salvar configurações: ${error.message || JSON.stringify(error)}`, "error");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    addToast("Link do Webhook copiado!", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setSettings(prev => ({
      ...prev,
      academyAddress: {
        ...(prev.academyAddress as Address),
        [field]: value
      }
    }));
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
                  <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 pl-12 text-white focus:border-brand-500 outline-none font-medium" value={String(settings.customDomain || '')} onChange={e => setSettings({...settings, customDomain: e.target.value})} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Nome da Academia / Razão Social</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" value={String(settings.name || '')} onChange={e => setSettings({...settings, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CNPJ</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" value={String(settings.cnpj || '')} onChange={e => setSettings({...settings, cnpj: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Representante Legal</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" value={String(settings.representativeName || '')} onChange={e => setSettings({...settings, representativeName: e.target.value})} />
              </div>
              <div className="md:col-span-2 pt-4 border-t border-dark-800">
                 <h4 className="text-white font-bold text-sm flex items-center gap-2"><MapPin size={18} className="text-brand-500"/> Endereço Completo</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CEP</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(settings.academyAddress?.zipCode || '')} onChange={e => handleAddressChange('zipCode', e.target.value)} /></div>
                   <div className="sm:col-span-2"><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Rua / Avenida</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(settings.academyAddress?.street || '')} onChange={e => handleAddressChange('street', e.target.value)} /></div>
                   <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Número</label><input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(settings.academyAddress?.number || '')} onChange={e => handleAddressChange('number', e.target.value)} /></div>
                   <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Complemento</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(settings.academyAddress?.complement || '')} onChange={e => handleAddressChange('complement', e.target.value)} /></div>
                   <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Bairro</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(settings.academyAddress?.neighborhood || '')} onChange={e => handleAddressChange('neighborhood', e.target.value)} /></div>
                   <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Cidade</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(settings.academyAddress?.city || '')} onChange={e => handleAddressChange('city', e.target.value)} /></div>
                   <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Estado</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(settings.academyAddress?.state || '')} onChange={e => handleAddressChange('state', e.target.value)} /></div>
                 </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-white font-bold flex items-center gap-2 border-b border-dark-800 pb-4">
               <CardIcon className="text-brand-500" size={20}/> Gateway Mercado Pago
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Public Key</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-mono text-xs" placeholder="APP_USR-..." value={String(settings.mercadoPagoPublicKey || '')} onChange={e => setSettings({...settings, mercadoPagoPublicKey: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Access Token</label>
                <input type="password" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-mono text-xs" placeholder="TEST-..." value={String(settings.mercadoPagoAccessToken || '')} onChange={e => setSettings({...settings, mercadoPagoAccessToken: e.target.value})} />
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

          {isSuperAdmin && ( 
            <section className="space-y-6">
                <h3 className="text-white font-bold flex items-center gap-2 border-b border-dark-800 pb-4">
                   <Lock className="text-brand-500" size={20}/> Segurança & Acessos
                </h3>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Código de Convite para Cadastro de Alunos</label>
                    <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-medium" value={String(settings.registrationInviteCode || '')} onChange={e => setSettings({...settings, registrationInviteCode: e.target.value})} />
                    <p className="text-slate-500 text-xs mt-2">Este código é exigido para novos alunos se registrarem no aplicativo.</p>
                </div>
            </section>
          )}
          
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

const FinancialPage = ({ user, selectedStudentId }: { user: User, selectedStudentId?: string }) => {
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
        addToast(`Erro ao carregar pagamentos: ${error.message || JSON.stringify(error)}`, "error");
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
    if (!confirm("Confirmar recebimento manual?")) return;
    try {
      await SupabaseService.markPaymentAsPaid(p.id);
      const student = students.find(s => s.id === p.studentId); 
      if (student) WhatsAppAutomation.sendConfirmation(student, p); 
      addToast("Fatura marcada como paga!", "success");
      refreshPayments();
    } catch (error: any) {
      console.error("Erro ao marcar pagamento:", error.message || JSON.stringify(error));
      addToast(`Erro ao marcar pagamento: ${error.message || JSON.stringify(error)}`, "error");
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
              addToast("Redirecionando para o Mercado Pago...", "info");
          }
      } catch (error: any) { 
          console.error("Erro ao processar pagamento do Mercado Pago:", error.message || JSON.stringify(error));
          addToast(`Erro ao processar pagamento: ${error.message || JSON.stringify(error)}`, "error");
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
                <th className="px-6 py-4">Fatura / Usuário</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {payments.filter(p => filter === 'ALL' || p.status === filter).map(p => {
                const userForPayment = isStaff ? students.find(s => s.id === p.studentId) : user; 
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

// Main App Component
function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [navParams, setNavParams] = useState<AppNavParams>({}); 
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(0);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = nextToastId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      // If user is a student and profile is not completed, force to complete profile page
      if (user.role === UserRole.STUDENT && user.profileCompleted === false) {
        setCurrentView('COMPLETE_PROFILE');
      } else {
        setCurrentView('DASHBOARD');
      }
    } else {
      setCurrentView('LOGIN');
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    // Check if the student needs to complete their profile
    if (user.role === UserRole.STUDENT && user.profileCompleted === false) {
      setCurrentView('COMPLETE_PROFILE');
    } else {
      setCurrentView('DASHBOARD');
    }
    addToast(`Bem-vindo(a) de volta, ${String(user.name).split(' ')[0]}!`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView('LOGIN');
    addToast("Você saiu da sua conta.", "info");
  };

  const handleNavigate = (view: ViewState, params: AppNavParams = {}) => {
    setCurrentView(view);
    setNavParams(params); 
  };

  const handleProfileComplete = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser)); 
    setCurrentView('DASHBOARD');
  };


  const renderContent = () => {
    if (!currentUser) {
      if (currentView === 'REGISTRATION') {
        return <RegistrationPage onLogin={handleLogin} onCancelRegistration={() => handleNavigate('LOGIN')} />;
      }
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
          <div className="bg-dark-900 p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-dark-800 text-center animate-fade-in">
            <div className="bg-brand-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/20 rotate-12">
              <Dumbbell className="text-white" size={40} />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-10">Studio</h1>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as typeof e.target & {
                email: { value: string };
                password: { value: string };
              };
              const email = target.email.value;
              const password = target.password.value;

              try {
                let user: User | null = null;
                // Check against SUPER_ADMIN_CONFIG
                if (email === SUPER_ADMIN_CONFIG.email && password === SUPER_ADMIN_CONFIG.password) {
                  user = { ...SUPER_ADMIN_CONFIG, profileCompleted: true }; 
                } else {
                  // Fetch all users and check for matching credentials
                  const allUsers = await SupabaseService.getAllUsers();
                  user = allUsers.find(u => u.email === email && u.password === password) || null;
                }

                if (user) {
                  handleLogin(user);
                } else {
                  addToast("Credenciais inválidas. Tente novamente.", "error");
                }
              } catch (error: any) {
                console.error("Erro no login:", error.message || JSON.stringify(error));
                addToast(`Erro no login: ${error.message || JSON.stringify(error)}. Tente novamente.`, "error");
              }
            }} className="space-y-4">
              <input
                type="email"
                name="email"
                required
                className="w-full bg-dark-950 border border-dark-700 rounded-2xl p-5 text-white focus:border-brand-500 outline-none text-lg"
                placeholder="Seu E-mail"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full bg-dark-950 border border-dark-700 rounded-2xl p-5 text-white focus:border-brand-500 outline-none text-lg pr-14"
                  placeholder="Sua Senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-white transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all text-sm"
              >
                Entrar
              </button>
              <button 
                type="button" 
                onClick={() => handleNavigate('REGISTRATION')} 
                className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white mt-4"
              >
                <UserPlus size={16} className="inline mr-2" /> Cadastre-se
              </button>
            </form>
          </div>
        </div>
      );
    }

    // User is logged in, render main layout
    return (
      <Layout currentUser={currentUser} currentView={currentView} onNavigate={handleNavigate} onLogout={handleLogout}>
        {currentView === 'DASHBOARD' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Olá, {String(currentUser.name).split(' ')[0]}! 👋</h2>
            <p className="text-slate-400 text-sm">Bem-vindo ao seu painel de controle.</p>
            {/* Cards and content for Dashboard */}
          </div>
        )}
        {currentView === 'SCHEDULE' && <SchedulePage currentUser={currentUser} addToast={addToast} />}
        {currentView === 'ASSESSMENTS' && <AssessmentsPage currentUser={currentUser} addToast={addToast} initialStudentId={navParams.studentId} />}
        {currentView === 'FINANCIAL' && <FinancialPage user={currentUser} selectedStudentId={navParams.studentId} />}
        {currentView === 'MANAGE_USERS' && <ManageUsersPage currentUser={currentUser} onNavigate={handleNavigate} />}
        {currentView === 'SETTINGS' && <SettingsPage currentUser={currentUser} />}
        {currentView === 'RANKING' && <RankingPage currentUser={currentUser} addToast={addToast} />}
        {currentView === 'ROUTES' && <RoutesPage currentUser={currentUser} addToast={addToast} />}
        {currentView === 'PERSONAL_WORKOUTS' && <PersonalWorkoutsPage currentUser={currentUser} addToast={addToast} initialStudentId={navParams.studentId} />}
        {currentView === 'FEED' && <FeedPage currentUser={currentUser} addToast={addToast} />}
        {currentView === 'REPORTS' && <ReportsPage currentUser={currentUser} addToast={addToast} />}
        {currentView === 'COMPLETE_PROFILE' && currentUser.role === UserRole.STUDENT && currentUser.profileCompleted === false && (
          <CompleteProfilePage currentUser={currentUser} onProfileComplete={handleProfileComplete} addToast={addToast} />
        )}
      </Layout>
    );
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {renderContent()}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export default App;