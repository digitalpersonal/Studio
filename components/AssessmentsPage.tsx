
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Assessment, User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { GeminiService } from '../services/geminiService';
import { ImageService } from '../services/imageService';
import { 
  Plus, Edit, Trash2, Activity, Loader2, Award, Heart, Ruler, Scale, 
  ChevronDown, ChevronUp, FileText, CalendarCheck, Zap, ClipboardList, 
  X, Gauge, TrendingUp, Users, AlertCircle, Camera, Image as ImageIcon,
  Upload, CheckCircle2, RotateCcw, Sparkles, Save, RefreshCw
} from 'lucide-react';

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
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [analyzingIA, setAnalyzingIA] = useState<string | null>(null);
  const [iaFeedback, setIaFeedback] = useState<Record<string, string>>({});
  const [updatingPhoto, setUpdatingPhoto] = useState<string | null>(null); // ID_PhotoType

  const isStaff = currentUser.role !== UserRole.STUDENT;

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const allUsers = await SupabaseService.getAllUsers(); 
      const onlyStudents = allUsers.filter(u => u.role === UserRole.STUDENT);
      setStudents(onlyStudents);

      if (currentUser.role === UserRole.STUDENT) {
        setSelectedStudentId(currentUser.id);
        const data = await SupabaseService.getAssessments(currentUser.id);
        setAssessments(data);
      } else if (initialStudentId) {
        setSelectedStudentId(initialStudentId);
        const data = await SupabaseService.getAssessments(initialStudentId);
        setAssessments(data);
      }
    } catch (error) {
      addToast("Erro ao sincronizar histórico.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentUser, initialStudentId, addToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const fetchAssessmentsForSelectedStudent = async () => {
      if (selectedStudentId && isStaff) {
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
  }, [selectedStudentId, isStaff, addToast]);

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
        const updated = await SupabaseService.getAssessments(assessmentData.studentId);
        setAssessments(updated);
      }
    } catch (error: any) {
      console.error("Erro ao salvar avaliação:", error);
      addToast(`Erro ao salvar: ${error.message || 'Erro de conexão com o banco.'}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPhotoUpdate = async (assessment: Assessment, type: 'photoFrontUrl' | 'photoSideUrl' | 'photoBackUrl', file: File) => {
    const loaderId = `${assessment.id}_${type}`;
    setUpdatingPhoto(loaderId);
    try {
      const base64 = await ImageService.compressImage(file, 1200, 0.6);
      const updatedAssessment = { ...assessment, [type]: base64 };
      await SupabaseService.updateAssessment(updatedAssessment);
      
      setAssessments(prev => prev.map(a => a.id === assessment.id ? updatedAssessment : a));
      addToast("Foto atualizada com sucesso!", "success");
    } catch (e) {
      addToast("Erro ao processar imagem.", "error");
    } finally {
      setUpdatingPhoto(null);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm("Deseja mesmo excluir este registro permanentemente?")) return;
    setLoading(true);
    try {
      await SupabaseService.deleteAssessment(id);
      addToast("Registro removido.", "success");
      if (selectedStudentId) {
        const updated = await SupabaseService.getAssessments(selectedStudentId);
        setAssessments(updated);
      }
    } catch (error: any) {
      addToast(`Erro ao remover registro.`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeIA = async (assessment: Assessment) => {
    setAnalyzingIA(assessment.id);
    try {
        const student = students.find(s => s.id === assessment.studentId);
        const result = await GeminiService.analyzeProgress(student?.name || 'Aluno', [assessment]);
        setIaFeedback(prev => ({ ...prev, [assessment.id]: result }));
    } catch (e) {
        addToast("A IA está processando outros dados, tente novamente em instantes.", "error");
    } finally {
        setAnalyzingIA(null);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[500px] gap-4">
        <Loader2 className="animate-spin text-brand-500" size={48} />
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Acessando Banco de Dados...</p>
      </div>
    );
  }

  if (showForm) {
    return (
      <AssessmentForm
        assessment={editingAssessment}
        studentId={selectedStudentId || ''}
        students={students}
        onSave={handleSaveAssessment}
        onCancel={() => { setShowForm(false); setEditingAssessment(null); }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tighter uppercase">Avaliações Físicas</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Acompanhamento e Evolução Funcional</p>
        </div>
        {isStaff && (
          <button
            onClick={() => {
              setEditingAssessment(null);
              setShowForm(true);
            }}
            className="bg-brand-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-brand-600/20 active:scale-95 transition-all"
          >
            <Plus size={16} className="mr-2" /> Iniciar Avaliação
          </button>
        )}
      </header>

      {isStaff && (
        <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl flex flex-col md:flex-row items-center gap-4">
          <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest shrink-0">Histórico do Aluno:</label>
          <select
            className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm font-bold"
            value={selectedStudentId || ''}
            onChange={e => setSelectedStudentId(e.target.value)}
          >
            <option value="">Selecione um aluno para ver a evolução...</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{String(s.name)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-4">
        {selectedStudentId && assessments.length > 0 ? (
          assessments.map(assessment => (
            <div key={assessment.id} className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-xl overflow-hidden relative group hover:border-brand-500/30 transition-all">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-600/10 rounded-2xl border border-brand-600/20 text-brand-500">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-lg uppercase tracking-tighter">Ficha: {new Date(assessment.date).toLocaleDateString('pt-BR')}</h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Avaliação Concluída</p>
                  </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleAnalyzeIA(assessment)}
                        disabled={analyzingIA === assessment.id}
                        className="p-2 bg-brand-600/10 text-brand-500 rounded-xl hover:bg-brand-600 hover:text-white transition-all disabled:opacity-50"
                        title="Analisar com IA"
                    >
                        {analyzingIA === assessment.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    </button>
                    {isStaff && (
                      <>
                        <button onClick={() => { setEditingAssessment(assessment); setShowForm(true); }} className="p-2 bg-dark-800 text-slate-400 rounded-xl hover:text-white transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteAssessment(assessment.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                </div>
              </div>

              {iaFeedback[assessment.id] && (
                  <div className="mb-6 p-6 bg-brand-500/5 border border-brand-500/20 rounded-[2rem] animate-fade-in">
                      <p className="text-[9px] font-black text-brand-500 uppercase flex items-center gap-2 mb-2"><Sparkles size={14}/> Laudo Técnico IA</p>
                      <p className="text-sm text-brand-100 leading-relaxed italic">"{iaFeedback[assessment.id]}"</p>
                  </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricDisplay label="Peso" value={assessment.weight} unit="kg" />
                <MetricDisplay label="% Gordura" value={assessment.bodyFatPercentage} unit="%" color="text-brand-500" />
                <MetricDisplay label="Massa Muscular" value={assessment.skeletalMuscleMass} unit="kg" color="text-emerald-500" />
                <MetricDisplay label="Gord. Visceral" value={assessment.visceralFatLevel} unit="Nível" />
              </div>

              <div className="mt-6 pt-6 border-t border-dark-800">
                  <button 
                      onClick={() => setExpandedAssessment(expandedAssessment === assessment.id ? null : assessment.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-dark-900 hover:bg-dark-800 text-brand-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-dark-800 hover:border-brand-500/30"
                  >
                      {expandedAssessment === assessment.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      {expandedAssessment === assessment.id ? 'Ocultar Detalhes' : 'Ver Ficha Completa (FMS / Fotos)'}
                  </button>

                  {expandedAssessment === assessment.id && (
                    <div className="mt-8 space-y-10 animate-fade-in">
                        {/* FOTOS */}
                        <div className="space-y-4">
                            <h5 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 border-l-2 border-brand-500 pl-3">
                                <Camera size={16} className="text-brand-500" /> Evolução Visual
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <PhotoDisplay 
                                    label="Frontal" 
                                    url={assessment.photoFrontUrl} 
                                    isStaff={isStaff} 
                                    isUploading={updatingPhoto === `${assessment.id}_photoFrontUrl`}
                                    onUpdate={(file) => handleQuickPhotoUpdate(assessment, 'photoFrontUrl', file)} 
                                />
                                <PhotoDisplay 
                                    label="Lateral" 
                                    url={assessment.photoSideUrl} 
                                    isStaff={isStaff} 
                                    isUploading={updatingPhoto === `${assessment.id}_photoSideUrl`}
                                    onUpdate={(file) => handleQuickPhotoUpdate(assessment, 'photoSideUrl', file)} 
                                />
                                <PhotoDisplay 
                                    label="Costas" 
                                    url={assessment.photoBackUrl} 
                                    isStaff={isStaff} 
                                    isUploading={updatingPhoto === `${assessment.id}_photoBackUrl`}
                                    onUpdate={(file) => handleQuickPhotoUpdate(assessment, 'photoBackUrl', file)} 
                                />
                            </div>
                        </div>

                        {/* PERFORMANCE */}
                        <div className="space-y-4">
                            <h5 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 border-l-2 border-brand-500 pl-3">
                                <Zap size={16} className="text-brand-500" /> Testes de Potência
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <MetricDetail label="Abdominal" value={assessment.abdominalTest} unit="reps" />
                                <MetricDetail label="Salto Horiz." value={assessment.horizontalJump} unit="cm" />
                                <MetricDetail label="Salto Vert." value={assessment.verticalJump} unit="cm" />
                                <MetricDetail label="Med. Ball" value={assessment.medicineBallThrow} unit="m" />
                            </div>
                        </div>

                        {/* FMS */}
                        <div className="space-y-4">
                            <h5 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 border-l-2 border-brand-500 pl-3">
                                <ClipboardList size={16} className="text-brand-500" /> Protocolo FMS
                            </h5>
                            <div className="bg-dark-900/30 rounded-[2rem] p-8 border border-dark-800">
                                {assessment.fms ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-8 pb-6 border-b border-dark-800/30">
                                            <FMSScore label="Agachamento Profundo" score={assessment.fms.deepSquat} />
                                            <FMSScore label="Estabilidade de Tronco" score={assessment.fms.trunkStability} />
                                        </div>
                                        <FMSScore label="Passo Barreira (E)" score={assessment.fms.hurdleStep_L} />
                                        <FMSScore label="Passo Barreira (D)" score={assessment.fms.hurdleStep_R} />
                                        <FMSScore label="Avanço Linha (E)" score={assessment.fms.inlineLunge_L} />
                                        <FMSScore label="Avanço Linha (D)" score={assessment.fms.inlineLunge_R} />
                                        <FMSScore label="Mobilidade Ombro (E)" score={assessment.fms.shoulderMobility_L} />
                                        <FMSScore label="Mobilidade Ombro (D)" score={assessment.fms.shoulderMobility_R} />
                                        <FMSScore label="Elevação Perna (E)" score={assessment.fms.activeStraightLegRaise_L} />
                                        <FMSScore label="Elevação Perna (D)" score={assessment.fms.activeStraightLegRaise_R} />
                                        <FMSScore label="Est. Rotacional (E)" score={assessment.fms.rotationalStability_L} />
                                        <FMSScore label="Est. Rotacional (D)" score={assessment.fms.rotationalStability_R} />
                                    </div>
                                ) : (
                                    <p className="text-slate-600 text-xs italic">Nenhum dado FMS registrado.</p>
                                )}
                            </div>
                        </div>

                        {/* PERÍMETROS */}
                        <div className="space-y-4">
                            <h5 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 border-l-2 border-brand-500 pl-3">
                                <Ruler size={16} className="text-brand-500" /> Perímetros (cm)
                            </h5>
                            {assessment.circumferences ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 p-8 bg-dark-900/30 rounded-[2rem] border border-dark-800 text-[11px]">
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-brand-500 uppercase border-b border-dark-800 pb-1">Tronco</p>
                                        <div className="flex justify-between">Tórax: <span className="text-white font-bold">{assessment.circumferences.chest || 0}</span></div>
                                        <div className="flex justify-between">Cintura: <span className="text-white font-bold">{assessment.circumferences.waist || 0}</span></div>
                                        <div className="flex justify-between">Abdômen: <span className="text-white font-bold">{assessment.circumferences.abdomen || 0}</span></div>
                                        <div className="flex justify-between">Quadril: <span className="text-white font-bold">{assessment.circumferences.hips || 0}</span></div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-brand-500 uppercase border-b border-dark-800 pb-1">Superiores</p>
                                        <div className="flex justify-between">Braço D: <span className="text-white font-bold">{assessment.circumferences.rightArm || 0}</span></div>
                                        <div className="flex justify-between">Braço E: <span className="text-white font-bold">{assessment.circumferences.leftArm || 0}</span></div>
                                        <div className="flex justify-between">Ant.Braço D: <span className="text-white font-bold">{assessment.circumferences.rightForearm || 0}</span></div>
                                        <div className="flex justify-between">Ant.Braço E: <span className="text-white font-bold">{assessment.circumferences.leftForearm || 0}</span></div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-brand-500 uppercase border-b border-dark-800 pb-1">Inferiores</p>
                                        <div className="flex justify-between">Coxa D: <span className="text-white font-bold">{assessment.circumferences.rightThigh || 0}</span></div>
                                        <div className="flex justify-between">Coxa E: <span className="text-white font-bold">{assessment.circumferences.leftThigh || 0}</span></div>
                                        <div className="flex justify-between">Pant. D: <span className="text-white font-bold">{assessment.circumferences.rightCalf || 0}</span></div>
                                        <div className="flex justify-between">Pant. E: <span className="text-white font-bold">{assessment.circumferences.leftCalf || 0}</span></div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-brand-500 uppercase border-b border-dark-800 pb-1">Observações</p>
                                        <p className="text-slate-400 italic leading-relaxed text-[10px]">{assessment.notes || 'Sem observações extras.'}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-600 text-xs italic">Nenhum perímetro registrado.</p>
                            )}
                        </div>
                    </div>
                  )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center bg-dark-950 rounded-[3rem] border border-dashed border-dark-800 shadow-inner">
             <div className="w-20 h-20 bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-dark-800 shadow-xl">
                <Activity className="text-dark-800" size={40} />
             </div>
             <h3 className="text-slate-500 font-black uppercase text-sm tracking-widest">Inicie o Histórico</h3>
             <p className="text-slate-700 text-xs mt-2 max-w-xs mx-auto">Selecione um aluno ou inicie uma nova avaliação para começar o acompanhamento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricDisplay = ({ label, value, unit, color = "text-white" }: any) => (
    <div className="bg-dark-900/50 p-5 rounded-2xl border border-dark-800">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-xl font-black ${color}`}>{value || '--'}<span className="text-[10px] text-slate-600 ml-1 font-bold">{unit}</span></p>
    </div>
);

