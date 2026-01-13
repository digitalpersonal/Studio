
import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { Layout } from './components/Layout';
import { User, UserRole, ViewState, ClassSession, Assessment, Payment, Post, Anamnesis, Route, Challenge, PersonalizedWorkout, Address, AcademySettings, AppNavParams } from './types';
import { MOCK_USER_ADMIN, DAYS_OF_WEEK, SYSTEM_ADMINS } from './constants';
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
  Zap as ZapIcon, Terminal
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
import { FinancialPage } from './components/FinancialPage';

const LOGO_URL = "https://digitalfreeshop.com.br/logostudio/logo.jpg";

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

// Fix: Added missing WhatsAppAutomation export used by FinancialPage and ManageUsersPage
export const WhatsAppAutomation = {
  sendConfirmation: (user: User, payment: Payment) => {
    const message = `Olá ${user.name}! Confirmamos o recebimento do seu pagamento de R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} referente a ${payment.description}. Obrigado!`;
    const url = `https://wa.me/${user.phoneNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },
  sendPaymentReminder: (user: User, payment: Payment) => {
    const message = `Olá ${user.name}! Passando para lembrar que sua fatura de R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${payment.description}) vence em ${payment.dueDate}. Se já pagou, por favor desconsidere.`;
    const url = `https://wa.me/${user.phoneNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },
  sendGenericMessage: (user: User, message: string) => {
    const url = `https://wa.me/${user.phoneNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
};

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
/*                                   PÁGINAS                                  */
/* -------------------------------------------------------------------------- */

const SettingsPage = ({ currentUser }: { currentUser: User }) => { 
  const [settings, setSettings] = useState<AcademySettings>(SettingsService.getSettings());
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  // A URL correta deve apontar para as Edge Functions do seu projeto Supabase
  const webhookUrl = settings.supabaseProjectId 
    ? `https://${settings.supabaseProjectId}.supabase.co/functions/v1/mercadopago-webhook`
    : "Configure o ID do Projeto Supabase abaixo";

  const isMPConfigured = !!(settings.mercadoPagoPublicKey && settings.mercadoPagoAccessToken);
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN; 

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      SettingsService.saveSettings(settings);
      addToast("Configurações atualizadas com sucesso!", "success");
    } catch (error: any) {
      addToast(`Erro ao salvar: ${error.message}`, "error");
    }
  };

  const copyToClipboard = () => {
    if (!settings.supabaseProjectId) return addToast("Configure o ID do projeto primeiro!", "error");
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
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Configurações do Studio</h2>
          <p className="text-slate-400 text-sm">Controle de identidade, dados fiscais e integrações.</p>
        </div>
      </header>

      <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-xl">
        <form onSubmit={handleSave} className="space-y-12">
          
          <section className="space-y-6">
            <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-3 border-b border-dark-800 pb-4">
               <Building className="text-brand-500" size={20}/> Dados da Unidade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">ID do Projeto Supabase (Obrigatório para Webhooks)</label>
                <div className="relative">
                  <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={18}/>
                  <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 pl-12 text-white focus:border-brand-500 outline-none font-mono text-sm" placeholder="ex: xdjrrxrepnnkvpdbbtot" value={String(settings.supabaseProjectId || '')} onChange={e => setSettings({...settings, supabaseProjectId: e.target.value})} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Nome Fantasia / Razão Social</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" value={String(settings.name || '')} onChange={e => setSettings({...settings, name: e.target.value})} />
              </div>
              <div><label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">CNPJ</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" value={String(settings.cnpj || '')} onChange={e => setSettings({...settings, cnpj: e.target.value})} /></div>
              <div><label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Responsável Legal</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" value={String(settings.representativeName || '')} onChange={e => setSettings({...settings, representativeName: e.target.value})} /></div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-3 border-b border-dark-800 pb-4">
               <CardIcon className="text-brand-500" size={20}/> Integração Mercado Pago
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Public Key (Produção)</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-mono text-xs" placeholder="APP_USR-..." value={String(settings.mercadoPagoPublicKey || '')} onChange={e => setSettings({...settings, mercadoPagoPublicKey: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Access Token (Produção)</label>
                <input type="password" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-mono text-xs" placeholder="TEST-..." value={String(settings.mercadoPagoAccessToken || '')} onChange={e => setSettings({...settings, mercadoPagoAccessToken: e.target.value})} />
              </div>
            </div>

            <div className="p-8 bg-brand-500/5 rounded-3xl border border-brand-500/10 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                {isMPConfigured ? (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">
                     <ZapIcon size={12}/> Integração Ativa
                   </span>
                ) : (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-full border border-amber-500/20">
                     <AlertCircle size={12}/> Pendente
                   </span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="bg-brand-600/20 p-3 rounded-2xl text-brand-500">
                  <GlobeIcon size={24}/>
                </div>
                <div>
                  <h4 className="text-white font-bold text-base">URL de Notificações (Webhook)</h4>
                  <p className="text-slate-500 text-xs">Aponte o Mercado Pago para a Supabase Edge Function abaixo.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-dark-950 border border-dark-800 rounded-2xl p-4 text-brand-500 font-mono text-xs select-all break-all flex items-center">
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
              
              <div className="mt-6 p-4 bg-dark-950/50 rounded-2xl border border-dark-800/50 flex gap-3">
                <Info size={16} className="text-brand-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                  <b>Importante:</b> Esta URL deve ser inserida no campo "Notification URL" dentro do Painel do Desenvolvedor do Mercado Pago. O processamento ocorre via Supabase Functions para garantir segurança e persistência automática no banco de dados.
                </p>
              </div>
            </div>
          </section>
          
          <div className="pt-8 border-t border-dark-800">
            <button type="submit" className="w-full md:w-auto px-16 py-5 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-600/25 hover:bg-brand-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
              <Save size={20}/> Salvar Configurações Gerais
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [navParams, setNavParams] = useState<AppNavParams>({}); 
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const nextToastId = useRef(0);
  const [showPassword, setShowPassword] = useState(false);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = nextToastId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      if (user.role === UserRole.STUDENT && user.profileCompleted === false) {
        setCurrentView('COMPLETE_PROFILE');
      } else {
        setCurrentView('DASHBOARD');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentView(user.role === UserRole.STUDENT && user.profileCompleted === false ? 'COMPLETE_PROFILE' : 'DASHBOARD');
    addToast(`Bem-vindo(a), ${String(user.name).split(' ')[0]}!`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView('LOGIN');
    addToast("Desconectado com sucesso.", "info");
  };

  const handleNavigate = (view: ViewState, params: AppNavParams = {}) => {
    setCurrentView(view);
    setNavParams(params); 
  };

  const renderContent = () => {
    if (!currentUser) {
      if (currentView === 'REGISTRATION') {
        return <RegistrationPage onLogin={handleLogin} onCancelRegistration={() => handleNavigate('LOGIN')} />;
      }
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-center animate-fade-in">
            <div className="mb-14 flex justify-center">
               <img src={LOGO_URL} alt="Studio Logo" className="w-full max-w-[400px] h-auto rounded-2xl" />
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (isLoggingIn) return;
              const target = e.target as any;
              const email = target.email.value;
              const password = target.password.value;
              setIsLoggingIn(true);
              try {
                const sysAdmin = SYSTEM_ADMINS.find(sa => sa.email === email && sa.password === password);
                const user = sysAdmin ? { ...sysAdmin } as any : await SupabaseService.getUserByEmail(email);
                if (user && (sysAdmin || user.password === password)) handleLogin(user);
                else addToast("Dados de acesso incorretos.", "error");
              } catch (error: any) {
                addToast(`Erro de conexão com o banco de dados.`, "error");
              } finally { setIsLoggingIn(false); }
            }} className="space-y-4">
              <input type="email" name="email" required className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 outline-none" placeholder="E-mail" />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" required className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 outline-none pr-14" placeholder="Senha" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
              <button type="submit" disabled={isLoggingIn} className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest hover:bg-brand-500 transition-all">
                {isLoggingIn ? <Loader2 size={18} className="animate-spin inline mr-2" /> : null} Entrar no Studio
              </button>
              <button type="button" onClick={() => handleNavigate('REGISTRATION')} className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-8 flex items-center justify-center gap-2"><UserPlus size={14}/> Novo Aluno? Cadastre-se</button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <ToastContext.Provider value={{ addToast }}>
        <Layout currentUser={currentUser} currentView={currentView} onNavigate={handleNavigate} onLogout={handleLogout}>
          {currentView === 'DASHBOARD' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Olá, {String(currentUser.name).split(' ')[0]}! 👋</h2>
              <p className="text-slate-400 text-sm">Central de atividades e métricas de hoje.</p>
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
          {currentView === 'COMPLETE_PROFILE' && currentUser.role === UserRole.STUDENT && (
            <CompleteProfilePage currentUser={currentUser} onProfileComplete={handleLogin} addToast={addToast} />
          )}
        </Layout>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </ToastContext.Provider>
    );
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {renderContent()}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}
