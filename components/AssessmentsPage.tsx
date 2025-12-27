

import React, { useState, useEffect, useMemo } from 'react';
import { Assessment, User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { GeminiService } from '../services/geminiService';
import { Plus, Edit, Trash2, Activity, Loader2, Award, Heart, Ruler, Scale, ChevronDown, ChevronUp, FileText, CalendarCheck } from 'lucide-react';

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
          // If staff, default to first student or no student selected
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
        console.error("Erro ao carregar avaliações:", error.message || JSON.stringify(error));
        addToast(`Erro ao carregar avaliações: ${error.message || JSON.stringify(error)}`, "error");
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
          console.error("Erro ao carregar avaliações do aluno:", error.message || JSON.stringify(error));
          addToast(`Erro ao carregar avaliações do aluno: ${error.message || JSON.stringify(error)}`, "error");
        } finally {
          setLoading(false);
        }
      } else {
        setAssessments([]);
        setGeminiAnalysis(null);
      }
    };
    fetchAssessmentsForSelectedStudent();
  }, [selectedStudentId, addToast]);

  const handleSaveAssessment = async (assessmentData: Omit<Assessment, 'id'>) => {
    setLoading(true);
    try {
      if (editingAssessment) {
        await SupabaseService.updateAssessment({ ...assessmentData as Assessment, id: editingAssessment.id });
        addToast("Avaliação atualizada com sucesso!", "success");
      } else {
        await SupabaseService.addAssessment(assessmentData);
        addToast("Nova avaliação criada com sucesso!", "success");
      }
      setShowForm(false);
      setEditingAssessment(null);
      if (selectedStudentId) {
        const updatedAssessments = await SupabaseService.getAssessments(selectedStudentId);
        setAssessments(updatedAssessments);
      }
    } catch (error: any) {
      console.error("Erro ao salvar avaliação:", error.message || JSON.stringify(error));
      addToast(`Erro ao salvar avaliação: ${error.message || 'Desconhecido'}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta avaliação?")) return;
    setLoading(true);
    try {
      await SupabaseService.deleteAssessment(id);
      addToast("Avaliação excluída com sucesso!", "success");
      if (selectedStudentId) {
        const updatedAssessments = await SupabaseService.getAssessments(selectedStudentId);
        setAssessments(updatedAssessments);
      }
    } catch (error: any) {
      console.error("Erro ao excluir avaliação:", error.message || JSON.stringify(error));
      addToast(`Erro ao excluir avaliação: ${error.message || 'Desconhecido'}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGeminiAnalysis = async () => {
    if (!selectedStudentId) {
      addToast("Selecione um aluno para gerar a análise.", "info");
      return;
    }
    if (assessments.length === 0) {
      addToast("Nenhuma avaliação encontrada para este aluno.", "info");
      return;
    }

    setAnalysisLoading(true);
    try {
      const student = students.find(s => s.id === selectedStudentId);
      if (!student) throw new Error("Aluno não encontrado.");
      const analysis = await GeminiService.analyzeProgress(String(student.name), assessments);
      setGeminiAnalysis(analysis);
    } catch (error: any) {
      console.error("Erro ao gerar análise Gemini:", error.message || JSON.stringify(error));
      addToast(`Erro ao gerar análise da IA: ${error.message || JSON.stringify(error)}`, "error");
      setGeminiAnalysis("Não foi possível gerar a análise da IA no momento.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Desconhecido';

  if (loading) {
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
        onSave={handleSaveAssessment}
        onCancel={() => { setShowForm(false); setEditingAssessment(null); }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Avaliações Físicas</h2>
          <p className="text-slate-400 text-sm">Acompanhe o progresso e a evolução dos alunos.</p>
        </div>
        {isStaff && (
          <button
            onClick={() => {
              if (!selectedStudentId) {
                addToast("Selecione um aluno para adicionar uma avaliação.", "info");
                return;
              }
              setEditingAssessment(null);
              setShowForm(true);
            }}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg shadow-brand-500/20"
          >
            <Plus size={16} className="mr-2" /> Nova Avaliação
          </button>
        )}
      </header>

      {isStaff && (
        <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl flex flex-col md:flex-row items-center gap-4">
          <label className="text-slate-400 text-[10px] font-bold uppercase shrink-0">Aluno:</label>
          <select
            className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
            value={selectedStudentId || ''}
            onChange={e => setSelectedStudentId(e.target.value)}
          >
            <option value="">Selecione um Aluno</option>
            {/* Filter to only show actual students in the dropdown */}
            {students.filter(s => s.role === UserRole.STUDENT).map(s => (
              <option key={s.id} value={s.id}>{String(s.name)}</option>
            ))}
          </select>
        </div>
      )}

      {selectedStudentId && assessments.length > 0 && (
        <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Award size={20} className="text-brand-500" /> Análise de Progresso (IA)
          </h3>
          <button
            onClick={handleGenerateGeminiAnalysis}
            disabled={analysisLoading || assessments.length < 2}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analysisLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <FileText size={16} className="mr-2" />}
            Gerar Análise da IA
          </button>
          {geminiAnalysis && (
            <div className="mt-4 p-4 bg-brand-500/5 rounded-2xl border border-brand-500/10 text-brand-100 prose prose-invert text-sm max-w-none">
              <p>{geminiAnalysis}</p>
            </div>
          )}
          {assessments.length < 2 && !analysisLoading && (
              <p className="text-slate-500 text-xs italic">É necessário pelo menos duas avaliações para gerar uma análise de progresso.</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {assessments.length > 0 ? (
          assessments.map(assessment => (
            <div key={assessment.id} className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <Activity size={24} className="text-brand-500" />
                  <div>
                    <h4 className="text-white font-bold text-lg">Avaliação de {String(assessment.date)}</h4>
                    <p className="text-slate-500 text-sm">{getStudentName(assessment.studentId)}</p>
                  </div>
                </div>
                {isStaff && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingAssessment(assessment); setShowForm(true); }} className="p-2 bg-dark-800 text-slate-400 rounded-lg hover:text-white transition-colors" title="Editar Avaliação">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteAssessment(assessment.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Excluir Avaliação">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
                <p><strong>Peso:</strong> {String(assessment.weight)} kg</p>
                <p><strong>Altura:</strong> {String(assessment.height)} cm</p>
                <p><strong>% Gordura:</strong> {String(assessment.bodyFatPercentage)}%</p>
                {assessment.skeletalMuscleMass && <p><strong>Massa Muscular:</strong> {String(assessment.skeletalMuscleMass)} kg</p>}
                {assessment.visceralFatLevel && <p><strong>Gord. Visceral:</strong> Nível {String(assessment.visceralFatLevel)}</p>}
                {assessment.vo2Max && <p><strong>VO2 Max:</strong> {String(assessment.vo2Max)}</p>}
                {assessment.squatMax && <p><strong>Squat Max:</strong> {String(assessment.squatMax)} kg</p>}
              </div>

              {assessment.circumferences && Object.keys(assessment.circumferences).length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-800">
                  <button 
                      onClick={() => setExpandedAssessment(expandedAssessment === assessment.id ? null : assessment.id)}
                      className="flex items-center gap-2 text-brand-500 font-bold text-xs uppercase"
                  >
                      {expandedAssessment === assessment.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      {expandedAssessment === assessment.id ? 'Ocultar Medidas' : 'Ver Medidas Detalhadas'}
                  </button>
                  {expandedAssessment === assessment.id && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300 mt-3 animate-fade-in">
                        {assessment.circumferences.chest && <p><strong>Tórax:</strong> {String(assessment.circumferences.chest)} cm</p>}
                        {assessment.circumferences.waist && <p><strong>Cintura:</strong> {String(assessment.circumferences.waist)} cm</p>}
                        {assessment.circumferences.abdomen && <p><strong>Abdômen:</strong> {String(assessment.circumferences.abdomen)} cm</p>}
                        {assessment.circumferences.hips && <p><strong>Quadril:</strong> {String(assessment.circumferences.hips)} cm</p>}
                        {assessment.circumferences.rightThigh && <p><strong>Coxa Dir.:</strong> {String(assessment.circumferences.rightThigh)} cm</p>}
                        {assessment.circumferences.rightCalf && <p><strong>Panturrilha Dir.:</strong> {String(assessment.circumferences.rightCalf)} cm</p>}
                    </div>
                  )}
                </div>
              )}

              {assessment.notes && (
                <div className="mt-4 pt-4 border-t border-dark-800 text-slate-400 text-sm">
                  <strong>Notas:</strong> {String(assessment.notes)}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-slate-500 italic">Nenhuma avaliação encontrada para este aluno.</p>
        )}
      </div>
    </div>
  );
};


interface AssessmentFormProps {
  assessment: Assessment | null;
  studentId: string;
  onSave: (assessmentData: Omit<Assessment, 'id'>) => void;
  onCancel: () => void;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({ assessment, studentId, onSave, onCancel }) => {
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
      vo2Max: 0,
      squatMax: 0,
      circumferences: {},
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleCircumferenceChange = (field: keyof typeof formData.circumferences, value: string) => {
    setFormData(prev => ({
      ...prev,
      circumferences: {
        ...(prev.circumferences || {}),
        [field]: Number(value)
      }
    }));
  };

  return (
    <div className="max-w-xl mx-auto bg-dark-950 p-8 rounded-3xl border border-dark-800 shadow-xl space-y-6 animate-fade-in">
      <h3 className="text-xl font-bold text-white border-b border-dark-800 pb-4">
        {assessment ? 'Editar Avaliação' : 'Nova Avaliação'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Data da Avaliação</label>
          <input required type="date" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.date)} onChange={e => setFormData({ ...formData, date: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Peso (kg)</label>
            <input required type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.weight)} onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Altura (cm)</label>
            <input required type="number" step="1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.height)} onChange={e => setFormData({ ...formData, height: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">% Gordura</label>
            <input required type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.bodyFatPercentage)} onChange={e => setFormData({ ...formData, bodyFatPercentage: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Massa Muscular (kg)</label>
            <input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.skeletalMuscleMass || '')} onChange={e => setFormData({ ...formData, skeletalMuscleMass: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Gordura Visceral (Nível)</label>
            <input type="number" step="1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.visceralFatLevel || '')} onChange={e => setFormData({ ...formData, visceralFatLevel: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">VO2 Max</label>
            <input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.vo2Max || '')} onChange={e => setFormData({ ...formData, vo2Max: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Squat Max (kg)</label>
            <input type="number" step="1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.squatMax || '')} onChange={e => setFormData({ ...formData, squatMax: Number(e.target.value) })} />
          </div>
        </div>

        <div className="pt-4 border-t border-dark-800 space-y-4">
          <h4 className="text-white font-bold text-sm flex items-center gap-2"><Ruler size={18} className="text-brand-500"/> Medidas de Circunferência (cm)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Tórax</label><input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.circumferences?.chest || '')} onChange={e => handleCircumferenceChange('chest', e.target.value)} /></div>
            <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Cintura</label><input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.circumferences?.waist || '')} onChange={e => handleCircumferenceChange('waist', e.target.value)} /></div>
            <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Abdômen</label><input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.circumferences?.abdomen || '')} onChange={e => handleCircumferenceChange('abdomen', e.target.value)} /></div>
            <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Quadril</label><input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.circumferences?.hips || '')} onChange={e => handleCircumferenceChange('hips', e.target.value)} /></div>
            <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Coxa Direita</label><input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.circumferences?.rightThigh || '')} onChange={e => handleCircumferenceChange('rightThigh', e.target.value)} /></div>
            <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Panturrilha Direita</label><input type="number" step="0.1" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.circumferences?.rightCalf || '')} onChange={e => handleCircumferenceChange('rightCalf', e.target.value)} /></div>
          </div>
        </div>

        <div>
          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Notas da Avaliação</label>
          <textarea className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white" value={String(formData.notes)} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onCancel} className="px-6 py-3 bg-dark-800 text-white rounded-lg font-bold">Cancelar</button>
          <button type="submit" className="px-6 py-3 bg-brand-600 text-white rounded-lg font-bold shadow-lg shadow-brand-500/20">Salvar Avaliação</button>
        </div>
      </form>
    </div>
  );
};