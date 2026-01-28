
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Plan, Anamnesis } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { SettingsService } from '../services/settingsService';
import { 
    Dumbbell, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, 
    UserCircle, HandCoins, ChevronRight, Check, FileText, Calendar,
    HeartPulse, Phone, AlertCircle, ClipboardList, Activity
} from 'lucide-react';
import { useToast } from '../App';

interface RegistrationPageProps {
    onLogin: (user: User) => void;
    onCancelRegistration: () => void;
}

type RegStep = 'CODE_INPUT' | 'PERSONAL_DATA' | 'PLAN_SELECTION' | 'ANAMNESIS';

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onLogin, onCancelRegistration }) => {
    const { addToast } = useToast();
    const [step, setStep] = useState<RegStep>('CODE_INPUT');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // 1 & 2. Dados Cadastrais
    const [inviteCode, setInviteCode] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [birthDateMasked, setBirthDateMasked] = useState('');
    const [cpf, setCpf] = useState('');
    const [rg, setRg] = useState('');

    // 3. Planos
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    // 4. Anamnese
    const [anamnesis, setAnamnesis] = useState<Partial<Anamnesis>>({
        hasMedicalCondition: false, medicalConditionDescription: '',
        hasRecentSurgeryOrInjury: false, recentSurgeryOrInjuryDetails: '',
        takesMedication: false, medicationDescription: '',
        hasAllergies: false, allergiesDescription: '',
        mainGoal: '', trainingFrequency: '3-4x', activityLevel: 'MODERATE',
        emergencyContactName: '', emergencyContactPhone: '',
    });

    const LOGO_URL = "https://digitalfreeshop.com.br/logostudio/logo.jpg";

    useEffect(() => {
        if (step === 'PLAN_SELECTION') {
            const fetchPlans = async () => {
                setIsLoading(true);
                try {
                    const availablePlans = await SupabaseService.getPlans();
                    setPlans(availablePlans);
                } catch (error) {
                    addToast("Erro ao carregar os planos disponíveis.", "error");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPlans();
        }
    }, [step, addToast]);

    const handleBirthDateChange = (value: string) => {
        const digits = value.replace(/\D/g, "");
        let masked = digits;
        if (digits.length > 2) masked = digits.slice(0, 2) + "/" + digits.slice(2);
        if (digits.length > 4) masked = masked.slice(0, 5) + "/" + digits.slice(4, 8);
        setBirthDateMasked(masked);
    };

    const handleAnamnesisChange = (field: keyof Anamnesis, value: any) => {
        setAnamnesis(prev => ({ ...prev, [field]: value }));
    };

    const isPersonalDataValid = useMemo(() => {
        return (
            name.trim().length > 3 &&
            email.includes('@') &&
            password.length >= 6 &&
            phoneNumber.trim().length >= 10 &&
            birthDateMasked.length === 10 &&
            cpf.trim().length >= 11 &&
            rg.trim().length >= 5
        );
    }, [name, email, password, phoneNumber, birthDateMasked, cpf, rg]);

    const isAnamnesisValid = useMemo(() => {
        return (
            anamnesis.emergencyContactName?.trim() &&
            anamnesis.emergencyContactPhone?.trim() &&
            anamnesis.mainGoal?.trim()
        );
    }, [anamnesis]);

    const handleCodeValidation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const settings = await SettingsService.getSettings();
            if (inviteCode.trim().toUpperCase() === settings.registrationInviteCode.trim().toUpperCase()) {
                setStep('PERSONAL_DATA');
            } else {
                addToast("Código de convite inválido.", "error");
            }
        } catch (error) {
            addToast(`Erro ao validar código.`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!selectedPlanId) return addToast("Selecione um plano primeiro.", "error");
        if (!isAnamnesisValid) return addToast("Preencha os dados de emergência e saúde.", "error");

        setIsLoading(true);
        try {
            const selectedPlan = plans.find(p => p.id === selectedPlanId);
            if (!selectedPlan) throw new Error("Plano inválido.");

            const [day, month, year] = birthDateMasked.split('/');
            const isoDate = `${year}-${month}-${day}`;

            const newUser: Omit<User, 'id'> = {
                name,
                email,
                password,
                role: UserRole.STUDENT,
                joinDate: new Date().toISOString().split('T')[0],
                phoneNumber,
                birthDate: isoDate,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff`,
                planId: selectedPlan.id,
                planValue: selectedPlan.price,
                planDiscount: 0,
                planDuration: selectedPlan.durationMonths,
                billingDay: 5,
                planStartDate: new Date().toISOString().split('T')[0],
                profileCompleted: true, 
                address: { zipCode: '37810-000', street: 'Não informado', number: 'SN', neighborhood: 'Não informado', city: 'Guaranésia', state: 'MG' },
                anamnesis: { 
                    ...anamnesis, 
                    updatedAt: new Date().toISOString() 
                } as Anamnesis,
                cpf,
                rg,
                status: 'ACTIVE'
            };

            const createdUser = await SupabaseService.addUser(newUser);

            await SupabaseService.addPayment({
                studentId: createdUser.id,
                amount: createdUser.planValue || selectedPlan.price,
                status: 'PENDING',
                dueDate: new Date().toISOString().split('T')[0],
                description: `Matrícula - ${selectedPlan.title}`
            }).catch(console.warn);
            
            addToast("Cadastro realizado com sucesso!", "success");
            onLogin(createdUser); 
        } catch (error: any) {
            if (error.message?.includes('users_email_key') || error.code === '23505') {
                addToast("Este e-mail já está em uso.", "error");
                setStep('PERSONAL_DATA');
            } else {
                addToast(error.message || "Erro ao registrar. Tente novamente.", "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const ProgressBar = () => {
        const steps = ['Convite', 'Dados', 'Plano', 'Saúde'];
        const currentIdx = ['CODE_INPUT', 'PERSONAL_DATA', 'PLAN_SELECTION', 'ANAMNESIS'].indexOf(step);
        return (
            <div className="flex justify-between mb-10 relative px-2">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                {steps.map((s, i) => (
                    <div key={s} className={`relative z-10 flex flex-col items-center gap-2 ${i <= currentIdx ? 'text-brand-600' : 'text-slate-300'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[9px] border-2 transition-all ${i < currentIdx ? 'bg-brand-600 border-brand-600 text-white' : i === currentIdx ? 'bg-white border-brand-600 shadow-xl scale-110' : 'bg-white border-slate-200'}`}>
                            {i < currentIdx ? <Check size={14} /> : i + 1}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-tighter">{s}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-xl border border-slate-100 animate-fade-in flex flex-col">
                <div className="text-center mb-6">
                    <img src={LOGO_URL} alt="Studio Logo" className="w-32 mx-auto mb-6 rounded-2xl" />
                    <ProgressBar />
                </div>
                
                {step === 'CODE_INPUT' && (
                    <form onSubmit={handleCodeValidation} className="space-y-6">
                        <div className="text-center space-y-2 mb-8">
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Portal de Matrícula</h3>
                            <p className="text-sm text-slate-500">Insira seu código de convite para começar.</p>
                        </div>
                        <input 
                            type="text" 
                            required 
                            className="w-full bg-slate-100 border-2 border-slate-200 rounded-3xl p-6 text-black focus:border-brand-500 outline-none text-center font-black tracking-[0.3em] uppercase text-2xl" 
                            placeholder="CÓDIGO" 
                            value={inviteCode} 
                            onChange={e => setInviteCode(e.target.value)} 
                            disabled={isLoading}
                        />
                        <button type="submit" className="w-full bg-brand-600 text-white font-black py-6 rounded-3xl uppercase tracking-widest shadow-2xl shadow-brand-600/30 active:scale-95 transition-all flex items-center justify-center gap-3" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <ChevronRight size={24}/>} Iniciar Cadastro
                        </button>
                    </form>
                )}

                {step === 'PERSONAL_DATA' && (
                    <div className="space-y-5 animate-fade-in">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3 mb-4"><UserCircle className="text-brand-500" size={28}/> Seus Dados</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nome Completo</label>
                                <input className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">E-mail</label>
                                <input className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">WhatsApp</label>
                                <input className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none" type="tel" placeholder="(00) 00000-0000" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                            </div>
                            
                            <div className="relative">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Sua Senha</label>
                                <input className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none pr-12" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-4 text-slate-400">{showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                            </div>
                            
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Data de Nascimento</label>
                                <input className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none" type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" value={birthDateMasked} onChange={e => handleBirthDateChange(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">CPF</label>
                                <input className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none" placeholder="Apenas números" value={cpf} onChange={e => setCpf(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">RG</label>
                                <input className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none" value={rg} onChange={e => setRg(e.target.value)} />
                            </div>
                        </div>

                        <button 
                            onClick={() => isPersonalDataValid ? setStep('PLAN_SELECTION') : addToast("Preencha todos os campos corretamente.", "error")}
                            className={`w-full py-6 rounded-3xl font-black uppercase tracking-widest transition-all mt-6 flex items-center justify-center gap-3 ${isPersonalDataValid ? 'bg-brand-600 text-white shadow-2xl shadow-brand-600/20' : 'bg-slate-100 text-slate-400 grayscale'}`}
                        >
                            Próximo: Planos <ChevronRight size={22}/>
                        </button>
                    </div>
                )}

                {step === 'PLAN_SELECTION' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center justify-center gap-3"><HandCoins className="text-brand-500" size={28}/> Escolha seu Plano</h3>
                        </div>

                        <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-4">
                           {isLoading && plans.length === 0 ? (
                                <div className="py-12 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-brand-500" size={40} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando...</p></div>
                           ) : (
                               plans.map(plan => (
                                    <button key={plan.id} type="button" onClick={() => setSelectedPlanId(plan.id)} className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all relative ${selectedPlanId === plan.id ? 'bg-brand-600 border-brand-600 text-white shadow-2xl scale-[0.98]' : 'bg-slate-50 border-slate-200 hover:border-brand-200 text-slate-700'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <p className={`font-black uppercase text-[8px] tracking-[0.2em] ${selectedPlanId === plan.id ? 'text-white/70' : 'text-slate-400'}`}>{plan.planType}</p>
                                            {selectedPlanId === plan.id && <div className="bg-white text-brand-600 p-1 rounded-full"><Check size={12} strokeWidth={4}/></div>}
                                        </div>
                                        <p className="font-black text-base leading-tight mb-2">{plan.title}</p>
                                        <div className="flex justify-between items-end">
                                            <p className={`text-[10px] font-bold uppercase ${selectedPlanId === plan.id ? 'text-white/60' : 'text-slate-500'}`}>{plan.frequency}</p>
                                            <p className={`font-black text-xl ${selectedPlanId === plan.id ? 'text-white' : 'text-brand-600'}`}>R$ {plan.price.toFixed(0)}<span className="text-[10px] font-medium opacity-60 ml-1">/mês</span></p>
                                        </div>
                                    </button>
                                ))
                           )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                            <button onClick={() => setStep('PERSONAL_DATA')} className="py-6 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-[10px] tracking-widest">Voltar</button>
                            <button onClick={() => selectedPlanId ? setStep('ANAMNESIS') : addToast("Selecione um plano.", "error")} className="py-6 bg-brand-600 text-white font-black rounded-3xl uppercase tracking-widest shadow-2xl shadow-brand-600/30 flex items-center justify-center gap-3">
                                Próximo: Saúde <ChevronRight size={22}/>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'ANAMNESIS' && (
                    <div className="space-y-6 animate-fade-in overflow-y-auto max-h-[65vh] pr-2 custom-scrollbar pb-6">
                        <div className="text-center mb-2">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center justify-center gap-3"><ClipboardList className="text-brand-500" size={28}/> Ficha de Saúde</h3>
                            <p className="text-xs text-slate-500 mt-1">Essas informações garantem sua segurança no treino.</p>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-black text-[10px] uppercase text-brand-600 tracking-widest border-b pb-2 flex items-center gap-2"><Phone size={14}/> Emergência (Obrigatório)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nome do Contato</label>
                                    <input className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none" value={anamnesis.emergencyContactName} onChange={e => handleAnamnesisChange('emergencyContactName', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">WhatsApp Emergência</label>
                                    <input className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none" value={anamnesis.emergencyContactPhone} onChange={e => handleAnamnesisChange('emergencyContactPhone', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="font-black text-[10px] uppercase text-brand-600 tracking-widest border-b pb-2 flex items-center gap-2"><HeartPulse size={14}/> Condições Médicas</h4>
                            <ConditionToggle label="Possui alguma condição médica?" isChecked={!!anamnesis.hasMedicalCondition} onToggle={v => handleAnamnesisChange('hasMedicalCondition', v)} value={anamnesis.medicalConditionDescription || ''} onValueChange={v => handleAnamnesisChange('medicalConditionDescription', v)} />
                            <ConditionToggle label="Cirurgias/Lesões recentes?" isChecked={!!anamnesis.hasRecentSurgeryOrInjury} onToggle={v => handleAnamnesisChange('hasRecentSurgeryOrInjury', v)} value={anamnesis.recentSurgeryOrInjuryDetails || ''} onValueChange={v => handleAnamnesisChange('recentSurgeryOrInjuryDetails', v)} />
                            <ConditionToggle label="Usa medicamentos?" isChecked={!!anamnesis.takesMedication} onToggle={v => handleAnamnesisChange('takesMedication', v)} value={anamnesis.medicationDescription || ''} onValueChange={v => handleAnamnesisChange('medicationDescription', v)} />
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-black text-[10px] uppercase text-brand-600 tracking-widest border-b pb-2 flex items-center gap-2"><Activity size={14}/> Objetivos</h4>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Qual seu principal objetivo?</label>
                                <textarea className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none h-24 resize-none" placeholder="Ex: Ganho de força, emagrecer, corrida..." value={anamnesis.mainGoal} onChange={e => handleAnamnesisChange('mainGoal', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 sticky bottom-0 bg-white pt-4">
                            <button onClick={() => setStep('PLAN_SELECTION')} className="py-6 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-[10px] tracking-widest">Voltar</button>
                            <button 
                                onClick={handleRegister} 
                                disabled={!isAnamnesisValid || isLoading} 
                                className={`py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-2 ${isAnamnesisValid ? 'bg-brand-600 text-white shadow-brand-600/30' : 'bg-slate-100 text-slate-400 grayscale'}`}
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle2 size={24}/>}
                                {isLoading ? 'Gravando...' : 'Finalizar Tudo'}
                            </button>
                        </div>
                    </div>
                )}
                
                {step === 'CODE_INPUT' && (
                    <button type="button" onClick={onCancelRegistration} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-brand-500 mt-10 transition-colors flex items-center justify-center gap-3 group"><ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Já sou membro? Entrar agora</button>
                )}
            </div>
        </div>
    );
};

const ConditionToggle = ({ label, isChecked, onToggle, value, onValueChange }: any) => (
    <div className="space-y-3">
        <button type="button" onClick={() => onToggle(!isChecked)} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${isChecked ? 'bg-brand-50 border-brand-500' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-sm font-bold ${isChecked ? 'text-brand-600' : 'text-slate-600'}`}>{label}</span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 ${isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200'}`}>
                {isChecked && <Check size={14} strokeWidth={4}/>}
            </div>
        </button>
        {isChecked && (
            <textarea className="w-full bg-slate-100 border-2 border-brand-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none h-20 resize-none animate-fade-in" placeholder="Detalhes aqui..." value={value} onChange={e => onValueChange(e.target.value)} />
        )}
    </div>
);
