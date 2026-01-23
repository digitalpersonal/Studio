
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Challenge } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Trophy, Loader2, Award, ChevronRight, Hash } from 'lucide-react';

interface RankingPageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const RankingPage: React.FC<RankingPageProps> = ({ currentUser, addToast }) => {
  const [globalChallenge, setGlobalChallenge] = useState<Challenge | null>(null);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [students, setStudents] = useState<User[]>([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankingData = async () => {
      setLoading(true);
      try {
        const result = await SupabaseService.getGlobalChallengeProgress();
        if (result) {
            setGlobalChallenge(result.challenge);
            setChallengeProgress(result.totalDistance || 0);
        }

        const allUsers = await SupabaseService.getAllUsers();
        if (allUsers && Array.isArray(allUsers)) {
            const onlyStudents = allUsers.filter(u => u.role === UserRole.STUDENT);
            setStudents([...onlyStudents].sort((a, b) => String(a.name).localeCompare(String(b.name)))); 
        }
      } catch (error: any) {
        console.error("Erro ao carregar ranking:", error);
        addToast(`Falha ao sincronizar ranking em tempo real.`, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchRankingData();
  }, [addToast]);

  const progressPercentage = useMemo(() => {
    if (!globalChallenge || !globalChallenge.targetValue || globalChallenge.targetValue <= 0) return 0;
    return Math.min(100, (challengeProgress / globalChallenge.targetValue) * 100);
  }, [globalChallenge, challengeProgress]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[500px] gap-4">
        <Loader2 className="animate-spin text-brand-500" size={48} />
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando Ranking...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Ranking & Desafios</h2>
          <p className="text-slate-400 text-sm font-medium">Acompanhe o desempenho da comunidade.</p>
        </div>
        {currentUser.role !== UserRole.STUDENT && ( 
          <button 
            className="bg-brand-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-brand-600/20 active:scale-95 transition-all"
          >
            <Award size={16} className="mr-2" /> Novo Desafio
          </button>
        )}
      </header>

      {globalChallenge ? (
        <div className="bg-brand-600 p-8 rounded-[2.5rem] shadow-2xl shadow-brand-500/20 text-white relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Trophy size={40} className="text-white" />
            </div>
            <div>
              <p className="text-brand-100 text-[10px] font-black uppercase tracking-widest mb-1">Desafio Ativo</p>
              <h3 className="text-3xl font-black uppercase tracking-tighter">{String(globalChallenge.title)}</h3>
            </div>
          </div>
          <p className="text-brand-100 mb-6 text-sm font-medium relative z-10 max-w-xl">{String(globalChallenge.description)}</p>

          <div className="relative z-10">
              <div className="w-full bg-black/20 rounded-full h-4 mb-3 border border-white/10 p-0.5 shadow-inner">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-1000 ease-out shadow-lg" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-end">
                  <p className="text-xs font-black text-white uppercase tracking-widest">
                    {challengeProgress.toLocaleString()} <span className="text-brand-100 font-bold">/ {globalChallenge.targetValue.toLocaleString()} {String(globalChallenge.unit)}</span>
                  </p>
                  <p className="text-2xl font-black text-white">{progressPercentage.toFixed(0)}%</p>
              </div>
          </div>

          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
            <Award size={180} />
          </div>
        </div>
      ) : (
        <div className="bg-dark-950 p-12 rounded-[3rem] border border-dashed border-dark-800 shadow-xl text-center">
          <Trophy size={48} className="mx-auto text-dark-800 mb-4" />
          <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Nenhum desafio ativo no momento.</p>
        </div>
      )}

      <div className="bg-dark-950 rounded-[2.5rem] border border-dark-800 overflow-hidden shadow-2xl mt-8">
        <div className="p-6 border-b border-dark-800 flex justify-between items-center bg-dark-950/50">
           <h3 className="font-black flex items-center gap-2 text-white uppercase text-xs tracking-widest"><Hash size={18} className="text-brand-500" /> Top Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-dark-900/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-6 w-20">Pos</th>
                <th className="px-6 py-6">Membro</th>
                <th className="px-6 py-6 text-right">Pontos / Km</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {students.length > 0 ? students.map((s, index) => (
                <tr key={s.id} className="hover:bg-dark-900/50 transition-colors group">
                  <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                          index === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                          index === 1 ? 'bg-slate-400/20 text-slate-400 border border-slate-400/30' :
                          index === 2 ? 'bg-orange-900/20 text-orange-700 border border-orange-900/30' :
                          'bg-dark-800 text-slate-500'
                      }`}>
                          {index + 1}
                      </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-10 h-10 rounded-xl border border-dark-800 object-cover" alt={String(s.name)} />
                      <p className="text-white font-bold">{String(s.name)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-white font-black text-base">
                        0
                    </span>
                    <span className="text-[10px] font-black text-slate-600 ml-1 uppercase tracking-tighter">{globalChallenge?.unit || 'unidades'}</span>
                  </td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan={3} className="px-6 py-20 text-center text-slate-600 font-bold uppercase text-[10px]">Aguardando dados dos membros...</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