const MetricDetail = ({ label, value, unit }: { label: string, value?: number | string, unit: string }) => (
    <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-800">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-base text-white font-bold">{value || '--'} <span className="text-[9px] text-slate-600">{unit}</span></p>
    </div>
);

const PhotoDisplay = ({ label, url, isStaff, isUploading, onUpdate }: { label: string, url?: string, isStaff: boolean, isUploading: boolean, onUpdate: (f: File) => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="bg-dark-900/50 p-4 rounded-[2rem] border border-dark-800 space-y-3 group/photo">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">{label}</p>
            <div className="h-64 bg-dark-950 rounded-2xl overflow-hidden flex items-center justify-center border border-dark-800 relative">
                {isUploading ? (
                    <div className="flex flex-col items-center gap-3 animate-pulse">
                        <Loader2 className="animate-spin text-brand-500" size={32} />
                        <p className="text-[8px] font-black text-slate-600 uppercase">Processando...</p>
                    </div>
                ) : url ? (
                    <>
                        <img src={url} alt={`Foto ${label}`} className="w-full h-full object-cover transition-transform hover:scale-110 cursor-zoom-in" />
                        {isStaff && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center no-print">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 bg-brand-600 text-white rounded-xl shadow-2xl hover:bg-brand-500 transition-all flex items-center gap-2"
                                >
                                    <RefreshCw size={18} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Trocar Foto</span>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <ImageIcon size={32} className="text-dark-900" />
                        {isStaff && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-dark-800 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all no-print"
                            >
                                Adicionar
                            </button>
                        )}
                    </div>
                )}
            </div>
            {isStaff && (
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUpdate(file);
                    }}
                />
            )}
        </div>
    );
};

