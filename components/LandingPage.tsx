
import React, { useState } from 'react';
import { User } from '../types';
import { SupabaseService } from '../services/supabaseService';
// Fix: Added MessageCircle to the import list from lucide-react
import { Loader2, ArrowRight, Eye, EyeOff, UserPlus, MoveRight, Clock, Flag, CheckCircle2, Star, Zap, MessageCircle } from 'lucide-react';

const LOGO_URL = "https://digitalfreeshop.com.br/logostudio/logo.jpg";
const RUNNING_BANNER_URL = "https://digitalfreeshop.com.br/logostudio/corrida.jpeg";

interface LandingPageProps {
  onLogin: (user: User) => void;
  onNavigateToRegistration: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const PlansSection = ({ onNavigate }: { onNavigate: () => void }) => {
    const mainPlans = [
        { title: 'Plano Mensal', price: '140', freq: '3x na semana', desc: 'Ideal para quem busca flexibilidade total.', icon: Zap, color: 'brand' },
        { title: 'Plano Mensal Plus', price: '150', freq: '4x na semana', desc: 'Nosso plano mais popular para constância.', icon: Star, color: 'brand', popular: true },
        { title: 'Trimestral', price: '110', freq: '3x na semana', desc: 'Foco em resultados de médio prazo.', icon: CheckCircle2, color: 'emerald' },
        { title: 'Semestral', price: '105', freq: '3x na semana', desc: 'Para quem vive o estilo de vida Studio.', icon: CheckCircle2, color: 'emerald' },
        { title: 'Treino Kids', price: '90', freq: '2x na semana', desc: 'Saúde e movimento para os pequenos.', icon: Star, color: 'purple' },
    ];

    return (
        <section className="py-24 px-8 bg-dark-950">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                        Nossos <span className="text-brand-500">Planos</span>
                    </h2>
                    <p className="text-slate-400 font-medium max-w-xl mx-auto">
                        Escolha a modalidade que melhor se adapta ao seu ritmo e comece sua transformação hoje.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mainPlans.map((plan, i) => (
                        <div key={i} className={`relative p-8 rounded-[3rem] border transition-all group overflow-hidden ${
                            plan.popular 
                            ? 'bg-brand-600/10 border-brand-500 shadow-[0_0_40px_rgba(249,115,22,0.15)] scale-105 z-10' 
                            : 'bg-dark-900/40 border-dark-800 hover:border-brand-500/50'
                        }`}>
                            {plan.popular && (
                                <div className="absolute top-6 right-8 bg-brand-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
                                    Mais Popular
                                </div>
                            )}
                            
                            <plan.icon className={`${plan.popular ? 'text-brand-500' : 'text-slate-600'} mb-6 group-hover:scale-110 transition-transform`} size={32} />
                            
                            <h3 className="text-white font-black uppercase tracking-tighter text-2xl mb-2">{plan.title}</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase mb-6">{plan.freq}</p>
                            
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-slate-500 text-lg font-bold">R$</span>
                                <span className="text-5xl font-black text-white tracking-tighter">{plan.price}</span>
                                <span className="text-slate-500 text-sm font-bold">/mês</span>
                            </div>

                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{plan.desc}</p>

                            <button 
                                onClick={onNavigate}
                                className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                                    plan.popular 
                                    ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/30 hover:bg-brand-500' 
                                    : 'bg-dark-800 text-white hover:bg-brand-600'
                                }`}
                            >
                                Quero este plano
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-dark-900/50 p-8 rounded-[2.5rem] border border-dark-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h4 className="text-white font-black uppercase tracking-tighter text-xl">Ainda tem dúvidas?</h4>
                        <p className="text-slate-500 text-sm">Fale com nossa equipe e agende uma aula experimental gratuita.</p>
                    </div>
                    <a href="https://wa.me/5535991048020" target="_blank" rel="noreferrer" className="bg-emerald-600 text-white font-black py-4 px-8 rounded-2xl uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20">
                        <MessageCircle size={18} /> Conversar no WhatsApp
                    </a>
                </div>
            </div>
        </section>
    );
};

const HoursSection = () => {
    return (
        <section className="py-20 px-8 bg-dark-950 border-t border-dark-800">
            <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                    Nossos <span className="text-brand-500">Horários</span>
                </h2>
                <p className="max-w-2xl mx-auto text-slate-400 mb-12">
                    Confira nossos horários de funcionamento e treinos especiais.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Bloco 1: Seg/Qua/Sex */}
                    <div className="bg-dark-900/40 p-8 rounded-[2.5rem] border border-dark-800 hover:border-brand-500/30 transition-all group">
                        <div className="bg-dark-800 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Clock className="text-brand-500" size={32} />
                        </div>
                        <h3 className="text-white font-black uppercase tracking-tighter text-xl mb-4">Seg, Qua e Sex</h3>
                        <div className="space-y-2 text-slate-300 font-bold">
                            <p className="text-2xl">05:00 <span className="text-slate-600 text-sm font-black uppercase">às</span> 12:00</p>
                            <div className="h-px bg-dark-800 w-12 mx-auto my-2 opacity-50"></div>
                            <p className="text-2xl">14:00 <span className="text-slate-600 text-sm font-black uppercase">às</span> 21:00</p>
                        </div>
                    </div>

                    {/* Bloco 2: Ter/Qui */}
                    <div className="bg-dark-900/40 p-8 rounded-[2.5rem] border border-dark-800 hover:border-brand-500/30 transition-all group">
                        <div className="bg-dark-800 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Clock className="text-brand-500" size={32} />
                        </div>
                        <h3 className="text-white font-black uppercase tracking-tighter text-xl mb-4">Terça e Quinta</h3>
                        <div className="space-y-2 text-slate-300 font-bold">
                            <p className="text-2xl">05:00 <span className="text-slate-600 text-sm font-black uppercase">às</span> 10:00</p>
                            <div className="h-px bg-dark-800 w-12 mx-auto my-2 opacity-50"></div>
                            <p className="text-2xl">16:00 <span className="text-slate-600 text-sm font-black uppercase">às</span> 21:00</p>
                        </div>
                    </div>

                    {/* Bloco 3: Clube de Corrida */}
                    <div className="bg-brand-600 p-8 rounded-[2.5rem] shadow-2xl shadow-brand-600/20 text-white flex flex-col items-center justify-center relative overflow-hidden group">
                        <Flag className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" size={150} />
                        <div className="bg-white/20 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <Flag className="text-white" size={32} />
                        </div>
                        <h3 className="font-black uppercase tracking-tighter text-xl mb-2">Clube de Corrida</h3>
                        <p className="text-brand-100 text-xs font-bold uppercase tracking-widest mb-4">Segunda e Quarta</p>
                        <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/20">
                            <p className="text-3xl font-black italic">19:00 <span className="text-xs uppercase opacity-60">às</span> 20:00</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onNavigateToRegistration, addToast }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    const target = e.target as any;
    const email = target.email.value.trim().toLowerCase();
    const password = target.password.value.trim();

    if (!email || !password) {
      addToast("Por favor, preencha todos os campos.", "error");
      return;
    }

    setIsLoggingIn(true);
    try {
      const allUsers = await SupabaseService.getAllUsers(true);
      const user = allUsers.find(u => 
        u.email.toLowerCase() === email && 
        u.password === password
      ) || null;

      if (user) {
        if (user.status === 'SUSPENDED') {
          addToast("Seu acesso está temporariamente suspenso. Procure a recepção.", "error");
        } else {
          onLogin(user);
        }
      } else {
        addToast("E-mail ou senha incorretos.", "error");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      addToast(`Erro de conexão com o servidor.`, "error");
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
            <img src={LOGO_URL} alt="Logo do Studio" className="w-48 h-auto mb-8 shadow-2xl rounded-2xl" />
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
                  <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1470" alt="Treino Funcional" className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8">
                    <h3 className="text-3xl font-black uppercase text-white tracking-tighter">Treino Funcional</h3>
                    <p className="text-slate-300 mt-2">Ganhe força, agilidade e resistência com treinos dinâmicos.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-dark-900 group">
                <div className="relative">
                  <img src={RUNNING_BANNER_URL} alt="Clube de Corrida" className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8">
                    <h3 className="text-3xl font-black uppercase text-white tracking-tighter">Clube de Corrida</h3>
                    <p className="text-slate-300 mt-2">Explore novos percursos e supere seus limites.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <HoursSection />

          <PlansSection onNavigate={onNavigateToRegistration} />
  
          <section id="login-section" className="py-24 bg-dark-950 px-8 scroll-mt-20">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Área do Membro</h2>
                <p className="text-slate-500 mt-2 text-sm uppercase font-bold tracking-widest">Acesse sua conta para ver seus treinos e evolução.</p>
              </div>
              <form onSubmit={handleLoginFormSubmit} className="space-y-4">
                <input 
                  type="email" 
                  name="email" 
                  required 
                  className="w-full bg-dark-900 border-2 border-dark-800 rounded-2xl p-5 text-white placeholder:text-slate-500 focus:border-brand-500 outline-none transition-colors font-bold" 
                  placeholder="Seu e-mail" 
                />
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    required 
                    className="w-full bg-dark-900 border-2 border-dark-800 rounded-2xl p-5 text-white placeholder:text-slate-500 focus:border-brand-500 outline-none pr-14 transition-colors font-bold" 
                    placeholder="Sua senha" 
                  />
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
