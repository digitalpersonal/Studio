import React, { useState } from 'react';
import { User } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Loader2, ArrowRight, Eye, EyeOff, UserPlus, MoveRight, CheckCircle2 } from 'lucide-react';

const LOGO_URL = "https://digitalfreeshop.com.br/logostudio/logo.jpg";
const RUNNING_BANNER_URL = "https://digitalfreeshop.com.br/logostudio/corrida.jpeg";

interface LandingPageProps {
  onLogin: (user: User) => void;
  onNavigateToRegistration: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const PricingSection = () => {
  const plans = [
    {
      title: "Trimestral",
      description: "Ideal para quem busca comprometimento a médio prazo com desconto.",
      prices: [
        { freq: "2x na semana", value: "100,00" },
        { freq: "3x na semana", value: "110,00" },
        { freq: "4x na semana", value: "120,00" },
        { freq: "5x na semana", value: "130,00" },
      ],
      contract: "3 meses de contrato",
      highlight: false,
    },
    {
      title: "Mensal",
      description: "Flexibilidade total para treinar no seu ritmo, sem compromisso.",
      prices: [
        { freq: "2x na semana", value: "110,00" },
        { freq: "3x na semana", value: "140,00" },
        { freq: "4x na semana", value: "150,00" },
        { freq: "5x na semana", value: "160,00" },
      ],
      contract: "Plano mensal sem contrato",
      highlight: true,
    },
    {
      title: "Semestral",
      description: "O melhor custo-benefício para quem está focado nos resultados.",
      prices: [
        { freq: "2x na semana", value: "95,00" },
        { freq: "3x na semana", value: "105,00" },
        { freq: "4x na semana", value: "115,00" },
        { freq: "5x na semana", value: "125,00" },
      ],
      contract: "6 meses de contrato",
      highlight: false,
    },
  ];

  return (
    <section className="py-20 px-8 bg-dark-900">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
          Conheça Nossos <span className="text-brand-500">Planos</span>
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-slate-400">
          Escolha o plano que melhor se adapta à sua rotina e objetivos. Todos os planos incluem acompanhamento profissional e acesso à nossa comunidade.
        </p>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`text-left rounded-[2.5rem] p-8 border transition-all duration-300 ${
                plan.highlight
                  ? 'bg-dark-950 border-brand-500 lg:scale-105 shadow-2xl shadow-brand-500/20'
                  : 'bg-dark-950 border-dark-800 hover:border-dark-700'
              }`}
            >
              <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-500">{plan.title}</h3>
              <p className="text-xs text-slate-500 font-bold h-8 mt-1">{plan.description}</p>
              
              <ul className="mt-6 space-y-4">
                {plan.prices.map((price, pIndex) => (
                  <li key={pIndex} className="flex justify-between items-center border-t border-dark-800 pt-4">
                    <span className="text-slate-300">{price.freq}</span>
                    <span className="text-white font-bold text-lg">R$ {price.value}</span>
                  </li>
                ))}
              </ul>

              <p className="text-center text-[10px] text-slate-600 font-black uppercase tracking-widest mt-8 bg-dark-900 py-2 px-4 rounded-full border border-dark-800">
                {plan.contract}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-dark-950 border border-dark-800 rounded-2xl p-6 flex justify-between items-center">
                <h4 className="font-bold text-white">Treinamento Kids <span className="text-slate-400 font-medium text-xs">(2x na semana)</span></h4>
                <span className="text-brand-500 font-black text-2xl">R$90,00</span>
            </div>
            <div className="bg-dark-950 border border-dark-800 rounded-2xl p-6 flex justify-between items-center">
                <h4 className="font-bold text-white">Treinamento Avulso</h4>
                <span className="text-brand-500 font-black text-2xl">R$30,00</span>
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
                  <img src={RUNNING_BANNER_URL} alt="Grupo de pessoas correndo ao ar livre" className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8">
                    <h3 className="text-3xl font-black uppercase text-white tracking-tighter">Clube de Corrida</h3>
                    <p className="text-slate-300 mt-2">Explore novos percursos, supere seus limites e corra com o nosso team.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <PricingSection />
  
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