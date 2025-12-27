

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
        const { challenge, totalDistance } = await SupabaseService.getGlobalChallengeProgress();
        setGlobalChallenge(challenge);
        setChallengeProgress(totalDistance);

        // Fetch all users, not just students
        const allUsers = await SupabaseService.getAllUsers();
        setStudents(allUsers.sort((a, b) => String(a.name).localeCompare(String(b.name)))); 
      } catch (error: any) {
        console.error("Erro ao carregar ranking:", error.message || JSON.stringify(error));
        addToast(`Erro ao carregar ranking: ${error.message || JSON.stringify(error)}`, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchRankingData();
  }, [addToast]);

  const progressPercentage = globalChallenge 
    ? Math.min(100, (challengeProgress / globalChallenge.targetValue) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <Loader2 className="animate-spin text-brand-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Ranking & Desafios</h2>
          <p className="text-slate-400 text-sm">Acompanhe o desempenho da comunidade e o progresso em desafios.</p>
        </div>
        {currentUser.role !== UserRole.STUDENT && ( 
          <button 
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg shadow-brand-500/20 disabled:opacity-50"
            disabled 
          >
            <Award size={16} className="mr-2" /> Gerenciar Desafios
          </button>
        )}
      </header>

      {globalChallenge ? (
        <div className="bg-brand-600 p-8 rounded-3xl shadow-2xl shadow-brand-500/20 text-white relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <Trophy size={40} className="text-brand-100" />
            <div>
              <p className="text-brand-100 text-[10px] font-bold uppercase tracking-widest mb-1">Desafio Global</p>
              <h3 className="text-3xl font-black">{String(globalChallenge.title)}</h3>
            </div>
          </div>
          <p className="text-brand-100 mb-4">{String(globalChallenge.description)}</p>

          <div className="w-full bg-brand-500 rounded-full h-3 mb-2">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm font-bold text-white">
            {challengeProgress.toLocaleString()} / {globalChallenge.targetValue.toLocaleString()} {String(globalChallenge.unit)}
          </p>
          <div className="absolute top-8 right-8 text-brand-100 opacity-20">
            <Award size={100} />
          </div>
        </div>
      ) : (
        <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl text-center">
          <p className="text-slate-500 italic">Nenhum desafio global ativo no momento.</p>
        </div>
      )}

      <div className="bg-dark-950 rounded-3xl border border-dark-800 overflow-hidden shadow-2xl mt-8">
        <div className="p-6 border-b border-dark-800 flex justify-between items-center bg-dark-950/50">
           <h3 className="font-bold flex items-center gap-2 text-white"><Hash size={18}/> Usuários</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-dark-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">Posição</th>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4 text-right">Métrica (Ex: Distância)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {students.map((s, index) => (
                <tr key={s.id} className="hover:bg-dark-900/50 transition-colors group">
                  <td className="px-6 py-4 text-white font-bold">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-8 h-8 rounded-full border border-dark-800" alt={String(s.name)} />
                      <p className="text-white font-bold">{String(s.name)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-white font-semibold">
                    {(Math.random() * 500 + 100).toFixed(0)} {globalChallenge?.unit || 'unidades'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};