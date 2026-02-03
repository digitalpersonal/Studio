
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Assessment, User, UserRole, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { GeminiService } from '../services/geminiService';
import { 
  Plus, Edit, Trash2, Activity, Loader2, Award, Heart, Ruler, Scale, 
  ChevronDown, ChevronUp, FileText, CalendarCheck, Zap, ClipboardList, 
  X, Gauge, TrendingUp, Users, AlertCircle, Camera, Image as ImageIcon,
  Upload, CheckCircle2, RotateCcw, Sparkles, ArrowLeft
} from 'lucide-react';

interface AssessmentsPageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialStudentId?: string; 
}

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({ currentUser, onNavigate, addToast, initialStudentId }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId || null); 
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [analyzingIA, setAnalyzingIA] = useState<string | null>(null);
  const [iaFeedback, setIaFeedback] = useState<Record<string, string>>({});

  const isStaff = currentUser.role !== UserRole.STUDENT;

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const allUsers = await SupabaseService.getAllUsers(); 
        const onlyStudents = allUsers.filter(u => u.role === UserRole.STUDENT);
        setStudents(onlyStudents);

        let assessmentData: Assessment[] = [];
        if (currentUser.role === UserRole.STUDENT) {
          assessmentData = await SupabaseService.getAssessments(currentUser.id);
          setSelectedStudentId(currentUser.id);
        } else if (selectedStudentId) { 
          assessmentData = await SupabaseService.getAssessments(selectedStudentId);
        } else if (initialStudentId) {
          setSelectedStudentId(initialStudentId);
          assessmentData = await SupabaseService.getAssessments(initialStudentId);
        }
        setAssessments(assessmentData);
      } catch (error: any) {
        addToast(`Erro ao carregar dados do sistema.`, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [currentUser, addToast, initialStudentId]); 

  useEffect(() => {
    const fetchAssessmentsForSelectedStudent = async () => {
      if (selectedStudentId) {
        setLoading(true);
        try {
          const assessmentData = await SupabaseService.getAssessments(selectedStudentId);
          setAssessments(assessmentData);
        } catch (error: any) {
          addToast(`Erro ao carregar histórico do aluno.`, "error");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAssessmentsForSelectedStudent();
  }, [selectedStudentId, addToast]);

  const handleSaveAssessment = async (assessmentData: Omit<Assessment, 'id'>) => {
    setLoading(true);
    try {
      if (editingAssessment) {
        await SupabaseService.updateAssessment({ ...assessmentData as Assessment, id: editingAssessment.id });
        addToast("Avaliação atualizada!", "success");
      } else {
        await SupabaseService.addAssessment(assessmentData);
        addToast("Avaliação salva com sucesso!", "success");
      }
      setShowForm(false);
      setEditingAssessment(null);
      if (assessmentData.studentId) {
        setSelectedStudentId(assessmentData.studentId);
        const updated = await SupabaseService.getAssessments(assessmentData.studentId);
        setAssessments(updated);
      }
    } catch (error: any) {
      addToast(`Erro ao salvar.`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm("Deseja mesmo excluir este registro?")) return;
    setLoading(true);
    try {
      await SupabaseService.deleteAssessment(id);
      addToast("Registro removido.", "success");
      if (selectedStudentId) {
        const updated = await SupabaseService.getAssessments(selectedStudentId);
        setAssessments(updated);
      }
    } catch (error: any) { addToast(`Erro ao remover registro.`, "error"); } finally { setLoading(false); }
  };

  const handleAnalyzeIA = async (assessment: Assessment) => {
    setAnalyzingIA(assessment.id);
    try {
        const student = students.find(s => s.id === assessment.studentId);
        const result = await GeminiService.analyzeProgress(student?.name || 'Aluno', [assessment]);
        setIaFeedback(prev => ({ ...prev, [assessment.id]: result }));
    } catch (e) { addToast("Erro na análise de IA.", "error"); } finally { setAnalyzingIA(null); }
  };

  if (loading && !showForm) return <div className="flex justify-center items-center h-full min-h-[500px]"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;

  if (showForm) return <AssessmentForm assessment={editingAssessment} studentId={selectedStudentId || ''} students={students} onSave={handleSaveAssessment} onCancel={() => { setShowForm(false); setEditingAssessment(null); }} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <button 
        onClick={() => onNavigate('DASHBOARD')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-2 transition-colors"
      >
        <ArrowLeft size={14} /> Voltar ao Início
      </button>

      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tighter uppercase">Avaliações Físicas</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Evolução Funcional</p>
        </div>
        {isStaff && (
          <button onClick={() => { setEditingAssessment(null); setShowForm(true); }} className="bg-brand-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-brand-600/20 active:scale-95 transition-all">
            <Plus size={16} className="mr-2" /> Nova Avaliação
          </button>
        )}
      </header>

      {isStaff && (
        <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl flex flex-col md:flex-row items-center gap-4">
          <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest shrink-0">Filtrar Aluno:</label>
          <select className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm font-bold" value={selectedStudentId || ''} onChange={e => setSelectedStudentId(e.target.value)}>
            <option value="">Selecione...</option>
            {students.map(s => <option key={s.id} value={s.id}>{String(s.name)}</option>)}
          </select>
        </div>
      )}

      <div className="space-y-4">
        {selectedStudentId && assessments.length > 0 ? (
          assessments.map(assessment => (
            <div key={assessment.id} className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-xl overflow-hidden relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-600/10 rounded-2xl border border-brand-600/20 text-brand-500"><Activity size={24} /></div>
                  <div>
                    <h4 className="text-white font-black text-lg uppercase tracking-tighter">{new Date(assessment.date).toLocaleDateString('pt-BR')}</h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Avaliação Concluída</p>
                  </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleAnalyzeIA(assessment)} disabled={analyzingIA === assessment.id} className="p-2 bg-brand-600/10 text-brand-500 rounded-xl hover:bg-brand-600 hover:text-white transition-all disabled:opacity-50">
                        {analyzingIA === assessment.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    </button>
                    {isStaff && (
                      <>
                        <button onClick={() => { setEditingAssessment(assessment); setShowForm(true); }} className="p-2 bg-dark-800 text-slate-400 rounded-xl hover:text-white transition-colors"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteAssessment(assessment.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                      </>
                    )}
                </div>
              </div>

              {iaFeedback[assessment.id] && (
                  <div className="mb-6 p-4 bg-brand-500/5 border border-brand-500/20 rounded-2xl animate-fade-in">
                      <p className="text-[9px] font-black text-brand-500 uppercase flex items-center gap-2 mb-2"><Sparkles size={14}/> Laudo da IA</p>
                      <p className="text-sm text-brand-100 italic">"{iaFeedback[assessment.id]}"</p>
                  </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricDisplay label="Peso" value={assessment.weight} unit="kg" />
                <MetricDisplay label="Gordura" value={assessment.bodyFatPercentage} unit="%" />
                <MetricDisplay label="Músculo" value={assessment.skeletalMuscleMass} unit="kg" />
                <MetricDisplay label="G. Visceral" value={assessment.visceralFatLevel} unit="" />
              </div>

              <div className="mt-6 pt-6 border-t border-dark-800">
                  <button onClick={() => setExpandedAssessment(expandedAssessment === assessment.id ? null : assessment.id)} className="w-full flex items-center justify-center gap-2 py-3 bg-dark-900 hover:bg-dark-800 text-brand-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-dark-800">
                      {expandedAssessment === assessment.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} Detalhes Completos
                  </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-dark-950 rounded-[2.5rem] border border-dashed border-dark-800">
             <Activity className="mx-auto text-dark-800 mb-4" size={48} />
             <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Nenhum histórico encontrado para este aluno.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricDisplay = ({ label, value, unit }: any) => (
    <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-800">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-lg text-white font-black">{value || '--'}<span className="text-[10px] text-slate-500 ml-1">{unit}</span></p>
    </div>
);

const AssessmentForm = ({ assessment, studentId, students, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState<any>(assessment || {
        studentId: studentId, date: new Date().toISOString().split('T')[0],
        status: 'DONE', weight: 0, height: 0, bodyFatPercentage: 0
    });

    return (
        <div className="max-w-3xl mx-auto bg-dark-950 p-8 rounded-[3rem] border border-dark-800 shadow-2xl space-y-8 animate-fade-in mb-20 overflow-hidden">
            <div className="flex justify-between items-center border-b border-dark-800 pb-6">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Nova Ficha</h3>
                <button onClick={onCancel} className="p-2 bg-dark-800 rounded-full text-slate-500"><X size={20}/></button>
            </div>
            <div className="space-y-4">
                <button type="button" onClick={() => onSave(formData)} className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl">Finalizar Avaliação</button>
                <button type="button" onClick={onCancel} className="w-full py-5 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            </div>
        </div>
    );
};
