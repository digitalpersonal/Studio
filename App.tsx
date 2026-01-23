
import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { Layout } from './components/Layout';
import { User, UserRole, ViewState, ClassSession, Assessment, Payment, Post, Anamnesis, Route, Challenge, PersonalizedWorkout, Address, AcademySettings, AppNavParams } from './types';
import { DAYS_OF_WEEK } from './constants';
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
  Zap as ZapIcon, Mail, MoveRight
} from 'lucide-react';
import { SupabaseService, SUPABASE_PROJECT_ID } from './services/supabaseService';
import { GeminiService } from './services/geminiService';
import { ContractService } from './services/contractService';
import { SettingsService } from './services/settingsService';
import { MercadoPagoService } from './services/mercadoPagoService';
import { UserFormPage } from './components/UserFormPage';
import { SchedulePage } from './components/SchedulePage';
import { AssessmentsPage } from './components/AssessmentsPage';
import { RankingPage } from './components/RankingPage';
import { RoutesPage } from './components/RoutesPage';
import { PersonalWorkoutsPage } from './components/PersonalWorkoutsPage';
import { FeedPage } from './components/FeedPage';
import { ReportsPage } from './components/ReportsPage';
import { ManageUsersPage } from './components/ManageUsersPage';
import { RegistrationPage } from './components/RegistrationPage';
import { CompleteProfilePage } from './components/CompleteProfilePage'; 
import { FinancialPage } from './components/FinancialPage';
import { DashboardPage } from './components/DashboardPage';

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
    const message = `Olá ${String(student.name).split(' ')[0]}! 👋 Lembrete amigável sobre sua mensalidade com vencimento em ${payment.dueDate}, no valor de R$ ${payment.amount.toFixed(2)}. Pague em dia e mantenha seu acesso liberado! 😉💪`;
    const url = `https://wa.me/${String(student.phoneNumber)?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },
  sendOverdueNotice: (student: User, payment: Payment) => {
    const message = `Olá ${String(student.name).split(' ')[0]}! 🚨 Notamos um débito em aberto referente à mensalidade com vencimento em ${payment.dueDate}, no valor de R$ ${payment.amount.toFixed(2)}. Por favor, regularize sua situação para evitar a suspensão do acesso. Se já pagou, desconsidere.`;
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
  const [settings, setSettings] = useState<AcademySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const synced = await SettingsService.getSettings();
        setSettings(synced);
      } catch (e) {
        addToast("Houve um erro ao sincronizar as configurações da nuvem.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [addToast]);

  const supabaseWebhookUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mercadopago-webhook`;
  
  const isMPConfigured = !!(settings?.mercadoPagoPublicKey && settings?.mercadoPagoAccessToken);
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN; 

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await SettingsService.saveSettings(settings);
      addToast("Configurações atualizadas com sucesso!", "success");
    } catch (error: any) {
      console.error("ERRO AO SALVAR CONFIGURAÇÕES:", error);
      addToast(`Erro ao salvar: ${error.message || 'Verifique a conexão com o banco.'}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(supabaseWebhookUrl);
    setCopied(true);
    addToast("Link do Webhook copiado!", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      academyAddress: {
        ...(settings.academyAddress as Address),
        [field]: value
      }
    });
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 size={48} className="animate-spin text-brand-500" />
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest text-center">Acessando Supabase Cloud...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Ajustes da Central</h2>
          <p className="text-slate-400 text-sm">Controle de identidade visual e integrações 100% em nuvem.</p>
        </div>
      </header>

      <div className="bg-dark-950 p-8 rounded-3xl border border-dark-800 shadow-xl">
        <form onSubmit={handleSave} className="space-y-10">
          <section className="space-y-6">
            <h3 className="text-white font-bold flex items-center gap-2 border-b border-dark-800 pb-4 uppercase text-xs tracking-widest">
               <Building className="text-brand-500" size={16}/> Dados Institucionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Domínio de Acesso (Endereço Web)</label>
                <div className="relative">
                  <GlobeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                  <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 pl-12 text-white focus:border-brand-500 outline-none font-medium" value={settings.customDomain} onChange={e => setSettings({...settings, customDomain: e.target.value})} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Nome Fantasia / Razão Social</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-bold" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CNPJ</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" value={settings.cnpj} onChange={e => setSettings({...settings, cnpj: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Representante Legal</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" value={settings.representativeName} onChange={e => setSettings({...settings, representativeName: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Telefone / WhatsApp Comercial</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                  <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 pl-12 text-white focus:border-brand-500 outline-none" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">E-mail de Contato</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                  <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 pl-12 text-white focus:border-brand-500 outline-none" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} placeholder="contato@empresa.com" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-emerald-500 text-[10px] font-black uppercase mb-1 tracking-widest">Chave Pix Institucional (Recebimentos Manuais)</label>
                <div className="relative">
                  <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18}/>
                  <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 pl-12 text-white focus:border-emerald-500 outline-none font-bold" value={settings.pixKey} onChange={e => setSettings({...settings, pixKey: e.target.value})} placeholder="Celular, E-mail, CPF ou Chave Aleatória" />
                </div>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-dark-800">
                 <h4 className="text-white font-bold text-sm flex items-center gap-2 mb-4"><MapPin size={18} className="text-brand-500"/> Endereço Físico da Academia</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CEP</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={settings.academyAddress?.zipCode || ''} onChange={e => handleAddressChange('zipCode', e.target.value)} /></div>
                   <div className="sm:col-span-2"><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Logradouro</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={settings.academyAddress?.street || ''} onChange={e => handleAddressChange('street', e.target.value)} /></div>
                   <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Número</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={settings.academyAddress?.number || ''} onChange={e => handleAddressChange('number', e.target.value)} /></div>
                   <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Bairro</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={settings.academyAddress?.neighborhood || ''} onChange={e => handleAddressChange('neighborhood', e.target.value)} /></div>
                   <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Cidade</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={settings.academyAddress?.city || ''} onChange={e => handleAddressChange('city', e.target.value)} /></div>
                   <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Estado</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={settings.academyAddress?.state || ''} onChange={e => handleAddressChange('state', e.target.value)} /></div>
                 </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-white font-bold flex items-center gap-2 border-b border-dark-800 pb-4 uppercase text-xs tracking-widest">
               <CardIcon className="text-brand-500" size={16}/> Integração Mercado Pago
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Chave Pública (Public Key)</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-mono text-xs" value={settings.mercadoPagoPublicKey} onChange={e => setSettings({...settings, mercadoPagoPublicKey: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Token de Acesso (Access Token)</label>
                <input type="password" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-mono text-xs" value={settings.mercadoPagoAccessToken} onChange={e => setSettings({...settings, mercadoPagoAccessToken: e.target.value})} />
              </div>
            </div>

            <div className="p-8 bg-brand-500/5 rounded-[2.5rem] border border-brand-500/10 relative overflow-hidden">
              <div className="absolute top-6 right-6">
                {isMPConfigured ? (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">
                     <ZapIcon size={12}/> Integração Ativa
                   </span>
                ) : (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-full border border-amber-500/20">
                     <AlertCircle size={12}/> Configuração Pendente
                   </span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="bg-brand-600/20 p-4 rounded-2xl text-brand-500">
                  <GlobeIcon size={28}/>
                </div>
                <div>
                  <h4 className="text-white font-black text-lg uppercase tracking-tighter">Webhook Central (Supabase)</h4>
                  <p className="text-slate-500 text-xs font-bold uppercase mt-1">Edge Functions em nuvem.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-dark-950 border border-dark-800 rounded-2xl p-5 text-brand-500 font-mono text-[11px] select-all break-all flex items-center">
                  {supabaseWebhookUrl}
                </div>
                <button 
                  type="button"
                  onClick={copyToClipboard}
                  className="px-8 py-5 bg-brand-600 text-white rounded-2xl hover:bg-brand-500 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-600/20"
                >
                  {copied ? <CheckCheck size={18}/> : <CopyIcon size={18}/>}
                  {copied ? 'Link Copiado' : 'Copiar URL'}
                </button>
              </div>
            </div>
          </section>

          {isSuperAdmin && ( 
            <section className="space-y-6">
                <h3 className="text-white font-bold flex items-center gap-2 border-b border-dark-800 pb-4 uppercase text-xs tracking-widest">
                   <Lock className="text-brand-500" size={16}/> Segurança de Cadastro
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Código de Convite (Alunos)</label>
                      <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-black text-center tracking-[0.3em] uppercase" value={settings.registrationInviteCode} onChange={e => setSettings({...settings, registrationInviteCode: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Mensalidade Padrão (R$)</label>
                      <input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none font-bold" value={settings.monthlyFee} onChange={e => setSettings({...settings, monthlyFee: Number(e.target.value)})} />
                  </div>
                </div>
            </section>
          )}
          
          <div className="pt-8 border-t border-dark-800">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full md:w-auto px-16 py-6 bg-brand-600 text-white font-black rounded-2xl shadow-2xl shadow-brand-600/30 hover:bg-brand-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20}/>}
              {saving ? 'Gravando...' : 'Aplicar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App Component
export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [navParams, setNavParams] = useState<AppNavParams>({}); 
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(0);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = nextToastId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === UserRole.STUDENT && user.profileCompleted === false) {
      setCurrentView('COMPLETE_PROFILE');
    } else {
      setCurrentView('DASHBOARD');
    }
    addToast(`Olá, ${String(user.name).split(' ')[0]}! Sessão em nuvem ativada.`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('LOGIN');
    addToast("Sessão encerrada.", "info");
  };

  const handleNavigate = (view: ViewState, params: AppNavParams = {}) => {
    setCurrentView(view);
    setNavParams(params); 
  };

  const handleProfileComplete = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setCurrentView('DASHBOARD');
  };

  const LandingPage = ({ onLogin, onNavigateToRegistration, addToast }: { onLogin: (u:User) => void, onNavigateToRegistration: () => void, addToast: (msg:string, type?:ToastType) => void }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
  
    const handleLoginFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoggingIn) return;
      
      const target = e.target as any;
      const email = target.email.value;
      const password = target.password.value;
      
      setIsLoggingIn(true);
      try {
        const allUsers = await SupabaseService.getAllUsers(true);
        const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password) || null;
        
        if (user) {
          onLogin(user);
        } else {
          addToast("E-mail ou senha incorretos.", "error");
        }
      } catch (error: any) {
        console.error("Login Error:", error);
        addToast(`Erro de conexão com o Supabase.`, "error");
      } finally {
        setIsLoggingIn(false);
      }
    };
  
    const handleScrollToLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const loginSection = document.getElementById('login-section');
      if (loginSection) {
        loginSection.scrollIntoView({ behavior: 'smooth' });
      }
    };

    return (
      <div className="bg-dark-950 text-white min-h-screen font-sans animate-fade-in">
        <div className="absolute inset-0 h-[80vh] bg-gradient-to-b from-black/80 to-dark-950 z-10"></div>
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-[80vh] object-cover z-0"
          src="https://videos.pexels.com/video-files/4762961/4762961-hd_1920_1080_25fps.mp4"
        ></video>
  
        <main className="relative z-20">
          <section className="min-h-[80vh] flex flex-col items-center justify-center text-center p-8">
            <img src={LOGO_URL} alt="Logo do Studio" className="w-48 h-auto mb-8 rounded-3xl shadow-2xl" />
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Sua Jornada <span className="text-brand-500">Começa Agora</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-300 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Treinos funcionais, corrida de rua e uma comunidade que te impulsiona. Tudo em um só lugar.
            </p>
            <a href="#login-section" onClick={handleScrollToLogin} className="mt-8 bg-brand-600 text-white font-black py-4 px-8 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/40 hover:bg-brand-500 transition-all text-sm flex items-center justify-center gap-2 group animate-fade-in" style={{ animationDelay: '0.6s' }}>
                Começar Agora <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </a>
          </section>
  
          <section className="py-20 px-8 bg-dark-950">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-dark-900 group">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1470" alt="Mulher levantando peso em treino funcional" className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8">
                    <h3 className="text-3xl font-black uppercase text-white tracking-tighter">Treino Funcional</h3>
                    <p className="text-slate-300 mt-2">Ganhe força, agilidade e resistência com treinos dinâmicos e desafiadores.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-dark-900 group">
                <div className="relative">
                  <img src="https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Grupo de pessoas correndo em uma trilha" className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8">
                    <h3 className="text-3xl font-black uppercase text-white tracking-tighter">Clube de Corrida</h3>
                    <p className="text-slate-300 mt-2">Explore novos percursos, supere seus limites e corra com o nosso time.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
  
          <section className="py-24 bg-dark-900 text-center px-8">
             <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Por que esperar pelo amanhã?</h2>
             <p className="max-w-3xl mx-auto mt-4 text-slate-400">
               Dar o primeiro passo é o movimento mais importante na sua busca por saúde e bem-estar. No Studio, você não encontra apenas equipamentos, mas uma comunidade pronta para te apoiar em cada etapa.
             </p>
          </section>
  
          <section id="login-section" className="py-24 bg-dark-950 px-8 scroll-mt-20">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Área do Membro</h2>
                <p className="text-slate-500 mt-2 text-sm uppercase font-bold tracking-widest">Acesse sua conta para ver seus treinos e evolução.</p>
              </div>
              <form onSubmit={handleLoginFormSubmit} className="space-y-4">
                <input type="email" name="email" required className="w-full bg-dark-900 border-2 border-dark-800 rounded-2xl p-5 text-white placeholder:text-slate-500 focus:border-brand-500 outline-none transition-colors" placeholder="Seu e-mail" />
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" required className="w-full bg-dark-900 border-2 border-dark-800 rounded-2xl p-5 text-white placeholder:text-slate-500 focus:border-brand-500 outline-none pr-14 transition-colors" placeholder="Sua senha" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/40 hover:bg-brand-500 transition-all text-sm mt-6 disabled:opacity-50 flex items-center justify-center gap-2 group"
                >
                  {isLoggingIn ? <Loader2 className="animate-spin" size={20}/> : <MoveRight className="group-hover:translate-x-1 transition-transform" size={20}/>}
                  {isLoggingIn ? 'Autenticando...' : 'Acessar Plataforma'}
                </button>
                <div className="pt-8 text-center">
                    <button type="button" onClick={onNavigateToRegistration} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-brand-500 transition-colors flex items-center justify-center gap-2 group">
                      <UserPlus size={14} className="group-hover:scale-110 transition-transform"/> Novo por aqui? Cadastre-se
                    </button>
                </div>
              </form>
            </div>
          </section>

          <footer className="py-12 bg-dark-900 text-center border-t border-dark-800">
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Studio - Todos os direitos reservados.</p>
            <p className="text-xs text-slate-600 mt-2">Desenvolvido por Multiplus - Silvio T. de Sá Filho</p>
          </footer>
        </main>
      </div>
    );
  };

  const renderContent = () => {
    if (!currentUser) {
      if (currentView === 'REGISTRATION') {
        return <RegistrationPage onLogin={handleLogin} onCancelRegistration={() => handleNavigate('LOGIN')} />;
      }
      return <LandingPage onLogin={handleLogin} onNavigateToRegistration={() => handleNavigate('REGISTRATION')} addToast={addToast} />;
    }

    return (
      <ToastContext.Provider value={{ addToast }}>
        <Layout currentUser={currentUser} currentView={currentView} onNavigate={handleNavigate} onLogout={handleLogout}>
          {currentView === 'DASHBOARD' && <DashboardPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
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
