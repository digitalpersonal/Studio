
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Anamnesis, Address } from '../types';
import {
  X, Info, Repeat, Stethoscope, HandCoins, ArrowLeft, Save, MapPin
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
    // Ensure default values for plan related fields if they are undefined
    planValue: initialFormData.planValue !== undefined ? initialFormData.planValue : 150,
    planDuration: initialFormData.planDuration !== undefined ? initialFormData.planDuration : 12,
    billingDay: initialFormData.billingDay !== undefined ? initialFormData.billingDay : 5,
  }));
  const [activeTab, setActiveTab] = useState<'basic' | 'plan' | 'anamnesis'>(initialActiveTab);
  const formContentRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = currentUserRole === UserRole.SUPER_ADMIN;

  useEffect(() => {
    setFormData(() => ({
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
      planValue: initialFormData.planValue !== undefined ? initialFormData.planValue : 150,
      planDuration: initialFormData.planDuration !== undefined ? initialFormData.planDuration : 12,
      billingDay: initialFormData.billingDay !== undefined ? initialFormData.billingDay : 5,
    }));
    setActiveTab(initialActiveTab);
  }, [initialFormData, initialActiveTab]);

  useEffect(() => {
    if (formContentRef.current) {
      formContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      role: formData.role || UserRole.STUDENT,
      avatarUrl: formData.avatarUrl || `https://ui-avatars.com/api/?name=${String(formData.name)}`,
      // Ensure profileCompleted is true if it's being saved through this form, unless it's a new user by Admin
      profileCompleted: formData.role === UserRole.STUDENT ? true : formData.profileCompleted // If student, assume completion
    } as User;
    onSave(payload);
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...(prev.address as Address),
        [field]: value
      }
    }));
  };

  const handleAnamnesisChange = (field: keyof Anamnesis, value: string | boolean) => {
    setFormData(prev => ({
        ...prev,
        anamnesis: {
            ...(prev.anamnesis as Anamnesis),
            [field]: value,
            updatedAt: new Date().toISOString().split('T')[0],
        }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-dark-950 p-8 rounded-3xl border border-dark-800 shadow-xl space-y-6 animate-fade-in">
      <div className="flex justify-between items-center pb-4 border-b border-dark-800">
        <div className="flex items-center gap-3">
          {/* Only show back button if not a new user or mandatory profile completion */}
          {editingUser && editingUser.profileCompleted !== false && (
             <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 rounded-full transition-colors">
               <ArrowLeft size={24} />
             </button>
          )}
          <h3 className="text-white font-bold text-xl">{editingUser ? 'Editar' : 'Novo'} Usuário</h3>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-white p-2"><X size={24}/></button>
      </div>

      <div className="flex border-b border-dark-800">
        {[
          { id: 'basic', label: 'Básico', icon: Info },
          { id: 'plan', label: 'Plano / Recorrência', icon: Repeat, visible: formData.role === UserRole.STUDENT },
          { id: 'anamnesis', label: 'Saúde', icon: Stethoscope, visible: formData.role === UserRole.STUDENT },
        ].filter(tab => tab.visible === undefined || tab.visible).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-500 bg-brand-500/5'
                : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div ref={formContentRef} className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6 max-h-[60vh]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {(activeTab === 'basic') && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Nome Completo</label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.name || '')} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">E-mail</label><input required type="email" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.email || '')} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">WhatsApp</label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" placeholder="(00) 00000-0000" value={String(formData.phoneNumber || '')} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} /></div>
                  {/* Password field only if editing a new user or if it's explicitly part of the form data to be changed */}
                  {!editingUser && ( // Only show password field when creating a new user
                      <div>
                          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Senha</label>
                          <input required type="password" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.password || '')} onChange={e => setFormData({...formData, password: e.target.value})} />
                      </div>
                  )}

                  {isSuperAdmin && (
                    <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Papel (Role)</label>
                        <select
                          required
                          className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                          value={String(formData.role || UserRole.STUDENT)}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        >
                          {Object.values(UserRole).map(role => (
                            <option key={role} value={role}>
                              {String(role).replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                    </div>
                  )}

                  {formData.role === UserRole.STUDENT && (
                    <>
                      <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CPF</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.cpf || '')} onChange={e => setFormData({...formData, cpf: e.target.value})} /></div>
                      <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">RG</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.rg || '')} onChange={e => setFormData({...formData, rg: e.target.value})} /></div>
                      <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Nacionalidade</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.nationality || '')} onChange={e => setFormData({...formData, nationality: e.target.value})} /></div>
                      <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Estado Civil</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.maritalStatus || '')} onChange={e => setFormData({...formData, maritalStatus: e.target.value})} /></div>
                      <div className="sm:col-span-2"><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Profissão</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.profession || '')} onChange={e => setFormData({...formData, profession: e.target.value})} /></div>
                    </>
                  )}
              </div>

              {formData.role === UserRole.STUDENT && (
                <div className="space-y-4 pt-4 border-t border-dark-800">
                  <h4 className="text-white font-bold text-sm flex items-center gap-2"><MapPin size={18} className="text-brand-500"/> Endereço Completo</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CEP</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.address?.zipCode || '')} onChange={e => handleAddressChange('zipCode', e.target.value)} /></div>
                    <div className="sm:col-span-2"><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Rua / Avenida</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.address?.street || '')} onChange={e => handleAddressChange('street', e.target.value)} /></div>
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Número</label><input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.address?.number || '')} onChange={e => handleAddressChange('number', e.target.value)} /></div>
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Complemento</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.address?.complement || '')} onChange={e => handleAddressChange('complement', e.target.value)} /></div>
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Bairro</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.address?.neighborhood || '')} onChange={e => handleAddressChange('neighborhood', e.target.value)} /></div>
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Cidade</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.address?.city || '')} onChange={e => handleAddressChange('city', e.target.value)} /></div>
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Estado</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.address?.state || '')} onChange={e => handleAddressChange('state', e.target.value)} /></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plan' && formData.role === UserRole.STUDENT && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-brand-500/5 p-6 rounded-2xl border border-brand-500/10">
                <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                  <HandCoins size={18} className="text-brand-500" /> Configuração do Plano Recorrente
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Mensalidade (R$)</label>
                    <input
                      type="number"
                      className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold"
                      value={String(formData.planValue || 0)}
                      onChange={(e) => setFormData({ ...formData, planValue: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Duração (Meses)</label>
                    <select
                      className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white"
                      value={String(formData.planDuration || 12)}
                      onChange={(e) => setFormData({ ...formData, planDuration: Number(e.target.value) })}
                    >
                      {[1, 3, 6, 12, 24].map((m) => (
                        <option key={m} value={m}>
                          {m} meses
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Dia Vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white"
                      value={String(formData.billingDay || 5)}
                      onChange={(e) => setFormData({ ...formData, billingDay: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'anamnesis' && formData.role === UserRole.STUDENT && (
            <div className="space-y-4 animate-fade-in">
              <label className="flex items-center gap-3 cursor-pointer group bg-dark-900 p-4 rounded-xl border border-dark-800">
                <input
                  type="checkbox"
                  checked={formData.anamnesis?.hasInjury || false}
                  onChange={(e) => handleAnamnesisChange('hasInjury', e.target.checked)}
                  className="w-5 h-5 accent-brand-500"
                />
                <span className="text-slate-300 text-sm">Possui alguma lesão ou restrição médica?</span>
              </label>
              {formData.anamnesis?.hasInjury && (
                <textarea
                  placeholder="Descreva a lesão ou restrição..."
                  className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none"
                  value={String(formData.anamnesis?.injuryDescription || '')}
                  onChange={(e) => handleAnamnesisChange('injuryDescription', e.target.value)}
                />
              )}

              <label className="flex items-center gap-3 cursor-pointer group bg-dark-900 p-4 rounded-xl border border-dark-800">
                <input
                  type="checkbox"
                  checked={formData.anamnesis?.takesMedication || false}
                  onChange={(e) => handleAnamnesisChange('takesMedication', e.target.checked)}
                  className="w-5 h-5 accent-brand-500"
                />
                <span className="text-slate-300 text-sm">Toma alguma medicação regularmente?</span>
              </label>
              {formData.anamnesis?.takesMedication && (
                <textarea
                  placeholder="Descreva a medicação..."
                  className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none"
                  value={String(formData.anamnesis?.medicationDescription || '')}
                  onChange={(e) => handleAnamnesisChange('medicationDescription', e.target.value)}
                />
              )}

              <label className="flex items-center gap-3 cursor-pointer group bg-dark-900 p-4 rounded-xl border border-dark-800">
                <input
                  type="checkbox"
                  checked={formData.anamnesis?.hadSurgery || false}
                  onChange={(e) => handleAnamnesisChange('hadSurgery', e.target.checked)}
                  className="w-5 h-5 accent-brand-500"
                />
                <span className="text-slate-300 text-sm">Já realizou alguma cirurgia?</span>
              </label>
              {formData.anamnesis?.hadSurgery && (
                <textarea
                  placeholder="Descreva a(s) cirurgia(s)..."
                  className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none"
                  value={String(formData.anamnesis?.surgeryDescription || '')}
                  onChange={(e) => handleAnamnesisChange('surgeryDescription', e.target.value)}
                />
              )}

              <label className="flex items-center gap-3 cursor-pointer group bg-dark-900 p-4 rounded-xl border border-dark-800">
                <input
                  type="checkbox"
                  checked={formData.anamnesis?.hasHeartCondition || false}
                  onChange={(e) => handleAnamnesisChange('hasHeartCondition', e.target.checked)}
                  className="w-5 h-5 accent-brand-500"
                />
                <span className="text-slate-300 text-sm">Possui alguma condição cardíaca?</span>
              </label>
              {formData.anamnesis?.hasHeartCondition && (
                <textarea
                  placeholder="Descreva a condição cardíaca..."
                  className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none"
                  value={String(formData.anamnesis?.heartConditionDescription || '')}
                  onChange={(e) => handleAnamnesisChange('heartConditionDescription', e.target.value)}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Nome Contato de Emergência</label>
                  <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.anamnesis?.emergencyContactName || '')} onChange={e => handleAnamnesisChange('emergencyContactName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Telefone Contato de Emergência</label>
                  <input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.anamnesis?.emergencyContactPhone || '')} onChange={e => handleAnamnesisChange('emergencyContactPhone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Tipo Sanguíneo</label>
                <input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={String(formData.anamnesis?.bloodType || '')} onChange={e => handleAnamnesisChange('bloodType', e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Outras Observações de Saúde</label>
                <textarea
                  placeholder="Notas gerais sobre a saúde do aluno..."
                  className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none"
                  value={String(formData.anamnesis?.notes || '')}
                  onChange={(e) => handleAnamnesisChange('notes', e.target.value)}
                />
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="p-6 border-t border-dark-800 flex gap-4 bg-dark-950 rounded-b-2xl -mx-8 -mb-8">
        <button
          type="button"
          onClick={onCancel} // This will be handled by CompleteProfilePage or ManageUsersPage
          className="flex-1 py-4 bg-dark-800 text-white font-bold rounded-xl uppercase text-[10px] tracking-widest"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-4 bg-brand-600 text-white font-bold rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-brand-600/20"
        >
          <Save size={16} className="inline mr-2" /> Salvar Dados
        </button>
      </div>
    </div>
  );
};