const FMSScore = ({ label, score }: { label: string, score?: number }) => (
    <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{label}</p>
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-dark-950 rounded-full overflow-hidden shadow-inner border border-dark-900">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${Number(score) === 3 ? 'bg-emerald-500' : Number(score) === 2 ? 'bg-brand-500' : 'bg-red-500'}`}
                    style={{ width: `${(Number(score || 0) / 3) * 100}%` }}
                />
            </div>
            <span className="text-sm font-black text-white bg-dark-900 w-8 h-8 rounded-lg flex items-center justify-center border border-dark-800">{score || 0}</span>
        </div>
    </div>
);

interface AssessmentFormProps {
  assessment: Assessment | null;
  studentId: string;
  students: User[];
  onSave: (assessmentData: Omit<Assessment, 'id'>) => void;
  onCancel: () => void;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({ assessment, studentId, students, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Assessment, 'id'>>(
    assessment || {
      studentId: studentId,
      date: new Date().toISOString().split('T')[0],
      status: 'DONE',
      notes: '',
      weight: 0,
      height: 0,
      bodyFatPercentage: 0,
      skeletalMuscleMass: 0,
      visceralFatLevel: 0,
      basalMetabolicRate: 0,
      hydrationPercentage: 0,
      abdominalTest: 0,
      horizontalJump: 0,
      verticalJump: 0,
      medicineBallThrow: 0,
      photoFrontUrl: '',
      photoSideUrl: '',
      photoBackUrl: '',
      fms: {
        deepSquat: 0, trunkStability: 0, 
        hurdleStep_L: 0, hurdleStep_R: 0,
        inlineLunge_L: 0, inlineLunge_R: 0,
        shoulderMobility_L: 0, shoulderMobility_R: 0,
        activeStraightLegRaise_L: 0, activeStraightLegRaise_R: 0,
        rotationalStability_L: 0, rotationalStability_R: 0
      },
      circumferences: {
        chest: 0, waist: 0, abdomen: 0, hips: 0,
        rightArm: 0, leftArm: 0, rightForearm: 0, leftForearm: 0,
        rightThigh: 0, leftThigh: 0, rightCalf: 0, leftCalf: 0
      },
    }
  );
  
  const [compressing, setCompressing] = useState(false);
  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null)
  };

