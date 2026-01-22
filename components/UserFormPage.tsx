
import React, { useState, useEffect, useRef, useContext } from 'react';
import { User, UserRole, Anamnesis, Address } from '../types';
import { ToastContext } from '../App';
import {
  X, Info, Repeat, Stethoscope, HandCoins, ArrowLeft, Save, MapPin, Calendar, Eye, EyeOff, ShieldCheck, Camera, FileText
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
    planValue: initialFormData.planValue !== undefined ? initialFormData.planValue : defaultFee,
    planDuration: initialFormData.planDuration !== undefined ? initialFormData.planDuration : 12,
    billingDay: initialFormData.billingDay !== undefined ? initialFormData.billingDay : 5,
    planStartDate: initialFormData.planStartDate || new Date().toISOString().split('T')[0],
  }));
  
  const [activeTab, setActiveTab] = useState<'basic' | 'plan' | 'anamnesis'>(initialActiveTab);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = currentUserRole === UserRole.SUPER_ADMIN;

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...initialFormData,
      planValue: initialFormData.planValue !== undefined ? initialFormData.planValue : (prev.planValue || defaultFee)
    }));
    setActiveTab(initialActiveTab);
  }, [initialFormData, initialActiveTab, defaultFee]);

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case UserRole.SUPER_ADMIN: return 'Administrador Geral';
      case UserRole.ADMIN: return 'Administrador';
      case UserRole.TRAINER: return 'Professor / Treinador';
      default: return 'Aluno';
    }
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.4)); 
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      role: isSuperAdmin ? (formData.role || UserRole.STUDENT) : UserRole.STUDENT,
      avatarUrl: formData.avatarUrl || `https://ui-avatars.com/api/?name=${String(formData.name)}`,
      profileCompleted: formData.role === UserRole.STUDENT ? true : formData.profileCompleted
    } as User;
    onSave(payload);
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setFormData(prev => ({ ...prev, address: { ...(prev.address as Address), [field]: value } }));
  };

  const handleAnamnesisChange = (field: keyof Anamnesis, value: string | boolean) => {
    setFormData(prev => ({ ...prev, anamnesis: { ...(prev.anamnesis as Anamnesis), [field]: value, updatedAt: new Date().toISOString().split('T')[0] } }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
          const compressed = await compressImage(reader.result as string);
          handleAnamnesisChange('medicalCertificateUrl', compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-dark-950 p-8 rounded-[2.5rem] border border-dark-800 shadow-2xl space-y-6 animate-fade-in mb-20">
      <div className="flex justify-between items-center pb-4 border-b border-dark-800">
        <div className="flex items-center gap-3">
          {editingUser && editingUser.profileCompleted !== false && (
             <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 rounded-full transition-colors"><ArrowLeft size={24} /></button>
          )}
          <h3 className="text-white font-black text-xl uppercase tracking-tighter">{editingUser ? 'Editar' : 'Novo'} Cadastro</h3>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-white p-2"><X size={24}/></button>
      </div>

      <div className="flex border-b border-dark-800 overflow-x-auto no-scrollbar">
        {[
          { id: 'basic', label: 'Dados Pessoais', icon: Info },
          { id: 'plan', label: 'Plano Financeiro', icon: HandCoins, visible: formData.role === UserRole.STUDENT || !isSuperAdmin },
          { id: 'anamnesis', label: 'Saúde & Ficha', icon: Stethoscope, visible: formData.role === UserRole.STUDENT || !isSuperAdmin },
        ].filter(tab => tab.visible === undefined || tab.visible).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[120px] py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === tab.id ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            <tab.icon size={16} /> <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6 max-h-[60vh]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {(activeTab === 'basic') && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Nome Completo</label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">E-mail</label><input required type="email" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">WhatsApp</label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" placeholder="(00) 00000-0000" value={formData.phoneNumber || ''} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} /></div>
                  
                  {!editingUser && (
                      <div className="relative group">
                          <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Senha de Acesso</label>
                          <div className="relative">
                              <input required type={showPassword ? "text" : "password"} className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none pr-12" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                          </div>
                      </div>
                  )}

                  <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Função / Nível de Acesso</label>
                      {isSuperAdmin ? (
                        <select 
                          required 
                          className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none text-sm font-bold" 
                          value={formData.role || UserRole.STUDENT} 
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        >
                            {Object.values(UserRole).map(role => (
                              <option key={role} value={role}>{getRoleLabel(role as UserRole)}</option>
                            ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-3 bg-dark-900/50 border border-dark-800 rounded-xl p-3">
                          <ShieldCheck size={18} className="text-brand-500" />
                          <span className="text-white text-sm font-bold uppercase">{getRoleLabel(formData.role || UserRole.STUDENT)}</span>
                        </div>
                      )}
                  </div>

                  {(formData.role === UserRole.STUDENT || !isSuperAdmin) && (
                    <>
                      <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CPF</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} /></div>
                      <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">RG</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.rg || ''} onChange={e => setFormData({...formData, rg: e.target.value})} /></div>
                    </>
                  )}
              </div>

              {(formData.role === UserRole.STUDENT || !isSuperAdmin) && (
                <div className="space-y-4 pt-4 border-t border-dark-800">
                  <h4 className="text-white font-bold text-sm flex items-center gap-2"><MapPin size={18} className="text-brand-500"/> Endereço Completo</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Logradouro</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.address?.street || ''} onChange={e => handleAddressChange('street', e.target.value)} /></div>
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Número</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.address?.number || ''} onChange={e => handleAddressChange('number', e.target.value)} /></div>
                    <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">CEP</label><input className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.address?.zipCode || ''} onChange={e => handleAddressChange('zipCode', e.target.value)} /></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plan' && (formData.role === UserRole.STUDENT || !isSuperAdmin) && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-brand-500/5 p-6 rounded-3xl border border-brand-500/10">
                <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><HandCoins size={18} className="text-brand-500" /> Configuração do Aluno</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Mensalidade (R$)</label><input type="number" className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white font-bold" value={formData.planValue || 0} onChange={(e) => setFormData({ ...formData, planValue: Number(e.target.value) })} /></div>
                  <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Duração (Meses)</label><select className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white text-sm" value={formData.planDuration || 12} onChange={(e) => setFormData({ ...formData, planDuration: Number(e.target.value) })}>{[1, 3, 6, 12, 24].map((m) => (<option key={m} value={m}>{m} meses</option>))}</select></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'anamnesis' && (formData.role === UserRole.STUDENT || !isSuperAdmin) && (
            <div className="space-y-6 animate-fade-in">
              <h4 className="text-white font-bold text-sm flex items-center gap-2"><Stethoscope size={18} className="text-brand-500" /> Histórico de Saúde</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <HealthToggle label="Possui lesão?" checked={formData.anamnesis?.hasInjury || false} onChange={v => handleAnamnesisChange('hasInjury', v)} description={formData.anamnesis?.injuryDescription} onDescChange={v => handleAnamnesisChange('injuryDescription', v)} />
                  <HealthToggle label="Usa medicação?" checked={formData.anamnesis?.takesMedication || false} onChange={v => handleAnamnesisChange('takesMedication', v)} description={formData.anamnesis?.medicationDescription} onDescChange={v => handleAnamnesisChange('medicationDescription', v)} />
                  <HealthToggle label="Fez cirurgia?" checked={formData.anamnesis?.hadSurgery || false} onChange={v => handleAnamnesisChange('hadSurgery', v)} description={formData.anamnesis?.surgeryDescription} onDescChange={v => handleAnamnesisChange('surgeryDescription', v)} />
                  <HealthToggle label="Problema cardíaco?" checked={formData.anamnesis?.hasHeartCondition || false} onChange={v => handleAnamnesisChange('hasHeartCondition', v)} description={formData.anamnesis?.heartConditionDescription} onDescChange={v => handleAnamnesisChange('heartConditionDescription', v)} />
              </div>
              <div className="pt-6 border-t border-dark-800 space-y-4">
                  <h4 className="text-white font-bold text-sm flex items-center gap-2"><FileText size={18} className="text-brand-500" /> Atestado Médico</h4>
                  {formData.anamnesis?.medicalCertificateUrl ? (
                      <div className="space-y-3">
                          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Documento Anexado</p>
                          <div className="relative rounded-2xl overflow-hidden border-2 border-dark-800 max-w-sm group">
                              <img src={formData.anamnesis.medicalCertificateUrl} className="w-full h-auto" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button type="button" onClick={() => handleAnamnesisChange('medicalCertificateUrl', '')} className="p-3 bg-red-500 text-white rounded-full"><X size={20}/></button>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-10 border-2 border-dashed border-dark-800 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-brand-500 transition-all">
                          <Camera size={32} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Anexar ou Tirar Foto do Atestado</span>
                      </button>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-dark-800">
                <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Contato de Emergência (Nome)</label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.anamnesis?.emergencyContactName || ''} onChange={e => handleAnamnesisChange('emergencyContactName', e.target.value)} /></div>
                <div><label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Telefone de Emergência</label><input required className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={formData.anamnesis?.emergencyContactPhone || ''} onChange={e => handleAnamnesisChange('emergencyContactPhone', e.target.value)} /></div>
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="p-6 border-t border-dark-800 flex gap-4 bg-dark-950 rounded-b-2xl -mx-8 -mb-8">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-dark-800 text-white font-bold rounded-xl uppercase text-[10px] tracking-widest hover:text-white">Cancelar</button>
        <button onClick={handleSubmit} className="flex-1 py-4 bg-brand-600 text-white font-bold rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-brand-600/20 hover:bg-brand-500"><Save size={16} className="inline mr-2" /> Salvar Cadastro</button>
      </div>
    </div>
  );
};

const HealthToggle = ({ label, checked, onChange, description, onDescChange }: { label: string, checked: boolean, onChange: (v: boolean) => void, description?: string, onDescChange: (v: string) => void }) => (
    <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer group bg-dark-900 p-4 rounded-xl border border-dark-800">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 accent-brand-500" />
            <span className="text-slate-300 text-sm font-bold">{label}</span>
        </label>
        {checked && (
            <textarea placeholder="Descrição..." className="w-full h-20 bg-dark-950 border border-dark-700 rounded-xl p-3 text-xs text-white focus:border-brand-500 outline-none resize-none animate-fade-in" value={description || ''} onChange={e => onDescChange(e.target.value)} />
        )}
    </div>
);
