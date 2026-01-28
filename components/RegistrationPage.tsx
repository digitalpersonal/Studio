
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Plan } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { SettingsService } from '../services/settingsService';
import { 
    Dumbbell, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, 
    UserCircle, HandCoins, ChevronRight, Check, FileText, Calendar
} from 'lucide-react';
import { useToast } from '../App';

interface RegistrationPageProps {
    onLogin: (user: User) => void;
    onCancelRegistration: () => void;
}

type RegStep = 'CODE_INPUT' | 'PERSONAL_DATA' | 'PLAN_SELECTION';

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onLogin, onCancelRegistration }) => {
    const { addToast } = useToast();
    const [step, setStep] = useState<RegStep>('CODE_INPUT');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Dados Cadastrais
    const [inviteCode, setInviteCode] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [birthDateMasked, setBirthDateMasked] = useState(''); // Estado para a máscara DD/MM/AAAA
    const [cpf, setCpf] = useState('');
    const [rg, setRg] = useState('');

    // Planos
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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

    // Função para aplicar máscara de data DD/MM/AAAA
    const handleBirthDateChange = (value: string) => {
        const digits = value.replace(/\D/g, "");
        let masked = digits;
        if (digits.length > 2) masked = digits.slice(0, 2) + "/" + digits.slice(2);
        if (digits.length > 4) masked = masked.slice(0, 5) + "/" + digits.slice(4, 8);
        setBirthDateMasked(masked);
    };

    const isPersonalDataValid = useMemo(() => {
        return (
            name.trim().length > 3 &&
            email.includes('@') &&
            password.length >= 6 &&
            phoneNumber.trim().length >= 10 &&
            birthDateMasked.length === 10 && // Verifica se completou DD/MM/AAAA
            cpf.trim().length >= 11 &&
            rg.trim().length >= 5
        );
    }, [name, email, password, phoneNumber, birthDateMasked, cpf, rg]);

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
        if (!selectedPlanId) return addToast("Selecione um plano para finalizar.", "error");

        setIsLoading(true);
        try {
            const selectedPlan = plans.find(p => p.id === selectedPlanId);
            if (!selectedPlan) throw new Error("Plano inválido.");

            // Converter DD/MM/AAAA para YYYY-MM-DD para o banco
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
                address: { zipCode: '37810-000', street: 'Cidade', number: 'SN', neighborhood: 'Centro', city: 'Guaranésia', state: 'MG' },
                anamnesis: { emergencyContactName: 'Não informado', emergencyContactPhone: 'Não informado', updatedAt: new Date().toISOString() },
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
            
            addToast("Conta criada! Redirecionando...", "success");
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
        const steps = ['Convite', 'Dados', 'Plano'];
        const currentIdx = ['CODE_INPUT', 'PERSONAL_DATA', 'PLAN_SELECTION'].indexOf(step);
        return (
            <div className="flex justify-between mb-10 relative px-4">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                {steps.map((s, i) => (
                    <div key={s} className={`relative z-10 flex flex-col items-center gap-2 ${i <= currentIdx ? 'text-brand-600' : 'text-slate-300'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[10px] border-2 transition-all ${i < currentIdx ? 'bg-brand-600 border-brand-600 text-white' : i === currentIdx ? 'bg-white border-brand-600 shadow-xl scale-110' : 'bg-white border-slate-200'}`}>
                            {i < currentIdx ? <Check size={18} /> : i + 1}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">{s}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-xl border border-slate-100 animate-fade-in">
                <div className="text-center mb-6">
                    <img src={LOGO_URL} alt="Studio Logo" className="w-40 mx-auto mb-6 rounded-2xl" />
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
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3 mb-4"><UserCircle className="text-brand-500" size={28}/> Dados Pessoais</h3>
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
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Escolha uma Senha</label>
                                <input className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none pr-12" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-4 text-slate-400">{showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                            </div>
                            
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Data de Nascimento</label>
                                <input 
                                    className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 text-black text-sm font-bold focus:border-brand-500 outline-none" 
                                    type="text" 
                                    inputMode="numeric"
                                    maxLength={10}
                                    placeholder="DD/MM/AAAA" 
                                    value={birthDateMasked} 
                                    onChange={e => handleBirthDateChange(e.target.value)} 
                                />
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
                            Próximo: Escolher Plano <ChevronRight size={22}/>
                        </button>
                    </div>
                )}

                {step === 'PLAN_SELECTION' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center justify-center gap-3"><HandCoins className="text-brand-500" size={28}/> Escolha seu Plano</h3>
                            <p className="text-xs text-slate-500 mt-2">Selecione como deseja treinar.</p>
                        </div>

                        <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-4">
                           {isLoading && plans.length === 0 ? (
                                <div className="py-12 flex flex-col items-center gap-4">
                                    <Loader2 className="animate-spin text-brand-500" size={40} />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando Planos...</p>
                                </div>
                           ) : (
                               plans.map(plan => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={`w-full p-6 rounded-[2.5rem] border-2 text-left transition-all relative ${
                                            selectedPlanId === plan.id ? 'bg-brand-600 border-brand-600 text-white shadow-2xl scale-[0.98]' : 'bg-slate-50 border-slate-200 hover:border-brand-200 text-slate-700'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <p className={`font-black uppercase text-[9px] tracking-[0.2em] ${selectedPlanId === plan.id ? 'text-white/70' : 'text-slate-400'}`}>{plan.planType}</p>
                                            {selectedPlanId === plan.id && <div className="bg-white text-brand-600 p-1 rounded-full"><Check size={14} strokeWidth={4}/></div>}
                                        </div>
                                        <p className="font-black text-lg leading-tight mb-2">{plan.title}</p>
                                        <div className="flex justify-between items-end">
                                            <p className={`text-[10px] font-bold uppercase ${selectedPlanId === plan.id ? 'text-white/60' : 'text-slate-500'}`}>{plan.frequency}</p>
                                            <p className={`font-black text-2xl ${selectedPlanId === plan.id ? 'text-white' : 'text-brand-600'}`}>R$ {plan.price.toFixed(0)}<span className="text-[10px] font-medium opacity-60 ml-1">/mês</span></p>
                                        </div>
                                    </button>
                                ))
                           )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                            <button onClick={() => setStep('PERSONAL_DATA')} className="py-6 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200">Voltar</button>
                            <button 
                                onClick={handleRegister} 
                                disabled={!selectedPlanId || isLoading} 
                                className="py-6 bg-brand-600 text-white font-black rounded-3xl uppercase tracking-widest shadow-2xl shadow-brand-600/30 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle2 size={24}/>}
                                {isLoading ? 'Gravando...' : 'Finalizar e Entrar'}
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
