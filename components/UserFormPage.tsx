import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, UserRole, Anamnesis, Address, Plan } from '../types';
import { SupabaseService } from '../services/supabaseService';
import {
  X, Info, Repeat, Stethoscope, HandCoins, ArrowLeft, Save, MapPin, Calendar, Eye, EyeOff, ShieldCheck, AlertCircle, HeartPulse, Dumbbell, BookOpen, User as UserIcon, Phone, FileHeart, CheckCircle2
} from 'lucide-react';

interface UserFormPageProps {
  editingUser: User | null;
  initialFormData: Partial<User>;
  onSave: (user: User, wasPlanNewlyAssigned?: boolean) => void;
  onCancel: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialActiveTab?: 'basic' | 'plan' | 'anamnesis';
  currentUserRole: UserRole;
  isCompletingProfile?: boolean;
}

const RequiredLabel = ({ text }: { text: string }) => (
  <span className="flex items-center gap-1">
    {text} <span className="text-red-500 font-bold">*</span>
  </span>
);

export const UserFormPage: React.FC<UserFormPageProps> = ({
  editingUser,
  initialFormData,
  onSave,
  onCancel,
  addToast,
  initialActiveTab = 'basic',
  currentUserRole,
  isCompletingProfile = false,
}) => {
  const [formData, setFormData] = useState<Partial<User>>(() => ({
    ...initialFormData,
    address: initialFormData.address || {
      zipCode: '', street: '', number: '', complement: '',
      neighborhood: '', city: '', state: ''
    },
    anamnesis: initialFormData.anamnesis || {
      hasMedicalCondition: false, medicalConditionDescription: '',
      hasRecentSurgeryOrInjury: false, recentSurgeryOrInjuryDetails: '',
      takesMedication: false, medicationDescription: '',
      hasAllergies: false, allergiesDescription: '',
      recentExamsResults: '',
      mainGoal: '', trainingFrequency: '3-4x', activityLevel: 'MODERATE',
      trainingExperience: '', availableEquipment: '', preferredTrainingTimes: '',
      smokesOrDrinks: false, smokingDrinkingFrequency: '',
      sleepQuality: '', currentDiet: '', bodyMeasurements: '',
      emergencyContactName: '', emergencyContactPhone: '',
      updatedAt: new Date().toISOString().split('T')[0],
    },
    planValue: initialFormData.planValue !== undefined ? initialFormData.planValue : 150,
    planDuration: initialFormData.planDuration !== undefined ? initialFormData.planDuration : 12,
    billingDay: initialFormData.billingDay !== undefined ? initialFormData.billingDay : 5,
    planStartDate: initialFormData.planStartDate || new Date().toISOString().split('T')[0],
  }));
  const [activeTab, setActiveTab] = useState<'basic' | 'plan' | 'anamnesis'>(initialActiveTab);
  const [showPassword, setShowPassword] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
        try {
            const availablePlans = await SupabaseService.getPlans();
            setPlans(availablePlans);
        } catch (error) {
            addToast("Erro ao carregar os planos disponíveis.", "error");
        }
    };
    fetchPlans();
  }, [addToast]);

  const plansByType = useMemo(() => {
    return plans.reduce((acc, plan) => {
        const type = plan.planType;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(plan);
        return acc;
    }, {} as Record<string, Plan[]>);
  }, [plans]);

  const handleSelectPlan = (plan: Plan) => {
    setFormData(prev => ({
        ...prev,
        planId: plan.id,
        planValue: plan.price,
        planDuration: plan.durationMonths,
    }));
    addToast(`Plano '${plan.title}' selecionado. Salve para aplicar.`, 'info');
  };

  const isSuperAdmin = currentUserRole === UserRole.SUPER_ADMIN;
  const isAdmin = currentUserRole === UserRole.ADMIN || isSuperAdmin;

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case UserRole.SUPER_ADMIN: return 'Administrador Geral';
      case UserRole.ADMIN: return 'Administrador';
      case UserRole.TRAINER: return 'Treinador / Professor';
      default: return 'Aluno(a)';
    }
  };

  useEffect(() => {
    setFormData(() => ({
      ...initialFormData,
      address: initialFormData.address || {
        zipCode: '', street: '', number: '', complement: '',
        neighborhood: '', city: '', state: ''
      },
      anamnesis: initialFormData.anamnesis || {
        hasMedicalCondition: false, medicalConditionDescription: '',
        hasRecentSurgeryOrInjury: false, recentSurgeryOrInjuryDetails: '',
        takesMedication: false, medicationDescription: '',
        hasAllergies: false, allergiesDescription: '',
        recentExamsResults: '',
        mainGoal: '', trainingFrequency: '3-4x', activityLevel: 'MODERATE',
        trainingExperience: '', availableEquipment: '', preferredTrainingTimes: '',
        smokesOrDrinks: false, smokingDrinkingFrequency: '',
        sleepQuality: '', currentDiet: '', bodyMeasurements: '',
        emergencyContactName: '', emergencyContactPhone: '',
        updatedAt: new Date().toISOString().split('T')[0],
      },
      planValue: initialFormData.planValue !== undefined ? initialFormData.planValue : 150,
      planDuration: initialFormData.planDuration !== undefined ? initialFormData.planDuration : 12,
      billingDay: initialFormData.billingDay !== undefined ? initialFormData.billingDay : 5,
      planStartDate: initialFormData.planStartDate || new Date().toISOString().split('T')[0],
    }));
    setActiveTab(initialActiveTab);
  }, [initialFormData, initialActiveTab]);

  const validateForm = () => {
    const isStudent = (formData.role || UserRole.STUDENT) === UserRole.STUDENT;

    // Tab 'basic'
    if (!formData.name?.trim()) { setActiveTab('basic'); return "O nome é obrigatório."; }
    if (!formData.email?.trim()) { setActiveTab('basic'); return "O e-mail é obrigatório."; }
    if (!formData.phoneNumber?.trim()) { setActiveTab('basic'); return "O WhatsApp é obrigatório."; }
    
    if (isStudent) {
      if (!formData.cpf?.trim()) { setActiveTab('basic'); return "O CPF é obrigatório para alunos."; }
      if (!formData.rg?.trim()) { setActiveTab('basic'); return "O RG é obrigatório para alunos."; }
      const address = formData.address;
      if (!address?.street?.trim() || !address?.number?.trim() || !address?.neighborhood?.trim() || !address?.city?.trim() || !address?.state?.trim() || !address?.zipCode?.trim()) {
        setActiveTab('basic');
        return "Todos os campos do endereço são obrigatórios.";
      }
    }

    // Tab 'plan'
    if (isStudent) {
      if (!formData.planId) { setActiveTab('plan'); return "É obrigatório selecionar um plano para o aluno."; }
    }

    // Tab 'anamnesis'
    if (isStudent) {
      const anamnesis = formData.anamnesis;
      if (!anamnesis?.emergencyContactName?.trim()) { setActiveTab('anamnesis'); return "O nome do contato de emergência é obrigatório."; }
      if (!anamnesis?.emergencyContactPhone?.trim()) { setActiveTab('anamnesis'); return "O telefone de emergência é obrigatório."; }
      if (anamnesis?.hasMedicalCondition && !anamnesis.medicalConditionDescription?.trim()) { setActiveTab('anamnesis'); return "Por favor, descreva a condição médica."; }
      if (anamnesis?.hasRecentSurgeryOrInjury && !anamnesis.recentSurgeryOrInjuryDetails?.trim()) { setActiveTab('anamnesis'); return "Por favor, detalhe as cirurgias ou lesões recentes."; }
      if (anamnesis?.takesMedication && !anamnesis.medicationDescription?.trim()) { setActiveTab('anamnesis'); return "Por favor, liste os medicamentos em uso."; }
      if (anamnesis?.hasAllergies && !anamnesis.allergiesDescription?.trim()) { setActiveTab('anamnesis'); return "Por favor, descreva suas alergias."; }
      if (anamnesis?.smokesOrDrinks && !anamnesis.smokingDrinkingFrequency?.trim()) { setActiveTab('anamnesis'); return "Por favor, informe a frequência do consumo de álcool/cigarro."; }
    }
    
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      addToast(error, "error");
      return;
    }

    const wasPlanNewlyAssigned = !!(formData.planId && editingUser?.planId !== formData.planId);

    const payload = {
      ...formData,
      role: isAdmin ? (formData.role || UserRole.STUDENT) : (editingUser?.role || UserRole.STUDENT),
      avatarUrl: formData.avatarUrl || `https://ui-avatars.com/api/?name=${String(formData.name)}`,
      profileCompleted: true
    } as User;

    onSave(payload, wasPlanNewlyAssigned);
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setFormData(prev => ({ ...prev, address: { ...(prev.address as Address), [field]: value } }));
  };

  const handleAnamnesisChange = (field: keyof Anamnesis, value: string | boolean) => {
    setFormData(prev => ({ ...prev, anamnesis: { ...(prev.anamnesis as Anamnesis), [field]: value, updatedAt: new Date().toISOString().split('T')[0] } }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl space-y-6 animate-fade-in mb-20">
      <div className="flex justify-between items-center pb-4 border-b border-dark-800">
        <div className="flex items-center gap-3">
          {editingUser && !isCompletingProfile && (
             <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 rounded-full transition-colors"><ArrowLeft size={24} /></button>
          )}
          <h3 className="text-white font-black text-xl uppercase tracking-tighter">{editingUser ? (isCompletingProfile ? '' : 'Editar Cadastro') : 'Novo Cadastro'}</h3>
        </div>
        {!isCompletingProfile && (
          <button onClick={onCancel} className="text-slate-500 hover:text-white p-2"><X size={24}/></button>
        )}
      </div>

      <div className="flex border-b border-dark-800">
        {[
          { id: 'basic', label: 'Dados Pessoais', icon: UserIcon },
          { id: 'plan', label: 'Plano Financeiro', icon: Repeat, visible: formData.role === UserRole.STUDENT || !isAdmin },
          { id: 'anamnesis', label: 'Saúde & Ficha', icon: Stethoscope, visible: formData.role === UserRole.STUDENT || !isAdmin },
        ].filter(tab => tab.visible === undefined || tab.visible).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === tab.id ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6 max-h-[60vh]">
        <form onSubmit={handleSubmit} id="user-form" className="space-y-6">
          {(activeTab === 'basic') && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="Nome Completo"/></label>
                    <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="E-mail"/></label>
                    <input required type="email" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="WhatsApp"/></label>
                    <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" placeholder="(00) 00000-0000" value={formData.phoneNumber || ''} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                  </div>
                  
                  {!editingUser && (
                      <div className="relative group">
                          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="Senha de Acesso"/></label>
                          <div className="relative">
                              <input 
                                required 
                                type={showPassword ? "text" : "password"} 
                                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none pr-12" 
                                value={formData.password || ''} 
                                onChange={e => setFormData({...formData, password: e.target.value})} 
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                          </div>
                      </div>
                  )}

                  <div className="sm:col-span-2">
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Função / Nível de Acesso</label>
                      {isAdmin ? (
                        <select
                            required
                            className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm font-bold"
                            value={formData.role || UserRole.STUDENT}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        >
                            {Object.values(UserRole).map(role => {
                                if (role === UserRole.SUPER_ADMIN && !isSuperAdmin) return null;
                                return <option key={role} value={role}>{getRoleLabel(role as UserRole)}</option>;
                            })}
                        </select>
                      ) : (
                        <div className="flex items-center gap-3 bg-dark-900/50 border border-dark-800 rounded-xl p-3">
                            <ShieldCheck size={18} className="text-brand-500" />
                            <span className="text-white text-sm font-bold uppercase">{getRoleLabel(formData.role || UserRole.STUDENT)}</span>
                            <span className="text-[9px] text-slate-600 ml-auto font-black uppercase tracking-tighter">Somente Admins podem alterar</span>
                        </div>
                      )}
                  </div>

                  {(formData.role === UserRole.STUDENT || !isAdmin) && (
                    <>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="CPF"/></label>
                        <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" placeholder="000.000.000-00" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="RG"/></label>
                        <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" placeholder="MG-00.000.000" value={formData.rg || ''} onChange={e => setFormData({...formData, rg: e.target.value})} />
                      </div>
                    </>
                  )}
              </div>

              {(formData.role === UserRole.STUDENT || !isAdmin) && (
                <div className="space-y-4 pt-4 border-t border-dark-800">
                  <h4 className="text-white font-bold text-sm flex items-center gap-2"><MapPin size={18} className="text-brand-500"/> Endereço Completo</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="CEP"/></label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.address?.zipCode || ''} onChange={e => handleAddressChange('zipCode', e.target.value)} /></div>
                    <div className="sm:col-span-2"><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="Logradouro"/></label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.address?.street || ''} onChange={e => handleAddressChange('street', e.target.value)} /></div>
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="Número"/></label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.address?.number || ''} onChange={e => handleAddressChange('number', e.target.value)} /></div>
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="Bairro"/></label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.address?.neighborhood || ''} onChange={e => handleAddressChange('neighborhood', e.target.value)} /></div>
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="Cidade"/></label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.address?.city || ''} onChange={e => handleAddressChange('city', e.target.value)} /></div>
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="Estado"/></label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.address?.state || ''} onChange={e => handleAddressChange('state', e.target.value)} /></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plan' && (formData.role === UserRole.STUDENT || !isAdmin) && (
             <div className="space-y-8 animate-fade-in">
                {['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'KIDS', 'AVULSO'].map(type => (
                    plansByType[type] && (
                        <div key={type}>
                            <h4 className="font-black text-brand-500 uppercase tracking-widest text-xs mb-3">{type}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {plansByType[type].map(plan => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => handleSelectPlan(plan)}
                                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                                            formData.planId === plan.id ? 'bg-brand-500/10 border-brand-500' : 'bg-dark-900 border-dark-800 hover:border-dark-700'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <p className={`font-bold text-sm ${formData.planId === plan.id ? 'text-brand-500' : 'text-white'}`}>{plan.title}</p>
                                            {formData.planId === plan.id && <CheckCircle2 size={20} className="text-brand-500" />}
                                        </div>
                                        <p className="text-slate-500 text-xs mt-1">{plan.frequency}</p>
                                        <p className={`font-black text-lg mt-2 ${formData.planId === plan.id ? 'text-brand-500' : 'text-white'}`}>R$ {plan.price.toFixed(2)}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
          )}

          {activeTab === 'anamnesis' && (formData.role === UserRole.STUDENT || !isAdmin) && (
            <div className="space-y-8 animate-fade-in">
              <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex gap-3 items-start">
                  <AlertCircle size={20} className="text-brand-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-brand-200 leading-relaxed font-medium">As informações de saúde e contato de emergência são <b>obrigatórias</b> para a segurança do aluno durante as atividades físicas.</p>
              </div>

              {/* Seção de Saúde */}
              <div className="space-y-6">
                <h4 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2 border-b border-dark-800 pb-3"><HeartPulse size={16} className="text-brand-500"/>Saúde e Histórico Médico</h4>
                
                <ConditionalTextarea 
                    label="Você tem alguma condição médica (ex: hipertensão, diabetes, lesões crônicas)?"
                    isChecked={!!formData.anamnesis?.hasMedicalCondition}
                    onCheckboxChange={(c) => handleAnamnesisChange('hasMedicalCondition', c)}
                    placeholder="Descreva a condição médica..."
                    value={formData.anamnesis?.medicalConditionDescription || ''}
                    onTextChange={(v) => handleAnamnesisChange('medicalConditionDescription', v)}
                    required={!!formData.anamnesis?.hasMedicalCondition}
                />
                <ConditionalTextarea 
                    label="Cirurgias ou lesões recentes (últimos 12 meses)?"
                    isChecked={!!formData.anamnesis?.hasRecentSurgeryOrInjury}
                    onCheckboxChange={(c) => handleAnamnesisChange('hasRecentSurgeryOrInjury', c)}
                    placeholder="Detalhes sobre a cirurgia ou lesão..."
                    value={formData.anamnesis?.recentSurgeryOrInjuryDetails || ''}
                    onTextChange={(v) => handleAnamnesisChange('recentSurgeryOrInjuryDetails', v)}
                    required={!!formData.anamnesis?.hasRecentSurgeryOrInjury}
                />
                <ConditionalTextarea 
                    label="Medicamentos em uso?"
                    isChecked={!!formData.anamnesis?.takesMedication}
                    onCheckboxChange={(c) => handleAnamnesisChange('takesMedication', c)}
                    placeholder="Quais medicamentos?"
                    value={formData.anamnesis?.medicationDescription || ''}
                    onTextChange={(v) => handleAnamnesisChange('medicationDescription', v)}
                    required={!!formData.anamnesis?.takesMedication}
                />
                 <ConditionalTextarea 
                    label="Alergias (medicamentos, alimentos)?"
                    isChecked={!!formData.anamnesis?.hasAllergies}
                    onCheckboxChange={(c) => handleAnamnesisChange('hasAllergies', c)}
                    placeholder="Descreva suas alergias..."
                    value={formData.anamnesis?.allergiesDescription || ''}
                    onTextChange={(v) => handleAnamnesisChange('allergiesDescription', v)}
                    required={!!formData.anamnesis?.hasAllergies}
                />
                <div>
                  <label className="block text-slate-400 text-sm font-bold mb-2">Realizou exames recentes (ex: FMS, composição corporal)?</label>
                  <textarea placeholder="Resultados relevantes..." className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm" value={formData.anamnesis?.recentExamsResults || ''} onChange={(e) => handleAnamnesisChange('recentExamsResults', e.target.value)} />
                </div>
              </div>

              {/* Seção de Objetivos */}
              <div className="space-y-6 pt-6 border-t border-dark-800">
                <h4 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2 border-b border-dark-800 pb-3"><Dumbbell size={16} className="text-brand-500"/>Objetivos e Estilo de Vida</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><label className="block text-slate-400 text-sm font-bold mb-2">Principal objetivo (ex: melhorar corrida, ganho de força, perda de peso)?</label><textarea className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm" value={formData.anamnesis?.mainGoal || ''} onChange={(e) => handleAnamnesisChange('mainGoal', e.target.value)} /></div>
                    <div><label className="block text-slate-400 text-sm font-bold mb-2">Frequência de treinos (semana)</label><select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold" value={formData.anamnesis?.trainingFrequency || '3-4x'} onChange={e => handleAnamnesisChange('trainingFrequency', e.target.value)}><option value="1-2x">1-2 vezes</option><option value="3-4x">3-4 vezes</option><option value="5x+">5 ou mais</option></select></div>
                    <div><label className="block text-slate-400 text-sm font-bold mb-2">Nível de atividade</label><select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm font-bold" value={formData.anamnesis?.activityLevel || 'MODERATE'} onChange={e => handleAnamnesisChange('activityLevel', e.target.value)}><option value="SEDENTARY">Sedentário</option><option value="MODERATE">Moderado</option><option value="ATHLETE">Atleta</option></select></div>
                    <div className="sm:col-span-2"><label className="block text-slate-400 text-sm font-bold mb-2">Experiência com treinamento funcional ou corrida?</label><textarea className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm" value={formData.anamnesis?.trainingExperience || ''} onChange={(e) => handleAnamnesisChange('trainingExperience', e.target.value)} /></div>
                </div>
              </div>

              {/* Seção de Hábitos */}
              <div className="space-y-6 pt-6 border-t border-dark-800">
                <h4 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2 border-b border-dark-800 pb-3"><BookOpen size={16} className="text-brand-500"/>Hábitos e Avaliação</h4>
                <ConditionalTextarea 
                    label="Fuma ou consome álcool?"
                    isChecked={!!formData.anamnesis?.smokesOrDrinks}
                    onCheckboxChange={(c) => handleAnamnesisChange('smokesOrDrinks', c)}
                    placeholder="Qual a frequência?"
                    value={formData.anamnesis?.smokingDrinkingFrequency || ''}
                    onTextChange={(v) => handleAnamnesisChange('smokingDrinkingFrequency', v)}
                    required={!!formData.anamnesis?.smokesOrDrinks}
                />
                 <div><label className="block text-slate-400 text-sm font-bold mb-2">Qualidade do sono (horas/noite)</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm" value={formData.anamnesis?.sleepQuality || ''} onChange={(e) => handleAnamnesisChange('sleepQuality', e.target.value)} /></div>
                 <div><label className="block text-slate-400 text-sm font-bold mb-2">Dieta atual (ex: restritiva, balanceada)?</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm" value={formData.anamnesis?.currentDiet || ''} onChange={(e) => handleAnamnesisChange('currentDiet', e.target.value)} /></div>
              </div>

              {/* Seção de Emergência */}
              <div className="space-y-4 pt-6 border-t border-dark-800">
                <h4 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2 border-b border-dark-800 pb-3"><Phone size={16} className="text-brand-500"/>Contato de Emergência</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="Nome"/></label>
                    <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.anamnesis?.emergencyContactName || ''} onChange={e => handleAnamnesisChange('emergencyContactName', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1"><RequiredLabel text="Telefone"/></label>
                    <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.anamnesis?.emergencyContactPhone || ''} onChange={e => handleAnamnesisChange('emergencyContactPhone', e.target.value)} />
                  </div>
                </div>
              </div>

            </div>
          )}
        </form>
      </div>

      <div className={`p-6 border-t border-dark-800 flex flex-col sm:flex-row gap-4 bg-dark-950 rounded-b-2xl ${isCompletingProfile ? '-mx-8 -mb-8' : ''}`}>
        {!isCompletingProfile && (
          <button type="button" onClick={onCancel} className="flex-1 py-5 bg-dark-800 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-dark-700 transition-all">Cancelar</button>
        )}
        <button 
          form="user-form"
          type="submit" 
          className="flex-1 py-5 bg-brand-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-2xl shadow-brand-600/30 hover:bg-brand-500 transition-all flex items-center justify-center gap-2"
        >
          <Save size={18} /> {isCompletingProfile ? 'Concluir Cadastro' : (editingUser ? 'Salvar Alterações' : 'Finalizar e Salvar')}
        </button>
      </div>
    </div>
  );
};

const ConditionalTextarea = ({ label, isChecked, onCheckboxChange, placeholder, value, onTextChange, required }: any) => (
  <div>
    <label className="flex items-center gap-3 cursor-pointer group bg-dark-900 p-4 rounded-2xl border border-dark-800 hover:border-brand-500/30 transition-all">
      <input type="checkbox" checked={isChecked} onChange={(e) => onCheckboxChange(e.target.checked)} className="w-6 h-6 rounded-lg accent-brand-500" />
      <span className="text-slate-200 text-sm font-bold">{label}</span>
    </label>
    {isChecked && (
      <div className="mt-3 animate-fade-in">
        <textarea required={required} placeholder={placeholder} className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-4 text-white text-sm focus:border-brand-500 outline-none resize-none" value={value} onChange={(e) => onTextChange(e.target.value)} />
      </div>
    )}
  </div>
);