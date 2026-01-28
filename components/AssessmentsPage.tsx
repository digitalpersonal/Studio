
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Assessment, User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { GeminiService } from '../services/geminiService';
import { 
  Plus, Edit, Trash2, Activity, Loader2, Award, Heart, Ruler, Scale, 
  ChevronDown, ChevronUp, FileText, CalendarCheck, Zap, ClipboardList, 
  X, Gauge, TrendingUp, Users, AlertCircle, Camera, Image as ImageIcon,
  Upload, CheckCircle2, RotateCcw, Sparkles
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
      console.error("Erro ao salvar avaliação:", error);
      addToast(`Erro ao salvar avaliação: ${error.message || 'Erro de conexão'}`, "error");
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
        addToast("Erro na análise de IA.", "error");
    } finally {
        setAnalyzingIA(null);
    }
  };

  if (loading && !showForm) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <Loader2 className="animate-spin text-brand-500" size={48} />
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
    <div className="space-y-6 animate-fade-in">
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
            <Plus size={16} className="mr-2" /> Nova Avaliação
          </button>
        )}
      </header>

      {isStaff && (
        <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl flex flex-col md:flex-row items-center gap-4">
          <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest shrink-0">Ver Histórico de:</label>
          <select
            className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm font-bold"
            value={selectedStudentId || ''}
            onChange={e => setSelectedStudentId(e.target.value)}
          >
            <option value="">Selecione um aluno para filtrar...</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{String(s.name)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-4">
        {selectedStudentId && assessments.length > 0 ? (
          assessments.map(assessment => (
            <div key={assessment.id} className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-xl overflow-hidden relative">
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
                  <div className="mb-6 p-4 bg-brand-500/5 border border-brand-500/20 rounded-2xl animate-fade-in">
                      <p className="text-[9px] font-black text-brand-500 uppercase flex items-center gap-2 mb-2"><Sparkles size={14}/> Laudo da IA</p>
                      <p className="text-sm text-brand-100 leading-relaxed italic">"{iaFeedback[assessment.id]}"</p>
                  </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-800">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Massa Corporal</p>
                    <p className="text-lg text-white font-black">{String(assessment.weight)}<span className="text-[10px] text-slate-500 ml-1">kg</span></p>
                </div>
                <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-800">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Gordura Corporal</p>
                    <p className="text-lg text-brand-500 font-black">{String(assessment.bodyFatPercentage)}<span className="text-[10px] text-slate-500 ml-1">%</span></p>
                </div>
                <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-800">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Massa Muscular</p>
                    <p className="text-lg text-emerald-500 font-black">{String(assessment.skeletalMuscleMass || '--')}<span className="text-[10px] text-slate-500 ml-1">kg</span></p>
                </div>
                <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-800">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Gordura Visceral</p>
                    <p className="text-lg text-white font-black">{String(assessment.visceralFatLevel || '--')}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-dark-800">
                  <button 
                      onClick={() => setExpandedAssessment(expandedAssessment === assessment.id ? null : assessment.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-dark-900 hover:bg-dark-800 text-brand-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-dark-800 hover:border-brand-500/30"
                  >
                      {expandedAssessment === assessment.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      {expandedAssessment === assessment.id ? 'Ocultar Detalhes' : 'Ver Histórico Completo'}
                  </button>

                  {expandedAssessment === assessment.id && (
                    <div className="mt-8 space-y-8 animate-fade-in">
                        <div className="space-y-4">
                            <h5 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 border-l-2 border-brand-500 pl-3">
                                <Activity size={16} className="text-brand-500" /> Bioimpedância & Metabolismo
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <MetricDetail label="TMB (Calorias)" value={assessment.basalMetabolicRate} unit="kcal" />
                                <MetricDetail label="Hidratação" value={assessment.hydrationPercentage} unit="%" />
                                <MetricDetail label="Altura" value={assessment.height} unit="cm" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h5 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 border-l-2 border-brand-500 pl-3">
                                <Camera size={16} className="text-brand-500" /> Registro Fotográfico
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {(assessment.photoFrontUrl || assessment.photoSideUrl || assessment.photoBackUrl) ? (
                                    <>
                                        <PhotoDisplay label="Frontal" url={assessment.photoFrontUrl} />
                                        <PhotoDisplay label="Lateral" url={assessment.photoSideUrl} />
                                        <PhotoDisplay label="Costas" url={assessment.photoBackUrl} />
                                    </>
                                ) : (
                                    <p className="col-span-3 text-slate-600 text-xs italic text-center py-4">Nenhuma foto registrada para esta avaliação.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h5 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 border-l-2 border-brand-500 pl-3">
                                <Zap size={16} className="text-brand-500" /> Potência & Performance
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <MetricDetail label="Abdominal" value={assessment.abdominalTest} unit="reps" />
                                <MetricDetail label="Salto Horizontal" value={assessment.horizontalJump} unit="cm" />
                                <MetricDetail label="Salto Vertical" value={assessment.verticalJump} unit="cm" />
                                <MetricDetail label="Arr. Med. Ball" value={assessment.medicineBallThrow} unit="m" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h5 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 border-l-2 border-brand-500 pl-3">
                                <ClipboardList size={16} className="text-brand-500" /> Protocolo FMS (Functional Movement Screen)
                            </h5>
                            <div className="bg-dark-900/30 rounded-2xl p-6 border border-dark-800">
                                {assessment.fms ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4 border-b border-dark-800/30">
                                            <FMSScore label="Agachamento Profundo (Central)" score={assessment.fms.deepSquat} />
                                            <FMSScore label="Estabilidade de Tronco (Central)" score={assessment.fms.trunkStability} />
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

                        <div className="space-y-4">
                            <h5 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 border-l-2 border-brand-500 pl-3">
                                <Ruler size={16} className="text-brand-500" /> Perímetros Musculares (cm)
                            </h5>
                            {assessment.circumferences ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 bg-dark-900/30 rounded-2xl border border-dark-800 text-[11px]">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-brand-500 uppercase mb-2">Tronco</p>
                                        <p className="flex justify-between">Tórax: <span className="text-white">{assessment.circumferences.chest || 0}</span></p>
                                        <p className="flex justify-between">Cintura: <span className="text-white">{assessment.circumferences.waist || 0}</span></p>
                                        <p className="flex justify-between">Abdômen: <span className="text-white">{assessment.circumferences.abdomen || 0}</span></p>
                                        <p className="flex justify-between">Quadril: <span className="text-white">{assessment.circumferences.hips || 0}</span></p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-brand-500 uppercase mb-2">Membros Superiores</p>
                                        <p className="flex justify-between">Braço D: <span className="text-white">{assessment.circumferences.rightArm || 0}</span></p>
                                        <p className="flex justify-between">Braço E: <span className="text-white">{assessment.circumferences.leftArm || 0}</span></p>
                                        <p className="flex justify-between">Ant.Braço D: <span className="text-white">{assessment.circumferences.rightForearm || 0}</span></p>
                                        <p className="flex justify-between">Ant.Braço E: <span className="text-white">{assessment.circumferences.leftForearm || 0}</span></p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-brand-500 uppercase mb-2">Membros Inferiores</p>
                                        <p className="flex justify-between">Coxa D: <span className="text-white">{assessment.circumferences.rightThigh || 0}</span></p>
                                        <p className="flex justify-between">Coxa E: <span className="text-white">{assessment.circumferences.leftThigh || 0}</span></p>
                                        <p className="flex justify-between">Pant. D: <span className="text-white">{assessment.circumferences.rightCalf || 0}</span></p>
                                        <p className="flex justify-between">Pant. E: <span className="text-white">{assessment.circumferences.leftCalf || 0}</span></p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-brand-500 uppercase mb-2">Anotações Extras</p>
                                        <p className="text-slate-400 italic leading-relaxed">{assessment.notes || 'Sem observações.'}</p>
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
          <div className="py-20 text-center bg-dark-950 rounded-[2.5rem] border border-dashed border-dark-800">
             <Activity className="mx-auto text-dark-800 mb-4" size={48} />
             <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Selecione um aluno para visualizar o histórico completo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricDetail = ({ label, value, unit }: { label: string, value?: number | string, unit: string }) => (
    <div className="bg-dark-900/50 p-3 rounded-xl border border-dark-800">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm text-white font-bold">{value || '--'} <span className="text-[9px] text-slate-500">{unit}</span></p>
    </div>
);

const PhotoDisplay = ({ label, url }: { label: string, url?: string }) => (
    <div className="bg-dark-900/50 p-3 rounded-2xl border border-dark-800 space-y-2">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">{label}</p>
        <div className="h-48 bg-dark-900 rounded-lg overflow-hidden flex items-center justify-center">
            {url ? (
                <img src={url} alt={`Foto ${label}`} className="w-full h-full object-cover" />
            ) : (
                <ImageIcon size={24} className="text-dark-800" />
            )}
        </div>
    </div>
);

const FMSScore = ({ label, score }: { label: string, score?: number }) => (
    <div className="space-y-1">
        <p className="text-[9px] font-bold text-slate-500 uppercase">{label}</p>
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full ${Number(score) === 3 ? 'bg-emerald-500' : Number(score) === 2 ? 'bg-brand-500' : 'bg-red-500'}`}
                    style={{ width: `${(Number(score || 0) / 3) * 100}%` }}
                />
            </div>
            <span className="text-xs font-black text-white">{score || 0}</span>
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

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
          else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject("Erro no Canvas");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  const handleFileUpload = async (type: 'photoFrontUrl' | 'photoSideUrl' | 'photoBackUrl', file: File) => {
    setCompressing(true);
    try {
      const base64 = await compressImage(file);
      setFormData(prev => ({ ...prev, [type]: base64 }));
    } catch (e) {
      console.error("Erro ao comprimir imagem:", e);
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) return alert("Por favor, selecione um aluno para a avaliação.");
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
    <div className="max-w-3xl mx-auto bg-dark-950 p-8 rounded-[3rem] border border-dark-800 shadow-2xl space-y-8 animate-fade-in mb-20 overflow-hidden">
      <div className="flex justify-between items-center border-b border-dark-800 pb-6">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
          {assessment ? 'Editar Avaliação' : 'Nova Ficha de Avaliação'}
        </h3>
        <button onClick={onCancel} className="p-2 bg-dark-800 rounded-full text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="space-y-6">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Users size={18}/> Seleção de Aluno & Data</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Aluno Avaliado</label>
                    {assessment ? (
                      <div className="w-full bg-dark-900/50 border border-dark-700 rounded-xl p-3 text-slate-400 font-bold">
                        {students.find(s => s.id === formData.studentId)?.name || 'Aluno Selecionado'}
                      </div>
                    ) : (
                      <select 
                        required 
                        className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold"
                        value={formData.studentId}
                        onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                      >
                        <option value="">Escolha o aluno...</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{String(s.name)}</option>
                        ))}
                      </select>
                    )}
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Data da Avaliação</label>
                    <input required type="date" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={String(formData.date)} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
            </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Scale size={18}/> Composição Corporal & Bioimpedância</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Peso (kg)</label>
                    <input required type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Altura (cm)</label>
                    <input required type="number" step="1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={formData.height || ''} onChange={e => setFormData({ ...formData, height: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px) font-bold uppercase mb-1">% de Gordura</label>
                    <input required type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={formData.bodyFatPercentage || ''} onChange={e => setFormData({ ...formData, bodyFatPercentage: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Massa Muscular (kg)</label>
                    <input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={formData.skeletalMuscleMass || ''} onChange={e => setFormData({ ...formData, skeletalMuscleMass: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Gord. Visceral (Nível)</label>
                    <input type="number" step="1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={formData.visceralFatLevel || ''} onChange={e => setFormData({ ...formData, visceralFatLevel: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">TMB (kcal)</label>
                    <input type="number" step="1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={formData.basalMetabolicRate || ''} onChange={e => setFormData({ ...formData, basalMetabolicRate: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Hidratação (%)</label>
                    <input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={formData.hydrationPercentage || ''} onChange={e => setFormData({ ...formData, hydrationPercentage: Number(e.target.value) })} />
                </div>
            </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Zap size={18}/> Testes de Performance</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Abdominal (reps)</label>
                    <input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold outline-none" value={formData.abdominalTest || ''} onChange={e => setFormData({ ...formData, abdominalTest: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Salto Horizontal (cm)</label>
                    <input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold outline-none" value={formData.horizontalJump || ''} onChange={e => setFormData({ ...formData, horizontalJump: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Salto Vertical (cm)</label>
                    <input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold outline-none" value={formData.verticalJump || ''} onChange={e => setFormData({ ...formData, verticalJump: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Arr. Med. Ball (m)</label>
                    <input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold outline-none" value={formData.medicineBallThrow || ''} onChange={e => setFormData({ ...formData, medicineBallThrow: Number(e.target.value) })} />
                </div>
            </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Camera size={18}/> Registro por Imagem</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <ImageUploadButton 
                    label="Frontal" 
                    value={formData.photoFrontUrl} 
                    onFileSelect={(f) => handleFileUpload('photoFrontUrl', f)}
                    onClear={() => setFormData(prev => ({ ...prev, photoFrontUrl: '' }))}
                    inputRef={fileInputRefs.front}
                    compressing={compressing}
                />
                <ImageUploadButton 
                    label="Lateral" 
                    value={formData.photoSideUrl} 
                    onFileSelect={(f) => handleFileUpload('photoSideUrl', f)}
                    onClear={() => setFormData(prev => ({ ...prev, photoSideUrl: '' }))}
                    inputRef={fileInputRefs.side}
                    compressing={compressing}
                />
                <ImageUploadButton 
                    label="Costas" 
                    value={formData.photoBackUrl} 
                    onFileSelect={(f) => handleFileUpload('photoBackUrl', f)}
                    onClear={() => setFormData(prev => ({ ...prev, photoBackUrl: '' }))}
                    inputRef={fileInputRefs.back}
                    compressing={compressing}
                />
            </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><ClipboardList size={18}/> Protocolo FMS</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* NOTAS ÚNICAS (CENTRAIS) */}
                <div className="col-span-full grid grid-cols-2 gap-4 pb-4 border-b border-dark-800/30">
                    <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Agachamento Profundo (Único)</label>
                        <select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold" value={formData.fms?.deepSquat || 0} onChange={e => handleFmsChange('deepSquat', e.target.value)}>
                            {[0,1,2,3].map(v => <option key={v} value={v}>{v} Pontos</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Estabilidade de Tronco (Única)</label>
                        <select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold" value={formData.fms?.trunkStability || 0} onChange={e => handleFmsChange('trunkStability', e.target.value)}>
                            {[0,1,2,3].map(v => <option key={v} value={v}>{v} Pontos</option>)}
                        </select>
                    </div>
                </div>

                {/* BILATERAIS (ESQUERDO E DIREITO) */}
                {[
                  { id: 'hurdleStep', label: 'Passo Sobre Barreira' },
                  { id: 'inlineLunge', label: 'Avanço em Linha Reta' },
                  { id: 'shoulderMobility', label: 'Mobilidade de Ombro' },
                  { id: 'activeStraightLegRaise', label: 'Elevação Perna Estendida' },
                  { id: 'rotationalStability', label: 'Estabilidade Rotacional' }
                ].map((move) => (
                  <div key={move.id} className="space-y-2">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-l-2 border-brand-500 pl-2">{move.label}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 text-[9px] font-bold uppercase mb-1">Esquerdo</label>
                        <select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-xs font-bold" value={formData.fms?.[`${move.id}_L` as keyof typeof formData.fms] || 0} onChange={e => handleFmsChange(`${move.id}_L` as any, e.target.value)}>
                          {[0,1,2,3].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[9px] font-bold uppercase mb-1">Direito</label>
                        <select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-xs font-bold" value={formData.fms?.[`${move.id}_R` as keyof typeof formData.fms] || 0} onChange={e => handleFmsChange(`${move.id}_R` as any, e.target.value)}>
                          {[0,1,2,3].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
        </section>

        <section className="pt-6 border-t border-dark-800 space-y-6">
          <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Ruler size={18} className="text-brand-500"/> Perímetros (cm)</h4>
          <div className="bg-dark-900/40 p-6 rounded-[2.5rem] border border-dark-800 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Tórax</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.chest || ''} onChange={e => handleCircumferenceChange('chest', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Abdômen</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.abdomen || ''} onChange={e => handleCircumferenceChange('abdomen', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Cintura</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.waist || ''} onChange={e => handleCircumferenceChange('waist', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Quadril</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.hips || ''} onChange={e => handleCircumferenceChange('hips', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <p className="col-span-2 text-[9px] font-black text-brand-500 uppercase tracking-widest border-b border-dark-800/50 pb-1">Superiores</p>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Braço Dir.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.rightArm || ''} onChange={e => handleCircumferenceChange('rightArm', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Braço Esq.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.leftArm || ''} onChange={e => handleCircumferenceChange('leftArm', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Ant.Braço Dir.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.rightForearm || ''} onChange={e => handleCircumferenceChange('rightForearm', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Ant.Braço Esq.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.leftForearm || ''} onChange={e => handleCircumferenceChange('leftForearm', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <p className="col-span-2 text-[9px] font-black text-brand-500 uppercase tracking-widest border-b border-dark-800/50 pb-1">Inferiores</p>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Coxa Dir.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.rightThigh || ''} onChange={e => handleCircumferenceChange('rightThigh', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Coxa Esq.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.leftThigh || ''} onChange={e => handleCircumferenceChange('leftThigh', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Pant. Dir.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.rightCalf || ''} onChange={e => handleCircumferenceChange('rightCalf', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Pant. Esq.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.leftCalf || ''} onChange={e => handleCircumferenceChange('leftCalf', e.target.value)} /></div>
              </div>
          </div>
        </section>

        <section className="space-y-4 pt-6 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><FileText size={18}/> Anotações Gerais</h4>
            <textarea className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white font-bold text-sm focus:border-brand-500 outline-none h-32 resize-none" placeholder="Observações sobre o desempenho, dores relatadas, etc..." value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
        </section>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-5 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-700 transition-all">Cancelar</button>
          <button type="submit" disabled={compressing} className="flex-1 py-5 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-brand-600/30 hover:bg-brand-500 transition-all active:scale-95 disabled:opacity-50">
            {compressing ? <Loader2 className="animate-spin mx-auto"/> : 'Finalizar Avaliação'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ImageUploadButton = ({ label, value, onFileSelect, onClear, inputRef, compressing }: any) => {
    return (
        <div className="space-y-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">{label}</p>
            <div 
                onClick={() => !value && inputRef.current?.click()}
                className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all cursor-pointer ${
                    value ? 'border-brand-500/50 bg-dark-900' : 'border-dark-700 hover:border-brand-500/30 hover:bg-dark-900/50'
                }`}
            >
                {value ? (
                    <>
                        <img src={value} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }} className="p-2 bg-red-600 text-white rounded-lg"><X size={16} /></button>
                        </div>
                    </>
                ) : (
                    <>
                        {compressing ? <Loader2 className="animate-spin text-brand-500" size={24} /> : <Upload className="text-slate-600" size={24} />}
                    </>
                )}
            </div>
            <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileSelect(file); }} />
        </div>
    );
};