  const handleFileUpload = async (type: 'photoFrontUrl' | 'photoSideUrl' | 'photoBackUrl', file: File) => {
    setCompressing(true);
    try {
      // Uso do novo ImageService para compressão profissional
      const base64 = await ImageService.compressImage(file, 1200, 0.6);
      setFormData(prev => ({ ...prev, [type]: base64 }));
    } catch (e) {
      console.error("Erro ao otimizar imagem:", e);
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) return alert("Selecione um aluno para esta avaliação.");
    onSave(formData);
  };

  const handleCircumferenceChange = (field: keyof NonNullable<typeof formData.circumferences>, value: string) => {
    setFormData(prev => ({
      ...prev,
      circumferences: { ...(prev.circumferences || {}), [field]: Number(value) }
    }));
  };

  const handleFmsChange = (field: keyof NonNullable<typeof formData.fms>, value: string) => {
    setFormData(prev => ({
      ...prev,
      fms: { ...(prev.fms || {}), [field]: Number(value) }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-dark-950 p-8 rounded-[3rem] border border-dark-800 shadow-2xl space-y-10 animate-fade-in mb-20 overflow-hidden">
      <div className="flex justify-between items-center border-b border-dark-800 pb-8">
        <div>
           <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
             {assessment ? 'Editar Ficha' : 'Nova Avaliação Técnica'}
           </h3>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Siga o protocolo para resultados precisos.</p>
        </div>
        <button onClick={onCancel} className="p-3 bg-dark-900 rounded-full text-slate-500 hover:text-white transition-colors border border-dark-800"><X size={24}/></button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* ALUNO E DATA */}
        <section className="space-y-6">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Users size={18}/> Perfil do Avaliado</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-2 ml-1">Aluno Avaliado</label>
                    {assessment ? (
                      <div className="w-full bg-dark-900/50 border border-dark-700 rounded-2xl p-4 text-slate-400 font-black uppercase text-sm">
                        {students.find(s => s.id === formData.studentId)?.name || 'Aluno Selecionado'}
                      </div>
                    ) : (
                      <select 
                        required 
                        className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 text-white focus:border-brand-500 outline-none font-bold text-sm"
                        value={formData.studentId}
                        onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                      >
                        <option value="">Selecione o aluno...</option>
                        {students.map(s => <option key={s.id} value={s.id}>{String(s.name)}</option>)}
                      </select>
                    )}
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-2 ml-1">Data da Coleta</label>
                    <input required type="date" className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-4 text-white focus:border-brand-500 outline-none font-black" value={String(formData.date)} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
            </div>
        </section>

        {/* BIOIMPEDANCIA */}
        <section className="space-y-6 pt-10 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Scale size={18}/> Composição & Bioimpedância</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricInput label="Peso (kg)" value={formData.weight} onChange={v => setFormData({...formData, weight: v})} step="0.1" required />
                <MetricInput label="Altura (cm)" value={formData.height} onChange={v => setFormData({...formData, height: v})} step="1" required />
                <MetricInput label="% Gordura" value={formData.bodyFatPercentage} onChange={v => setFormData({...formData, bodyFatPercentage: v})} step="0.1" required />
                <MetricInput label="Massa Musc (kg)" value={formData.skeletalMuscleMass} onChange={v => setFormData({...formData, skeletalMuscleMass: v})} step="0.1" />
                <MetricInput label="Gord. Visc (Nível)" value={formData.visceralFatLevel} onChange={v => setFormData({...formData, visceralFatLevel: v})} />
                <MetricInput label="TMB (kcal)" value={formData.basalMetabolicRate} onChange={v => setFormData({...formData, basalMetabolicRate: v})} />
                <MetricInput label="Hidratação (%)" value={formData.hydrationPercentage} onChange={v => setFormData({...formData, hydrationPercentage: v})} step="0.1" />
            </div>
        </section>

        {/* PERFORMANCE */}
        <section className="space-y-6 pt-10 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Zap size={18}/> Testes de Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricInput label="Abdominal (reps)" value={formData.abdominalTest} onChange={v => setFormData({...formData, abdominalTest: v})} />
                <MetricInput label="Salto Horiz (cm)" value={formData.horizontalJump} onChange={v => setFormData({...formData, horizontalJump: v})} />
                <MetricInput label="Salto Vert (cm)" value={formData.verticalJump} onChange={v => setFormData({...formData, verticalJump: v})} />
                <MetricInput label="Med. Ball (m)" value={formData.medicineBallThrow} onChange={v => setFormData({...formData, medicineBallThrow: v})} step="0.1" />
            </div>
        </section>

        {/* FOTOS */}
        <section className="space-y-6 pt-10 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Camera size={18}/> Avaliação Fotográfica</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <ImageUploadButton label="Frontal" value={formData.photoFrontUrl} onFileSelect={(f) => handleFileUpload('photoFrontUrl', f)} onClear={() => setFormData(prev => ({ ...prev, photoFrontUrl: '' }))} inputRef={fileInputRefs.front} compressing={compressing} />
                <ImageUploadButton label="Lateral" value={formData.photoSideUrl} onFileSelect={(f) => handleFileUpload('photoSideUrl', f)} onClear={() => setFormData(prev => ({ ...prev, photoSideUrl: '' }))} inputRef={fileInputRefs.side} compressing={compressing} />
                <ImageUploadButton label="Costas" value={formData.photoBackUrl} onFileSelect={(f) => handleFileUpload('photoBackUrl', f)} onClear={() => setFormData(prev => ({ ...prev, photoBackUrl: '' }))} inputRef={fileInputRefs.back} compressing={compressing} />
            </div>
        </section>

        {/* FMS */}
        <section className="space-y-6 pt-10 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><ClipboardList size={18}/> Protocolo FMS (0 a 3)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="col-span-full grid grid-cols-2 gap-8 pb-8 border-b border-dark-800/30">
                    <FMSInput label="Agachamento Profundo" value={formData.fms?.deepSquat} onChange={v => handleFmsChange('deepSquat', v)} />
                    <FMSInput label="Estabilidade de Tronco" value={formData.fms?.trunkStability} onChange={v => handleFmsChange('trunkStability', v)} />
                </div>
                {[
                  { id: 'hurdleStep', label: 'Passo Sobre Barreira' },
                  { id: 'inlineLunge', label: 'Avanço em Linha' },
                  { id: 'shoulderMobility', label: 'Mobilidade de Ombro' },
                  { id: 'activeStraightLegRaise', label: 'Elevação Perna Estendida' },
                  { id: 'rotationalStability', label: 'Estabilidade Rotacional' }
                ].map((move) => (
                  <div key={move.id} className="space-y-4">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-l-2 border-brand-500 pl-3">{move.label}</p>
                    <div className="grid grid-cols-2 gap-6">
                      <FMSInput label="Esquerdo" value={formData.fms?.[`${move.id}_L` as keyof typeof formData.fms]} onChange={v => handleFmsChange(`${move.id}_L` as any, v)} compact />
                      <FMSInput label="Direito" value={formData.fms?.[`${move.id}_R` as keyof typeof formData.fms]} onChange={v => handleFmsChange(`${move.id}_R` as any, v)} compact />
                    </div>
                  </div>
                ))}
            </div>
        </section>

        {/* PERIMETROS */}
        <section className="pt-10 border-t border-dark-800 space-y-8">
          <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Ruler size={18}/> Perímetros (cm)</h4>
          <div className="bg-dark-900/40 p-8 rounded-[2.5rem] border border-dark-800 space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <MetricInput label="Tórax" value={formData.circumferences?.chest} onChange={v => handleCircumferenceChange('chest', String(v))} step="0.1" />
                  <MetricInput label="Abdômen" value={formData.circumferences?.abdomen} onChange={v => handleCircumferenceChange('abdomen', String(v))} step="0.1" />
                  <MetricInput label="Cintura" value={formData.circumferences?.waist} onChange={v => handleCircumferenceChange('waist', String(v))} step="0.1" />
                  <MetricInput label="Quadril" value={formData.circumferences?.hips} onChange={v => handleCircumferenceChange('hips', String(v))} step="0.1" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <MetricInput label="Braço D" value={formData.circumferences?.rightArm} onChange={v => handleCircumferenceChange('rightArm', String(v))} step="0.1" />
                  <MetricInput label="Braço E" value={formData.circumferences?.leftArm} onChange={v => handleCircumferenceChange('leftArm', String(v))} step="0.1" />
                  <MetricInput label="Ant.Braço D" value={formData.circumferences?.rightForearm} onChange={v => handleCircumferenceChange('rightForearm', String(v))} step="0.1" />
                  <MetricInput label="Ant.Braço E" value={formData.circumferences?.leftForearm} onChange={v => handleCircumferenceChange('leftForearm', String(v))} step="0.1" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <MetricInput label="Coxa D" value={formData.circumferences?.rightThigh} onChange={v => handleCircumferenceChange('rightThigh', String(v))} step="0.1" />
                  <MetricInput label="Coxa E" value={formData.circumferences?.leftThigh} onChange={v => handleCircumferenceChange('leftThigh', String(v))} step="0.1" />
                  <MetricInput label="Panturrilha D" value={formData.circumferences?.rightCalf} onChange={v => handleCircumferenceChange('rightCalf', String(v))} step="0.1" />
                  <MetricInput label="Panturrilha E" value={formData.circumferences?.leftCalf} onChange={v => handleCircumferenceChange('leftCalf', String(v))} step="0.1" />
              </div>
          </div>
        </section>

        {/* NOTAS */}
        <section className="space-y-4 pt-10 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><FileText size={18}/> Conclusões & Notas</h4>
            <textarea className="w-full bg-dark-900 border border-dark-700 rounded-2xl p-5 text-white font-bold text-sm focus:border-brand-500 outline-none h-40 resize-none" placeholder="Relato de dores, percepção de esforço, etc..." value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
        </section>

        <div className="flex gap-4 pt-8">
          <button type="button" onClick={onCancel} className="flex-1 py-5 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-700 transition-all">Descartar</button>
          <button type="submit" disabled={compressing} className="flex-1 py-5 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-brand-600/30 hover:bg-brand-500 transition-all active:scale-95 disabled:opacity-50">
            {compressing ? <Loader2 className="animate-spin mx-auto"/> : 'Finalizar e Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

const MetricInput = ({ label, value, onChange, step = "1", required = false }: any) => (
    <div>
        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-2 ml-1">{label}</label>
        <input 
            type="number" 
            step={step}
            required={required}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white font-black text-lg focus:border-brand-500 outline-none transition-all" 
            value={value || ''} 
            onChange={e => onChange(Number(e.target.value))} 
        />
    </div>
);

const FMSInput = ({ label, value, onChange, compact = false }: any) => (
    <div>
        <label className={`block text-slate-500 font-bold uppercase mb-2 ml-1 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{label}</label>
        <select 
            className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white font-black text-base focus:border-brand-500 outline-none" 
            value={value || 0} 
            onChange={e => onChange(e.target.value)}
        >
            {[0,1,2,3].map(v => <option key={v} value={v}>{v} Pontos</option>)}
        </select>
    </div>
);

const ImageUploadButton = ({ label, value, onFileSelect, onClear, inputRef, compressing }: any) => {
    return (
        <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">{label}</p>
            <div 
                onClick={() => !value && inputRef.current?.click()}
                className={`h-64 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all cursor-pointer ${
                    value ? 'border-brand-500/50 bg-dark-900' : 'border-dark-700 hover:border-brand-500/30 hover:bg-dark-900/50 shadow-inner'
                }`}
            >
                {value ? (
                    <>
                        <img src={value} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }} className="p-4 bg-red-600 text-white rounded-2xl shadow-2xl hover:scale-110 transition-transform"><Trash2 size={24} /></button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        {compressing ? <Loader2 className="animate-spin text-brand-500" size={32} /> : <div className="p-5 bg-dark-950 rounded-full border border-dark-800"><Camera className="text-slate-600" size={32} /></div>}
                        <p className="text-[10px] text-slate-600 font-black uppercase">Anexar Foto</p>
                    </div>
                )}
            </div>
            <input 
              type="file" 
              ref={inputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileSelect(file); }} 
            />
        </div>
    );
};
