

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { SettingsService } from '../services/settingsService';
import { Dumbbell, ArrowLeft, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '../App'; // Importa useToast do App

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
            console.error("Erro ao validar código:", error.message || JSON.stringify(error));
            addToast(`Ocorreu um erro ao validar o código: ${error.message || JSON.stringify(error)}. Tente novamente.`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const newUser: Omit<User, 'id'> = {
                name,
                email,
                password, // Em um app real, senhas seriam hasheadas no backend
                role: UserRole.STUDENT,
                joinDate: new Date().toISOString().split('T')[0],
                phoneNumber,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff`,
                planValue: 0, // Default to 0, can be set by admin later
                planDuration: 0, // Default to 0, can be set by admin later
                profileCompleted: false, // NEW: Mark profile as incomplete on self-registration
            };

            const createdUser = await SupabaseService.addUser(newUser);
            addToast("Cadastro realizado com sucesso! Bem-vindo(a) ao Studio!", "success");
            // Automatically log in the new user
            onLogin(createdUser); 
        } catch (error: any) {
            console.error("Erro ao registrar:", error.message || JSON.stringify(error));
            addToast(`Erro ao registrar: ${error.message || 'Verifique seus dados e tente novamente.'}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
            <div className="bg-dark-900 p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-dark-800 text-center animate-fade-in">
                <div className="bg-brand-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/20 rotate-12">
                   <Dumbbell className="text-white" size={40} />
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter mb-10">Studio</h1>

                {step === 'CODE_INPUT' ? (
                    <form onSubmit={handleCodeValidation} className="space-y-4">
                        <p className="text-slate-400 text-sm mb-6">Para se cadastrar, insira o código de convite fornecido pelo Studio.</p>
                        <input
                            type="text"
                            required
                            className="w-full bg-dark-950 border border-dark-700 rounded-2xl p-5 text-white focus:border-brand-500 outline-none text-lg text-center font-bold tracking-wider uppercase"
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
                        <p className="text-slate-400 text-sm mb-6">Preencha seus dados para criar sua conta de aluno.</p>
                        <input
                            type="text"
                            required
                            className="w-full bg-dark-950 border border-dark-700 rounded-2xl p-5 text-white focus:border-brand-500 outline-none text-lg"
                            placeholder="Nome Completo"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isLoading}
                        />
                        <input
                            type="email"
                            required
                            className="w-full bg-dark-950 border border-dark-700 rounded-2xl p-5 text-white focus:border-brand-500 outline-none text-lg"
                            placeholder="E-mail"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                        <input
                            type="password"
                            required
                            className="w-full bg-dark-950 border border-dark-700 rounded-2xl p-5 text-white focus:border-brand-500 outline-none text-lg"
                            placeholder="Senha"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        <input
                            type="tel"
                            required
                            className="w-full bg-dark-950 border border-dark-700 rounded-2xl p-5 text-white focus:border-brand-500 outline-none text-lg"
                            placeholder="WhatsApp (Ex: 5535991234567)"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all text-sm flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin mr-2" /> : <Send size={20} className="mr-2" />}
                            Criar Conta
                        </button>
                        <button type="button" onClick={onCancelRegistration} className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white mt-4" disabled={isLoading}>
                           <ArrowLeft size={16} className="inline mr-2" /> Voltar ao Login
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};