
import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { Layout } from './components/Layout';
import { User, UserRole, ViewState, ClassSession, Assessment, Payment, Post, Anamnesis, Route, Challenge, PersonalizedWorkout, Address, AcademySettings, AppNavParams } from './types';
import { DAYS_OF_WEEK, SUPER_ADMIN_CONFIG } from './constants';
import { 
  Dumbbell, UserPlus, Lock, ArrowLeft, Check, X, Calendar, Camera, 
  Trash2, Edit, Plus, Filter, Download, User as UserIcon, Search,
  Users, Activity, DollarSign, UserCheck, CheckCircle2, XCircle, Clock,
  AlertTriangle, CreditCard, QrCode, Smartphone, Barcode, FileText,
  MessageCircle, Send, Cake, Gift, ExternalLink, Image as ImageIcon, Loader2,
  Building, Save, Settings, Repeat, Zap, Trophy, Medal, Crown, Star, Flame,
  ClipboardList, Stethoscope, Pill, AlertCircle, Phone, CheckCheck, ChevronDown,
  ArrowRightLeft, TrendingUp, TrendingDown, Minus, Diff, Map, MapPin, Flag, Globe,
  List, ChevronUp, Gauge, Video, CheckSquare, Share2, Copy, Ruler, Scale,
  Heart, Upload, FileCheck, FileSignature, CalendarCheck, PieChart, BarChart3,
  CalendarPlus, ShieldCheck, Eye, EyeOff, GraduationCap, MapPinned, CreditCard as CardIcon,
  Info, Sparkles, Target, ZapOff, ChevronRight, TrendingUp as TrendUp, Wallet, Receipt,
  BadgePercent, HandCoins, ExternalLink as LinkIcon, Copy as CopyIcon, Globe as GlobeIcon,
  Zap as ZapIcon, ImageIcon as PhotoIcon
} from 'lucide-react';
import { SupabaseService } from './services/supabaseService';
import { SettingsService } from './services/settingsService';
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
import { DashboardPage } from './components/DashboardPage';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export const ToastContext = createContext<{
  addToast: (message: string, type?: ToastType) => void;
  academySettings: AcademySettings | null;
  refreshSettings: () => Promise<void>;
}>({ addToast: () => {}, academySettings: null, refreshSettings: async () => {} });

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

