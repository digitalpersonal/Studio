
import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { Layout } from './components/Layout';
import { User, UserRole, ViewState, AcademySettings, AppNavParams } from './types';
import { SUPER_ADMIN_CONFIG } from './constants';
import { 
  X, CheckCircle2, AlertCircle, Info, Loader2, ArrowLeft, UserPlus, Eye, EyeOff, Save
} from 'lucide-react';
import { SupabaseService } from './services/supabaseService';
import { SettingsService } from './services/settingsService';
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

export const WhatsAppAutomation = {
  getApiUrl: (phone: string, text: string) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  },
  sendPaymentReminder: (student: any, payment: any) => {
    const message = `Olá, ${String(student?.name || 'Aluno').split(' ')[0]}! 👋 Sua mensalidade de R$ ${Number(payment?.amount || 0).toFixed(2)} vence em ${String(payment?.dueDate || '').split('-').reverse().join('/')}. Bons treinos!`;
    window.open(WhatsAppAutomation.getApiUrl(student?.phoneNumber || '', message), '_blank');
  },
  sendConfirmation: (student: any, payment: any) => {
    const message = `Olá, ${String(student?.name || 'Aluno').split(' ')[0]}! 🌟 Recebemos seu pagamento de R$ ${Number(payment?.amount || 0).toFixed(2)}. Obrigado! 🔥`;
    window.open(WhatsAppAutomation.getApiUrl(student?.phoneNumber || '', message), '_blank');
  }
};

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [navParams, setNavParams] = useState<AppNavParams>({}); 
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [academySettings, setAcademySettings] = useState<AcademySettings | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const nextToastId = useRef(0);

  const LOGO_DEFAULT = "https://digitalfreeshop.com.br/logostudio/logo.jpg";

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      // Timeout de segurança para evitar tela branca de carregamento infinito
      const timeout = setTimeout(() => {
        if (isMounted && isAppLoading) {
           console.warn("Carregamento inicial excedeu tempo limite. Forçando inicialização.");
           setIsAppLoading(false);
        }
      }, 3000);

      try {
        const settings = await SettingsService.getSettings();
        if (isMounted) setAcademySettings(settings);
        
        const stored = localStorage.getItem('currentUser');
        if (stored && isMounted) {
          try {
              const user = JSON.parse(stored);
              if (user && user.id) {
                setCurrentUser(user);
                setCurrentView(user.role === UserRole.STUDENT && user.profileCompleted === false ? 'COMPLETE_PROFILE' : 'DASHBOARD');
              }
          } catch (e) {
              localStorage.removeItem('currentUser');
          }
        }
      } catch (e) {
        console.warn("Erro ao carregar dados iniciais.");
      } finally {
        if (isMounted) {
            clearTimeout(timeout);
            setIsAppLoading(false);
        }
      }
    };
    init();
    return () => { isMounted = false; };
  }, []);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = nextToastId.current++;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id: number) => setToasts(p => p.filter(t => t.id !== id));

  const handleLogin = (user: User) => {
    if (!user) return;
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentView(user.role === UserRole.STUDENT && user.profileCompleted === false ? 'COMPLETE_PROFILE' : 'DASHBOARD');
    addToast(`Bem-vindo(a), ${String(user.name || 'Membro').split(' ')[0]}!`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView('LOGIN');
    addToast("Logout realizado.", "info");
  };

  if (isAppLoading) return <div className="min-h-screen bg-dark-950 flex items-center justify-center"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;

  return (
    <ToastContext.Provider value={{ addToast, academySettings, refreshSettings: async () => { const s = await SettingsService.getSettings(); setAcademySettings(s); } }}>
      {!currentUser ? (
        currentView === 'REGISTRATION' ? (
          <RegistrationPage onLogin={handleLogin} onCancelRegistration={() => setCurrentView('LOGIN')} />
        ) : (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
             <div className="bg-white p-8 rounded-[3rem] shadow-xl w-full max-w-md border border-gray-200 text-center animate-fade-in">
                <img src={academySettings?.logoUrl || LOGO_DEFAULT} className="w-full max-w-[280px] mx-auto mb-10 rounded-2xl" />
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const email = fd.get('email') as string;
                  const pass = fd.get('password') as string;
                  try {
                    if (email === SUPER_ADMIN_CONFIG.email && pass === SUPER_ADMIN_CONFIG.password) return handleLogin({ ...SUPER_ADMIN_CONFIG, profileCompleted: true } as any);
                    const users = await SupabaseService.getAllUsers();
                    const u = (users || []).find(x => x.email === email && x.password === pass);
                    if (u) handleLogin(u); else addToast("Credenciais incorretas.", "error");
                  } catch { addToast("Erro de conexão.", "error"); }
                }} className="space-y-4">
                  <input name="email" required type="email" placeholder="E-mail" className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none" />
                  <div className="relative">
                    <input name="password" required type={showPassword ? "text" : "password"} placeholder="Senha" className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-5 text-slate-400">{showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                  </div>
                  <button type="submit" className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all">Entrar</button>
                  <button type="button" onClick={() => setCurrentView('REGISTRATION')} className="w-full text-slate-500 text-[10px] font-black uppercase mt-4 hover:text-brand-500">Cadastre-se</button>
                </form>
             </div>
          </div>
        )
      ) : (
        <Layout currentUser={currentUser} currentView={currentView} onNavigate={(v, p) => { setCurrentView(v); if(p) setNavParams(p); }} onLogout={handleLogout}>
          {currentView === 'DASHBOARD' && <DashboardPage currentUser={currentUser} onNavigate={(v, p) => { setCurrentView(v); if(p) setNavParams(p); }} addToast={addToast} />}
          {currentView === 'SCHEDULE' && <SchedulePage currentUser={currentUser} onNavigate={setCurrentView} addToast={addToast} />}
          {currentView === 'ASSESSMENTS' && <AssessmentsPage currentUser={currentUser} onNavigate={setCurrentView} addToast={addToast} initialStudentId={navParams.studentId} />}
          {currentView === 'FINANCIAL' && <FinancialPage user={currentUser} onNavigate={setCurrentView} selectedStudentId={navParams.studentId} />}
          {currentView === 'MANAGE_USERS' && <ManageUsersPage currentUser={currentUser} onNavigate={(v, p) => { setCurrentView(v); if(p) setNavParams(p); }} />}
          {currentView === 'RANKING' && <RankingPage currentUser={currentUser} onNavigate={setCurrentView} addToast={addToast} />}
          {currentView === 'ROUTES' && <RoutesPage currentUser={currentUser} onNavigate={setCurrentView} addToast={addToast} />}
          {currentView === 'PERSONAL_WORKOUTS' && <PersonalWorkoutsPage currentUser={currentUser} onNavigate={setCurrentView} addToast={addToast} initialStudentId={navParams.studentId} />}
          {currentView === 'FEED' && <FeedPage currentUser={currentUser} onNavigate={setCurrentView} addToast={addToast} />}
          {currentView === 'REPORTS' && <ReportsPage currentUser={currentUser} onNavigate={setCurrentView} addToast={addToast} />}
          {currentView === 'COMPLETE_PROFILE' && <CompleteProfilePage currentUser={currentUser} onProfileComplete={handleLogin} addToast={addToast} />}
        </Layout>
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}
