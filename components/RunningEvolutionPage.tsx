
import React, { useState, useEffect, useMemo } from 'react';
import { AttendanceRecord, User, UserRole, ClassSession, CycleSummary } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Loader2, TrendingUp, User as UserIcon, Award, BarChart3, MessageCircle, Sparkles, Flag, Clock, Zap, FileText, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type PerformanceRecord = AttendanceRecord & { classDetails?: ClassSession };

interface RunningEvolutionPageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialStudentId?: string;
}

const MetricCard = ({ label, value, icon: Icon, colorClass }: { label: string; value: string; icon: React.ElementType; colorClass: string; }) => (
    <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl">
        <div className={`p-3 rounded-2xl w-fit mb-3 border ${colorClass}`}>
            <Icon size={24}/>
        </div>
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">{label}</p>
        <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
    </div>
);

export const RunningEvolutionPage: React.FC<RunningEvolutionPageProps> = ({ currentUser, addToast, initialStudentId }) => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId || null);
    const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
    const [cycleSummaries, setCycleSummaries] = useState<CycleSummary[]>([]);
    const [filterDistance, setFilterDistance] = useState<number | 'all'>('all');

    const isStaff = currentUser.role !== UserRole.STUDENT;

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                if (isStaff) {
                    const allStudents = await SupabaseService.getAllStudents();
                    setStudents(allStudents);
                    if (initialStudentId) setSelectedStudentId(initialStudentId);
                } else {
                    setSelectedStudentId(currentUser.id);
                }
            } catch (e) {
                addToast("Erro ao carregar lista de alunos.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [currentUser, isStaff, initialStudentId, addToast]);

    useEffect(() => {
        const fetchPerformanceData = async () => {
            if (!selectedStudentId) {
                setPerformanceRecords([]);
                setCycleSummaries([]);
                return;
            }
            setLoading(true);
            try {
                const [performanceData, summaryData] = await Promise.all([
                    SupabaseService.getAttendanceForStudent(selectedStudentId, 'RUNNING'),
                    SupabaseService.getCycleSummariesForStudent(selectedStudentId)
                ]);
                setPerformanceRecords(performanceData);
                setCycleSummaries(summaryData);
            } catch (e) {
                addToast("Erro ao carregar histórico de performance.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchPerformanceData();
    }, [selectedStudentId, addToast]);
    
    const stats = useMemo(() => {
        const recordsWithPace = performanceRecords.filter(r => r.averagePace);
        if (recordsWithPace.length === 0) return { bestPace: 'N/A', totalDistance: 0, longestRun: 0 };

        const bestPaceRecord = recordsWithPace.reduce((best, current) => {
            return (current.averagePace && best.averagePace && current.averagePace < best.averagePace) ? current : best;
        });

        const totalDistance = performanceRecords.reduce((sum, r) => sum + (r.classDetails?.distanceKm || 0), 0);
        const longestRun = Math.max(...performanceRecords.map(r => r.classDetails?.distanceKm || 0));

        return {
            bestPace: bestPaceRecord.averagePace || 'N/A',
            totalDistance: totalDistance.toFixed(1),
            longestRun: longestRun.toFixed(1)
        };
    }, [performanceRecords]);
    
    const paceToSeconds = (pace: string) => {
        if (!pace) return 0;
        const parts = pace.split(' ')[0].split(':');
        if (parts.length !== 2) return 0;
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    };

    const chartData = useMemo(() => {
        return performanceRecords
            .filter(r => r.averagePace && (filterDistance === 'all' || r.classDetails?.distanceKm === filterDistance))
            .map(r => ({
                date: new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                paceSeconds: paceToSeconds(r.averagePace!),
                pace: r.averagePace,
                distance: r.classDetails?.distanceKm
            }))
            .reverse();
    }, [performanceRecords, filterDistance]);

    const availableDistances = useMemo(() => {
        const distances = new Set<number>();
        performanceRecords.forEach(r => {
            if (typeof r.classDetails?.distanceKm === 'number') {
                distances.add(r.classDetails.distanceKm);
            }
        });
        return Array.from(distances).sort((a,b) => a - b);
    }, [performanceRecords]);
    
    if (loading && performanceRecords.length === 0 && cycleSummaries.length === 0) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-brand-500" size={40} /></div>;
    }

    return (
        <div className="space-y-8 animate-fade-in printable-area">
            <header className="relative">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <TrendingUp size={32} className="text-brand-500"/> Evolução de Corrida
                </h2>
                <p className="text-slate-400 text-sm mt-1">Análise de performance, recordes e histórico de treinos.</p>
                <div className="absolute top-0 right-0 no-print">
                  <button onClick={() => window.print()} className="bg-dark-950 text-slate-400 px-4 py-3 rounded-2xl text-sm font-bold flex items-center shadow-lg border border-dark-800 hover:bg-dark-800 hover:text-white transition-all">
                    <Download size={18} className="mr-2" /> Imprimir Evolução
                  </button>
                </div>
            </header>

            {isStaff && (
                <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl flex flex-col md:flex-row items-center gap-4 no-print">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest shrink-0">Visualizando Aluno:</label>
                    <select
                        className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm font-bold"
                        value={selectedStudentId || ''}
                        onChange={e => setSelectedStudentId(e.target.value)}
                    >
                        <option value="">Selecione um aluno...</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            )}

            {!selectedStudentId ? (
                <div className="py-20 text-center bg-dark-950 rounded-[2.5rem] border border-dashed border-dark-800">
                     <UserIcon className="mx-auto text-dark-800 mb-4" size={48} />
                     <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Selecione um aluno para ver seu progresso na corrida.</p>
                </div>
            ) : performanceRecords.length > 0 || cycleSummaries.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard label="Melhor Pace" value={stats.bestPace} icon={Zap} colorClass="text-emerald-500 border-emerald-500/20 bg-emerald-500/10" />
                        <MetricCard label="Distância Total" value={`${stats.totalDistance} km`} icon={Flag} colorClass="text-brand-500 border-brand-500/20 bg-brand-500/10" />
                        <MetricCard label="Maior Distância" value={`${stats.longestRun} km`} icon={Award} colorClass="text-blue-500 border-blue-500/20 bg-blue-500/10" />
                    </div>

                    {cycleSummaries.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter mt-8">Resumos de Ciclo (IA)</h3>
                            {cycleSummaries.map(summary => (
                                <div key={summary.id} className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="font-black text-brand-500 text-[10px] uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={14}/> Ciclo Finalizado em {new Date(summary.cycleEndDate).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/20">
                                        <p className="text-[9px] font-black text-brand-500 uppercase flex items-center gap-1.5"><Sparkles size={12}/> Análise de Evolução</p>
                                        <p className="text-brand-200 text-sm mt-2 whitespace-pre-wrap leading-relaxed">{summary.summaryText}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {chartData.length > 0 && (
                      <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                              <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                  <BarChart3 className="text-brand-500"/> Evolução do Pace
                              </h3>
                              <div className="flex items-center gap-2 no-print">
                                 <label className="text-slate-500 text-[9px] font-black uppercase">Distância:</label>
                                 <select value={filterDistance} onChange={e => setFilterDistance(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-dark-900 border border-dark-700 text-white text-xs font-bold rounded-lg p-2 outline-none">
                                     <option value="all">Todas</option>
                                     {availableDistances.map(d => <option key={d} value={d}>{d} km</option>)}
                                 </select>
                              </div>
                          </div>
                          <div className="h-[300px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={chartData}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                      <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} domain={[(dataMin: number) => Math.max(0, dataMin - 10), (dataMax: number) => dataMax + 10]} tickFormatter={(s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`} />
                                      <Tooltip
                                          contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px' }}
                                          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                          formatter={(value: number, name, props) => [props.payload.pace, `Pace (${props.payload.distance} km)`]}
                                      />
                                      <Legend formatter={() => `Pace (/km)`} />
                                      <Line type="monotone" dataKey="paceSeconds" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                  </LineChart>
                             </ResponsiveContainer>
                          </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mt-8">Histórico de Corridas</h3>
                        {performanceRecords.map(r => (
                            <div key={r.id} className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 space-y-4">
                               <div className="flex justify-between items-center">
                                 <p className="font-black text-brand-500 text-[10px] uppercase tracking-widest">{new Date(r.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                 <p className="font-bold text-white text-sm">{r.classDetails?.title}</p>
                               </div>
                               <div className="grid grid-cols-3 gap-4 text-center">
                                  <div className="bg-dark-900/50 p-3 rounded-xl border border-dark-800">
                                     <p className="text-[9px] font-black text-slate-500 uppercase">Distância</p>
                                     <p className="text-base text-white font-black">{r.classDetails?.distanceKm || '--'} <span className="text-xs text-slate-500">km</span></p>
                                  </div>
                                  <div className="bg-dark-900/50 p-3 rounded-xl border border-dark-800">
                                     <p className="text-[9px] font-black text-slate-500 uppercase">Tempo</p>
                                     <p className="text-base text-white font-black">{r.totalTimeSeconds ? `${Math.floor(r.totalTimeSeconds/60)}'${r.totalTimeSeconds%60}"` : '--'}</p>
                                  </div>
                                   <div className="bg-dark-900/50 p-3 rounded-xl border border-dark-800">
                                     <p className="text-[9px] font-black text-slate-500 uppercase">Pace Médio</p>
                                     <p className="text-base text-white font-black">{r.averagePace || '--'}</p>
                                  </div>
                               </div>
                               {r.instructorNotes && (
                                  <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-800">
                                     <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5"><MessageCircle size={12}/> Feedback do Treinador</p>
                                     <p className="text-slate-300 text-xs italic mt-2">"{r.instructorNotes}"</p>
                                  </div>
                               )}
                               {r.generatedFeedback && (
                                  <div className="bg-brand-500/5 p-4 rounded-xl border border-brand-500/20">
                                     <p className="text-[9px] font-black text-brand-500 uppercase flex items-center gap-1.5"><Sparkles size={12}/> Análise da IA</p>
                                     <p className="text-brand-200 text-xs mt-2">"{r.generatedFeedback}"</p>
                                  </div>
                               )}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="py-20 text-center bg-dark-950 rounded-[2.5rem] border border-dashed border-dark-800">
                     <TrendingUp className="mx-auto text-dark-800 mb-4" size={48} />
                     <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Nenhum registro de corrida encontrado para este aluno.</p>
                     <p className="text-slate-700 text-xs mt-2">Complete uma aula de corrida para começar a ver sua evolução.</p>
                </div>
            )}
        </div>
    );
};