const SettingsPage = ({ currentUser, onBack }: { currentUser: User, onBack: () => void }) => {
  const { academySettings, refreshSettings, addToast } = useToast();
  const [localSettings, setLocalSettings] = useState<AcademySettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (academySettings) setLocalSettings(academySettings);
  }, [academySettings]);

  const handleSave = async () => {
    if (!localSettings) return;
    setLoading(true);
    try {
      await SettingsService.saveSettings(localSettings);
      await refreshSettings();
      addToast("Configurações atualizadas!", "success");
    } catch (e) {
      addToast("Erro ao salvar no banco de dados.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    if (!localSettings) return;
    setLocalSettings(prev => ({
      ...prev!,
      academyAddress: { ...prev!.academyAddress, [field]: value }
    }));
  };

  if (!localSettings) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500" /></div>;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-20">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2.5 bg-dark-950 border border-dark-800 text-slate-500 rounded-full hover:text-brand-500 hover:border-brand-500/50 transition-all active:scale-90">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Configurações do Studio</h2>
          <p className="text-slate-400 text-sm">Personalize os dados, logo e regras de acesso.</p>
        </div>
      </header>

      <div className="bg-dark-950 rounded-[2.5rem] border border-dark-800 shadow-2xl overflow-hidden">
        <div className="p-8 space-y-8">
           <section className="space-y-6">
              <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Building size={18}/> Visual e Identidade</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-2">URL da Logo do Studio</label>
                      <div className="flex gap-4 items-center">
                          <img src={localSettings.logoUrl} className="w-16 h-16 rounded-xl border border-dark-700 object-contain bg-dark-900" alt="Logo preview" />
                          <input className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-xs font-mono" value={localSettings.logoUrl} onChange={e => setLocalSettings({...localSettings, logoUrl: e.target.value})} placeholder="https://..." />
                      </div>
                  </div>
                  <div className="md:col-span-2">
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Nome Fantasia</label>
                      <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={localSettings.name} onChange={e => setLocalSettings({...localSettings, name: e.target.value})} />
                  </div>
              </div>
           </section>

           <section className="space-y-6 pt-8 border-t border-dark-800">
              <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><MapPin size={18}/> Dados Fiscais e Localização</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CNPJ</label>
                      <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={localSettings.cnpj} onChange={e => setLocalSettings({...localSettings, cnpj: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Responsável</label>
                      <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={localSettings.representativeName} onChange={e => setLocalSettings({...localSettings, representativeName: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Rua / Logradouro</label>
                      <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={localSettings.academyAddress.street} onChange={e => handleAddressChange('street', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 md:col-span-2">
                      <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Cidade</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={localSettings.academyAddress.city} onChange={e => handleAddressChange('city', e.target.value)} /></div>
                      <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">UF</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={localSettings.academyAddress.state} onChange={e => handleAddressChange('state', e.target.value)} /></div>
                      <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CEP</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={localSettings.academyAddress.zipCode} onChange={e => handleAddressChange('zipCode', e.target.value)} /></div>
                  </div>
              </div>
           </section>

           <section className="space-y-6 pt-8 border-t border-dark-800">
              <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><DollarSign size={18}/> Regras de Negócio</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Código de Convite Aluno</label>
                      <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold tracking-widest" value={localSettings.registrationInviteCode} onChange={e => setLocalSettings({...localSettings, registrationInviteCode: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Mensalidade Padrão (R$)</label>
                      <input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={localSettings.monthlyFee} onChange={e => setLocalSettings({...localSettings, monthlyFee: Number(e.target.value)})} />
                  </div>
              </div>
           </section>
        </div>

        <div className="p-8 bg-dark-900 border-t border-dark-800 flex justify-end">
            <button onClick={handleSave} disabled={loading} className="bg-brand-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all flex items-center gap-2 active:scale-95">
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                Salvar Alterações
            </button>
        </div>
      </div>
    </div>
  );
};

export const WhatsAppAutomation = {
  getApiUrl: (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const isMobile = /iPhone|Android|iPad|iPod/i.test(navigator.userAgent);
    
    if (!isMobile) {
      return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  },
  
  sendPlanSold: (student: User) => {
    const message = `Boas-vindas ao *Studio*, ${String(student.name).split(' ')[0]}! 🎉🔥\n\nSeu plano de ${student.planDuration} meses foi ativado com sucesso!\nValor mensal: *R$ ${student.planValue?.toFixed(2)}*.\n\nEstamos muito felizes em ter você conosco. Rumo à sua melhor versão! 💪🚀`;
    window.open(WhatsAppAutomation.getApiUrl(student.phoneNumber || '', message), 'studio_whatsapp');
  },
  
  sendPaymentReminder: (student: User, payment: Payment) => {
    const message = `Olá, ${String(student.name).split(' ')[0]}! 👋 Passando para lembrar que sua mensalidade vence em breve (*${payment.dueDate.split('-').reverse().join('/')}*).\n\nValor: *R$ ${payment.amount.toFixed(2)}*.\n\nEvite juros e mantenha seu acesso liberado para os treinos! 🏃‍♂️💨`;
    window.open(WhatsAppAutomation.getApiUrl(student.phoneNumber || '', message), 'studio_whatsapp');
  },
  
  sendConfirmation: (student: User, payment: Payment) => {
    const message = `Olá, ${String(student.name).split(' ')[0]}! 🌟\n\nRecebemos seu pagamento de *R$ ${payment.amount.toFixed(2)}* referente a ${payment.description}.\n\nObrigado pela pontualidade e bom treino! 🔥🏋️‍♂️`;
    window.open(WhatsAppAutomation.getApiUrl(student.phoneNumber || '', message), 'studio_whatsapp');
  },
  
  sendGenericMessage: (student: User, customMessage: string) => {
    const message = `Olá, ${String(student.name).split(' ')[0]}! 👋\n\n${customMessage}`;
    window.open(WhatsAppAutomation.getApiUrl(student.phoneNumber || '', message), 'studio_whatsapp');
  }
};

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [navParams, setNavParams] = useState<AppNavParams>({}); 
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [academySettings, setAcademySettings] = useState<AcademySettings | null>(null);
  const nextToastId = useRef(0);
  const [showPassword, setShowPassword] = useState(false);

  const LOGO_DEFAULT = "https://digitalfreeshop.com.br/logostudio/logo.jpg";

  const refreshSettings = async () => {
    const settings = await SettingsService.getSettings();
    setAcademySettings(settings);
  };

  useEffect(() => {
    refreshSettings();
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

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (user.role === UserRole.STUDENT && user.profileCompleted === false) {
      setCurrentView('COMPLETE_PROFILE');
    } else {
      setCurrentView('DASHBOARD');
    }
    addToast(`Bem-vindo(a) de volta!`, "success");
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/10 blur-[120px] rounded-full"></div>

          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl w-full max-w-md border border-gray-200 text-center animate-fade-in relative z-10">
            <div className="mb-14 flex justify-center">
               <img 
                 src={academySettings?.logoUrl || LOGO_DEFAULT} 
                 alt="Studio Logo" 
                 className="w-full max-w-[400px] h-auto object-contain rounded-2xl" 
               />
            </div>

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
                if (email === SUPER_ADMIN_CONFIG.email && password === SUPER_ADMIN_CONFIG.password) {
                  user = { ...SUPER_ADMIN_CONFIG, profileCompleted: true }; 
                } else {
                  const allUsers = await SupabaseService.getAllUsers();
                  user = allUsers.find(u => u.email === email && u.password === password) || null;
                }

                if (user) {
                  handleLogin(user);
                } else {
                  addToast("Credenciais inválidas.", "error");
                }
              } catch (error: any) {
                addToast(`Erro no login.`, "error");
              }
            }} className="space-y-4">
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none text-base placeholder:text-slate-600 transition-all focus:ring-4 focus:ring-brand-500/10"
                  placeholder="Seu E-mail"
                />
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none text-base placeholder:text-slate-600 pr-14 transition-all focus:ring-4 focus:ring-brand-500/10"
                  placeholder="Sua Senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-gray-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              <button
                type="submit"
                className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/40 hover:bg-brand-500 hover:-translate-y-1 active:translate-y-0 transition-all text-sm mt-6"
              >
                Entrar no Studio
              </button>
              
              <div className="pt-8">
                  <button 
                    type="button" 
                    onClick={() => handleNavigate('REGISTRATION')} 
                    className="w-full text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-brand-500 transition-colors flex items-center justify-center gap-2 group"
                  >
                    <UserPlus size={14} className="group-hover:scale-110 transition-transform"/> Cadastre-se
                  </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    return (
      <Layout currentUser={currentUser} currentView={currentView} onNavigate={handleNavigate} onLogout={handleLogout}>
        {currentView === 'DASHBOARD' && (
          <DashboardPage 
            currentUser={currentUser} 
            onNavigate={handleNavigate} 
            addToast={addToast} 
          />
        )}
        {currentView === 'SCHEDULE' && <SchedulePage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'ASSESSMENTS' && <AssessmentsPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} initialStudentId={navParams.studentId} />}
        {currentView === 'FINANCIAL' && <FinancialPage user={currentUser} onNavigate={handleNavigate} selectedStudentId={navParams.studentId} />}
        {currentView === 'MANAGE_USERS' && <ManageUsersPage currentUser={currentUser} onNavigate={handleNavigate} />}
        {currentView === 'SETTINGS' && <SettingsPage currentUser={currentUser} onBack={() => handleNavigate('DASHBOARD')} />}
        {currentView === 'RANKING' && <RankingPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'ROUTES' && <RoutesPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'PERSONAL_WORKOUTS' && <PersonalWorkoutsPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} initialStudentId={navParams.studentId} />}
        {currentView === 'FEED' && <FeedPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'REPORTS' && <ReportsPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'COMPLETE_PROFILE' && currentUser.role === UserRole.STUDENT && currentUser.profileCompleted === false && (
          <CompleteProfilePage currentUser={currentUser} onProfileComplete={handleProfileComplete} addToast={addToast} />
        )}
      </Layout>
    );
  };

  return (
    <ToastContext.Provider value={{ addToast, academySettings, refreshSettings }}>
      {renderContent()}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}
