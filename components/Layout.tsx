

import React from 'react';
import { User, UserRole, ViewState } from '../types';
import { 
  Dumbbell, 
  Calendar, 
  Activity, 
  Users, 
  DollarSign, 
  FileBarChart, 
  LogOut, 
  LayoutDashboard,
  Menu,
  X,
  Camera,
  Trophy,
  Map,
  Settings,
  Download,
  Smartphone,
  Share,
  MoreVertical,
  MessageCircle,
  Heart,
  ArrowLeft,
  FileText
} from 'lucide-react';

interface LayoutProps {
  currentUser: User;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  currentUser, 
  currentView, 
  onNavigate, 
  onLogout, 
  children 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showInstallModal, setShowInstallModal] = React.useState(false);

  // Staff roles (Admin, Super Admin e Trainer)
  const isStaff = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.TRAINER;
  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN; 

  const NavItem = ({ view, icon: Icon, label, roles }: { view: ViewState; icon: any; label: string; roles?: UserRole[] }) => {
    // Only render if the current user's role is allowed for this NavItem
    if (roles && !roles.includes(currentUser.role)) {
      return null;
    }
    return (
      <button
        onClick={() => {
          onNavigate(view);
          setMobileMenuOpen(false);
        }}
        className={`flex items-center w-full px-4 py-3 mb-1 rounded-lg transition-colors ${
          currentView === view 
            ? 'bg-brand-600 text-white shadow-md' 
            : 'text-slate-400 hover:bg-dark-800 hover:text-white'
        }`}
      >
        <Icon size={20} className="mr-3" />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case UserRole.SUPER_ADMIN: return 'Administrador Geral';
      case UserRole.ADMIN: return 'Administrador';
      case UserRole.TRAINER: return 'Treinador';
      default: return 'Aluno';
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex text-slate-200 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-950 border-r border-dark-800 h-screen sticky top-0">
        <div className="p-6 flex flex-col items-center justify-center border-b border-dark-800 text-center">
          <Dumbbell className="text-brand-500 mb-2" size={32} />
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Studio</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Visão Geral" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
          <NavItem view="RANKING" icon={Trophy} label="Ranking" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
          <NavItem view="ROUTES" icon={Map} label="Rotas & Mapas" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
          <NavItem view="SCHEDULE" icon={Calendar} label="Agenda de Aulas" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
          <NavItem view="PERSONAL_WORKOUTS" icon={FileText} label="Treinos Individuais" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
          <NavItem view="ASSESSMENTS" icon={Activity} label="Avaliações" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
          <NavItem view="FEED" icon={Camera} label="Comunidade" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
          
          {isStaff && (
            <>
              <div className="my-4 border-t border-dark-800 pt-4 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Operação
              </div>
              <NavItem view="MANAGE_USERS" icon={Users} label="Alunos & Equipe" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]} /> 
            </>
          )}

          {isAdmin && ( 
            <>
              <div className="my-4 border-t border-dark-800 pt-4 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gestão
              </div>
              <NavItem view="REPORTS" icon={FileBarChart} label="Relatórios" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]} />
              {isSuperAdmin && <NavItem view="SETTINGS" icon={Settings} label="Configurações" roles={[UserRole.SUPER_ADMIN]} />} 
            </>
          )}

          {currentUser.role === UserRole.STUDENT && (
            <NavItem view="FINANCIAL" icon={DollarSign} label="Financeiro" roles={[UserRole.STUDENT]} />
          )}
        </nav>

        <div className="p-4 border-t border-dark-800">
          <div className="flex items-center mb-4 px-2">
            <img 
              src={String(currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${String(currentUser.name)}`)} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full bg-dark-800 mr-3 border border-brand-500"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{String(currentUser.name)}</p>
              <p className="text-xs text-slate-500 truncate">{getRoleLabel(currentUser.role)}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header & Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-dark-900">
        
        {/* Mobile Header (FIXED) */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-dark-950 border-b border-dark-800 px-4 flex items-center justify-between z-50 shadow-lg">
          <div className="flex items-center">
            {currentView !== 'DASHBOARD' ? (
              <button 
                onClick={() => onNavigate('DASHBOARD')}
                className="mr-3 text-slate-300 hover:text-white p-1 rounded-full active:bg-dark-800 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            ) : (
              <Dumbbell className="text-brand-500 mr-2 shrink-0" size={24} />
            )}
            <span className="font-bold text-lg text-white truncate max-w-[200px]">Studio</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 p-2">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-dark-900/95 backdrop-blur-md pt-20 px-4 pb-8 overflow-y-auto">
            <nav className="flex flex-col space-y-2 animate-fade-in-up">
              <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Visão Geral" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
              <NavItem view="RANKING" icon={Trophy} label="Ranking" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
              <NavItem view="ROUTES" icon={Map} label="Rotas & Mapas" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
              <NavItem view="SCHEDULE" icon={Calendar} label="Agenda" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
              <NavItem view="PERSONAL_WORKOUTS" icon={FileText} label="Treinos Individuais" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
              <NavItem view="ASSESSMENTS" icon={Activity} label="Avaliações" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
              <NavItem view="FEED" icon={Camera} label="Comunidade" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINER, UserRole.STUDENT]} />
              {isStaff && <NavItem view="MANAGE_USERS" icon={Users} label="Alunos & Equipe" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]} />}
              {isAdmin && (
                <>
                  <NavItem view="REPORTS" icon={FileBarChart} label="Relatórios" roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]} />
                  {isSuperAdmin && <NavItem view="SETTINGS" icon={Settings} label="Configurações" roles={[UserRole.SUPER_ADMIN]} />}
                </>
              )}
              {currentUser.role === UserRole.STUDENT && <NavItem view="FINANCIAL" icon={DollarSign} label="Financeiro" roles={[UserRole.STUDENT]} />}
              <div className="h-px bg-dark-800 my-4" />
              <button 
                onClick={onLogout}
                className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-dark-800 rounded-lg font-medium"
              >
                <LogOut size={20} className="mr-3" />
                Sair
              </button>
            </nav>
          </div>
        )}

        {/* Main Content (With top padding for mobile to account for fixed header) */}
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto bg-dark-900 scroll-smooth">
          <div className="max-w-6xl mx-auto min-h-[calc(100vh-150px)]">
            {children}
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-dark-800 text-center pb-8">
             <div className="flex justify-center gap-6 mb-6">
                <button onClick={() => setShowInstallModal(true)} className="flex flex-col items-center gap-2 text-slate-500 hover:text-brand-500 transition-colors group">
                    <div className="p-3 bg-dark-950 rounded-full border border-dark-800 group-hover:border-brand-500 group-hover:bg-brand-500/10 transition-all">
                        <Download size={20} />
                    </div>
                    <span className="text-xs font-bold">Instalar App</span>
                </button>
                <a href="https://wa.me/5535991048020" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 text-slate-500 hover:text-green-500 transition-colors group">
                    <div className="p-3 bg-dark-950 rounded-full border border-dark-800 group-hover:border-green-500 group-hover:bg-green-500/10 transition-all">
                        <MessageCircle size={20} />
                    </div>
                    <span className="text-xs font-bold">Suporte</span>
                </a>
             </div>
             
             <p className="text-slate-600 text-sm mb-2">
               Desenvolvido por <span className="text-brand-500 font-bold">Multiplus</span> - Silvio Torres de Sá Filho
             </p>
             <p className="text-slate-700 text-xs">
               &copy; {new Date().getFullYear()} Studio. Todos os direitos reservados.
             </p>
          </footer>
        </main>
      </div>

      {/* PWA INSTALL INSTRUCTIONS MODAL */}
      {showInstallModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden">
                  <div className="bg-brand-600 p-6 text-center">
                      <Smartphone size={48} className="mx-auto text-white mb-2" />
                      <h3 className="text-xl font-bold text-white">Instalar Aplicativo</h3>
                      <p className="text-brand-100 text-sm">Tenha o Studio direto na tela inicial do seu celular.</p>
                  </div>
                  <button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={24}/></button>
                  
                  <div className="p-6 space-y-6">
                      {/* iOS Instructions */}
                      <div className="flex gap-4 items-start">
                          <div className="bg-dark-950 p-2 rounded-lg border border-dark-800 text-blue-400">
                             <Share size={24} />
                          </div>
                          <div>
                              <h4 className="text-white font-bold text-sm mb-1">iPhone (iOS)</h4>
                              <p className="text-slate-400 text-xs">
                                  1. Toque no botão <span className="text-blue-400 font-bold">Compartilhar</span> no menu do navegador.<br/>
                                  2. Role para baixo e selecione <span className="text-white font-bold">"Adicionar à Tela de Início"</span>.
                              </p>
                          </div>
                      </div>

                      <div className="h-px bg-dark-800" />

                      {/* Android Instructions */}
                      <div className="flex gap-4 items-start">
                          <div className="bg-dark-950 p-2 rounded-lg border border-dark-800 text-slate-300">
                             <MoreVertical size={24} />
                          </div>
                          <div>
                              <h4 className="text-white font-bold text-sm mb-1">Android (Chrome)</h4>
                              <p className="text-slate-400 text-xs">
                                  1. Toque nos <span className="text-white font-bold">três pontos</span> no canto superior direito.<br/>
                                  2. Selecione <span className="text-white font-bold">"Adicionar à Tela Inicial"</span> ou "Instalar App".
                              </p>
                          </div>
                      </div>

                      <button onClick={() => setShowInstallModal(false)} className="w-full bg-dark-800 hover:bg-dark-700 text-white font-bold py-3 rounded-xl transition-colors">
                          Entendi
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};