
import React, { useState, useEffect } from 'react';
import { User, UserRole, Payment, ViewState, AppNavParams } from '../types';
import {
  ArrowLeft, Edit, DollarSign, Activity, UserPlus, Loader2, Dumbbell, Trash2, FileText, AlertTriangle, CheckCircle2, MessageCircle, Smartphone
} from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { ContractService } from '../services/contractService';
import { useToast, WhatsAppAutomation } from '../App';
import { UserFormPage } from './UserFormPage';

export const ManageUsersPage = ({ currentUser, onNavigate }: { currentUser: User, onNavigate: (view: ViewState, params?: AppNavParams) => void }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const { addToast } = useToast();

    const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;
    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

    const refreshList = async () => {
        setIsLoading(true);
        try {
            const [uData, pData] = await Promise.all([
                SupabaseService.getAllUsers(),
                SupabaseService.getPayments()
            ]);
            setUsers(uData || []);
            setPayments(pData || []);
        } catch (error: any) {
            addToast(`Falha na sincronização.`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { refreshList(); }, []);

    const getRoleLabel = (role: UserRole) => {
        switch(role) {
            case UserRole.SUPER_ADMIN: return 'Administrador Geral';
            case UserRole.ADMIN: return 'Administrador';
            case UserRole.TRAINER: return 'Professor / Treinador';
            default: return 'Aluno';
        }
    };

    const handleOpenForm = (u: User | null) => {
        setEditingUser(u);
        setShowUserForm(true);
    };

    const handleSaveUser = async (payload: User) => {
        setIsLoading(true);
        try {
            if (payload.id) {
                await SupabaseService.updateUser(payload);
                addToast("Cadastro atualizado!", "success");
            } else {
                await SupabaseService.addUser(payload);
                addToast("Usuário criado!", "success");
            }
            setShowUserForm(false);
            refreshList();
        } catch (e: any) {
            addToast(`Erro ao salvar: ${e.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
      if (!confirm("Excluir definitivamente este cadastro?")) return;
      setIsLoading(true);
      try {
        await SupabaseService.deleteUser(id);
        addToast("Removido com sucesso.", "success");
        refreshList();
      } catch { addToast("Erro ao excluir usuário.", "error"); }
      finally { setIsLoading(false); }
    };

    const handleGenerateContract = async (user: User) => {
        try {
            addToast("Gerando contrato...", "info");
            await ContractService.generateContract(user);
            addToast("Contrato gerado!", "success");
        } catch (e) {
            addToast("Erro ao gerar PDF.", "error");
        }
    };

    const handleWhatsAppContact = (user: User) => {
        const message = `Olá, ${String(user.name).split(' ')[0]}! Tudo bem?`;
        window.open(WhatsAppAutomation.getApiUrl(user.phoneNumber || '', message), '_blank');
    };

    const handleWhatsAppBilling = (user: User) => {
        const userPayments = payments.filter(p => p.studentId === user.id);
        const overdue = userPayments.find(p => p.status === 'OVERDUE');
        const pending = userPayments
            .filter(p => p.status === 'PENDING')
            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
        
        const targetPayment = overdue || pending;
        
        if (targetPayment) {
            WhatsAppAutomation.sendPaymentReminder(user, targetPayment);
        } else {
            const genericMessage = `Olá, ${String(user.name).split(' ')[0]}! Gostaria de falar sobre sua mensalidade no Studio.`;
            window.open(WhatsAppAutomation.getApiUrl(user.phoneNumber || '', genericMessage), '_blank');
        }
    };

    if (showUserForm) {
        return <UserFormPage editingUser={editingUser} initialFormData={editingUser || {}} onSave={handleSaveUser} onCancel={() => setShowUserForm(false)} addToast={addToast} currentUserRole={currentUser.role} />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button onClick={() => onNavigate('DASHBOARD')} className="p-2.5 bg-dark-950 border border-dark-800 text-slate-500 rounded-full hover:text-brand-500 transition-all active:scale-95">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                      <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Gestão de Alunos e Equipe</h2>
                      <p className="text-slate-400 text-sm">Controle central de acessos e saúde do Studio.</p>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleOpenForm(null)} className="bg-brand-600 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center shadow-xl hover:bg-brand-500 transition-all active:scale-95">
                      <UserPlus size={18} className="mr-2" /> Novo Cadastro
                  </button>
                )}
            </div>

            <div className="bg-dark-950 rounded-[2.5rem] border border-dark-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400 min-w-[1250px]">
                        <thead className="bg-dark-900/50 font-bold uppercase text-[10px] tracking-widest text-slate-500">
                            <tr>
                                <th className="px-6 py-6">Membro / Saúde</th>
                                <th className="px-6 py-6">Função</th>
                                <th className="px-6 py-6">Status Financeiro</th>
                                <th className="px-6 py-6 text-right">Ações de Gestão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-800">
                            {users.filter(u => u.role !== UserRole.SUPER_ADMIN || isSuperAdmin).map(s => {
                                const userPayments = payments.filter(p => p.studentId === s.id);
                                const hasDebt = userPayments.some(p => p.status === 'OVERDUE');
                                const hasRestriction = s.anamnesis?.hasInjury || s.anamnesis?.hadSurgery || s.anamnesis?.hasHeartCondition || s.anamnesis?.takesMedication;
                                
                                // Cálculo de parcelas: X de Y
                                const paidCount = userPayments.filter(p => p.status === 'PAID').length;
                                const totalCount = userPayments.length > 0 
                                    ? (userPayments[0].totalInstallments || s.planDuration || 0) 
                                    : (s.planDuration || 0);

                                return (
                                    <tr key={s.id} className="hover:bg-dark-900/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-12 h-12 rounded-2xl border border-dark-800 object-cover" />
                                                    {hasRestriction && (
                                                        <div className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full border-2 border-dark-950 shadow-lg">
                                                            <AlertTriangle size={10} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold">{String(s.name)}</p>
                                                    {hasRestriction ? (
                                                        <p className="text-[9px] text-red-500 font-black uppercase flex items-center gap-1 mt-0.5">
                                                            <AlertTriangle size={10}/> Restrição Médica
                                                        </p>
                                                    ) : (
                                                        <p className="text-[9px] text-emerald-500 font-black uppercase flex items-center gap-1 mt-0.5">
                                                            <CheckCircle2 size={10}/> Saúde em dia
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-dark-900 px-3 py-1 rounded-lg border border-dark-800">
                                                {getRoleLabel(s.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.role === UserRole.STUDENT ? (
                                              <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${hasDebt ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {hasDebt ? 'Mensalidade Atrasada' : 'Financeiro em Dia'}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase">Parcela {paidCount} de {totalCount}</span>
                                                    <span className="text-slate-800">|</span>
                                                    <span className="text-[9px] text-slate-600 font-bold">Venc. Dia {s.billingDay || 5}</span>
                                                </div>
                                              </div>
                                            ) : (
                                              <span className="text-slate-700">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* LINK EDITAR */}
                                                <button onClick={() => handleOpenForm(s)} title="Editar Cadastro" className="p-2.5 bg-dark-900 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20 shadow-lg">
                                                    <Edit size={16}/>
                                                </button>

                                                {s.role === UserRole.STUDENT && (
                                                  <>
                                                    {/* WHATSAPP GERAL */}
                                                    <button onClick={() => handleWhatsAppContact(s)} title="Contato WhatsApp" className="p-2.5 bg-dark-900 text-emerald-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-500/20 shadow-lg">
                                                        <MessageCircle size={16}/>
                                                    </button>
                                                    
                                                    {/* WHATSAPP COBRANÇA */}
                                                    <button onClick={() => handleWhatsAppBilling(s)} title="Enviar Cobrança WhatsApp" className="p-2.5 bg-dark-900 text-teal-500 rounded-xl hover:bg-teal-600 hover:text-white transition-all border border-teal-500/20 shadow-lg">
                                                        <Smartphone size={16}/>
                                                    </button>

                                                    {/* LINK CONTRATO */}
                                                    <button onClick={() => handleGenerateContract(s)} title="Gerar Contrato PDF" className="p-2.5 bg-dark-900 text-amber-500 rounded-xl hover:bg-amber-600 hover:text-white transition-all border border-amber-500/20 shadow-lg">
                                                        <FileText size={16}/>
                                                    </button>
                                                    {/* LINK TREINOS */}
                                                    <button onClick={() => onNavigate('PERSONAL_WORKOUTS', { studentId: s.id })} title="Treinos Personalizados" className="p-2.5 bg-dark-900 text-brand-500 rounded-xl hover:bg-brand-500 hover:text-white transition-all border border-brand-500/20 shadow-lg">
                                                        <Dumbbell size={16}/>
                                                    </button>
                                                    {/* LINK AVALIAÇÕES */}
                                                    <button onClick={() => onNavigate('ASSESSMENTS', { studentId: s.id })} title="Avaliações Físicas" className="p-2.5 bg-dark-900 text-purple-500 rounded-xl hover:bg-purple-600 hover:text-white transition-all border border-purple-500/20 shadow-lg">
                                                        <Activity size={16}/>
                                                    </button>
                                                    {/* LINK FINANCEIRO */}
                                                    <button onClick={() => onNavigate('FINANCIAL', { studentId: s.id })} title="Financeiro do Aluno" className="p-2.5 bg-dark-900 text-emerald-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-500/20 shadow-lg">
                                                        <DollarSign size={16}/>
                                                    </button>
                                                  </>
                                                )}
                                                
                                                {isSuperAdmin && s.id !== currentUser.id && (
                                                  <button onClick={() => handleDeleteUser(s.id)} title="Excluir Usuário" className="p-2.5 bg-dark-900 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-500/20 shadow-lg">
                                                      <Trash2 size={16}/>
                                                  </button>
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
            {isLoading && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] backdrop-blur-sm"><Loader2 className="animate-spin text-brand-500" size={48}/></div>}
        </div>
    );
};
