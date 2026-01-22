
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Challenge, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Trophy, Loader2, Award, ChevronRight, Hash, Plus, X, Zap, Target, History, ArrowLeft } from 'lucide-react';

interface RankingPageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const RankingPage: React.FC<RankingPageProps> = ({ currentUser, onNavigate, addToast }) => {
  const [globalChallenge, setGlobalChallenge] = useState<Challenge | null>(null);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [rankingData, setRankingData] = useState<{studentId: string, total: number}[]>([]);
  const [students, setStudents] = useState<User[]>([]); 
  const [loading, setLoading] = useState(true);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStaff = currentUser.role !== UserRole.STUDENT;

  const fetchRankingData = async () => {
    setLoading(true);
    try {
      const { challenge, totalDistance, ranking } = await SupabaseService.getGlobalChallengeProgress();
      setGlobalChallenge(challenge);
      setChallengeProgress(totalDistance);
      setRankingData(ranking || []);
      const allUsers = await SupabaseService.getAllUsers();
      setStudents(allUsers.filter(u => u.role === UserRole.STUDENT)); 
    } catch (error: any) {
      addToast(`Erro ao carregar ranking.`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingData();
  }, []);

  const progressPercentage = globalChallenge 
    ? Math.min(100, (challengeProgress / globalChallenge.targetValue) * 100)
    : 0;

  const fullRanking = useMemo(() => {
    return rankingData.map(r => {
        const student = students.find(s => s.id === r.studentId);
        return {
            ...r,
            name: student?.name || 'Atleta',
            avatar: student?.avatarUrl
        };
    });
  }, [rankingData, students]);

  const handleCreateChallenge = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const newChallenge: Omit<Challenge, 'id'> = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        targetValue: Number(formData.get('targetValue')),
        unit: formData.get('unit') as string,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
    };

