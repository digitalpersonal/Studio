
import React, { useState, useEffect, useMemo } from 'react';
import { Assessment, User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { GeminiService } from '../services/geminiService';
import { Plus, Edit, Trash2, Activity, Loader2, Award, Heart, Ruler, Scale, ChevronDown, ChevronUp, FileText, CalendarCheck, Zap, ClipboardList, X } from 'lucide-react';

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
      addToast(`Erro técnico ao salvar no banco.`, "error");
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
            <div key={assessment.id} className="bg-dark-950 p-6 rounded-[2rem] border border-dark-800 shadow-xl overflow-hidden relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-600/10 rounded-2xl border border-brand-600/20 text-brand-500">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-lg uppercase tracking-tighter">Avaliação: {new Date(assessment.date).toLocaleDateString('pt-BR')}</h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Status: Concluída</p>
                  </div>
                </div>
                {isStaff && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingAssessment(assessment); setShowForm(true); }} className="p-2 bg-dark-800 text-slate-400 rounded-xl hover:text-white transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteAssessment(assessment.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-dark-900/50 p-5 rounded-2xl border border-dark-800 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-dark-800 pb-2 mb-2">Composição</p>
                    <p className="text-sm text-slate-300 font-bold">Peso: <span className="text-white">{String(assessment.weight)} kg</span></p>
                    <p className="text-sm text-slate-300 font-bold">Altura: <span className="text-white">{String(assessment.height)} cm</span></p>
                    <p className="text-sm text-slate-300 font-bold">% Gordura: <span className="text-brand-500">{String(assessment.bodyFatPercentage)}%</span></p>
                </div>
                <div className="bg-dark-900/50 p-5 rounded-2xl border border-dark-800 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-dark-800 pb-2 mb-2">Potência & Saltos</p>
                    <p className="text-sm text-slate-300 font-bold">Salto Horiz.: <span className="text-white">{assessment.horizontalJump || 0} cm</span></p>
                    <p className="text-sm text-slate-300 font-bold">Salto Vert.: <span className="text-white">{assessment.verticalJump || 0} cm</span></p>
                    <p className="text-sm text-slate-300 font-bold">Arr. Med. Ball: <span className="text-white">{assessment.medicineBallThrow || 0} m</span></p>
                </div>
                <div className="bg-dark-900/50 p-5 rounded-2xl border border-dark-800 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-dark-800 pb-2 mb-2">Protocolo FMS</p>
                    {assessment.fms ? (
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-bold">
                        <span className="text-slate-500">Agachamento: <span className="text-brand-500">{assessment.fms.deepSquat || 0}</span></span>
                        <span className="text-slate-500">Barreira: <span className="text-brand-500">{assessment.fms.hurdleStep || 0}</span></span>
                        <span className="text-slate-500">Avanço: <span className="text-brand-500">{assessment.fms.inlineLunge || 0}</span></span>
                        <span className="text-slate-500">Ombro: <span className="text-brand-500">{assessment.fms.shoulderMobility || 0}</span></span>
                        <span className="text-slate-500">Perna Est.: <span className="text-brand-500">{assessment.fms.activeStraightLegRaise || 0}</span></span>
                        <span className="text-slate-500">Est. Rotac.: <span className="text-brand-500">{assessment.fms.rotationalStability || 0}</span></span>
                      </div>
                    ) : <p className="text-slate-600 text-xs italic">FMS não disponível</p>}
                </div>
              </div>

              {assessment.circumferences && (
                <div className="mt-6 pt-6 border-t border-dark-800">
                  <button 
                      onClick={() => setExpandedAssessment(expandedAssessment === assessment.id ? null : assessment.id)}
                      className="flex items-center gap-2 text-brand-500 font-black text-[10px] uppercase tracking-widest hover:text-brand-400 transition-colors"
                  >
                      {expandedAssessment === assessment.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      {expandedAssessment === assessment.id ? 'Ocultar Medidas Detalhadas' : 'Ver Perímetros Bilaterais (D/E)'}
                  </button>
                  {expandedAssessment === assessment.id && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs text-slate-300 mt-6 animate-fade-in p-6 bg-dark-900/30 rounded-3xl border border-dark-800">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-brand-500 uppercase tracking-widest mb-3 border-b border-dark-800 pb-1">Tronco</p>
                            <p>Tórax: <span className="text-white">{assessment.circumferences.chest || 0} cm</span></p>
                            <p>Cintura: <span className="text-white">{assessment.circumferences.waist || 0} cm</span></p>
                            <p>Abdômen: <span className="text-white">{assessment.circumferences.abdomen || 0} cm</span></p>
                            <p>Quadril: <span className="text-white">{assessment.circumferences.hips || 0} cm</span></p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-brand-500 uppercase tracking-widest mb-3 border-b border-dark-800 pb-1">Superiores</p>
                            <p>Braço D: <span className="text-white">{assessment.circumferences.rightArm || 0} cm</span></p>
                            <p>Braço E: <span className="text-white">{assessment.circumferences.leftArm || 0} cm</span></p>
                            <p>Ant.Braço D: <span className="text-white">{assessment.circumferences.rightForearm || 0} cm</span></p>
                            <p>Ant.Braço E: <span className="text-white">{assessment.circumferences.leftForearm || 0} cm</span></p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-brand-500 uppercase tracking-widest mb-3 border-b border-dark-800 pb-1">Coxas</p>
                            <p>Coxa D: <span className="text-white">{assessment.circumferences.rightThigh || 0} cm</span></p>
                            <p>Coxa E: <span className="text-white">{assessment.circumferences.leftThigh || 0} cm</span></p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-brand-500 uppercase tracking-widest mb-3 border-b border-dark-800 pb-1">Panturrilhas</p>
                            <p>Pant. D: <span className="text-white">{assessment.circumferences.rightCalf || 0} cm</span></p>
                            <p>Pant. E: <span className="text-white">{assessment.circumferences.leftCalf || 0} cm</span></p>
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-dark-950 rounded-[2.5rem] border border-dashed border-dark-800">
             <Activity className="mx-auto text-dark-800 mb-4" size={48} />
             <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Selecione um aluno para visualizar o histórico.</p>
          </div>
        )}
      </div>
    </div>
  );
};

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
      horizontalJump: 0,
      verticalJump: 0,
      medicineBallThrow: 0,
      fms: {
        deepSquat: 0, hurdleStep: 0, inlineLunge: 0,
        shoulderMobility: 0, activeStraightLegRaise: 0, rotationalStability: 0
      },
      circumferences: {
        chest: 0, waist: 0, abdomen: 0, hips: 0,
        rightArm: 0, leftArm: 0, rightForearm: 0, leftForearm: 0,
        rightThigh: 0, leftThigh: 0, rightCalf: 0, leftCalf: 0
      },
    }
  );

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
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><UsersIcon size={18}/> Seleção de Aluno & Data</h4>
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
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Scale size={18}/> Composição Corporal</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Peso (kg)</label>
                    <input required type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Altura (cm)</label>
                    <input required type="number" step="1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={formData.height || ''} onChange={e => setFormData({ ...formData, height: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">% de Gordura</label>
                    <input required type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold" value={formData.bodyFatPercentage || ''} onChange={e => setFormData({ ...formData, bodyFatPercentage: Number(e.target.value) })} />
                </div>
            </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Zap size={18}/> Potência & Saltos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Salto Horizontal (cm)</label>
                    <input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.horizontalJump || ''} onChange={e => setFormData({ ...formData, horizontalJump: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Salto Vertical (cm)</label>
                    <input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.verticalJump || ''} onChange={e => setFormData({ ...formData, verticalJump: Number(e.target.value) })} />
                </div>
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Arremesso Med. Ball (m)</label>
                    <input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.medicineBallThrow || ''} onChange={e => setFormData({ ...formData, medicineBallThrow: Number(e.target.value) })} />
                </div>
            </div>
        </section>

        <section className="space-y-6 pt-6 border-t border-dark-800">
            <h4 className="text-brand-500 font-black text-xs uppercase tracking-widest flex items-center gap-2"><ClipboardList size={18}/> Protocolo FMS</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {Object.keys(formData.fms || {}).map((key) => {
                  const labels: any = {
                    deepSquat: 'Agachamento Profundo',
                    hurdleStep: 'Passo Sobre Barreira',
                    inlineLunge: 'Avanço em Linha Reta',
                    shoulderMobility: 'Mobilidade Ombro',
                    activeStraightLegRaise: 'Elev. Perna Estendida',
                    rotationalStability: 'Estabilidade Rotacional'
                  };
                  return (
                    <div key={key}>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">{labels[key]}</label>
                        <select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold" value={formData.fms![key as keyof typeof formData.fms] || 0} onChange={e => handleFmsChange(key as any, e.target.value)}>
                            {[0,1,2,3].map(v => <option key={v} value={v}>{v} Pontos</option>)}
                        </select>
                    </div>
                  );
                })}
            </div>
        </section>

        <section className="pt-6 border-t border-dark-800 space-y-6">
          <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><Ruler size={18} className="text-brand-500"/> Perímetros Bilaterais (cm)</h4>
          <div className="bg-dark-900/40 p-6 rounded-[2.5rem] border border-dark-800 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Tórax</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.chest || ''} onChange={e => handleCircumferenceChange('chest', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Abdômen</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.abdomen || ''} onChange={e => handleCircumferenceChange('abdomen', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <p className="col-span-2 text-[9px] font-black text-brand-500 uppercase tracking-widest border-b border-dark-800/50 pb-1">Superiores</p>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Braço Dir.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.rightArm || ''} onChange={e => handleCircumferenceChange('rightArm', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Braço Esq.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.leftArm || ''} onChange={e => handleCircumferenceChange('leftArm', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Ant. Braço D.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.rightForearm || ''} onChange={e => handleCircumferenceChange('rightForearm', e.target.value)} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Ant. Braço E.</label><input type="number" step="0.1" className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.circumferences?.leftForearm || ''} onChange={e => handleCircumferenceChange('leftForearm', e.target.value)} /></div>
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

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-5 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-700 transition-all">Cancelar</button>
          <button type="submit" className="flex-1 py-5 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-brand-600/30 hover:bg-brand-500 transition-all active:scale-95">Finalizar Avaliação</button>
        </div>
      </form>
    </div>
  );
};

const UsersIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
