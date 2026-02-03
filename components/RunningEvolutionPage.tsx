
import React, { useState, useEffect, useMemo } from 'react';
import { AttendanceRecord, User, UserRole, ClassSession, CycleSummary, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Loader2, TrendingUp, User as UserIcon, Award, BarChart3, MessageCircle, Sparkles, Flag, Clock, Zap, FileText, Download, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RunningEvolutionPageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialStudentId?: string;
}

export const RunningEvolutionPage: React.FC<RunningEvolutionPageProps> = ({ currentUser, onNavigate, addToast, initialStudentId }) => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId || null);
    const [performanceRecords, setPerformanceRecords] = useState<any[]>([]);

    const isStaff = currentUser.role !== UserRole.STUDENT;

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            if (isStaff) {
                const all = await SupabaseService.getAllStudents();
                setStudents(all);
            } else { setSelectedStudentId(currentUser.id); }
            setLoading(false);
        };
        fetchInitialData();
    }, [currentUser, isStaff]);

    useEffect(() => {
        if (selectedStudentId) {
            SupabaseService.getAttendanceForStudent(selectedStudentId, 'RUNNING').then(setPerformanceRecords);
        }
    }, [selectedStudentId]);

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-brand-500" size={40} /></div>;

    return (
        <div className="space-y-8 animate-fade-in printable-area">
            <button 
                onClick={() => onNavigate('DASHBOARD')}
                className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-2 transition-colors no-print"
            >
                <ArrowLeft size={14} /> Voltar ao Início
            </button>

            <header>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <TrendingUp size={32} className="text-brand-500"/> Evolução
                </h2>
            </header>

            <div className="bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl h-80 flex items-center justify-center">
                <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Gráficos de Performance do Aluno</p>
            </div>
        </div>
    );
};
