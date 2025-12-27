
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
import { FinancialPage } from './components/FinancialPage'; // Import FinancialPage


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


// Main App Component
export function App() { // Changed to named export
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
