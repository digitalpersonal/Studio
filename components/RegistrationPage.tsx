
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, Anamnesis, AcademySettings } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { SettingsService } from '../services/settingsService';
import { Dumbbell, ArrowLeft, Send, Loader2, CheckCircle2, Eye, EyeOff, UserCircle, Stethoscope, AlertTriangle, Camera, X, Check, ShieldAlert, AlertCircle } from 'lucide-react';
import { useToast } from '../App';

interface RegistrationPageProps {
    onLogin: (user: User) => void;
    onCancelRegistration: () => void;
}

type Step = 'CODE_INPUT' | 'BASIC_INFO' | 'ANAMNESIS';

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onLogin, onCancelRegistration }) => {
    const { addToast } = useToast();
    const [step, setStep] = useState<Step>('CODE_INPUT');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [settings, setSettings] = useState<AcademySettings | null>(null);
    
    const [inviteCode, setInviteCode] = useState('');
    const [basicInfo, setBasicInfo] = useState({
        name: '', email: '', password: '', phoneNumber: ''
    });

    const [anamnesis, setAnamnesis] = useState<Omit<Anamnesis, 'updatedAt'>>({
        hasInjury: false,
        injuryDescription: '',
        takesMedication: false,
        medicationDescription: '',
        hadSurgery: false,
        surgeryDescription: '',
        hasHeartCondition: false,
        heartConditionDescription: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        medicalCertificateUrl: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const LOGO_DEFAULT = "https://digitalfreeshop.com.br/logostudio/logo.jpg";

    useEffect(() => {
        const fetchSettings = async () => {
            const data = await SettingsService.getSettings();
            setSettings(data);
        };
        fetchSettings();
    }, []);

    const hasAnyRestriction = anamnesis.hasInjury || anamnesis.hadSurgery || anamnesis.hasHeartCondition || anamnesis.takesMedication;

    const handleCodeValidation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const currentSettings = settings || await SettingsService.getSettings();
            if (inviteCode === currentSettings.registrationInviteCode) {
                addToast("Código validado!", "success");
                setStep('BASIC_INFO');
            } else {
                addToast("Código de convite inválido.", "error");
            }
        } catch (error: any) {
            addToast(`Erro ao validar código.`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBasicInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('ANAMNESIS');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAnamnesis({ ...anamnesis, medicalCertificateUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // VALIDAÇÃO OBRIGATÓRIA DE ANAMNESE (CAMPOS DE EMERGÊNCIA)
        if (!anamnesis.emergencyContactName || !anamnesis.emergencyContactPhone) {
            addToast("Dados de contato de emergência são obrigatórios.", "error");
            return;
        }

        // Validação se as descrições foram preenchidas caso marcado como 'Sim'
        if ((anamnesis.hasInjury && !anamnesis.injuryDescription) || 
            (anamnesis.takesMedication && !anamnesis.medicationDescription) ||
            (anamnesis.hadSurgery && !anamnesis.surgeryDescription) ||
            (anamnesis.hasHeartCondition && !anamnesis.heartConditionDescription)) {
            addToast("Por favor, descreva as condições marcadas como 'Sim'.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const currentSettings = settings || await SettingsService.getSettings();
            const newUser: Omit<User, 'id'> = {
                ...basicInfo,
                role: UserRole.STUDENT,
                joinDate: new Date().toISOString().split('T')[0],
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(basicInfo.name)}&background=f97316&color=fff`,
                planValue: currentSettings.monthlyFee, 
                planDuration: 12,
                billingDay: 5,
                profileCompleted: true,
                address: { zipCode: '', street: '', number: '', neighborhood: '', city: '', state: '' },
                anamnesis: {
                    ...anamnesis,
                    updatedAt: new Date().toISOString()
                }
            };

            const createdUser = await SupabaseService.addUser(newUser);
            addToast("Cadastro concluído! Bem-vindo ao Studio.", "success");
            onLogin(createdUser); 
        } catch (error: any) {
            addToast("Erro ao registrar. Verifique os dados.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-10">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-gray-200 animate-fade-in relative overflow-hidden">
                <div className="mb-10 flex justify-center">
                   <img src={settings?.logoUrl || LOGO_DEFAULT} alt="Studio Logo" className="w-full max-w-[280px] h-auto object-contain rounded-2xl" />
                </div>

                {step === 'CODE_INPUT' && (
                    <form onSubmit={handleCodeValidation} className="space-y-4 text-center">
                        <p className="text-slate-400 text-sm mb-6 uppercase font-bold tracking-widest text-[10px]">Validação de Acesso</p>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none text-lg text-center font-bold tracking-wider uppercase"
                            placeholder="CÓDIGO DE CONVITE"
                            value={inviteCode}
                            onChange={e => setInviteCode(e.target.value)}
                        />
                        <button type="submit" disabled={isLoading} className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all text-sm flex items-center justify-center">
                            {isLoading ? <Loader2 size={20} className="animate-spin mr-2" /> : <CheckCircle2 size={20} className="mr-2" />}
                            Validar Código
                        </button>
                        <button type="button" onClick={onCancelRegistration} className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-brand-500 mt-4">
                            <ArrowLeft size={16} className="inline mr-2" /> Voltar ao Login
                        </button>
                    </form>
                )}

                {step === 'BASIC_INFO' && (
                    <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
                        <div className="mb-6 flex justify-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-full">
                                <UserCircle size={16} className="text-brand-500" />
                                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Passo 1: Dados Pessoais</span>
                            </div>
                        </div>
                        <input required className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none" placeholder="Nome Completo" value={basicInfo.name} onChange={e => setBasicInfo({...basicInfo, name: e.target.value})} />
                        <input required type="email" className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none" placeholder="E-mail" value={basicInfo.email} onChange={e => setBasicInfo({...basicInfo, email: e.target.value})} />
                        <div className="relative group text-left">
                            <input required type={showPassword ? "text" : "password"} className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none pr-14" placeholder="Crie sua Senha" value={basicInfo.password} onChange={e => setBasicInfo({...basicInfo, password: e.target.value})} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-gray-900">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                        </div>
                        <input required className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none" placeholder="WhatsApp (com DDD)" value={basicInfo.phoneNumber} onChange={e => setBasicInfo({...basicInfo, phoneNumber: e.target.value})} />
                        <button type="submit" className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all text-sm">Próximo Passo</button>
                    </form>
                )}

                {step === 'ANAMNESIS' && (
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="bg-red-600 text-white p-4 rounded-2xl mb-4 flex items-center gap-3 shadow-lg shadow-red-600/20">
                            <ShieldAlert size={24} className="shrink-0 animate-pulse" />
                            <div>
                                <p className="font-black text-xs uppercase tracking-tighter">Anamnese Obrigatória</p>
                                <p className="text-[10px] opacity-90 font-bold uppercase leading-tight">Preencha todos os dados de saúde para finalizar seu cadastro com segurança.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <AnamnesisCheck label="Possui alguma lesão?" checked={anamnesis.hasInjury} onChange={v => setAnamnesis({...anamnesis, hasInjury: v})} description={anamnesis.injuryDescription} onDescriptionChange={v => setAnamnesis({...anamnesis, injuryDescription: v})} />
                            <AnamnesisCheck label="Faz uso de medicação controlada?" checked={anamnesis.takesMedication} onChange={v => setAnamnesis({...anamnesis, takesMedication: v})} description={anamnesis.medicationDescription} onDescriptionChange={v => setAnamnesis({...anamnesis, medicationDescription: v})} />
                            <AnamnesisCheck label="Já passou por alguma cirurgia?" checked={anamnesis.hadSurgery} onChange={v => setAnamnesis({...anamnesis, hadSurgery: v})} description={anamnesis.surgeryDescription} onDescriptionChange={v => setAnamnesis({...anamnesis, surgeryDescription: v})} />
                            <AnamnesisCheck label="Possui algum problema cardíaco?" checked={anamnesis.hasHeartCondition} onChange={v => setAnamnesis({...anamnesis, hasHeartCondition: v})} description={anamnesis.heartConditionDescription} onDescriptionChange={v => setAnamnesis({...anamnesis, heartConditionDescription: v})} />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                             <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                <label className="block text-slate-500 text-[10px] font-black uppercase mb-2 tracking-widest flex items-center gap-1"><AlertCircle size={10} className="text-red-500"/> Contatos de Emergência (Obrigatório)</label>
                                <div className="space-y-3">
                                    <input required className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm focus:border-brand-500 outline-none" placeholder="Nome do Contato" value={anamnesis.emergencyContactName} onChange={e => setAnamnesis({...anamnesis, emergencyContactName: e.target.value})} />
                                    <input required className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm focus:border-brand-500 outline-none" placeholder="Telefone de Emergência" value={anamnesis.emergencyContactPhone} onChange={e => setAnamnesis({...anamnesis, emergencyContactPhone: e.target.value})} />
                                </div>
                             </div>

                             {hasAnyRestriction && (
                                <div className="p-4 border border-blue-100 rounded-2xl bg-blue-50/50 space-y-3">
                                    <p className="text-blue-600 font-black text-[10px] uppercase tracking-widest text-center">Atestado Médico (Opcional p/ o Aluno)</p>
                                    <p className="text-[9px] text-blue-400 text-center uppercase font-bold leading-tight">Se você tiver o documento agora, pode enviar. Caso contrário, o professor poderá anexar depois.</p>
                                    {anamnesis.medicalCertificateUrl ? (
                                        <div className="relative h-32 rounded-xl overflow-hidden shadow-md">
                                            <img src={anamnesis.medicalCertificateUrl} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setAnamnesis({...anamnesis, medicalCertificateUrl: ''})} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full"><X size={14}/></button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-4 flex flex-col items-center gap-2 text-blue-400 hover:text-blue-600 transition-colors border-2 border-dashed border-blue-200 rounded-xl">
                                            <Camera size={24} />
                                            <span className="text-[10px] font-black uppercase">Anexar Foto (Opcional)</span>
                                        </button>
                                    )}
                                    <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                                </div>
                             )}
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all text-sm flex items-center justify-center">
                            {isLoading ? <Loader2 size={20} className="animate-spin mr-2" /> : <Send size={20} className="mr-2" />}
                            Finalizar Cadastro
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

const AnamnesisCheck = ({ label, checked, onChange, description, onDescriptionChange }: { label: string, checked: boolean, onChange: (v: boolean) => void, description?: string, onDescriptionChange: (v: string) => void }) => (
    <div className="space-y-2">
        <button type="button" onClick={() => onChange(!checked)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${checked ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-500' : 'bg-gray-50 border-gray-200'}`}>
            <span className={`text-xs font-bold ${checked ? 'text-brand-600' : 'text-slate-600'}`}>{label}</span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${checked ? 'bg-brand-500 text-white' : 'bg-gray-200 text-transparent'}`}><Check size={14} strokeWidth={4}/></div>
        </button>
        {checked && (
            <textarea required className="w-full bg-white border border-brand-200 rounded-xl p-3 text-xs focus:border-brand-500 outline-none animate-fade-in shadow-inner" placeholder="Especifique detalhadamente..." value={description} onChange={e => onDescriptionChange(e.target.value)} />
        )}
    </div>
);
