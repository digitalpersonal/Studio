import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Share2, Zap, CheckCircle2, XCircle, BarChart, Trophy, Power, Loader2, Info, BookOpen, ChevronDown, User as UserIcon, GraduationCap, Shield } from 'lucide-react';

// --- URL de autorização do Strava ---
// Em um app real, o client_id viria de variáveis de ambiente.
const STRAVA_AUTH_URL = `https://www.strava.com/oauth/authorize?client_id=12345&response_type=code&redirect_uri=${window.location.origin}&approval_prompt=force&scope=read,activity:read_all`;

const faqData = {
  student: [
    { 
      q: 'Como vai funcionar a integração? (A Experiência)', 
      a: 'A ideia é <strong>simplicidade total</strong>. Você só conecta sua conta uma vez e depois não precisa se preocupar com mais nada.<br><br><ol class="list-decimal list-inside space-y-3"><li><strong>Conexão Única:</strong> Nesta tela, clique em "Conectar com Strava". Você será levado ao site seguro do Strava para autorizar o acesso.</li><li><strong>Corra Normalmente:</strong> Use seu app Strava ou relógio (Garmin, Apple Watch) como sempre fez para registrar suas corridas.</li><li><strong>Sincronização Mágica:</strong> Assim que salvar a corrida no Strava, nosso sistema puxa os dados (distância, tempo, pace, etc.) automaticamente.</li><li><strong>Tudo no App:</strong> Sua corrida aparecerá na "Evolução de Corrida" e a distância será somada ao Ranking e Desafio Global, sem nenhum trabalho manual!</li></ol>' 
    },
    { 
      q: 'Por que devo conectar? Quais os benefícios para mim?', 
      a: 'Conectar sua conta transforma sua experiência no Studio:<br><br><ul class="list-disc list-inside space-y-2"><li><strong>Coaching de Precisão:</strong> Seu treinador verá seus dados reais de corrida (pace, distância, elevação), permitindo um feedback muito mais técnico e personalizado para você evoluir mais rápido.</li><li><strong>Engajamento Máximo:</strong> Participe automaticamente do Ranking e dos Desafios de corrida. Veja seu nome subir no placar em tempo real!</li><li><strong>Histórico Unificado:</strong> Todo o seu progresso, tanto das aulas de funcional quanto das suas corridas de rua, fica centralizado em um só lugar.</li></ul>' 
    },
    { 
      q: 'Preciso fazer algo a cada corrida?', 
      a: '<strong>Absolutamente nada!</strong> Depois de conectar uma vez, é só correr e deixar a mágica acontecer. A sincronização é 100% automática.' 
    },
    { 
      q: 'E se eu quiser desconectar minha conta?', 
      a: 'Nesta mesma tela, onde você fez a conexão, haverá um botão para <strong>"Desconectar"</strong>. Ao clicar, o vínculo é removido e suas atividades futuras não serão mais sincronizadas.' 
    },
  ],
  staff: [
    { 
      q: 'Qual o valor estratégico e de negócio da integração?', 
      a: 'A integração com o Strava é uma poderosa ferramenta de <strong>engajamento, retenção e marketing</strong>.<br><br><ul class="list-disc list-inside space-y-2"><li><strong>Gamificação:</strong> O ranking automático cria uma competição saudável que incentiva os alunos a treinarem mais.</li><li><strong>Retenção (Efeito Ecossistema):</strong> Ao centralizar todos os dados de performance (funcional + corrida), o aluno cria um vínculo mais forte com o Studio, tornando o serviço mais "pegajoso" (sticky).</li><li><strong>Marketing e Atração:</strong> É um diferencial competitivo enorme. Anuncie seu "Clube de Corrida com integração total ao Strava" para atrair novos clientes, especialmente corredores de rua.</li><li><strong>Coaching de Precisão:</strong> Permite que os treinadores deem feedback baseado em dados reais, aumentando o valor percebido do serviço.</li></ul>' 
    },
    { 
      q: 'Como vejo as corridas de um aluno sincronizadas?', 
      a: 'Na tela de <strong>"Alunos & Equipe"</strong>, encontre o aluno e acesse a <strong>"Evolução de Corrida"</strong> dele usando o botão de atalho. As atividades sincronizadas aparecerão automaticamente na lista.' 
    },
    { 
      q: 'Os alunos precisam de ajuda para configurar?', 
      a: 'Não, e essa é a maior vantagem. O processo é muito simples e o aluno só precisa conectar a conta <strong>uma única vez</strong>. Depois disso, a sincronização é 100% automática. Você pode orientá-los a consultar esta seção para ver o passo a passo.' 
    },
    { 
      q: 'Preciso configurar algo como administrador?', 
      a: '<strong>Não.</strong> A integração foi projetada para ser "plug-and-play". A única ação necessária é a do próprio aluno. Não há painéis de configuração ou chaves de API para o administrador gerenciar.' 
    },
  ]
};

