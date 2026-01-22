
import React, { useState, useEffect } from 'react';
import { User, UserRole, Anamnesis, Address, Payment, ViewState, AppNavParams, ClassSession } from '../types';
import {
  X, Info, Repeat, Stethoscope, HandCoins, ArrowLeft, Save, MapPin,
  Edit, FileText, Receipt, DollarSign, Dumbbell, Activity,
  AlertTriangle, MessageCircle, CheckCheck, UserPlus, AlertCircle, 
  CheckCircle2, Loader2, Send, Users as UsersIcon, Trash2, 
  Calendar, ListOrdered, ClipboardList, BookOpen, Wallet, Check,
  ZapOff, Play, CalendarPlus, Tag
} from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { ContractService } from '../services/contractService';
import { WhatsAppAutomation, useToast } from '../App';
import { UserFormPage } from './UserFormPage';

export const ManageUsersPage = ({ currentUser, onNavigate }: { currentUser: User, onNavigate: (view: ViewState, params?: AppNavParams) => void }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [initialFormData, setInitialFormData] = useState<Partial<User>>({});
    const [initialFormTab, setInitialFormTab] = useState<'basic' | 'plan' | 'anamnesis'>('basic');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState<User | null>(null);
    const [showEnrolledClasses, setShowEnrolledClasses] = useState<User | null>(null);
    const [showReactivateModal, setShowReactivateModal] = useState<{user: User, pending: Payment[]} | null>(null);
    const { addToast } = useToast();

    const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;
    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
    const isTrainer = currentUser.role === UserRole.TRAINER;

    useEffect(() => { refreshList(); }, []);
    
    const refreshList = async () => {
        setIsLoading(true);
        try {
            const [uData, pData, cData] = await Promise.all([
                SupabaseService.getAllUsers(),
                SupabaseService.getPayments(),
                SupabaseService.getClasses()
            ]);
            setUsers(uData);
            setPayments(pData);
            setClasses(cData);
        } catch (error: any) {
            addToast(`Erro ao sincronizar dados`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleLabel = (role: UserRole) => {
        switch(role) {
            case UserRole.SUPER_ADMIN: return 'Admin Geral';
            case UserRole.ADMIN: return 'Administrador';
            case UserRole.TRAINER: return 'Treinador';
            default: return 'Aluno';
        }
    };

    const handlePauseUser = async (user: User) => {
        if (!confirm(`Deseja PAUSAR o contrato de ${user.name}? As cobranças futuras serão suspensas.`)) return;
        setIsProcessingAction(user.id);
        try {
            const updated = { ...user, profileCompleted: false }; 
            await SupabaseService.updateUser(updated);
            addToast(`${user.name} foi pausado(a).`, "info");
            refreshList();
        } catch (e) {
            addToast("Erro ao pausar aluno.", "error");
        } finally {
            setIsProcessingAction(null);
        }
    };

    const handleOpenReactivate = (user: User) => {
        const pending = payments.filter(p => p.studentId === user.id && p.status !== 'PAID');
        setShowReactivateModal({ user, pending });
    };

    const handleReactivateSubmit = async (newAmount: number, newStartDate: string) => {
        if (!showReactivateModal) return;
        const { user, pending } = showReactivateModal;
        setIsLoading(true);
        try {
            await SupabaseService.updateUser({ ...user, profileCompleted: true });
            let currentDate = new Date(newStartDate);
            for (let i = 0; i < pending.length; i++) {
                const p = pending[i];
                const dueDate = new Date(currentDate);
                dueDate.setMonth(currentDate.getMonth() + i);
                await SupabaseService.updatePayment({
                    ...p,
                    amount: newAmount,
                    due_date: dueDate.toISOString().split('T')[0]
                });
            }
            addToast(`${user.name} reativado com sucesso!`, "success");
            setShowReactivateModal(null);
            refreshList();
        } catch (e) {
            addToast("Erro na reativação.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (!confirm(`CUIDADO: Excluir ${user.name}?`)) return;
        setIsLoading(true);
        try {
            await SupabaseService.deleteUser(user.id);
            addToast("Usuário removido.", "success");
            refreshList();
        } catch (e) {
            addToast(`Erro na exclusão`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveUser = async (payload: User) => {
        setIsLoading(true);
        try {
            if (editingUser) {
                await SupabaseService.updateUser(payload);
                addToast("Cadastro atualizado!", "success");
            } else {
                await SupabaseService.addUser(payload);
                addToast("Novo usuário cadastrado!", "success");
            }
            setShowUserForm(false);
            refreshList();
        } catch (e) {
            addToast(`Erro ao salvar`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickPay = async (user: User, payment: Payment) => {
        if (!confirm(`Confirmar recebimento de R$ ${payment.amount.toFixed(2)}?`)) return;
        setIsProcessingAction(payment.id);
        try {
            await SupabaseService.markPaymentAsPaid(payment.id);
            WhatsAppAutomation.sendConfirmation(user, payment);
            addToast(`Pagamento registrado!`, "success");
            refreshList();
        } catch (e) {
            addToast("Erro ao dar baixa.", "error");
        } finally {
            setIsProcessingAction(null);
        }
    };

    const handleOpenForm = (u: User | null, tab: 'basic' | 'plan' | 'anamnesis' = 'basic') => {
        setEditingUser(u);
        setInitialFormData(u ? { ...u } : { 
            name: '', email: '', role: UserRole.STUDENT,
            planDuration: 12, planValue: 150, billingDay: 5,
            joinDate: new Date().toISOString().split('T')[0]
        });
        setInitialFormTab(tab);
        setShowUserForm(true);
    };

    const filteredUsers = users.filter(u => u.role !== UserRole.SUPER_ADMIN);

    if (showUserForm) {
        return <UserFormPage editingUser={editingUser} initialFormData={initialFormData} initialActiveTab={initialFormTab} onSave={handleSaveUser} onCancel={() => setShowUserForm(false)} addToast={addToast} currentUserRole={currentUser.role} />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button onClick={() => onNavigate('DASHBOARD')} className="p-2.5 bg-dark-950 border border-dark-800 text-slate-500 rounded-full hover:text-brand-500 hover:border-brand-500/50 transition-all active:scale-90">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                      <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Alunos & Equipe</h2>
                      <p className="text-slate-400 text-sm">Controle operacional e financeiro centralizado.</p>
                  </div>
                </div>
                {(isAdmin || isTrainer) && (
                  <button onClick={() => handleOpenForm(null)} className="bg-brand-600 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all active:scale-95">
                      <UserPlus size={18} className="mr-2" /> Novo Cadastro
                  </button>
                )}
            </div>

            <div className="bg-dark-950 rounded-[2.5rem] border border-dark-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400 min-w-[1300px]">
                        <thead className="bg-dark-900/50 font-bold uppercase text-[10px] tracking-widest text-slate-500">
                            <tr>
                                <th className="px-6 py-6">Identificação</th>
                                <th className="px-6 py-6">Saúde / Status</th>
                                <th className="px-6 py-6">Financeiro</th>
                                <th className="px-6 py-6 text-right">Ações de Gestão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-800">
                            {filteredUsers.map(s => {
                                const isContractReady = !!(s.cpf && s.rg && s.address?.zipCode);
                                const sPayments = payments.filter(p => p.studentId === s.id);
                                const hasDebt = sPayments.some(p => p.status === 'OVERDUE');
                                const isPaused = s.profileCompleted === false; // Usando flag de profile como status
                                const nextDue = sPayments.filter(p => p.status !== 'PAID').sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

                                return (
                                    <tr key={s.id} className={`hover:bg-dark-900/40 transition-colors group ${isPaused ? 'opacity-50 grayscale' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-12 h-12 rounded-2xl border-2 border-dark-800 shadow-lg object-cover" />
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-950 ${isPaused ? 'bg-slate-500' : (s.role === UserRole.STUDENT ? 'bg-brand-500' : 'bg-blue-500')}`}></div>
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-base">{String(s.name)}</p>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{isPaused ? 'CONTRATO PAUSADO' : getRoleLabel(s.role)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`p-1 rounded-md ${s.anamnesis?.hasInjury ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                        {s.anamnesis?.hasInjury ? <AlertTriangle size={12}/> : <CheckCheck size={12}/>}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase">Saúde {s.anamnesis?.hasInjury ? 'Restrita' : 'OK'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.role === UserRole.STUDENT && (
                                              <div className="space-y-1">
                                                  <div className="flex items-center gap-2">
                                                      <span className={`w-2 h-2 rounded-full ${hasDebt ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                                      <span className={`text-[10px] font-black tracking-widest ${hasDebt ? 'text-red-500' : 'text-emerald-500'}`}>
                                                          {hasDebt ? 'INADIMPLENTE' : 'EM DIA'}
                                                      </span>
                                                  </div>
                                                  <p className="text-[10px] text-slate-600 font-mono">Próximo: {nextDue ? nextDue.dueDate.split('-').reverse().join('/') : '--'}</p>
                                              </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end items-center gap-1.5 flex-wrap max-w-[600px] ml-auto">
                                                {/* Pausa / Reativar */}
                                                {isAdmin && s.role === UserRole.STUDENT && (
                                                    isPaused ? (
                                                        <button 
                                                            onClick={() => handleOpenReactivate(s)}
                                                            className="px-3 py-2 bg-brand-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-500 transition-all flex items-center gap-1 shadow-lg"
                                                            title="Reativar Aluno"
                                                        >
                                                            <Play size={12} strokeWidth={3} /> Reativar
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handlePauseUser(s)}
                                                            disabled={isProcessingAction === s.id}
                                                            className="px-3 py-2 bg-dark-800 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-1 border border-dark-700"
                                                            title="Pausar Contrato"
                                                        >
                                                            {isProcessingAction === s.id ? <Loader2 size={12} className="animate-spin" /> : <ZapOff size={12} />} Pausar
                                                        </button>
                                                    )
                                                )}

                                                {/* Baixa Rápida */}
                                                {!isPaused && isAdmin && s.role === UserRole.STUDENT && nextDue && (
                                                    <button 
                                                        onClick={() => handleQuickPay(s, nextDue)}
                                                        className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-1 shadow-lg shadow-emerald-600/20"
                                                    >
                                                        <Check size={12} strokeWidth={3} /> Baixa Rápida
                                                    </button>
                                                )}

                                                <div className="flex bg-dark-900/80 p-1 rounded-xl gap-1 border border-dark-800">
                                                    <ActionButton icon={Edit} color="blue" onClick={() => handleOpenForm(s)} title="Editar" />
                                                    {isSuperAdmin && s.id !== currentUser.id && (
                                                        <ActionButton icon={Trash2} color="red" onClick={() => handleDeleteUser(s)} title="Excluir" />
                                                    )}
                                                </div>

                                                {!isPaused && s.role === UserRole.STUDENT && (
                                                    <div className="flex bg-dark-900/80 p-1 rounded-xl gap-1 border border-dark-800">
                                                        <ActionButton icon={Dumbbell} color="purple" onClick={() => onNavigate('PERSONAL_WORKOUTS', { studentId: s.id })} title="Treinos" />
                                                        <ActionButton icon={Activity} color="brand" onClick={() => onNavigate('ASSESSMENTS', { studentId: s.id })} title="Avaliações" />
                                                    </div>
                                                )}

                                                {isAdmin && s.role === UserRole.STUDENT && (
                                                    <div className="flex bg-dark-900/80 p-1 rounded-xl gap-1 border border-dark-800">
                                                        <ActionButton icon={DollarSign} color="emerald" onClick={() => onNavigate('FINANCIAL', { studentId: s.id })} title="Financeiro" />
                                                        <ActionButton icon={FileText} color="indigo" onClick={() => ContractService.generateContract(s)} disabled={!isContractReady} title="Contrato" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showReactivateModal && (
                <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
                    <ReactivateForm 
                        user={showReactivateModal.user} 
                        pendingCount={showReactivateModal.pending.length}
                        onConfirm={handleReactivateSubmit}
                        onCancel={() => setShowReactivateModal(null)}
                    />
                </div>
            )}

            {showEnrolledClasses && (
                <EnrolledClassesModal student={showEnrolledClasses} classes={classes.filter(c => c.enrolledStudentIds.includes(showEnrolledClasses.id))} onClose={() => setShowEnrolledClasses(null)} />
            )}
        </div>
    );
};

const ActionButton = ({ icon: Icon, color, onClick, disabled, title }: { icon: any, color: string, onClick: () => void, disabled?: boolean, title: string }) => {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white",
        emerald: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white",
        brand: "bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white",
        purple: "bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white",
        slate: "bg-slate-700/30 text-slate-400 hover:bg-slate-600 hover:text-white",
        indigo: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white",
        red: "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white",
    };
    return (
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} disabled={disabled} title={title} className={`p-2 rounded-xl transition-all disabled:opacity-5 transform active:scale-90 ${colorClasses[color]}`}>
            <Icon size={14} />
        </button>
    );
};

const ReactivateForm = ({ user, pendingCount, onConfirm, onCancel }: { user: User, pendingCount: number, onConfirm: (amt: number, date: string) => void, onCancel: () => void }) => {
    const [amt, setAmt] = useState(user.planValue || 150);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    return (
        <div className="bg-dark-900 border border-dark-700 p-10 rounded-[3rem] shadow-2xl max-w-md w-full space-y-8 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <div className="text-center">
                <div className="bg-emerald-500/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Play className="text-emerald-500" size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Reativar Aluno</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Ajuste as {pendingCount} parcelas restantes</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Tag size={12} className="text-brand-500"/> Novo Valor por Parcela (R$):
                    </label>
                    <input type="number" className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-5 text-white font-black text-xl focus:border-brand-500 outline-none" value={amt} onChange={e => setAmt(Number(e.target.value))} />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <CalendarPlus size={12} className="text-brand-500"/> Data do Novo 1º Vencimento:
                    </label>
                    <input type="date" className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-5 text-white font-bold focus:border-brand-500 outline-none" value={date} onChange={e => setDate(e.target.value)} />
                </div>

                <div className="bg-brand-500/5 p-4 rounded-2xl border border-brand-500/20">
                    <p className="text-[10px] text-brand-200 font-bold leading-relaxed">
                        Ao reativar, o sistema ajustará todas as parcelas pendentes para o valor de <b>R$ {amt.toFixed(2)}</b> e distribuirá os vencimentos mensalmente a partir de <b>{date.split('-').reverse().join('/')}</b>.
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={onCancel} className="flex-1 py-4 bg-dark-800 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white">Cancelar</button>
                <button onClick={() => onConfirm(amt, date)} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-500">Confirmar</button>
            </div>
        </div>
    );
};

const EnrolledClassesModal = ({ student, classes, onClose }: { student: User, classes: ClassSession[], onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
            <div className="bg-dark-900 border border-dark-700 p-8 rounded-[3rem] shadow-2xl max-w-lg w-full space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen size={22} className="text-brand-500" /> Matrículas de {String(student.name).split(' ')[0]}
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full"><X size={20} /></button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {classes.length > 0 ? (
                        classes.map(c => (
                            <div key={c.id} className="p-5 bg-dark-950 rounded-2xl border border-dark-800 flex justify-between items-center group hover:border-brand-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${c.type === 'RUNNING' ? 'bg-blue-500/10 text-blue-500' : 'bg-brand-500/10 text-brand-500'}`}><Calendar size={20} /></div>
                                    <div><p className="text-white font-bold">{c.title}</p><p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{c.dayOfWeek} às {c.startTime}</p></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center bg-dark-950 rounded-3xl border border-dashed border-dark-800"><p className="text-slate-600 font-bold uppercase text-[10px]">Nenhuma matrícula ativa</p></div>
                    )}
                </div>
                <button onClick={onClose} className="w-full py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-700 transition-all">Fechar</button>
            </div>
        </div>
    );
};
