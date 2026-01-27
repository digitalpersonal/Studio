import React, { useState, useEffect } from 'react';
import { User, UserRole, Plan } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { SettingsService } from '../services/settingsService';
import { Dumbbell, ArrowLeft, Send, Loader2, CheckCircle2, Eye, EyeOff, UserCircle, HandCoins } from 'lucide-react';
import { useToast } from '../App';

interface RegistrationPageProps {
    onLogin: (user: User) => void;
    onCancelRegistration: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onLogin, onCancelRegistration }) => {
    const { addToast } = useToast();
    const [step, setStep] = useState<'CODE_INPUT' | 'FORM_INPUT' | 'PLAN_SELECTION'>('CODE_INPUT');
    const [inviteCode, setInviteCode] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
    
    const handleCodeValidation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const settings = await SettingsService.getSettings();
            if (inviteCode.trim().toUpperCase() === settings.registrationInviteCode.trim().toUpperCase()) {
                addToast("Código validado! Prossiga com seu cadastro.", "success");
                setStep('FORM_INPUT');
            } else {
                addToast("Código de convite inválido.", "error");
            }
        } catch (error: any) {
            addToast(`Erro ao validar código.`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!selectedPlanId) {
            addToast("Por favor, selecione um plano para continuar.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const selectedPlan = plans.find(p => p.id === selectedPlanId);
            if (!selectedPlan) {
                addToast("Plano selecionado é inválido. Tente novamente.", "error");
                setIsLoading(false);
                return;
            }

            const newUser: Omit<User, 'id'> = {
                name,
                email,
                password,
                role: UserRole.STUDENT,
                joinDate: new Date().toISOString().split('T')[0],
                phoneNumber,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff`,
                planId: selectedPlan.id,
                planValue: selectedPlan.price,
                planDuration: selectedPlan.durationMonths,
                billingDay: 5,
                planStartDate: new Date().toISOString().split('T')[0],
                profileCompleted: false,
                address: { zipCode: '', street: '', number: '', neighborhood: '', city: '', state: '' },
                anamnesis: { hasMedicalCondition: false, hasRecentSurgeryOrInjury: false, takesMedication: false, hasAllergies: false, emergencyContactName: '', emergencyContactPhone: '', updatedAt: new Date().toISOString() },
                cpf: '',
                rg: '',
                birthDate: '',
            };

            const createdUser = await SupabaseService.addUser(newUser);

            if (!createdUser || !createdUser.id) {
                throw new Error("Falha ao criar usuário no banco de dados.");
            }

            // Cria o primeiro pagamento
            try {
                await SupabaseService.addPayment({
                    studentId: createdUser.id,
                    amount: createdUser.planValue || selectedPlan.price,
                    status: 'PENDING',
                    dueDate: new Date().toISOString().split('T')[0],
                    description: `Matrícula - ${selectedPlan.title}`
                });
            } catch (pErr) {
                console.warn("Usuário criado, mas erro ao gerar primeira fatura:", pErr);
            }
            
            addToast("Cadastro realizado com sucesso!", "success");
            
            // Redireciona via callback de login
            onLogin(createdUser); 
        } catch (error: any) {
            console.error("Erro no registro:", error);
            addToast(error.message || "Erro ao registrar usuário. Verifique se o e-mail já existe.", "error");
            setIsLoading(false); // Mantém o loading false apenas se der erro, pois o sucesso unmounta o componente
        }
    };

    const renderPlanCards = () => {
        const plansByType = plans.reduce((acc, plan) => {
            const type = plan.planType;
            if (!acc[type]) acc[type] = [];
            acc[type].push(plan);
            return acc;
        }, {} as Record<string, Plan[]>);

        return (
            <div className="space-y-6">
                {['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'KIDS', 'AVULSO'].map(type => (
                    plansByType[type] && (
                        <div key={type}>
                            <h4 className="font-black text-brand-500 uppercase tracking-widest text-xs mb-3 text-left">{type}</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {plansByType[type].map(plan => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all outline-none ${
                                            selectedPlanId === plan.id ? 'bg-brand-500/10 border-brand-500' : 'bg-gray-100 border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center pointer-events-none">
                                            <p className={`font-bold text-sm ${selectedPlanId === plan.id ? 'text-brand-600' : 'text-gray-800'}`}>{plan.title}</p>
                                            {selectedPlanId === plan.id && <CheckCircle2 size={20} className="text-brand-500" />}
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1 pointer-events-none">{plan.frequency}</p>
                                        <p className={`font-black text-lg mt-2 pointer-events-none ${selectedPlanId === plan.id ? 'text-brand-600' : 'text-gray-800'}`}>R$ {plan.price.toFixed(2)}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-200 text-center animate-fade-in relative overflow-hidden">
                <img src={LOGO_URL} alt="Studio Logo" className="w-48 mx-auto mb-8" />
                
                {step === 'CODE_INPUT' && (
                    <form onSubmit={handleCodeValidation} className="space-y-4">
                        <div className="mb-4 text-left">
                            <h3 className="text-xl font-black text-gray-800">Bem-vindo(a)!</h3>
                            <p className="text-sm text-gray-500">Insira seu código de convite para começar.</p>
                        </div>
                        <input type="text" required className="w-full bg-gray-100 border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none text-center font-bold tracking-wider uppercase" placeholder="CÓDIGO DE CONVITE" value={inviteCode} onChange={e => setInviteCode(e.target.value)} disabled={isLoading}/>
                        <button type="submit" className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-lg shadow-brand-600/20 active:scale-95 transition-all" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin mx-auto"/> : 'Validar Código'}</button>
                    </form>
                )}

                {step === 'FORM_INPUT' && (
                    <form onSubmit={(e) => { e.preventDefault(); setStep('PLAN_SELECTION'); }} className="space-y-4">
                        <div className="mb-4 text-left">
                            <h3 className="text-xl font-black text-gray-800">Seus Dados</h3>
                            <p className="text-sm text-gray-500">Crie sua conta de acesso.</p>
                        </div>
                        <input type="text" required className="w-full bg-gray-100 border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} />
                        <input type="email" required className="w-full bg-gray-100 border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} required className="w-full bg-gray-100 border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none pr-12" placeholder="Crie sua Senha" value={password} onChange={e => setPassword(e.target.value)} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500">{showPassword ? <EyeOff/> : <Eye/>}</button>
                        </div>
                        <input type="tel" required className="w-full bg-gray-100 border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none" placeholder="WhatsApp (DDD+Número)" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                        <button type="submit" className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-lg shadow-brand-600/20 active:scale-95 transition-all">Avançar para Planos</button>
                    </form>
                )}

                {step === 'PLAN_SELECTION' && (
                    <div className="text-left">
                        <div className="mb-6"><h3 className="text-xl font-black text-gray-800 flex items-center gap-2"><HandCoins className="text-brand-500"/> Selecione seu plano</h3><p className="text-sm text-gray-500">Escolha como prefere treinar no Studio.</p></div>
                        <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                           {isLoading && plans.length === 0 ? <Loader2 className="animate-spin mx-auto text-brand-500 my-8" /> : renderPlanCards()}
                        </div>
                        <div className="mt-6">
                            <button onClick={handleRegister} disabled={!selectedPlanId || isLoading} className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-lg shadow-brand-600/20 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2">
                                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>}
                                {isLoading ? 'Criando Conta...' : 'Finalizar Cadastro'}
                            </button>
                        </div>
                    </div>
                )}
                
                <button type="button" onClick={onCancelRegistration} className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-brand-500 mt-6 flex items-center justify-center gap-2" disabled={isLoading}><ArrowLeft size={16}/> Voltar</button>
            </div>
        </div>
    );
};