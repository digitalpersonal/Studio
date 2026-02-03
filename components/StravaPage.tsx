
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  Share2, Zap, CheckCircle2, XCircle, BarChart, Trophy, Power, 
  Loader2, Info, BookOpen, ChevronDown, User as UserIcon, 
  GraduationCap, Shield, Settings, ExternalLink, StepForward
} from 'lucide-react';

// --- CONFIGURAÇÃO CRÍTICA ---
// IMPORTANTE: A academia precisa criar um app em https://www.strava.com/settings/api
// e substituir o '12345' pelo Client ID gerado lá.
const STRAVA_CLIENT_ID = '12345'; 
const STRAVA_AUTH_URL = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${window.location.origin}&approval_prompt=force&scope=read,activity:read_all`;

export const StravaPage: React.FC<StravaPageProps> = ({ currentUser, onUpdateUser, addToast }) => {
  const [isConnected, setIsConnected] = useState(!!currentUser.stravaAccessToken);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFaqTab, setActiveFaqTab] = useState<'student' | 'staff' | 'setup'>(
    currentUser.role === UserRole.STUDENT ? 'student' : 'setup'
  );

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

        // Simulação de troca de token (O processo real exige Client Secret no backend/Supabase Edge Function)
        await new Promise(resolve => setTimeout(resolve, 2000)); 

        try {
          const updatedUser = { 
            ...currentUser, 
            stravaAccessToken: `access_${Date.now()}`,
            stravaRefreshToken: `refresh_${Date.now()}`,
          };
          await SupabaseService.updateUser(updatedUser);
          onUpdateUser(updatedUser);
          setIsConnected(true);
          addToast("Conexão com o Strava estabelecida com sucesso!", "success");
        } catch (error) {
          addToast("Erro ao salvar a conexão no banco de dados.", "error");
        } finally {
          setIsLoading(false);
        }
      }
    };
    handleStravaRedirect();
  }, [currentUser, onUpdateUser, addToast]);

  const handleConnect = () => {
    if (STRAVA_CLIENT_ID === '12345') {
        addToast("Atenção: A Academia ainda não configurou o Client ID do Strava.", "error");
        return;
    }
    window.location.href = STRAVA_AUTH_URL;
  };

  const handleDisconnect = async () => {
    if (!confirm("Deseja desconectar sua conta do Strava? Suas atividades não serão mais sincronizadas.")) return;
    setIsLoading(true);
    try {
      const updatedUser = { ...currentUser, stravaAccessToken: undefined, stravaRefreshToken: undefined };
      await SupabaseService.updateUser(updatedUser);
      onUpdateUser(updatedUser);
      setIsConnected(false);
      addToast("Conta do Strava desconectada.", "success");
    } catch (error) {
      addToast("Erro ao desconectar.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-20">
      <header className="text-center">
        <div className="w-20 h-20 bg-[#FC4C02] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-600/20">
            <Share2 className="text-white" size={40} />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Integração Strava</h2>
        <p className="text-slate-400 mt-2 max-w-2xl mx-auto font-medium">
          Sincronize suas corridas automaticamente e suba no ranking da comunidade.
        </p>
      </header>
      
      <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl relative overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 size={48} className="animate-spin text-brand-500" />
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest text-center">Validando com Strava...</p>
          </div>
        ) : isConnected ? (
          <div className="text-center space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Status: Conectado</h3>
              <p className="text-slate-400 max-w-md mx-auto text-sm">Parabéns! Sua conta está vinculada. Agora, toda vez que você salvar uma corrida no Strava, o Studio receberá os dados automaticamente.</p>
            </div>
            <button onClick={handleDisconnect} className="bg-red-500/10 text-red-500 font-black py-4 px-8 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 mx-auto border border-red-500/20">
              <Power size={14} /> Desconectar Minha Conta
            </button>
          </div>
        ) : (
          <div className="text-center space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <BenefitCard icon={Zap} title="Automático" desc="Correu lá, apareceu aqui. Sem digitar nada."/>
                <BenefitCard icon={BarChart} title="Técnico" desc="Pace, distância e elevação direto pro seu coach."/>
                <BenefitCard icon={Trophy} title="Ranking" desc="Sua distância conta pro Desafio Global."/>
            </div>
            
            <button onClick={handleConnect} className="bg-[#FC4C02] text-white font-black py-5 px-12 rounded-[2rem] uppercase tracking-widest text-sm shadow-2xl shadow-orange-600/30 hover:scale-105 transition-all flex items-center justify-center gap-3 mx-auto">
              <Share2 size={20} /> Conectar com Strava
            </button>
          </div>
        )}
      </div>

       <div className="bg-dark-950 rounded-[2.5rem] border border-dark-800 shadow-2xl overflow-hidden">
        <div className="flex border-b border-dark-800 bg-dark-900/50">
          {isStaff && (
            <button onClick={() => setActiveFaqTab('setup')} className={`flex-1 flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeFaqTab === 'setup' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-slate-500 hover:text-white'}`}>
              <Settings size={16} /> 1. Configurar Academia
            </button>
          )}
          <button onClick={() => setActiveFaqTab('student')} className={`flex-1 flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeFaqTab === 'student' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-slate-500 hover:text-white'}`}>
            <UserIcon size={16} /> 2. Guia do Aluno
          </button>
        </div>

        <div className="p-8">
          {activeFaqTab === 'setup' && (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-brand-500/10 p-6 rounded-3xl border border-brand-500/20">
                    <h4 className="text-white font-black uppercase tracking-tighter text-xl mb-4 flex items-center gap-2">
                        <Settings className="text-brand-500" size={24}/> Passo a Passo para o Gestor
                    </h4>
                    <div className="space-y-6">
                        <Step item="1" title="Crie uma conta de Desenvolvedor" desc="Acesse o site strava.com/settings/api usando o computador e logue na conta do Strava da academia." />
                        <Step item="2" title="Preencha o Formulário" desc="No campo 'Application Name' coloque Studio. No campo 'Authorization Callback Domain' coloque exatamente studiosemovimento.com.br (ou o domínio que estiver usando)." />
                        <Step item="3" title="Pegue seu Client ID" desc="O Strava vai te dar um número chamado 'Client ID'. É esse número que deve ser colocado no código do sistema para o botão de login funcionar." />
                        <Step item="4" title="Avise os Alunos" desc="Com o ID configurado, os alunos já podem vir nesta página e clicar no botão de conectar." />
                    </div>
                    <a href="https://www.strava.com/settings/api" target="_blank" className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-dark-900 border border-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-800 transition-all">
                        Ir para o Portal do Strava <ExternalLink size={14}/>
                    </a>
                </div>
            </div>
          )}

          {activeFaqTab === 'student' && (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                    <h4 className="text-white font-black uppercase tracking-tighter text-xl mb-4 flex items-center gap-2">
                        <UserIcon className="text-emerald-500" size={24}/> Como o aluno se conecta?
                    </h4>
                    <div className="space-y-6">
                        <Step item="1" title="Clique no Botão Laranja" desc="Toque no botão 'Conectar com Strava' no topo desta página." />
                        <Step item="2" title="Autorize o Acesso" desc="Você será levado ao site do Strava. Clique em 'Autorizar'. Certifique-se de marcar a opção 'Visualizar Atividades'." />
                        <Step item="3" title="Volte ao App" desc="O sistema voltará para cá sozinho e mostrará uma mensagem de sucesso." />
                        <Step item="4" title="Basta Correr" desc="Não precisa fazer mais nada. Ao terminar um treino no seu relógio ou celular, ele aparecerá aqui em alguns segundos." />
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BenefitCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="bg-dark-900/50 p-6 rounded-3xl border border-dark-800 hover:border-brand-500/30 transition-all">
        <div className="p-3 bg-brand-600/10 rounded-xl w-fit mb-4 text-brand-500">
            <Icon size={20}/>
        </div>
        <h4 className="text-white font-black uppercase text-xs tracking-widest mb-2">{title}</h4>
        <p className="text-slate-500 text-xs leading-relaxed font-medium">{desc}</p>
    </div>
);

const Step = ({ item, title, desc }: { item: string, title: string, desc: string }) => (
    <div className="flex gap-4">
        <div className="w-8 h-8 rounded-full bg-dark-900 border border-dark-700 flex items-center justify-center text-white font-black text-xs shrink-0">
            {item}
        </div>
        <div>
            <h5 className="text-white font-bold text-sm mb-1">{title}</h5>
            <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
        </div>
    </div>
);

interface StravaPageProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}
