
import React, { useState, useEffect } from 'react';
import { User, UserRole, AcademySettings } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { SettingsService } from '../services/settingsService';
import { 
  Share2, Zap, CheckCircle2, XCircle, BarChart, Trophy, Power, 
  Loader2, Info, BookOpen, ChevronDown, User as UserIcon, 
  GraduationCap, Shield, Settings, ExternalLink, StepForward, AlertTriangle,
  Copy, Globe
} from 'lucide-react';

interface StravaPageProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const StravaPage: React.FC<StravaPageProps> = ({ currentUser, onUpdateUser, addToast }) => {
  const [isConnected, setIsConnected] = useState(!!currentUser.stravaAccessToken);
  const [isLoading, setIsLoading] = useState(false);
  const [academySettings, setAcademySettings] = useState<AcademySettings | null>(null);
  const [activeFaqTab, setActiveFaqTab] = useState<'student' | 'staff' | 'setup'>(
    currentUser.role === UserRole.STUDENT ? 'student' : 'setup'
  );

  const isStaff = currentUser.role !== UserRole.STUDENT;
  
  // Define o URI de redirecionamento para a raiz do app atual
  const REDIRECT_URI = window.location.origin;
  const CALLBACK_DOMAIN = window.location.hostname;

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const settings = await SettingsService.getSettings();
            setAcademySettings(settings);
        } catch (e) {
            console.error("Erro ao carregar configurações do Strava:", e);
        }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleStravaRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        addToast("A conexão foi cancelada ou negada no Strava.", "error");
        window.history.replaceState({}, document.title, REDIRECT_URI);
        return;
      }

      if (code && academySettings) {
        setIsLoading(true);
        addToast("Validando autorização...", "info");
        
        // Limpa a URL imediatamente para evitar reprocessamento
        window.history.replaceState({}, document.title, REDIRECT_URI);

        try {
          // Tenta realizar a troca do CODE pelo ACCESS_TOKEN
          const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: academySettings.stravaClientId,
              client_secret: academySettings.stravaClientSecret,
              code: code,
              grant_type: 'authorization_code'
            })
          });

          const data = await response.json();

          if (data.access_token) {
            const updatedUser = { 
              ...currentUser, 
              stravaAccessToken: data.access_token,
              stravaRefreshToken: data.refresh_token,
            };
            await SupabaseService.updateUser(updatedUser);
            onUpdateUser(updatedUser);
            setIsConnected(true);
            addToast("Conta Strava vinculada com sucesso!", "success");
          } else {
            console.error("Strava Response Error:", data);
            addToast(`Erro Strava: ${data.message || 'Verifique o Secret nas configurações.'}`, "error");
          }
        } catch (error: any) {
          console.error("Erro de Rede/CORS no Strava:", error);
          // O erro de CORS acontece porque o Strava não permite troca de token via Frontend (Browser)
          addToast("Erro de Segurança (CORS): O navegador bloqueou a troca de chaves. Verifique as configurações de domínio no painel do Strava.", "error");
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (academySettings) {
        handleStravaRedirect();
    }
  }, [academySettings, currentUser, onUpdateUser, addToast, REDIRECT_URI]);

  const handleConnect = () => {
    if (!academySettings?.stravaClientId) {
        addToast("Configure o Client ID primeiro.", "error");
        return;
    }
    
    // Escopos necessários para ler atividades
    const scope = "read,activity:read_all";
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${academySettings.stravaClientId}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&approval_prompt=force&scope=${scope}`;
    
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!confirm("Deseja desconectar sua conta do Strava?")) return;
    setIsLoading(true);
    try {
      const updatedUser = { ...currentUser, stravaAccessToken: undefined, stravaRefreshToken: undefined };
      await SupabaseService.updateUser(updatedUser);
      onUpdateUser(updatedUser);
      setIsConnected(false);
      addToast("Conta desconectada.", "success");
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
          Sincronize suas corridas automaticamente e dispute o topo do ranking.
        </p>
      </header>
      
      <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl relative overflow-hidden">
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
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Status: Conectado</h3>
              <p className="text-slate-400 max-w-md mx-auto text-sm italic">"Suas atividades salvas no Strava agora aparecem automaticamente no Studio."</p>
            </div>
            <button onClick={handleDisconnect} className="bg-red-500/10 text-red-500 font-black py-4 px-8 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 mx-auto border border-red-500/20">
              <Power size={14} /> Desvincular Conta
            </button>
          </div>
        ) : (
          <div className="text-center space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <BenefitCard icon={Zap} title="Sincronização" desc="Correu lá, salvou aqui. Sem tabelas manuais."/>
                <BenefitCard icon={BarChart} title="Performance" desc="Pace e distância analisados pelo seu coach."/>
                <BenefitCard icon={Trophy} title="Ranking" desc="Dispute metas com toda a comunidade."/>
            </div>
            
            <div className="space-y-4">
                <button onClick={handleConnect} className="bg-[#FC4C02] text-white font-black py-5 px-12 rounded-[2rem] uppercase tracking-widest text-sm shadow-2xl shadow-orange-600/30 hover:scale-105 transition-all flex items-center justify-center gap-3 mx-auto">
                <Share2 size={20} /> Conectar com Strava
                </button>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Requer conta Strava ativa</p>
            </div>
          </div>
        )}
      </div>

       <div className="bg-dark-950 rounded-[2.5rem] border border-dark-800 shadow-2xl overflow-hidden">
        <div className="flex border-b border-dark-800 bg-dark-900/50">
          {isStaff && (
            <button onClick={() => setActiveFaqTab('setup')} className={`flex-1 flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeFaqTab === 'setup' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-slate-500 hover:text-white'}`}>
              <Settings size={16} /> 1. Configuração Técnica
            </button>
          )}
          <button onClick={() => setActiveFaqTab('student')} className={`flex-1 flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeFaqTab === 'student' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-slate-500 hover:text-white'}`}>
            <UserIcon size={16} /> 2. Manual do Aluno
          </button>
        </div>

        <div className="p-8">
          {activeFaqTab === 'setup' && (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-brand-500/5 p-6 rounded-3xl border border-brand-500/20">
                    <h4 className="text-white font-black uppercase tracking-tighter text-xl mb-6 flex items-center gap-2">
                        <Shield className="text-brand-500" size={24}/> Diagnóstico de Integração
                    </h4>
                    
                    <div className="space-y-6">
                        <div className="p-5 bg-dark-900 rounded-2xl border border-dark-800">
                            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Globe size={12}/> Authorization Callback Domain (Obrigatório)
                            </p>
                            <div className="flex items-center justify-between gap-4">
                                <code className="text-brand-500 font-mono text-sm bg-black/40 px-3 py-2 rounded-lg flex-1 overflow-hidden truncate">
                                    {CALLBACK_DOMAIN}
                                </code>
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(CALLBACK_DOMAIN); addToast("Domínio copiado!", "info"); }}
                                    className="p-3 bg-dark-800 text-white rounded-xl hover:bg-brand-600 transition-all"
                                    title="Copiar Domínio"
                                >
                                    <Copy size={16}/>
                                </button>
                            </div>
                            <p className="text-[10px] text-amber-500 font-bold mt-3 leading-relaxed">
                                Atenção: No site do Strava, cole EXATAMENTE o texto acima. Não inclua "https://" nem "/" no final.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Step item="1" title="Crie a App no Strava" desc="Acesse strava.com/settings/api." />
                            <Step item="2" title="Defina o Domínio" desc="Use o domínio de callback mostrado acima." />
                            <Step item="3" title="Copie as Chaves" desc="Pegue o Client ID e Secret e salve no menu Configurações." />
                            <Step item="4" title="Redirect URI" desc={`Certifique-se que o Redirect URI é: ${REDIRECT_URI}`} />
                        </div>
                    </div>

                    <a href="https://www.strava.com/settings/api" target="_blank" className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-500 transition-all shadow-xl shadow-brand-600/20">
                        Abrir Painel Strava API <ExternalLink size={14}/>
                    </a>
                </div>
                
                <div className="bg-dark-900 p-6 rounded-3xl border border-dark-800">
                    <p className="text-slate-400 text-xs leading-relaxed">
                        <Info size={16} className="inline mr-2 text-brand-500" />
                        <b>Nota sobre CORS:</b> Se você estiver testando localmente ou em domínios temporários, o Strava pode bloquear a troca de tokens via navegador. Em produção, este domínio deve ser fixo e validado no painel do Strava.
                    </p>
                </div>
            </div>
          )}

          {activeFaqTab === 'student' && (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                    <h4 className="text-white font-black uppercase tracking-tighter text-xl mb-4 flex items-center gap-2">
                        <UserIcon className="text-emerald-500" size={24}/> Passo a Passo para o Aluno
                    </h4>
                    <div className="space-y-6">
                        <Step item="1" title="Autorize o Studio" desc="Clique em 'Conectar com Strava'. Você será levado ao site oficial do Strava." />
                        <Step item="2" title="Dê as Permissões" desc="Marque todas as caixas, especialmente 'Visualizar atividades'. Isso é essencial para o ranking." />
                        <Step item="3" title="Confirmação" desc="Você voltará para este app e verá o status 'Conectado'." />
                        <Step item="4" title="Treine" desc="Suas futuras corridas serão importadas segundos após você salvá-las no Strava." />
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
