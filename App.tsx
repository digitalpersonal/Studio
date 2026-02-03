
import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { Layout } from './components/Layout';
import { User, UserRole, ViewState, ClassSession, Assessment, Payment, Post, Anamnesis, Route, Challenge, PersonalizedWorkout, Address, AcademySettings, AppNavParams } from './types';
import { SupabaseService, SUPABASE_PROJECT_ID } from './services/supabaseService';
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
import { RunningEvolutionPage } from './components/RunningEvolutionPage';
import { LandingPage } from './components/LandingPage';
import { HelpCenterPage } from './components/HelpCenterPage';
import { StravaPage } from './components/StravaPage';
import { Loader2, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                   NOTIFICAÇÕES                             */
/* -------------------------------------------------------------------------- */

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }

export const ToastContext = createContext<{ addToast: (message: string, type?: ToastType) => void; }>({ addToast: () => {} });
export const useToast = () => useContext(ToastContext);

// Fix: Added missing WhatsAppAutomation export to resolve import errors in multiple components
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

const ToastContainer = ({ toasts, removeToast }: any) => (
  <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
    {toasts.map((t: any) => (
      <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-fade-in min-w-[300px] ${t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-brand-500/10 border-brand-500/20 text-brand-500'}`}>
        <span className="text-sm font-bold flex-1">{t.message}</span>
        <button onClick={() => removeToast(t.id)}><X size={16} /></button>
      </div>
    ))}
  </div>
);

function getInitialState(): { user: User | null; view: ViewState } {
  try {
    const storedUser = localStorage.getItem('studioCurrentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user?.id) return { user, view: (user.role === UserRole.STUDENT && !user.profileCompleted) ? 'COMPLETE_PROFILE' : 'DASHBOARD' };
    }
  } catch {}
  return { user: null, view: 'LOGIN' };
}

export function App() {
  const [initialState] = useState(getInitialState);
  const [currentUser, setCurrentUser] = useState<User | null>(initialState.user);
  const [currentView, setCurrentView] = useState<ViewState>(initialState.view);
  const [navParams, setNavParams] = useState<AppNavParams>({}); 
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(0);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = nextToastId.current++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
  
  const handleLogin = (user: User) => {
    localStorage.setItem('studioCurrentUser', JSON.stringify(user));
    setCurrentUser(user);
    setCurrentView((user.role === UserRole.STUDENT && !user.profileCompleted) ? 'COMPLETE_PROFILE' : 'DASHBOARD');
    addToast(`Olá, ${String(user.name).split(' ')[0]}!`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem('studioCurrentUser');
    setCurrentUser(null);
    setCurrentView('LOGIN');
  };

  const handleNavigate = (view: ViewState, params: AppNavParams = {}) => {
    setCurrentView(view);
    setNavParams(params); 
  };

  const renderContent = () => {
    if (!currentUser) {
      if (currentView === 'REGISTRATION') return <RegistrationPage onLogin={handleLogin} onCancelRegistration={() => handleNavigate('LOGIN')} />;
      return <LandingPage onLogin={handleLogin} onNavigateToRegistration={() => handleNavigate('REGISTRATION')} addToast={addToast} />;
    }

    if (currentUser.role === UserRole.STUDENT && !currentUser.profileCompleted) {
      return <CompleteProfilePage currentUser={currentUser} onProfileComplete={user => { setCurrentUser(user); setCurrentView('DASHBOARD'); }} addToast={addToast} />;
    }
    
    return (
      <Layout currentUser={currentUser} currentView={currentView} onNavigate={handleNavigate} onLogout={handleLogout}>
        {currentView === 'DASHBOARD' && <DashboardPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'SCHEDULE' && <SchedulePage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'ASSESSMENTS' && <AssessmentsPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} initialStudentId={navParams.studentId} />}
        {currentView === 'FINANCIAL' && <FinancialPage user={currentUser} onNavigate={handleNavigate} selectedStudentId={navParams.studentId} />}
        {currentView === 'MANAGE_USERS' && <ManageUsersPage currentUser={currentUser} onNavigate={handleNavigate} />}
        {currentView === 'SETTINGS' && <DashboardPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'RANKING' && <RankingPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'ROUTES' && <RoutesPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'PERSONAL_WORKOUTS' && <PersonalWorkoutsPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} initialStudentId={navParams.studentId} />}
        {currentView === 'FEED' && <FeedPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'REPORTS' && <ReportsPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} />}
        {currentView === 'RUNNING_EVOLUTION' && <RunningEvolutionPage currentUser={currentUser} onNavigate={handleNavigate} addToast={addToast} initialStudentId={navParams.studentId} />}
        {currentView === 'HELP_CENTER' && <HelpCenterPage currentUser={currentUser} onNavigate={handleNavigate} />}
        {currentView === 'STRAVA_CONNECT' && <StravaPage currentUser={currentUser} onNavigate={handleNavigate} onUpdateUser={setCurrentUser} addToast={addToast} />}
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
