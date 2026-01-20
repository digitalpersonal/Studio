
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { SettingsService } from '../services/settingsService';
import { Dumbbell, ArrowLeft, Send, Loader2, CheckCircle2, Eye, EyeOff, UserCircle } from 'lucide-react';
import { useToast } from '../App';

interface RegistrationPageProps {
    onLogin: (user: User) => void;
    onCancelRegistration: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onLogin, onCancelRegistration }) => {
    const { addToast } = useToast();
    const [step, setStep] = useState<'CODE_INPUT' | 'FORM_INPUT'>('CODE_INPUT');
    const [inviteCode, setInviteCode] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const LOGO_URL = "https://digitalfreeshop.com.br/logostudio/logo.jpg";

    const handleCodeValidation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const settings = SettingsService.getSettings();
            if (inviteCode === settings.registrationInviteCode) {
                addToast("Código de convite validado! Prossiga com seu cadastro.", "success");
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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // FALLBACK: Garantir que objetos jsonb não sejam null
            const newUser: Omit<User, 'id'> = {
                name,
                email,
                password,
                role: UserRole.STUDENT,
                joinDate: new Date().toISOString().split('T')[0],
                phoneNumber,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff`,
                planValue: 0,
                planDuration: 1,
                billingDay: 5,
                profileCompleted: false,
                address: {
                    zipCode: '', street: '', number: '', neighborhood: '', city: '', state: ''
                },
                anamnesis: {
                    hasInjury: false, takesMedication: false, hadSurgery: false, hasHeartCondition: false,
                    emergencyContactName: '', emergencyContactPhone: '', updatedAt: new Date().toISOString()
                }
            };

            const createdUser = await SupabaseService.addUser(newUser);
            addToast("Cadastro realizado com sucesso!", "success");
            onLogin(createdUser); 
        } catch (error: any) {
            console.error("Erro no registro:", error);
            addToast(error.message || "Erro ao registrar usuário. Tente novamente.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-200 text-center animate-fade-in relative overflow-hidden">
                <div className="mb-14 flex justify-center">
                   <img src={LOGO_URL} alt="Studio Logo" className="w-full max-w-[360px] h-auto object-contain" />
                </div>

                {step === 'CODE_INPUT' ? (
                    <form onSubmit={handleCodeValidation} className="space-y-4">
                        <p className="text-slate-400 text-sm mb-6 uppercase font-bold tracking-widest text-[10px]">Validação de Acesso</p>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none text-lg text-center font-bold tracking-wider uppercase"
                            placeholder="CÓDIGO DE CONVITE"
                            value={inviteCode}
                            onChange={e => setInviteCode(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all text-sm flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin mr-2" /> : <CheckCircle2 size={20} className="mr-2" />}
                            Validar Código
                        </button>
                        <button type="button" onClick={onCancelRegistration} className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white mt-4" disabled={isLoading}>
                            <ArrowLeft size={16} className="inline mr-2" /> Voltar ao Login
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-full">
                            <UserCircle size={16} className="text-brand-500" />
                            <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Cadastro de Aluno</span>
                        </div>
                        
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none text-lg"
                            placeholder="Nome Completo"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isLoading}
                        />
                        <input
                            type="email"
                            required
                            className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none text-lg"
                            placeholder="E-mail"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                        <div className="relative group text-left">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none text-lg pr-14"
                                placeholder="Crie sua Senha"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-gray-900 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <input
                            type="tel"
                            required
                            className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-5 text-gray-900 focus:border-brand-500 outline-none text-lg"
                            placeholder="WhatsApp (com DDD)"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            disabled={isLoading}
                        />
                        
                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all text-sm flex items-center justify-center"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 size={20} className="animate-spin mr-2" /> : <Send size={20} className="mr-2" />}
                                Finalizar Cadastro
                            </button>
                        </div>
                        
                        <button type="button" onClick={onCancelRegistration} className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white mt-4" disabled={isLoading}>
                           <ArrowLeft size={16} className="inline mr-2" /> Voltar ao Login
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