const AccordionItem: React.FC<{ question: string; answer: string; }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-dark-800 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-4"
        aria-expanded={isOpen}
      >
        <span className="font-bold text-white text-sm">{question}</span>
        <ChevronDown
          size={20}
          className={`text-brand-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="pb-4 animate-fade-in"
          dangerouslySetInnerHTML={{ __html: `<div class="text-slate-400 text-sm leading-relaxed space-y-2">${answer}</div>` }}
        />
      )}
    </div>
  );
};


interface StravaPageProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const StravaPage: React.FC<StravaPageProps> = ({ currentUser, onUpdateUser, addToast }) => {
  const [isConnected, setIsConnected] = useState(!!currentUser.stravaAccessToken);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFaqTab, setActiveFaqTab] = useState(currentUser.role === UserRole.STUDENT ? 'student' : 'staff');

  const isStaff = currentUser.role !== UserRole.STUDENT;

  useEffect(() => {
    const handleStravaRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const scope = urlParams.get('scope');

      if (code && scope?.includes('activity:read_all')) {
        setIsLoading(true);
        addToast("Autorização recebida! Finalizando conexão...", "info");

        window.history.replaceState({}, document.title, window.location.pathname);

        // Mock: Simula a troca do 'code' por um 'access_token' no backend.
        await new Promise(resolve => setTimeout(resolve, 2000)); 

        const mockAccessToken = `mock_access_${Date.now()}`;
        const mockRefreshToken = `mock_refresh_${Date.now()}`;

        try {
          const updatedUser = { 
            ...currentUser, 
            stravaAccessToken: mockAccessToken,
            stravaRefreshToken: mockRefreshToken,
          };
          await SupabaseService.updateUser(updatedUser);
          onUpdateUser(updatedUser);
          setIsConnected(true);
          addToast("Conexão com o Strava estabelecida com sucesso!", "success");
        } catch (error) {
          addToast("Erro ao salvar a conexão com o banco de dados.", "error");
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleStravaRedirect();
  }, [currentUser, onUpdateUser, addToast]);

  const handleConnect = () => {
    if (!confirm("Você será redirecionado para o site seguro do Strava para autorizar a conexão. Após a autorização, você retornará automaticamente para o Studio. Deseja continuar?")) {
        return;
    }

    setIsLoading(true);
    addToast("Redirecionando para o Strava...", "info");
    // CORREÇÃO: Redireciona para a URL de autorização real do Strava.
    window.location.href = STRAVA_AUTH_URL;
  };

  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar sua conta do Strava? Suas atividades não serão mais sincronizadas automaticamente.")) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser = { 
        ...currentUser, 
        stravaAccessToken: undefined,
        stravaRefreshToken: undefined,
      };
      await SupabaseService.updateUser(updatedUser);
      onUpdateUser(updatedUser);
      setIsConnected(false);
      addToast("Sua conta do Strava foi desconectada.", "success");
    } catch (error) {
      addToast("Erro ao tentar desconectar. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <header className="text-center">
        <img src="https://digitalfreeshop.com.br/logostudio/strava.png" alt="Strava Logo" className="w-24 h-24 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Integração com Strava</h2>
        <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
          Conecte sua conta para automatizar o registro das suas corridas, participar de rankings e receber análises de performance detalhadas.
        </p>
      </header>
      
      <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 size={48} className="animate-spin text-brand-500" />
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest text-center">Processando conexão...</p>
          </div>
        ) : isConnected ? (
          <div className="text-center space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-white">Conexão Ativa!</h3>
              <p className="text-slate-400 max-w-md mx-auto">Sua conta do Studio está vinculada ao Strava. Suas próximas corridas serão sincronizadas automaticamente.</p>
            </div>
            <button
              onClick={handleDisconnect}
              className="bg-red-500/10 text-red-500 font-black py-4 px-8 rounded-2xl uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Power size={16} /> Desconectar
            </button>
          </div>
        ) : (
          <div className="text-center space-y-12">
            <div>
                <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter">Benefícios da Conexão</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <BenefitCard icon={Zap} title="Sincronização Automática" description="Suas corridas registradas no Strava aparecem aqui sem esforço manual."/>
                    <BenefitCard icon={BarChart} title="Análise de Performance" description="Receba insights detalhados sobre sua evolução, ritmo e consistência."/>
                    <BenefitCard icon={Trophy} title="Rankings e Desafios" description="Participe automaticamente dos desafios do Studio e suba no ranking."/>
                </div>
            </div>
            
            <div className="p-6 bg-brand-500/5 rounded-2xl border border-brand-500/20 flex items-center gap-4">
                <Info size={24} className="text-brand-500 shrink-0"/>
                <p className="text-xs text-brand-200 text-left">Ao conectar, você autorizará o Studio a visualizar suas atividades de corrida. Respeitamos sua privacidade e não compartilharemos seus dados.</p>
            </div>

            <button
              onClick={handleConnect}
              className="bg-brand-600 text-white font-black py-5 px-10 rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-brand-600/30 hover:bg-brand-500 transition-all flex items-center justify-center gap-3 mx-auto"
            >
              <Share2 size={20} /> Conectar com Strava
            </button>
          </div>
        )}
      </div>

       <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl">
        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter flex items-center gap-3">
          <BookOpen size={24} className="text-brand-500" />
          Como Funciona? Guia Rápido
        </h3>
        
        <div className="flex border-b border-dark-800 mb-6">
          <button onClick={() => setActiveFaqTab('student')} className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeFaqTab === 'student' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-slate-500 hover:text-white'}`}>
            <UserIcon size={16} /> Para Alunos
          </button>
          {isStaff && (
            <button onClick={() => setActiveFaqTab('staff')} className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeFaqTab === 'staff' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-slate-500 hover:text-white'}`}>
              <GraduationCap size={16} /> Para Treinadores & Gestão
            </button>
          )}
        </div>

        <div className="space-y-2">
          {activeFaqTab === 'student' && faqData.student.map((q, i) => (
            <AccordionItem key={i} question={q.q} answer={q.a} />
          ))}
          {activeFaqTab === 'staff' && faqData.staff.map((q, i) => (
            <AccordionItem key={i} question={q.q} answer={q.a} />
          ))}
        </div>
      </div>

       <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl">
         <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter">Atividades Recentes do Strava</h3>
         <div className="py-16 text-center bg-dark-900 rounded-2xl border border-dashed border-dark-800">
            <Zap size={40} className="mx-auto text-dark-800 mb-4" />
            <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">
              {isConnected ? 'Aguardando sua próxima corrida...' : 'Conecte sua conta para ver suas atividades aqui.'}
            </p>
         </div>
       </div>
    </div>
  );
};

const BenefitCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="bg-dark-900 p-6 rounded-2xl border border-dark-800">
        <Icon size={24} className="text-brand-500 mb-3"/>
        <h4 className="font-bold text-white text-sm mb-2">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
    </div>
);