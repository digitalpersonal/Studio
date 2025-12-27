

import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Anamnesis, Address, Payment, ViewState, AppNavParams } from '../types';
import {
  X, Info, Repeat, Stethoscope, HandCoins, ArrowLeft, Save, MapPin,
  MoreVertical, Edit, FileText, Receipt, DollarSign, Dumbbell, Activity,
  AlertTriangle, MessageCircle, CheckCheck, UserPlus, AlertCircle, CheckCircle2, Loader2,
  Send, Users as UsersIcon // Importa Users como UsersIcon para evitar conflito com 'users' do estado
} from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { ContractService } from '../services/contractService';
import { WhatsAppAutomation, useToast } from '../App';

// Fix: Import UserFormPage from its dedicated component file
import { UserFormPage } from './UserFormPage';

export const ManageUsersPage = ({ currentUser, onNavigate }: { currentUser: User, onNavigate: (view: ViewState, params?: AppNavParams) => void }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]); // All payments for calculations
    const [showUserForm, setShowUserForm] = useState(false); // Estado para controlar a exibição do formulário
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [initialFormData, setInitialFormData] = useState<Partial<User>>({});
    const [initialFormTab, setInitialFormTab] = useState<'basic' | 'plan' | 'anamnesis'>('basic');
    const [isLoading, setIsLoading] = useState(false);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState<User | null>(null);
    const { addToast } = useToast();

    const isStaff = currentUser.role !== UserRole.STUDENT;
    const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;
    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
    const isTrainer = currentUser.role === UserRole.TRAINER;


    useEffect(() => { refreshList(); }, []);
    
    const refreshList = async () => {
        setIsLoading(true);
        try {
            const [uData, pData] = await Promise.all([
                SupabaseService.getAllUsers(),
                SupabaseService.getPayments() // Fetch all payments
            ]);
            setUsers(uData);
            setPayments(pData);
        } catch (error: any) {
            console.error("Erro ao carregar lista de usuários/pagamentos:", error.message || JSON.stringify(error));
            addToast(`Erro ao carregar lista de usuários: ${error.message || JSON.stringify(error)}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateContract = (s: User) => {
      ContractService.generateContract(s);
      addToast(`Contrato de ${String(s.name).split(' ')[0]} gerado com sucesso!`, "success");
    };

    const handleGeneratePayments = async (student: User) => {
        if (!student.planValue || !student.planDuration) {
            addToast("Defina valor e duração do plano.", "error");
            return;
        }
        if (!confirm(`Gerar ${student.planDuration} faturas para este usuário?`)) return;

        setIsLoading(true);
        try {
            const billingDay = student.billingDay || 5;
            const startDate = new Date();
            
            for (let i = 1; i <= student.planDuration; i++) {
                const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i - 1, billingDay);
                const isoDate = dueDate.toISOString().split('T')[0];
                
                await SupabaseService.addPayment({
                    studentId: student.id,
                    amount: student.planValue,
                    status: 'PENDING',
                    dueDate: isoDate,
                    description: `Mensalidade ${i}/${student.planDuration}`,
                    installmentNumber: i,
                    totalInstallments: student.planDuration
                });
            }
            
            WhatsAppAutomation.sendPlanSold(student);
            addToast("Plano ativado e faturas geradas!", "success");
        } catch (error: any) {
            console.error("Erro ao gerar pagamentos:", error.message || JSON.stringify(error));
            addToast(`Erro ao gerar pagamentos: ${error.message || JSON.stringify(error)}`, "error");
        } finally {
            await refreshList(); // Ensure list is refreshed after attempt, even if error
            setIsLoading(false);
        }
    };

    const handleSaveUser = async (payload: User) => {
        setIsLoading(true);
        try {
            if (editingUser) {
              await SupabaseService.updateUser(payload); // Use updateUser, not updateStudent
              addToast("Dados do usuário atualizados!", "success");
            } else {
              await SupabaseService.addUser(payload); // Use addUser, not addStudent
              addToast("Novo usuário adicionado com sucesso!", "success");
            }
            
            setShowUserForm(false);
        } catch (error: any) {
            console.error("Erro ao salvar usuário:", error.message || JSON.stringify(error));
            addToast(`Erro ao salvar usuário: ${error.message || JSON.stringify(error)}`, "error");
        } finally {
            refreshList(); // Always refresh to reflect changes or failed attempts
            setIsLoading(false);
        }
    };

    const handleOpenForm = (userToEdit: User | null, tab: 'basic' | 'plan' | 'anamnesis' = 'basic') => {
        setEditingUser(userToEdit);
        if (userToEdit) {
            setInitialFormData({ 
                ...userToEdit, 
                anamnesis: userToEdit.anamnesis || { 
                    hasInjury: false, takesMedication: false, hadSurgery: false, 
                    hasHeartCondition: false, emergencyContactName: '', emergencyContactPhone: '',
                    updatedAt: new Date().toISOString().split('T')[0]
                },
                address: userToEdit.address || { 
                  zipCode: '37810-000', street: '', number: '', complement: '',
                  neighborhood: '', city: 'Guaranésia', state: 'MG' 
                }
            });
        } else {
            setInitialFormData({ 
                name: '', email: '', role: UserRole.STUDENT, // Default role to STUDENT for new users
                planDuration: 12, planValue: 150, billingDay: 5, 
                joinDate: new Date().toISOString().split('T')[0],
                nationality: '', maritalStatus: '', profession: '',
                anamnesis: {
                    hasInjury: false, takesMedication: false, hadSurgery: false, 
                    hasHeartCondition: false, emergencyContactName: '', emergencyContactPhone: '',
                    updatedAt: new Date().toISOString().split('T')[0]
                },
                address: { 
                    zipCode: '37810-000', street: '', number: '', complement: '',
                    neighborhood: '', city: 'Guaranésia', state: 'MG'
                }
            });
        }
        setInitialFormTab(tab);
        setShowUserForm(true);
    };

    const handleCancelForm = () => {
        setShowUserForm(false);
        setEditingUser(null);
        setInitialFormData({});
        setInitialFormTab('basic');
    };

    const getNextDuePayment = (studentId: string): Payment | undefined => {
      // Find all payments for the student, filter by PENDING and sort by dueDate
      const studentPayments = payments.filter(p => p.studentId === studentId && p.status === 'PENDING')
                                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find the next payment that is due within 5 days from today
      const upcomingPayment = studentPayments.find(p => {
        const dueDate = new Date(p.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 5;
      });
      return upcomingPayment;
    };

    const getLatestOverduePayment = (studentId: string): Payment | undefined => {
      // Find all payments for the student, filter by OVERDUE and sort by dueDate descending
      const studentPayments = payments.filter(p => p.studentId === studentId && p.status === 'OVERDUE')
                                    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
      // Return the most recent overdue payment
      return studentPayments[0];
    };

    if (showUserForm) {
        return (
            <UserFormPage
                editingUser={editingUser}
                initialFormData={initialFormData}
                initialActiveTab={initialFormTab}
                onSave={handleSaveUser}
                onCancel={handleCancelForm}
                addToast={addToast}
                currentUserRole={currentUser.role} // Pass the current user's role
            />
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-white">Alunos & Equipe</h2><p className="text-slate-400 text-sm">Gestão de acessos e planos recorrentes.</p></div>
                {/* Button to add new user */}
                {(isAdmin || isTrainer) && ( // Admin/SuperAdmin can add any user, Trainer can add students
                  <button onClick={() => handleOpenForm(null)} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg shadow-brand-500/20">
                      <UserPlus size={16} className="mr-2" /> Novo Usuário
                  </button>
                )}
            </div>

            <div className="bg-dark-950 rounded-2xl border border-dark-800 overflow-hidden overflow-x-auto shadow-2xl">
                <table className="w-full text-left text-sm text-slate-400 min-w-[1000px]">
                    <thead className="bg-dark-900 font-bold uppercase text-[10px] tracking-widest text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Usuário / Papel</th>
                            <th className="px-6 py-4">Status Saúde</th>
                            <th className="px-6 py-4">Financeiro</th>
                            <th className="px-6 py-4 text-center">Contrato</th>
                            <th className="px-6 py-4 text-right">Ações Rápidas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800">
                        {users.map(s => {
                            const isContractDataComplete = !!(s.cpf && s.rg && s.address?.zipCode && s.address?.street);
                            const studentPayments = payments.filter(p => p.studentId === s.id);
                            const hasOverdue = studentPayments.some(p => p.status === 'OVERDUE');
                            const paidCount = studentPayments.filter(p => p.status === 'PAID').length;
                            const totalCount = s.planDuration || 0;
                            const nextDuePayment = getNextDuePayment(s.id);
                            const latestOverduePayment = getLatestOverduePayment(s.id);

                            return (
                                <tr key={s.id} className="hover:bg-dark-900/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={String(s.avatarUrl || `https://ui-avatars.com/api/?name=${String(s.name)}`)} className="w-10 h-10 rounded-full border border-dark-800" />
                                            <div>
                                                <p className="text-white font-bold">{String(s.name)}</p>
                                                <div className="flex items-center gap-2 text-[9px] text-brand-500 font-bold uppercase tracking-tighter">
                                                   <UsersIcon size={10}/> {String(s.role).replace(/_/g, ' ')}
                                                </div>
                                                {s.role === UserRole.STUDENT && s.planValue ? (
                                                  <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                                                    <Repeat size={10}/> R$ {String(s.planValue)} / {String(s.planDuration)} meses
                                                  </div>
                                                ) : s.role === UserRole.STUDENT ? (
                                                  <div className="flex items-center gap-2 text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
                                                    Sem Plano
                                                  </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.role === UserRole.STUDENT && (s.anamnesis?.hasInjury ? (
                                            <span className="text-amber-500 font-bold text-[10px] uppercase flex items-center gap-1"><AlertCircle size={14}/> Lesão</span>
                                        ) : s.anamnesis ? (
                                            <span className="text-emerald-500 font-bold text-[10px] uppercase flex items-center gap-1"><CheckCheck size={14}/> Avaliado</span>
                                        ) : (
                                            <span className="text-slate-600 font-bold text-[10px] uppercase flex items-center gap-1"><AlertCircle size={14}/> Pendente</span>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.role === UserRole.STUDENT && (
                                          <div className="space-y-1">
                                              {hasOverdue ? (
                                                  <span className="text-red-500 font-bold text-[9px] uppercase flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 w-fit"><AlertTriangle size={10}/> Inadimplente</span>
                                              ) : (
                                                  <span className="text-emerald-500 font-bold text-[9px] uppercase flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-red-500/20 w-fit"><CheckCircle2 size={10}/> Em dia</span>
                                              )}
                                              <div className="text-[10px] text-slate-500 font-mono">
                                                  Progresso: {paidCount}/{totalCount} parcelas
                                              </div>
                                          </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {s.role === UserRole.STUDENT && (
                                          <div className="flex justify-center">
                                              <span className={`p-2 rounded-full transition-all ${isContractDataComplete ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-700 bg-dark-800'}`} title={isContractDataComplete ? "Dados de Contrato Completos" : "Dados de Contrato Incompletos"}>
                                                  <FileText size={16}/>
                                              </span>
                                          </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="relative inline-block text-left">
                                           <MenuDropdown>
                                                {/* Edit User: SuperAdmin can edit all. Admin can edit students/trainers. Trainer can edit students. */}
                                                {(isSuperAdmin || (isAdmin && s.role !== UserRole.SUPER_ADMIN) || (isTrainer && s.role === UserRole.STUDENT)) && (
                                                  <MenuItem icon={Edit} onClick={() => handleOpenForm(s)}>
                                                    Editar Usuário
                                                  </MenuItem>
                                                )}
                                                
                                                {/* Manage Contract (Admin only for students) */}
                                                {isAdmin && s.role === UserRole.STUDENT && (
                                                  <MenuItem icon={FileText} onClick={() => handleGenerateContract(s)} disabled={!isContractDataComplete} title={isContractDataComplete ? "" : "Complete CPF, RG e Endereço"}>
                                                    Imprimir Contrato
                                                  </MenuItem>
                                                )}

                                                {/* Generate Recurring Payments (Admin only for students) */}
                                                {isAdmin && s.role === UserRole.STUDENT && (
                                                  <MenuItem icon={Receipt} onClick={() => handleGeneratePayments(s)} disabled={!(s.planValue && s.planDuration)}>
                                                    Gerar Recorrência
                                                  </MenuItem>
                                                )}

                                                {/* Financials (Admin/Trainer for students) */}
                                                {(isAdmin || isTrainer) && s.role === UserRole.STUDENT && (
                                                  <MenuItem icon={DollarSign} onClick={() => onNavigate('FINANCIAL', { studentId: s.id })}>
                                                    Ver Financeiro
                                                  </MenuItem>
                                                )}

                                                {/* Workouts (Admin/Trainer for students) */}
                                                {(isAdmin || isTrainer) && s.role === UserRole.STUDENT && (
                                                  <MenuItem icon={Dumbbell} onClick={() => onNavigate('PERSONAL_WORKOUTS', { studentId: s.id })}>
                                                    Ver Treinos
                                                  </MenuItem>
                                                )}

                                                {/* Assessments (Admin/Trainer for students) */}
                                                {(isAdmin || isTrainer) && s.role === UserRole.STUDENT && (
                                                  <MenuItem icon={Activity} onClick={() => onNavigate('ASSESSMENTS', { studentId: s.id })}>
                                                    Ver Avaliações
                                                  </MenuItem>
                                                )}

                                                {/* Anamnesis (Admin/Trainer for students) */}
                                                {(isAdmin || isTrainer) && s.role === UserRole.STUDENT && (
                                                  <MenuItem icon={Stethoscope} onClick={() => handleOpenForm(s, 'anamnesis')}>
                                                    Editar Anamnese
                                                  </MenuItem>
                                                )}

                                                {/* Send Generic WhatsApp (Admin/Trainer for any user with phone number) */}
                                                {(isAdmin || isTrainer) && s.phoneNumber && (
                                                  <MenuItem icon={Send} onClick={() => setShowWhatsAppModal(s)}>
                                                    Enviar WhatsApp
                                                  </MenuItem>
                                                )}

                                                {/* WhatsApp Reminders (Admin only for students) */}
                                                {isAdmin && s.role === UserRole.STUDENT && latestOverduePayment && (
                                                  <MenuItem icon={AlertTriangle} className="text-red-500" onClick={() => WhatsAppAutomation.sendPaymentReminder(s, latestOverduePayment)}>
                                                    Lembrar Atraso (WhatsApp)
                                                  </MenuItem>
                                                )}
                                                {isAdmin && s.role === UserRole.STUDENT && nextDuePayment && (
                                                  <MenuItem icon={MessageCircle} className="text-amber-500" onClick={() => WhatsAppAutomation.sendPaymentReminder(s, nextDuePayment)}>
                                                    Lembrar Vencimento (WhatsApp)
                                                  </MenuItem>
                                                )}
                                           </MenuDropdown>
                                       </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showWhatsAppModal && (
                <WhatsAppMessageModal 
                    student={showWhatsAppModal}
                    onSend={(student, message) => {
                        WhatsAppAutomation.sendGenericMessage(student, message);
                        addToast(`Mensagem para ${String(student.name).split(' ')[0]} enviada para WhatsApp!`, "success");
                        setShowWhatsAppModal(null);
                    }}
                    onCancel={() => setShowWhatsAppModal(null)}
                />
            )}
        </div>
    );
};

// Dropdown Menu Component
const MenuDropdown: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-dark-800 text-slate-400 rounded-lg hover:text-white transition-colors" title="Mais Ações">
        <MoreVertical size={16} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-dark-900 border border-dark-700 rounded-lg shadow-lg z-10 animate-fade-in-up origin-top-right">
          <div className="py-1">
            {React.Children.map(children, (child: React.ReactElement<any>) => {
                return React.cloneElement(child, { 
                    onClick: (e: React.MouseEvent) => {
                        setIsOpen(false);
                        if (child.props.onClick) {
                            child.props.onClick(e);
                        }
                    }
                });
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Menu Item Component
const MenuItem: React.FC<{ icon: any; children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string; className?: string }> = ({ icon: Icon, children, onClick, disabled, title, className }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-dark-800 transition-colors gap-2 ${disabled ? 'text-slate-600 cursor-not-allowed opacity-50' : 'text-slate-300 hover:text-white'} ${className}`}
    >
      <Icon size={16} />
      <span>{children}</span>
    </button>
  );
};

// WhatsApp Message Modal Component
interface WhatsAppMessageModalProps {
    student: User;
    onSend: (student: User, message: string) => void;
    onCancel: () => void;
}

const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({ student, onSend, onCancel }) => {
    const [message, setMessage] = useState('');
    const { addToast } = useToast();

    const handleSendMessage = () => {
        if (message.trim()) {
            onSend(student, message);
        } else {
            addToast("A mensagem não pode estar vazia.", "info");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
            <div className="bg-dark-900 border border-dark-700 p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full space-y-6">
                <div className="flex justify-between items-center border-b border-dark-800 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageCircle size={20} className="text-brand-500" /> Enviar WhatsApp para {String(student.name).split(' ')[0]}
                    </h3>
                    <button onClick={onCancel} className="text-slate-500 hover:text-white p-2"><X size={24} /></button>
                </div>

                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Mensagem:</label>
                    <textarea
                        className="w-full h-32 bg-dark-950 border border-dark-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-brand-500 outline-none"
                        placeholder="Digite sua mensagem aqui..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    ></textarea>
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t border-dark-800 pt-4">
                    <button type="button" onClick={onCancel} className="px-6 py-3 bg-dark-800 text-white rounded-lg font-bold">Cancelar</button>
                    <button type="submit" onClick={handleSendMessage} className="px-6 py-3 bg-brand-600 text-white rounded-lg font-bold shadow-lg shadow-brand-500/20">
                        <Send size={16} className="inline mr-2" /> Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};