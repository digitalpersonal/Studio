
import React, { useState, useEffect, useRef, useContext } from 'react';
import { User, UserRole, Anamnesis, Address } from '../types';
import { ToastContext } from '../App';
import {
  X, Info, HandCoins, Stethoscope, ArrowLeft, Save, MapPin, Eye, EyeOff, ShieldCheck, Camera, FileText
} from 'lucide-react';

interface UserFormPageProps {
  editingUser: User | null;
  initialFormData: Partial<User>;
  onSave: (user: User) => void;
  onCancel: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialActiveTab?: 'basic' | 'plan' | 'anamnesis';
  currentUserRole: UserRole;
}

export const UserFormPage: React.FC<UserFormPageProps> = ({
  editingUser,
  initialFormData,
  onSave,
  onCancel,
  addToast,
  initialActiveTab = 'basic',
  currentUserRole,
}) => {
  const { academySettings } = useContext(ToastContext);
  const defaultFee = academySettings?.monthlyFee || 150;

  const [formData, setFormData] = useState<Partial<User>>(() => ({
    ...initialFormData,
    address: initialFormData.address || {
      zipCode: '', street: '', number: '', complement: '',
      neighborhood: '', city: '', state: ''
    },
    anamnesis: initialFormData.anamnesis || {
      hasInjury: false, takesMedication: false, hadSurgery: false,
      hasHeartCondition: false, emergencyContactName: '', emergencyContactPhone: '',
      updatedAt: new Date().toISOString().split('T')[0]
    },
    planValue: initialFormData.planValue || defaultFee,
    planDuration: initialFormData.planDuration || 12,
    billingDay: initialFormData.billingDay || 5,
    role: initialFormData.role || UserRole.STUDENT,
  }));
  
  const [activeTab, setActiveTab] = useState<'basic' | 'plan' | 'anamnesis'>(initialActiveTab);
  const [showPassword, setShowPassword] = useState(false);

  const isManagement = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.SUPER_ADMIN;

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case UserRole.SUPER_ADMIN: return 'Administrador Geral';
      case UserRole.ADMIN: return 'Administrador';
      case UserRole.TRAINER: return 'Professor / Treinador';
      default: return 'Aluno';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
        addToast("Preencha os campos obrigatórios.", "error");
        return;
    }
    onSave(formData as User);
  };

  return (
    <div className="max-w-4xl mx-auto bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl space-y-6 animate-fade-in mb-20">
      <div className="flex justify-between items-center pb-4 border-b border-dark-800">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 rounded-full transition-colors"><ArrowLeft size={24} /></button>
          <h3 className="text-white font-black text-xl uppercase tracking-tighter">{editingUser ? 'Editar' : 'Novo'} Cadastro</h3>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-white p-2"><X size={24}/></button>
      </div>

      <div className="flex border-b border-dark-800 overflow-x-auto no-scrollbar">
        {[
          { id: 'basic', label: 'Dados Gerais', icon: Info },
          { id: 'plan', label: 'Plano & Financeiro', icon: HandCoins, visible: formData.role === UserRole.STUDENT },
          { id: 'anamnesis', label: 'Saúde', icon: Stethoscope, visible: formData.role === UserRole.STUDENT },
        ].filter(tab => tab.visible === undefined || tab.visible).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[120px] py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === tab.id ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-slate-500'
            }`}
          >
            <tab.icon size={16} /> <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <div className="md:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Nome Completo</label>
                  <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">E-mail</label>
                  <input required type="email" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">WhatsApp</label>
                  <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" placeholder="(35) 99999-9999" value={formData.phoneNumber || ''} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
              </div>
              <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Função / Perfil</label>
                  {isManagement ? (
                    <select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                        <option value={UserRole.STUDENT}>Aluno</option>
                        <option value={UserRole.TRAINER}>Professor / Treinador</option>
                        <option value={UserRole.ADMIN}>Administrador</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-dark-900 border border-dark-800 rounded-xl text-white text-sm font-bold uppercase">{getRoleLabel(formData.role || UserRole.STUDENT)}</div>
                  )}
              </div>
              {!editingUser && (
                <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Senha</label>
                    <div className="relative">
                        <input required type={showPassword ? "text" : "password"} className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-500">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                    </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plan' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Valor Mensal (R$)</label>
                      <input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.planValue || 0} onChange={e => setFormData({...formData, planValue: Number(e.target.value)})} />
                  </div>
                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Dia do Vencimento</label>
                      <input type="number" min="1" max="31" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.billingDay || 5} onChange={e => setFormData({...formData, billingDay: Number(e.target.value)})} />
                  </div>
              </div>
          )}

          <div className="p-6 border-t border-dark-800 flex gap-4 bg-dark-950 rounded-b-2xl">
            <button type="button" onClick={onCancel} className="flex-1 py-4 bg-dark-800 text-white font-bold rounded-xl uppercase text-[10px] tracking-widest">Cancelar</button>
            <button type="submit" className="flex-1 py-4 bg-brand-600 text-white font-bold rounded-xl uppercase text-[10px] tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all"><Save size={16} className="inline mr-2" /> Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};
