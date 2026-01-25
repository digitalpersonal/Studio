import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Share2, Zap, CheckCircle2, XCircle, BarChart, Trophy, Power, Loader2, Info } from 'lucide-react';

// --- Mock da URL de autorização do Strava ---
// Em um app real, o client_id viria de variáveis de ambiente.
const STRAVA_AUTH_URL = `https://www.strava.com/oauth/authorize?client_id=12345&response_type=code&redirect_uri=${window.location.origin}&approval_prompt=force&scope=read,activity:read_all`;

interface StravaPageProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const StravaPage: React.FC<StravaPageProps> = ({ currentUser, onUpdateUser, addToast }) => {
  const [isConnected, setIsConnected] = useState(!!currentUser.stravaAccessToken);
  const [isLoading, setIsLoading] = useState(false);

  // Simula o fluxo de autorização OAuth2 do Strava
  useEffect(() => {
    const handleStravaRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const scope = urlParams.get('scope');

      if (code && scope?.includes('activity:read_all')) {
        setIsLoading(true);
        addToast("Autorização recebida! Finalizando conexão...", "info");

        // Limpa a URL para remover os parâmetros do Strava
        window.history.replaceState({}, document.title, window.location.pathname);

        // --- SIMULAÇÃO: Troca do código por tokens de acesso ---
        // Em um app real, aqui você faria uma chamada para o seu backend
        // que por sua vez faria uma chamada segura para a API do Strava.
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
          onUpdateUser(updatedUser); // Atualiza o estado global do usuário no App.tsx
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
    setIsLoading(true);
    addToast("Redirecionando para o Strava...", "info");
    // Simula um clique de autorização para obter o 'code' na URL.
    // Em um app de produção, a linha abaixo seria a única necessária.
    // window.location.href = STRAVA_AUTH_URL;

    // Apenas para simulação, recarregamos a página com os parâmetros esperados.
    const mockRedirectUrl = `${window.location.origin}?code=mock_strava_code_123456&scope=read,activity:read_all`;
    window.location.href = mockRedirectUrl;
  };

  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar sua conta do Strava? Suas atividades não serão mais sincronizadas automaticamente.")) return;

    setIsLoading(true);
    try {
      // --- SIMULAÇÃO: Revogação do token ---
      // Em um app real, você faria uma chamada ao seu backend para revogar o token na API do Strava.
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
          Conecte sua conta do Strava para automatizar o registro das suas corridas, participar de rankings e receber análises de performance detalhadas.
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
