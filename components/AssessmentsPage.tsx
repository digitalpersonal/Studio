
import React, { useState, useEffect, useRef } from 'react';
import { Assessment, User, UserRole, FMSData } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { GeminiService } from '../services/geminiService';
import { Plus, Edit, Trash2, Activity, Loader2, Award, Ruler, Scale, ChevronDown, ChevronUp, Zap, Target, X, Camera, Sparkles, Image as ImageIcon } from 'lucide-react';

interface AssessmentsPageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialStudentId?: string; 
}

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({ currentUser, addToast, initialStudentId }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId || null); 
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [fmsExpanded, setFmsExpanded] = useState<string | null>(null);
  const [correctiveLoading, setCorrectiveLoading] = useState<string | null>(null);

  const isStaff = currentUser.role !== UserRole.STUDENT;

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const studentData = await SupabaseService.getAllUsers(); 
        setStudents(studentData);

        let assessmentData: Assessment[] = [];
        if (currentUser.role === UserRole.STUDENT) {
          assessmentData = await SupabaseService.getAssessments(currentUser.id);
          setSelectedStudentId(currentUser.id);
        } else {
          if (initialStudentId) { 
            setSelectedStudentId(initialStudentId);
            assessmentData = await SupabaseService.getAssessments(initialStudentId);
          } else if (studentData.length > 0) { 
            const firstStudent = studentData.find(u => u.role === UserRole.STUDENT);
            if (firstStudent) {
              setSelectedStudentId(firstStudent.id);
              assessmentData = await SupabaseService.getAssessments(firstStudent.id);
            }
          }
        }
        setAssessments(assessmentData);
      } catch (error: any) {
        addToast(`Erro ao carregar avaliações: ${error.message}`, "error");
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
          setGeminiAnalysis(null); 
        } catch (error: any) {
          addToast(`Erro ao carregar avaliações do aluno`, "error");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAssessmentsForSelectedStudent();
  }, [selectedStudentId]);

  const handleSaveAssessment = async (assessmentData: Omit<Assessment, 'id'>) => {
    setLoading(true);
    try {
      if (editingAssessment) {
        await SupabaseService.updateAssessment({ ...assessmentData as Assessment, id: editingAssessment.id });
        addToast("Avaliação atualizada!", "success");
      } else {
        await SupabaseService.addAssessment(assessmentData);
        addToast("Nova avaliação concluída!", "success");
      }
      setShowForm(false);
      setEditingAssessment(null);
      if (selectedStudentId) {
        const updatedAssessments = await SupabaseService.getAssessments(selectedStudentId);
        setAssessments(updatedAssessments);
      }
    } catch (error: any) {
      addToast(`Erro ao salvar avaliação`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCorrective = async (assessment: Assessment) => {
    if (!assessment.fms) return;
    setCorrectiveLoading(assessment.id);
    try {
      const plan = await GeminiService.suggestCorrectivePlan(assessment.fms);
      const updated = { ...assessment, correctivePlan: plan };
      await SupabaseService.updateAssessment(updated);
      setAssessments(prev => prev.map(a => a.id === assessment.id ? updated : a));
      addToast("Plano corretivo gerado pela IA!", "success");
    } catch (error) {
      addToast("Erro ao gerar plano corretivo.", "error");
    } finally {
      setCorrectiveLoading(null);
    }
  };

  const handleGenerateGeminiAnalysis = async () => {
    if (!selectedStudentId || assessments.length < 2) return;
    setAnalysisLoading(true);
    try {
      const student = students.find(s => s.id === selectedStudentId);
      const analysis = await GeminiService.analyzeProgress(String(student?.name), assessments);
      setGeminiAnalysis(analysis);
    } catch (error: any) {
      addToast(`Erro ao gerar análise da IA`, "error");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Desconhecido';

  const calculateFMSTotal = (fms?: FMSData) => {
    if (!fms) return 0;
    return (fms.deepSquat || 0) + (fms.hurdleStep || 0) + (fms.inlineLunge || 0) + 
           (fms.shoulderMobility || 0) + (fms.activeStraightLegRaise || 0) + (fms.rotationalStability || 0);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;
  }

  if (showForm) {
    return (
      <AssessmentForm
        assessment={editingAssessment}
        studentId={selectedStudentId || ''}
        onSave={handleSaveAssessment}
        onCancel={() => { setShowForm(false); setEditingAssessment(null); }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Avaliação Profissional FMS</h2>
          <p className="text-slate-400 text-sm">Qualidade de movimento e performance física.</p>
        </div>
        {isStaff && (
          <button
            onClick={() => {
              if (!selectedStudentId) return addToast("Selecione um aluno primeiro", "info");
              setEditingAssessment(null);
              setShowForm(true);
            }}
            className="bg-brand-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center shadow-xl shadow-brand-500/20 hover:bg-brand-500 transition-all"
          >
            <Plus size={16} className="mr-2" /> Nova Avaliação
          </button>
        )}
      </header>

      {isStaff && (
        <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl flex flex-col md:flex-row items-center gap-4">
          <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest shrink-0">Selecionar Aluno:</label>
          <select
            className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold"
            value={selectedStudentId || ''}
            onChange={e => setSelectedStudentId(e.target.value)}
          >
            <option value="">Selecione um Aluno</option>
            {students.filter(s => s.role === UserRole.STUDENT).map(s => (
              <option key={s.id} value={s.id}>{String(s.name)}</option>
            ))}
          </select>
        </div>
      )}

      {selectedStudentId && assessments.length > 1 && (
        <div className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tighter">
              <Sparkles size={20} className="text-brand-500" /> Evolução Biomecânica
            </h3>
            <button
              onClick={handleGenerateGeminiAnalysis}
              disabled={analysisLoading}
              className="bg-brand-600/10 text-brand-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-500/20 hover:bg-brand-500 hover:text-white transition-all disabled:opacity-50"
            >
              {analysisLoading ? <Loader2 size={14} className="animate-spin" /> : "Gerar Laudo Técnico IA"}
            </button>
          </div>
          {geminiAnalysis && (
            <div className="p-5 bg-brand-500/5 rounded-2xl border border-brand-500/10 text-slate-300 text-sm leading-relaxed whitespace-pre-line shadow-inner">
              {geminiAnalysis}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {assessments.map(assessment => (
          <div key={assessment.id} className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-dark-900 rounded-2xl border border-dark-800 text-brand-500 group-hover:scale-110 transition-transform">
                  <Activity size={24} />
                </div>
                <div>
                  <h4 className="text-white font-black text-lg uppercase tracking-tighter">Avaliação de {new Date(assessment.date).toLocaleDateString('pt-BR')}</h4>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{getStudentName(assessment.studentId)}</p>
                </div>
              </div>
              {isStaff && (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingAssessment(assessment); setShowForm(true); }} className="p-2 bg-dark-800 text-slate-400 rounded-xl hover:text-white transition-all"><Edit size={16} /></button>
                  <button onClick={async () => { if(confirm("Excluir registro?")) { await SupabaseService.deleteAssessment(assessment.id); addToast("Removido", "success"); if(selectedStudentId) setAssessments(await SupabaseService.getAssessments(selectedStudentId)); } }} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-slate-300">
              <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-800 space-y-1">
                 <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><Scale size={10}/> Biometria</p>
                 <p className="flex justify-between"><span>Peso:</span> <span className="text-white font-bold">{assessment.weight} kg</span></p>
                 <p className="flex justify-between"><span>Gordura:</span> <span className="text-brand-500 font-black">{assessment.bodyFatPercentage}%</span></p>
                 <p className="flex justify-between"><span>Massa Musc:</span> <span className="text-white font-bold">{assessment.skeletalMuscleMass || '-'} kg</span></p>
              </div>
              
              <div className="bg-brand-500/5 p-4 rounded-2xl border border-brand-500/10 space-y-1">
                 <p className="text-brand-500 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><Zap size={10}/> Potência</p>
                 <p className="flex justify-between"><span>S. Horizontal:</span> <span className="text-white font-bold">{assessment.horizontalJump ? `${assessment.horizontalJump}m` : '-'}</span></p>
                 <p className="flex justify-between"><span>S. Vertical:</span> <span className="text-white font-bold">{assessment.verticalJump ? `${assessment.verticalJump}cm` : '-'}</span></p>
                 <p className="flex justify-between"><span>Arremesso WB:</span> <span className="text-white font-bold">{assessment.wallBallThrow ? `${assessment.wallBallThrow}m` : '-'}</span></p>
              </div>

              <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 flex flex-col justify-center text-center">
                 <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><Target size={10}/> Score FMS</p>
                 <p className="text-3xl font-black text-white">{calculateFMSTotal(assessment.fms)} / 18</p>
                 <button onClick={() => setFmsExpanded(fmsExpanded === assessment.id ? null : assessment.id)} className="mt-2 text-[8px] font-black uppercase text-blue-400 hover:underline">
                   {fmsExpanded === assessment.id ? 'Fechar Detalhes' : 'Ver Scores Técnicos'}
                 </button>
              </div>

              <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-800 flex items-center gap-2 overflow-hidden">
                  {['front', 'side', 'back'].map(type => (
                      <div key={type} className="flex-1 aspect-[3/4] bg-dark-950 rounded-lg border border-dark-800 overflow-hidden relative">
                          {assessment.photos?.[type as keyof Required<Assessment>['photos']] ? (
                              <img src={assessment.photos[type as keyof Required<Assessment>['photos']]} className="w-full h-full object-cover" />
                          ) : <ImageIcon size={12} className="text-slate-700 absolute inset-0 m-auto" />}
                      </div>
                  ))}
              </div>
            </div>

            {fmsExpanded === assessment.id && assessment.fms && (
              <div className="mt-6 animate-fade-in space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <FmsViewItem label="Agachamento" score={assessment.fms.deepSquat} />
                  <FmsViewItem label="Barreira" score={assessment.fms.hurdleStep} />
                  <FmsViewItem label="Avanço" score={assessment.fms.inlineLunge} />
                  <FmsViewItem label="Ombro" score={assessment.fms.shoulderMobility} />
                  <FmsViewItem label="Elev. Perna" score={assessment.fms.activeStraightLegRaise} />
                  <FmsViewItem label="Estabilidade" score={assessment.fms.rotationalStability} />
                </div>
                
                <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-[2rem]">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <h5 className="text-blue-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Sparkles size={14}/> Prescrição de Mobilidade (IA)</h5>
                      <button 
                        onClick={() => handleGenerateCorrective(assessment)}
                        disabled={correctiveLoading === assessment.id}
                        className="px-4 py-2 bg-blue-500 text-white text-[9px] font-black uppercase rounded-xl hover:bg-blue-400 disabled:opacity-50 tracking-widest shadow-lg shadow-blue-500/20"
                      >
                        {correctiveLoading === assessment.id ? 'Analisando Movimentos...' : 'Gerar Corretivos IA'}
                      </button>
                   </div>
                   {assessment.correctivePlan ? (
                     <div className="text-xs text-slate-300 whitespace-pre-line bg-dark-950/50 p-5 rounded-2xl border border-dark-800">
                        {assessment.correctivePlan}
                     </div>
                   ) : (
                     <p className="text-[10px] text-slate-500 italic text-center py-4 uppercase font-bold tracking-widest">Aguardando solicitação do plano pela IA.</p>
                   )}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-dark-800">
                <button 
                    onClick={() => setExpandedAssessment(expandedAssessment === assessment.id ? null : assessment.id)}
                    className="flex items-center gap-2 text-brand-500 font-black text-[10px] uppercase tracking-widest"
                >
                    {expandedAssessment === assessment.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    {expandedAssessment === assessment.id ? 'Recolher Perimetria' : 'Ver Medidas (Simetria D/E)'}
                </button>
            </div>

            {expandedAssessment === assessment.id && assessment.circumferences && (
              <div className="mt-4 bg-dark-900/50 p-6 rounded-[2rem] border border-dark-800 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-slate-300">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-600 uppercase mb-3 border-b border-dark-800 pb-1 flex items-center gap-2"><Ruler size={12}/> Tronco</p>
                        <p className="flex justify-between"><span>Tórax:</span> <span className="text-white font-bold">{assessment.circumferences.chest || '-'} cm</span></p>
                        <p className="flex justify-between"><span>Cintura:</span> <span className="text-white font-bold">{assessment.circumferences.waist || '-'} cm</span></p>
                        <p className="flex justify-between"><span>Abdômen:</span> <span className="text-white font-bold">{assessment.circumferences.abdomen || '-'} cm</span></p>
                        <p className="flex justify-between"><span>Quadril:</span> <span className="text-white font-bold">{assessment.circumferences.hips || '-'} cm</span></p>
                      </div>
                      <div className="space-y-1 bg-brand-500/5 p-4 rounded-2xl border border-brand-500/10">
                        <p className="text-[10px] font-black text-brand-600 uppercase mb-3 border-b border-brand-500/10 pb-1">Simetria: Coxas</p>
                        <p className="flex justify-between"><span>Direita (D):</span> <span className="text-white font-black">{assessment.circumferences.rightThigh || '-'} cm</span></p>
                        <p className="flex justify-between"><span>Esquerda (E):</span> <span className="text-white font-black">{assessment.circumferences.leftThigh || '-'} cm</span></p>
                        <p className="text-[9px] text-slate-500 mt-2 italic text-right">Desvio: {Math.abs((assessment.circumferences.rightThigh || 0) - (assessment.circumferences.leftThigh || 0)).toFixed(1)} cm</p>
                      </div>
                      <div className="space-y-1 bg-brand-500/5 p-4 rounded-2xl border border-brand-500/10">
                        <p className="text-[10px] font-black text-brand-600 uppercase mb-3 border-b border-brand-500/10 pb-1">Simetria: Panturrilhas</p>
                        <p className="flex justify-between"><span>Direita (D):</span> <span className="text-white font-black">{assessment.circumferences.rightCalf || '-'} cm</span></p>
                        <p className="flex justify-between"><span>Esquerda (E):</span> <span className="text-white font-black">{assessment.circumferences.leftCalf || '-'} cm</span></p>
                        <p className="text-[9px] text-slate-500 mt-2 italic text-right">Desvio: {Math.abs((assessment.circumferences.rightCalf || 0) - (assessment.circumferences.leftCalf || 0)).toFixed(1)} cm</p>
                      </div>
                  </div>
              </div>
            )}
          </div>
        ))}

        {assessments.length === 0 && (
          <div className="py-20 text-center bg-dark-950 rounded-[3rem] border border-dashed border-dark-800">
              <Activity size={48} className="mx-auto text-dark-800 mb-4" />
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Nenhuma avaliação técnica registrada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FmsViewItem = ({ label, score }: { label: string, score: number }) => (
  <div className="p-3 bg-dark-900 rounded-2xl border border-dark-800 text-center shadow-inner">
    <p className="text-[8px] font-black text-slate-600 uppercase mb-2 truncate tracking-tighter">{label}</p>
    <div className={`text-base font-black w-10 h-10 flex items-center justify-center mx-auto rounded-xl shadow-lg border ${
      score === 3 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
      score === 2 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
      score === 1 ? 'bg-red-500/10 text-red-500 border-red-500/20' :
      'bg-dark-800 text-slate-600 border-dark-700'
    }`}>{score}</div>
  </div>
);

const AssessmentForm = ({ assessment, studentId, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState<Omit<Assessment, 'id'>>(
    assessment || {
      studentId: studentId,
      date: new Date().toISOString().split('T')[0],
      status: 'DONE',
      notes: '',
      weight: 0, height: 0, bodyFatPercentage: 0,
      skeletalMuscleMass: 0,
      fms: { deepSquat: 3, hurdleStep: 3, inlineLunge: 3, shoulderMobility: 3, activeStraightLegRaise: 3, rotationalStability: 3 },
      photos: { front: '', side: '', back: '' },
      circumferences: { chest: 0, waist: 0, abdomen: 0, hips: 0, rightThigh: 0, leftThigh: 0, rightCalf: 0, leftCalf: 0 },
      horizontalJump: 0, verticalJump: 0, wallBallThrow: 0,
    }
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePhoto, setActivePhoto] = useState<'front' | 'side' | 'back' | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePhoto) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(p => ({ ...p, photos: { ...p.photos, [activePhoto]: reader.result } }));
        setActivePhoto(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const setFms = (key: keyof FMSData, val: number) => setFormData(p => ({ ...p, fms: { ...p.fms!, [key]: val } }));
  const setCirc = (key: string, val: string) => setFormData(p => ({ ...p, circumferences: { ...p.circumferences!, [key]: Number(val) } }));

  return (
    <div className="max-w-4xl mx-auto bg-dark-950 p-8 rounded-[3rem] border border-dark-800 shadow-2xl space-y-8 animate-fade-in mb-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-brand-600"></div>
      <div className="flex justify-between items-center border-b border-dark-800 pb-6">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <Target className="text-brand-500" size={28}/> {assessment ? 'Ajustar Avaliação' : 'Novo Protocolo Técnico'}
        </h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 bg-dark-900 rounded-full border border-dark-800 transition-all"><X size={24}/></button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-10">
        
        {/* COMPOSIÇÃO BÁSICA */}
        <section className="space-y-4">
          <h4 className="text-brand-500 font-black text-[11px] uppercase tracking-widest border-l-2 border-brand-500 pl-3">Composição Corporal</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><label className="block text-slate-500 text-[9px] font-black uppercase mb-1">Data</label><input required type="date" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold text-sm" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
            <div><label className="block text-slate-500 text-[9px] font-black uppercase mb-1">Peso (kg)</label><input required type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold text-sm" value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })} /></div>
            <div><label className="block text-slate-500 text-[9px] font-black uppercase mb-1">Altura (cm)</label><input required type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold text-sm" value={formData.height || ''} onChange={e => setFormData({ ...formData, height: Number(e.target.value) })} /></div>
            <div><label className="block text-brand-500 text-[9px] font-black uppercase mb-1">% Gordura</label><input required type="number" step="0.1" className="w-full bg-dark-900 border border-brand-500/30 rounded-xl p-3 text-brand-500 font-black text-sm" value={formData.bodyFatPercentage || ''} onChange={e => setFormData({ ...formData, bodyFatPercentage: Number(e.target.value) })} /></div>
          </div>
        </section>

        {/* FMS PROTOCOLO */}
        <section className="p-6 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/10 space-y-6">
          <h4 className="text-blue-500 font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Target size={14}/> Protocolo FMS (0-3)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <FmsInput label="Agachamento Prof." value={formData.fms?.deepSquat} onChange={v => setFms('deepSquat', v)} />
            <FmsInput label="Passa Barreira" value={formData.fms?.hurdleStep} onChange={v => setFms('hurdleStep', v)} />
            <FmsInput label="Avanço Linha Reta" value={formData.fms?.inlineLunge} onChange={v => setFms('inlineLunge', v)} />
            <FmsInput label="Mobilidade Ombro" value={formData.fms?.shoulderMobility} onChange={v => setFms('shoulderMobility', v)} />
            <FmsInput label="Elevação Perna" value={formData.fms?.activeStraightLegRaise} onChange={v => setFms('activeStraightLegRaise', v)} />
            <FmsInput label="Estabilidade Rot." value={formData.fms?.rotationalStability} onChange={v => setFms('rotationalStability', v)} />
          </div>
        </section>

        {/* PERFORMANCE POTENCIA */}
        <section className="p-6 bg-brand-500/5 rounded-[2.5rem] border border-brand-500/10 space-y-4">
          <h4 className="text-brand-500 font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Performance & Potência</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div><label className="block text-slate-500 text-[9px] font-black uppercase mb-1">Salto Horizontal (m)</label><input type="number" step="0.01" placeholder="0.00" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white font-black text-sm" value={formData.horizontalJump || ''} onChange={e => setFormData({ ...formData, horizontalJump: Number(e.target.value) })} /></div>
            <div><label className="block text-slate-500 text-[9px] font-black uppercase mb-1">Salto Vertical (cm)</label><input type="number" placeholder="0" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white font-black text-sm" value={formData.verticalJump || ''} onChange={e => setFormData({ ...formData, verticalJump: Number(e.target.value) })} /></div>
            <div><label className="block text-slate-500 text-[9px] font-black uppercase mb-1">Wall Ball Throw (m)</label><input type="number" step="0.1" placeholder="0.0" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white font-black text-sm" value={formData.wallBallThrow || ''} onChange={e => setFormData({ ...formData, wallBallThrow: Number(e.target.value) })} /></div>
          </div>
        </section>

        {/* PERIMETRIA COM SIMETRIA */}
        <section className="space-y-4">
          <h4 className="text-slate-500 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 border-l-2 border-slate-800 pl-3">Simetria de Perímetros (cm)</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-dark-900/50 p-6 rounded-[2rem] border border-dark-800">
             <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-700 uppercase mb-2">Tronco Superior</p>
                <input placeholder="Tórax" type="number" step="0.1" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white text-xs font-bold" value={formData.circumferences?.chest || ''} onChange={e => setCirc('chest', e.target.value)} />
                <input placeholder="Cintura" type="number" step="0.1" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white text-xs font-bold" value={formData.circumferences?.waist || ''} onChange={e => setCirc('waist', e.target.value)} />
             </div>
             <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-700 uppercase mb-2">Tronco Inferior</p>
                <input placeholder="Abdômen" type="number" step="0.1" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white text-xs font-bold" value={formData.circumferences?.abdomen || ''} onChange={e => setCirc('abdomen', e.target.value)} />
                <input placeholder="Quadril" type="number" step="0.1" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white text-xs font-bold" value={formData.circumferences?.hips || ''} onChange={e => setCirc('hips', e.target.value)} />
             </div>
             <div className="space-y-3 bg-brand-600/5 p-4 rounded-2xl border border-brand-600/10">
                <p className="text-[9px] font-black text-brand-600 uppercase mb-2 text-center">Coxas (D / E)</p>
                <div className="flex gap-2">
                  <input placeholder="D" type="number" step="0.1" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-white text-xs font-black text-center" value={formData.circumferences?.rightThigh || ''} onChange={e => setCirc('rightThigh', e.target.value)} />
                  <input placeholder="E" type="number" step="0.1" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-white text-xs font-black text-center" value={formData.circumferences?.leftThigh || ''} onChange={e => setCirc('leftThigh', e.target.value)} />
                </div>
             </div>
             <div className="space-y-3 bg-brand-600/5 p-4 rounded-2xl border border-brand-600/10">
                <p className="text-[9px] font-black text-brand-600 uppercase mb-2 text-center">Pantur. (D / E)</p>
                <div className="flex gap-2">
                  <input placeholder="D" type="number" step="0.1" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-white text-xs font-black text-center" value={formData.circumferences?.rightCalf || ''} onChange={e => setCirc('rightCalf', e.target.value)} />
                  <input placeholder="E" type="number" step="0.1" className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-white text-xs font-black text-center" value={formData.circumferences?.leftCalf || ''} onChange={e => setCirc('leftCalf', e.target.value)} />
                </div>
             </div>
          </div>
        </section>

        {/* FOTOS EVOLUÇÃO */}
        <section className="space-y-4">
          <h4 className="text-brand-500 font-black text-[11px] uppercase tracking-widest flex items-center gap-2"><Camera size={14}/> Evolução Visual</h4>
          <div className="grid grid-cols-3 gap-6">
              {['front', 'side', 'back'].map(type => (
                  <button key={type} type="button" onClick={() => { setActivePhoto(type as any); fileInputRef.current?.click(); }} className={`aspect-[3/4] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative group ${formData.photos?.[type as keyof Required<Assessment>['photos']] ? 'border-brand-500/50' : 'border-dark-800 bg-dark-900/50 hover:border-brand-500/30'}`}>
                      {formData.photos?.[type as keyof Required<Assessment>['photos']] ? (
                          <img src={formData.photos[type as keyof Required<Assessment>['photos']]} className="w-full h-full object-cover" />
                      ) : (
                          <>
                            <div className="p-3 bg-dark-950 rounded-full mb-2 text-slate-700 group-hover:text-brand-500 transition-colors"><ImageIcon size={20} /></div>
                            <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">{type === 'front' ? 'Frente' : type === 'side' ? 'Lado' : 'Costas'}</span>
                          </>
                      )}
                  </button>
              ))}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </div>
        </section>

        <div className="flex gap-4 pt-6 border-t border-dark-800">
          <button type="button" onClick={onCancel} className="flex-1 py-5 bg-dark-800 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-dark-700 transition-all">Cancelar</button>
          <button type="submit" className="flex-1 py-5 bg-brand-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-brand-600/30 hover:bg-brand-500 transition-all">Salvar Protocolo Completo</button>
        </div>
      </form>
    </div>
  );
};

const FmsInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
  <div className="text-center group">
    <label className="block text-slate-600 text-[8px] font-black uppercase mb-2 truncate group-hover:text-blue-400 transition-colors">{label}</label>
    <div className="flex flex-col gap-1">
      {[3, 2, 1, 0].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} className={`py-1.5 rounded-lg text-[10px] font-black transition-all border ${value === s ? 'bg-blue-600 text-white border-blue-400 shadow-lg scale-105 z-10' : 'bg-dark-950 text-slate-700 border-dark-800 hover:text-slate-500'}`}>{s}</button>
      ))}
    </div>
  </div>
);
