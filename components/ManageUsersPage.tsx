import React, { useState, useEffect } from 'react';
import { User, UserRole, Anamnesis, Address, Payment, ViewState, AppNavParams, ClassSession } from '../types';
import {
  X, Info, Repeat, Stethoscope, HandCoins, ArrowLeft, Save, MapPin,
  Edit, FileText, Receipt, DollarSign, Dumbbell, Activity,
  AlertTriangle, MessageCircle, CheckCheck, UserPlus, AlertCircle, 
  CheckCircle2, Loader2, Send, Users as UsersIcon, Trash2, 
  Calendar, ListOrdered, ClipboardList, BookOpen, Zap, ZapOff, BadgePercent,
  TrendingUp
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
    const [showWhatsAppModal, setShowWhatsAppModal] = useState<User | null>(null);
    const [showEnrolledClasses, setShowEnrolledClasses] = useState<User | null>(null);
    const [manualPaymentModal, setManualPaymentModal] = useState<{ student: User, payment: Payment } | null>(null);
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
            addToast(`Erro ao sincronizar dados: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Definição de Peso Hierárquico para permissões
    const roleRank = {
        [UserRole.SUPER_ADMIN]: 4,
        [UserRole.ADMIN]: 3,
        [UserRole.TRAINER]: 2,
        [UserRole.STUDENT]: 1,
    };

    const canManageUser = (targetUser: User) => {
        if (targetUser.id === currentUser.id) return false; // Não edita a si mesmo na lista
        return roleRank[currentUser.role] > roleRank[targetUser.role];
    };

    const toggleSuspension = async (user: User) => {
        if (!canManageUser(user)) return addToast("Você não tem permissão para suspender este nível de usuário.", "error");

        const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        const msg = newStatus === 'SUSPENDED' 
            ? `Deseja suspender o aluno ${user.name}? Isso sinalizará inatividade e paralisará cobranças automáticas.` 
            : `Deseja reativar o aluno ${user.name}?`;
        
        if (!confirm(msg)) return;

        setIsLoading(true);
        try {
            await SupabaseService.updateUser({ 
                ...user, 
                status: newStatus, 
                suspendedAt: newStatus === 'SUSPENDED' ? new Date().toISOString() : undefined 
            });
            addToast(`Aluno ${newStatus === 'SUSPENDED' ? 'suspenso' : 'reativado'} com sucesso!`, "success");
            refreshList();
        } catch (e) {
            addToast("Erro ao alterar status.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkPaidWithDiscount = async (payment: Payment, discount: number) => {
        setIsLoading(true);
        try {
            await SupabaseService.markPaymentAsPaid(payment.id, discount);
            const student = users.find(s => s.id === payment.studentId);
            if (student) WhatsAppAutomation.sendConfirmation(student, payment);
            addToast("Baixa realizada com sucesso!", "success");
            setManualPaymentModal(null);
            refreshList();
        } catch (e: any) {
            addToast(`Erro ao processar baixa: ${e.message}`, "error");
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

    const handleDeleteUser = async (user: User) => {
        if (!canManageUser(user)) return addToast("Você não tem permissão para excluir este nível de usuário.", "error");
        if (!confirm(`CUIDADO: Deseja excluir permanentemente o usuário ${user.name}? Todos os registros financeiros e de treinos serão apagados.`)) return;
        
        setIsLoading(true);
        try {
            await SupabaseService.deleteUser(user.id);
            addToast("Usuário removido da base de dados.", "success");
            refreshList();
        } catch (error: any) {
            addToast(`Erro na exclusão: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveUser = async (payload: User, wasPlanNewlyAssigned?: boolean) => {
        setIsLoading(true);
        try {
            let savedUser: User;
            if (editingUser) {
                savedUser = await SupabaseService.updateUser(payload);
                addToast("Cadastro atualizado com sucesso!", "success");
            } else {
                savedUser = await SupabaseService.addUser(payload);
                addToast("Novo usuário cadastrado!", "success");
            }

            if (wasPlanNewlyAssigned && savedUser.planId && (savedUser.planDuration || 0) > 0) {
                await SupabaseService.deletePendingPaymentsForStudent(savedUser.id);
                
                const paymentsToCreate: Omit<Payment, 'id'>[] = [];
                const startDate = new Date(savedUser.planStartDate || new Date().toISOString());
                
                for (let i = 0; i < (savedUser.planDuration || 0); i++) {
                    const dueDate = new Date(startDate.getTime());
                    dueDate.setMonth(dueDate.getMonth() + i);

                    const finalAmount = (savedUser.planValue || 0) - (savedUser.planDiscount || 0);
                    
                    paymentsToCreate.push({
                        studentId: savedUser.id,
                        amount: finalAmount,
                        status: 'PENDING',
                        dueDate: dueDate.toISOString().split('T')[0],
                        description: `Mensalidade ${i + 1}/${savedUser.planDuration}`
                    });
                }

                if (paymentsToCreate.length > 0) {
                    await SupabaseService.addMultiplePayments(paymentsToCreate);
                    addToast(`${savedUser.planDuration} faturas foram geradas para o plano.`, "info");
                }
            }

            setShowUserForm(false);
            refreshList();
        } catch (error: any) {
            addToast(`Erro ao salvar: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (u: User | null, tab: 'basic' | 'plan' | 'anamnesis' = 'basic') => {
        setEditingUser(u);
        setInitialFormData(u ? { ...u } : { 
            name: '', email: '', role: UserRole.STUDENT,
            planDuration: 12, planValue: 150, planDiscount: 0, billingDay: 5,
            joinDate: new Date().toISOString().split('T')[0],
            status: 'ACTIVE'
        });
        setInitialFormTab(tab);
        setShowUserForm(true);
    };

    const handleGenerateContract = async (user: User) => {
        setIsLoading(true);
        try {
            await ContractService.generateContract(user);
            addToast("Contrato gerado com sucesso!", "success");
        } catch (error: any) {
            console.error("Erro ao gerar contrato:", error);
            addToast(`Erro ao gerar contrato: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter(u => u.role !== UserRole.SUPER_ADMIN || isSuperAdmin);

    if (showUserForm) {
        return <UserFormPage editingUser={editingUser} initialFormData={initialFormData} initialActiveTab={initialFormTab} onSave={handleSaveUser} onCancel={() => setShowUserForm(false)} addToast={addToast} currentUserRole={currentUser.role} />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gestão de Alunos & Equipe</h2>
                    <p className="text-slate-400 text-sm">Central de comando para controle operacional e financeiro.</p>
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
                                const paidCount = sPayments.filter(p => p.status === 'PAID').length;
                                const nextDue = sPayments.filter(p => p.status === 'PENDING').sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
                                const latestDebt = sPayments.filter(p => p.status === 'OVERDUE').sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0];
                                const enrolledCount = classes.filter(c => c.enrolledStudentIds.includes(s.id)).length;
                                const isSuspended = s.status === 'SUSPENDED';

                                // Hierarquia de permissões rigorosa
                                const canEdit = canManageUser(s);

                                return (
                                    <tr key={s.id} className={`hover:bg-dark-900/40 transition-colors group ${isSuspended ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-12 h-12 rounded-2xl border-2 border-dark-800 shadow-lg object-cover" />
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-950 ${isSuspended ? 'bg-red-600' : (s.role === UserRole.STUDENT ? 'bg-brand-500' : 'bg-blue-500')}`}></div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-white font-bold text-base">{String(s.name)}</p>
                                                        {isSuspended && <span className="bg-red-500/20 text-red-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-red-500/30">Suspenso</span>}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{getRoleLabel(s.role)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.role === UserRole.STUDENT && (
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`p-1 rounded-md ${s.anamnesis?.hasRecentSurgeryOrInjury ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                            {s.anamnesis?.hasRecentSurgeryOrInjury ? <AlertTriangle size={12}/> : <CheckCheck size={12}/>}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase">Saúde {s.anamnesis?.hasRecentSurgeryOrInjury ? 'Restrita' : 'OK'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                                                        <Calendar size={12}/> {enrolledCount} Aula(s) ativa(s)
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.role === UserRole.STUDENT && (
                                              <div className="space-y-1">
                                                  <div className="flex items-center gap-2">
                                                      <span className={`w-2 h-2 rounded-full ${hasDebt ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-emerald-500'}`}></span>
                                                      <span className={`text-[10px] font-black tracking-widest ${hasDebt ? 'text-red-500' : 'text-emerald-500'}`}>
                                                          {hasDebt ? 'INADIMPLENTE' : 'EM DIA'}
                                                      </span>
                                                  </div>
                                                  <p className="text-[10px] text-slate-600 font-mono">Status: {paidCount} de {s.planDuration || 0} parcelas</p>
                                              </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end items-center gap-1.5 flex-wrap max-w-[650px] ml-auto">
                                                {/* Categoria: Status & Suspensão */}
                                                {canEdit && s.role === UserRole.STUDENT && (
                                                    <div className="flex bg-dark-900/80 p-1 rounded-xl gap-1 border border-dark-800">
                                                        <ActionButton 
                                                            icon={isSuspended ? Zap : ZapOff} 
                                                            color={isSuspended ? "green" : "red"} 
                                                            onClick={() => toggleSuspension(s)} 
                                                            title={isSuspended ? "Reativar Aluno" : "Suspender Aluno"} 
                                                        />
                                                    </div>
                                                )}

                                                {/* Categoria: Gestão Cadastral e Saúde */}
                                                {canEdit && (
                                                    <div className="flex bg-dark-900/80 p-1 rounded-xl gap-1 border border-dark-800">
                                                        <ActionButton icon={Edit} color="blue" onClick={() => handleOpenForm(s)} title="Editar Cadastro" />
                                                        {s.role === UserRole.STUDENT && (
                                                            <ActionButton icon={Stethoscope} color="slate" onClick={() => handleOpenForm(s, 'anamnesis')} title="Anamnese / Saúde" />
                                                        )}
                                                        {isAdmin && (
                                                            <ActionButton icon={Trash2} color="red" onClick={() => handleDeleteUser(s)} title="Excluir do Sistema" />
                                                        )}
                                                    </div>
                                                )}

                                                {/* Categoria: Visualização de Performance */}
                                                {s.role === UserRole.STUDENT && (
                                                    <div className="flex bg-dark-900/80 p-1 rounded-xl gap-1 border border-dark-800">
                                                        <ActionButton icon={ListOrdered} color="cyan" onClick={() => setShowEnrolledClasses(s)} title="Aulas Matriculadas" />
                                                        <ActionButton icon={TrendingUp} color="emerald" onClick={() => onNavigate('RUNNING_EVOLUTION', { studentId: s.id })} title="Evolução de Corrida" />
                                                        <ActionButton icon={Dumbbell} color="purple" onClick={() => onNavigate('PERSONAL_WORKOUTS', { studentId: s.id })} title="Treinos Individuais" />
                                                        <ActionButton icon={Activity} color="brand" onClick={() => onNavigate('ASSESSMENTS', { studentId: s.id })} title="Avaliações Físicas" />
                                                    </div>
                                                )}

                                                {/* Categoria: Financeiro & Documentos */}
                                                {isAdmin && s.role === UserRole.STUDENT && (
                                                    <div className="flex bg-dark-900/80 p-1 rounded-xl gap-1 border border-dark-800">
                                                        <ActionButton icon={DollarSign} color="emerald" onClick={() => onNavigate('FINANCIAL', { studentId: s.id })} title="Fluxo Financeiro" />
                                                        <ActionButton icon={FileText} color="indigo" onClick={() => handleGenerateContract(s)} disabled={!isContractReady || isLoading} title={isContractReady ? "Imprimir Contrato" : "Faltam Dados p/ Contrato"} />
                                                        <ActionButton 
                                                            icon={Receipt} 
                                                            color="amber" 
                                                            onClick={() => {
                                                                if (nextDue) {
                                                                    setManualPaymentModal({ student: s, payment: nextDue });
                                                                } else if (s.planId && s.planValue && s.planValue > 0) {
                                                                    if (confirm("Nenhum vencimento próximo. Deseja gerar nova fatura avulsa?")) {
                                                                        SupabaseService.addPayment({ 
                                                                            studentId: s.id, 
                                                                            amount: (s.planValue || 150) - (s.planDiscount || 0), 
                                                                            status: 'PENDING', 
                                                                            dueDate: new Date().toISOString().split('T')[0], 
                                                                            description: "Mensalidade Avulsa"
                                                                        }).then(() => {
                                                                            addToast("Fatura avulsa gerada. Atualizando...", "success");
                                                                            refreshList();
                                                                        });
                                                                    }
                                                                } else {
                                                                    addToast("Nenhum plano ativo encontrado para este aluno.", "info");
                                                                }
                                                            }} 
                                                            title="Receber / Gerar Fatura" 
                                                        />
                                                    </div>
                                                )}

                                                {/* Categoria: WhatsApp & Cobrança */}
                                                {(isAdmin || isTrainer) && s.phoneNumber && (
                                                    <div className="flex bg-dark-900/80 p-1 rounded-xl gap-1 border border-dark-800">
                                                        {isAdmin && latestDebt && (
                                                            <ActionButton icon={AlertTriangle} color="red" onClick={() => WhatsAppAutomation.sendOverdueNotice(s, latestDebt)} title="WhatsApp: Cobrar Atraso" />
                                                        )}
                                                        {isAdmin && nextDue && !latestDebt && (
                                                            <ActionButton icon={MessageCircle} color="amber" onClick={() => WhatsAppAutomation.sendPaymentReminder(s, nextDue)} title="WhatsApp: Lembrar Vencimento" />
                                                        )}
                                                        <ActionButton icon={Send} color="green" onClick={() => setShowWhatsAppModal(s)} title="WhatsApp: Contato Livre" />
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

            {/* Modal de Baixa Manual com Desconto */}
            {manualPaymentModal && (
                <ManualPaymentModal 
                    student={manualPaymentModal.student}
                    payment={manualPaymentModal.payment}
                    onConfirm={handleMarkPaidWithDiscount}
                    onCancel={() => setManualPaymentModal(null)}
                    isLoading={isLoading}
                />
            )}

            {/* Modal de Aulas do Aluno */}
            {showEnrolledClasses && (
                <EnrolledClassesModal 
                    student={showEnrolledClasses} 
                    classes={classes.filter(c => c.enrolledStudentIds.includes(showEnrolledClasses.id))}
                    onClose={() => setShowEnrolledClasses(null)}
                />
            )}

            {/* Modal de WhatsApp Livre */}
            {showWhatsAppModal && (
                <WhatsAppMessageModal 
                    student={showWhatsAppModal}
                    onSend={(student, msg) => { WhatsAppAutomation.sendGenericMessage(student, msg); setShowWhatsAppModal(null); }}
                    onCancel={() => setShowWhatsAppModal(null)}
                />
            )}
        </div>
    );
};

// Modal de Baixa Manual com Desconto
const ManualPaymentModal = ({ student, payment, onConfirm, onCancel, isLoading }: { student: User, payment: Payment, onConfirm: (p: Payment, discount: number) => void, onCancel: () => void, isLoading: boolean }) => {
    const [discount, setDiscount] = useState(0);
    const finalAmount = Math.max(0, payment.amount - discount);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
            <div className="bg-dark-900 border border-dark-700 p-8 rounded-[3rem] shadow-2xl max-w-md w-full space-y-6 relative overflow-hidden">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <BadgePercent size={22} className="text-brand-500" /> Receber Pagamento
                        </h3>
                        <p className="text-slate-500 text-[10px] mt-1 uppercase font-black tracking-widest">{String(student.name)}</p>
                    </div>
                    <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800 flex justify-between items-center">
                        <span className="text-slate-400 text-xs font-bold uppercase">Valor da Fatura:</span>
                        <span className="text-white font-black">R$ {payment.amount.toFixed(2)}</span>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Aplicar Desconto (R$)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-4 text-white font-black text-lg focus:border-brand-500 outline-none"
                            placeholder="0.00"
                            value={discount || ''}
                            onChange={e => setDiscount(Number(e.target.value))}
                        />
                    </div>

                    <div className="bg-brand-600/10 p-5 rounded-2xl border border-brand-500/20 flex justify-between items-center animate-pulse">
                        <span className="text-brand-500 text-xs font-black uppercase">Total a Receber:</span>
                        <span className="text-white font-black text-xl">R$ {finalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onCancel} className="py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-700">Cancelar</button>
                    <button 
                        onClick={() => onConfirm(payment, discount)} 
                        disabled={isLoading}
                        className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente de botão de ação otimizado
const ActionButton = ({ icon: Icon, color, onClick, disabled, title }: { icon: any, color: string, onClick: () => void, disabled?: boolean, title: string }) => {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white",
        emerald: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white",
        brand: "bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white",
        purple: "bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white",
        slate: "bg-slate-700/30 text-slate-400 hover:bg-slate-600 hover:text-white",
        indigo: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white",
        amber: "bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white",
        red: "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white",
        green: "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white",
        cyan: "bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-white"
    };

    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            disabled={disabled}
            title={title}
            className={`p-2 rounded-xl transition-all duration-300 disabled:opacity-5 disabled:cursor-not-allowed transform active:scale-90 ${colorClasses[color]}`}
        >
            <Icon size={14} />
        </button>
    );
};

const EnrolledClassesModal = ({ student, classes, onClose }: { student: User, classes: ClassSession[], onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
            <div className="bg-dark-900 border border-dark-700 p-8 rounded-[3rem] shadow-2xl max-w-lg w-full space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <BookOpen size={22} className="text-brand-500" /> Matrículas de {String(student.name).split(' ')[0]}
                        </h3>
                        <p className="text-slate-500 text-xs mt-1 uppercase font-bold tracking-widest">Aulas que o aluno está inscrito nesta semana</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-2 bg-dark-800 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {classes.length > 0 ? (
                        classes.map(c => (
                            <div key={c.id} className="p-5 bg-dark-950 rounded-2xl border border-dark-800 flex justify-between items-center group hover:border-brand-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${c.type === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{c.title}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{c.dayOfWeek} às {c.startTime} • Prof. {c.instructor.split(' ')[0]}</p>
                                    </div>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${c.type === 'RUNNING' ? 'text-emerald-500 bg-emerald-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                                    {c.type === 'RUNNING' ? 'Corrida' : 'Funcional'}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center bg-dark-950 rounded-3xl border border-dashed border-dark-800">
                            <ClipboardList size={40} className="mx-auto text-dark-800 mb-3" />
                            <p className="text-slate-600 font-bold uppercase text-[10px]">Nenhuma matrícula ativa</p>
                        </div>
                    )}
                </div>

                <button onClick={onClose} className="w-full py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-dark-700 transition-all">
                    Fechar Visualização
                </button>
            </div>
        </div>
    );
};

const WhatsAppMessageModal = ({ student, onSend, onCancel }: { student: User, onSend: (s: User, m: string) => void, onCancel: () => void }) => {
    const [message, setMessage] = useState('');
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-fade-in">
            <div className="bg-dark-900 border border-dark-700 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full space-y-5">
                <div className="flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2"><MessageCircle className="text-brand-500" size={20}/> Mensagem p/ {String(student.name).split(' ')[0]}</h3>
                    <button onClick={onCancel} className="text-slate-500 hover:text-white"><X size={20}/></button>
                </div>
                <textarea
                    className="w-full h-32 bg-dark-950 border border-dark-800 rounded-xl p-4 text-white placeholder-slate-600 focus:border-brand-500 outline-none text-sm"
                    placeholder="Digite a mensagem personalizada..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                />
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 bg-dark-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Sair</button>
                    <button onClick={() => onSend(student, message)} className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-600/20">Enviar</button>
                </div>
            </div>
        </div>
    );
};