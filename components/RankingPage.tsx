
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Challenge, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Trophy, Loader2, Award, ChevronRight, Hash, Download, ArrowLeft } from 'lucide-react';

interface RankingPageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface RankedStudent extends User {
  totalDistance: number;
}

export const RankingPage: React.FC<RankingPageProps> = ({ currentUser, onNavigate, addToast }) => {
  const [globalChallenge, setGlobalChallenge] = useState<Challenge | null>(null);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [rankedStudents, setRankedStudents] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const isStaff = currentUser.role !== UserRole.STUDENT;

  useEffect(() => {
    const fetchRankingData = async () => {
      setLoading(true);
      try {
        const [challengeResult, allStudents, rankingData] = await Promise.all([
            SupabaseService.getGlobalChallengeProgress(),
            SupabaseService.getAllStudents(),
            SupabaseService.getRankingData()
        ]);

        if (challengeResult) {
            setGlobalChallenge(challengeResult.challenge);
            setChallengeProgress(challengeResult.totalDistance || 0);
        }

        const distanceMap = new Map<string, number>();
        rankingData.forEach(item => {
            const studentId = item.student_id;
            const distance = item.classes?.distance_km || 0;
            distanceMap.set(studentId, (distanceMap.get(studentId) || 0) + distance);
        });

        const studentsWithDistance = allStudents
            .filter(u => u.role === UserRole.STUDENT)
            .map(student => ({
                ...student,
                totalDistance: distanceMap.get(student.id) || 0,
            }))
            .sort((a, b) => b.totalDistance - a.totalDistance);

        setRankedStudents(studentsWithDistance);

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

  const visibleStudents = useMemo(() => {
    return isStaff ? rankedStudents : rankedStudents.slice(0, 10);
  }, [isStaff, rankedStudents]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[500px] gap-4">
        <Loader2 className="animate-spin text-brand-500" size={48} />
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando Ranking...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in printable-area">
      <button 
        onClick={() => onNavigate('DASHBOARD')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-2 transition-colors no-print"
      >
        <ArrowLeft size={14} /> Voltar ao Início
      </button>

      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Ranking & Desafios</h2>
          <p className="text-slate-400 text-sm font-medium">Acompanhe o desempenho da comunidade.</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button onClick={() => window.print()} className="bg-dark-950 text-slate-400 px-4 py-3 rounded-2xl text-sm font-bold flex items-center shadow-lg border border-dark-800 hover:bg-dark-800 hover:text-white transition-all">
            <Download size={18} className="mr-2" /> Imprimir
          </button>
          {isStaff && ( 
            <button 
              className="bg-brand-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-brand-600/20 active:scale-95 transition-all"
            >
              <Award size={16} className="mr-2" /> Novo Desafio
            </button>
          )}
        </div>
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
           <h3 className="font-black flex items-center gap-2 text-white uppercase text-xs tracking-widest"><Hash size={18} className="text-brand-500" /> {isStaff ? 'Ranking Geral de Distância' : 'Top 10 Performance'} (KM)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-dark-900/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-6 w-20">Pos</th>
                <th className="px-6 py-6">Membro</th>
                <th className="px-6 py-6 text-right">Distância Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {visibleStudents.length > 0 ? visibleStudents.map((s, index) => (
                <tr key={s.id} className={`transition-colors group ${s.id === currentUser.id ? 'bg-brand-500/5' : 'hover:bg-dark-900/50'}`}>
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
                      <p className={`font-bold ${s.id === currentUser.id ? 'text-brand-500' : 'text-white'}`}>{String(s.name)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-white font-black text-base">
                        {s.totalDistance.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-black text-slate-600 ml-1 uppercase tracking-tighter">km</span>
                  </td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan={3} className="px-6 py-20 text-center text-slate-600 font-bold uppercase text-[10px]">Aguardando dados de corridas...</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isStaff && rankedStudents.length > 10 && (
            <div className="p-6 bg-dark-900/50 text-center border-t border-dark-800">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mostrando apenas os 10 primeiros colocados.</p>
            </div>
        )}
      </div>
    </div>
  );
};