    try {
        await SupabaseService.saveChallenge(newChallenge);
        addToast("Desafio global lançado! 🔥", "success");
        setShowChallengeForm(false);
        await fetchRankingData();
    } catch (e) {
        addToast("Erro ao criar desafio.", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleLogActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!globalChallenge || !showLogActivity) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const value = Number(formData.get('value'));
    try {
        await SupabaseService.addChallengeEntry(globalChallenge.id, showLogActivity.id, value);
        addToast(`Atividade registrada com sucesso!`, "success");
        setShowLogActivity(null);
        await fetchRankingData();
    } catch (e) {
        addToast("Erro ao registrar atividade.", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading && !showChallengeForm && !showLogActivity) {
    return <div className="flex justify-center items-center h-full min-h-[500px]"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('DASHBOARD')} className="p-2.5 bg-dark-950 border border-dark-800 text-slate-500 rounded-full hover:text-brand-500 hover:border-brand-500/50 transition-all active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Ranking & Desafios</h2>
            <p className="text-slate-400 text-sm">Supere limites e lidere a comunidade!</p>
          </div>
        </div>
        {isStaff && ( 
          <button onClick={() => setShowChallengeForm(true)} className="bg-brand-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-brand-600/20 active:scale-95 transition-all">
            <Plus size={16} className="mr-2" /> Novo Desafio
          </button>
        )}
      </header>

      {globalChallenge ? (
        <div className="bg-brand-600 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md"><Trophy size={40} className="text-white" /></div>
            <div>
              <p className="text-brand-100 text-[10px] font-black uppercase tracking-widest mb-1">Desafio Global Ativo</p>
              <h3 className="text-3xl font-black uppercase tracking-tighter">{String(globalChallenge.title)}</h3>
            </div>
          </div>
          <p className="text-brand-100 mb-6 text-sm max-w-2xl font-medium leading-relaxed relative z-10">{String(globalChallenge.description)}</p>
          <div className="space-y-2 relative z-10">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-brand-100">
                  <span>Meta da Comunidade</span>
                  <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-brand-800/50 rounded-full h-4 p-1 border border-brand-500/30">
                <div className="bg-white h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <p className="text-xs font-black text-white uppercase tracking-widest text-center pt-2">{challengeProgress.toLocaleString()} / {globalChallenge.targetValue.toLocaleString()} {String(globalChallenge.unit)}</p>
          </div>
          <Award size={200} className="absolute -top-10 -right-10 text-white opacity-10 rotate-12" />
        </div>
      ) : (
        <div className="py-20 text-center bg-dark-950 rounded-[3rem] border border-dashed border-dark-800">
          <Award size={64} className="mx-auto text-dark-800 mb-4 opacity-50" />
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nenhum desafio ativo.</p>
        </div>
      )}

      <div className="bg-dark-950 rounded-[2.5rem] border border-dark-800 overflow-hidden shadow-2xl mt-8">
        <div className="p-8 border-b border-dark-800 flex justify-between items-center bg-dark-950/50">
           <h3 className="font-black uppercase tracking-tighter text-white flex items-center gap-3"><History size={18}/> Quadro de Líderes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-dark-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr><th className="px-8 py-5">Rank</th><th className="px-8 py-5">Atleta</th><th className="px-8 py-5 text-right">Acumulado</th>{isStaff && <th className="px-8 py-5 text-right">Ação</th>}</tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {fullRanking.length > 0 ? fullRanking.map((r, index) => (
                <tr key={r.studentId} className={`hover:bg-dark-900/50 transition-colors group ${index === 0 ? 'bg-brand-500/5' : ''}`}>
                  <td className="px-8 py-5">
                    {index === 0 ? <Trophy size={20} className="text-amber-500" /> : index === 1 ? <Award size={20} className="text-slate-400" /> : index === 2 ? <Award size={20} className="text-amber-700" /> : <span className="text-slate-600 font-bold ml-1">{index + 1}º</span>}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <img src={String(r.avatar || `https://ui-avatars.com/api/?name=${String(r.name)}`)} className="w-10 h-10 rounded-xl border-2 border-dark-800" />
                      <p className={`font-bold text-base ${index === 0 ? 'text-white' : 'text-slate-300'}`}>{String(r.name)}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right"><span className={`font-mono text-base font-black ${index === 0 ? 'text-brand-500' : 'text-white'}`}>{r.total.toLocaleString()}</span><span className="text-[10px] ml-1 text-slate-500 font-bold uppercase">{globalChallenge?.unit || ''}</span></td>
                  {isStaff && (
                      <td className="px-8 py-5 text-right">
                          <button onClick={() => { const s = students.find(st => st.id === r.studentId); if (s) setShowLogActivity(s); }} className="p-2 bg-dark-900 text-brand-500 rounded-xl hover:bg-brand-500 hover:text-white transition-all border border-brand-500/20"><Plus size={16} /></button>
                      </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={isStaff ? 4 : 3} className="px-8 py-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest">Sem progresso ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isStaff && globalChallenge && (
          <div className="pt-8 space-y-4">
               <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 px-2"><Target size={16} className="text-brand-500" /> Registrar p/ outros alunos</h4>
               <div className="flex flex-wrap gap-2">
                   {students.filter(s => !rankingData.some(r => r.studentId === s.id)).map(s => (
                       <button key={s.id} onClick={() => setShowLogActivity(s)} className="px-4 py-2 bg-dark-950 border border-dark-800 rounded-2xl text-xs font-bold text-slate-400 hover:border-brand-500/50 hover:text-white transition-all flex items-center gap-2">
                           <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-5 h-5 rounded-md" />{s.name.split(' ')[0]}
                       </button>
                   ))}
               </div>
          </div>
      )}

      {showChallengeForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-dark-900 border border-dark-700 p-8 rounded-[3rem] shadow-2xl max-w-lg w-full space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Novo Desafio Global</h3>
                    <button onClick={() => setShowChallengeForm(false)} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <form onSubmit={handleCreateChallenge} className="space-y-4">
                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Título</label><input name="title" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none" /></div>
                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Objetivo</label><textarea name="description" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none h-24" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Meta Total</label><input name="targetValue" type="number" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none" /></div>
                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Unidade (ex: km)</label><input name="unit" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Início</label><input name="startDate" type="date" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-xs" /></div>
                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Fim</label><input name="endDate" type="date" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-xs" /></div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-brand-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-brand-500 transition-all">
                      {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : "Publicar Desafio"}
                    </button>
                </form>
              </div>
          </div>
      )}

      {showLogActivity && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-dark-900 border border-dark-700 p-10 rounded-[3rem] shadow-2xl max-w-sm w-full space-y-6 text-center">
                  <div className="bg-brand-500/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-2"><Zap className="text-brand-500" size={32} /></div>
                  <h3 className="text-white font-black text-xl uppercase tracking-tighter">Registrar p/ {showLogActivity.name.split(' ')[0]}</h3>
                  <form onSubmit={handleLogActivity} className="space-y-6">
                      <div className="relative"><input name="value" type="number" step="0.1" autoFocus required className="w-full bg-dark-950 border-2 border-dark-800 rounded-2xl p-6 text-white text-center text-3xl font-black focus:border-brand-500 outline-none" /><span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-600 uppercase text-xs">{globalChallenge?.unit}</span></div>
                      <div className="flex gap-3">
                          <button type="button" onClick={() => setShowLogActivity(null)} className="flex-1 py-4 bg-dark-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Sair</button>
                          <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : "Salvar"}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
