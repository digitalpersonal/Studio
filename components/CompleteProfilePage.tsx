
import React, { useContext } from 'react';
import { User, UserRole, Address, Anamnesis } from '../types';
import { UserFormPage } from './UserFormPage';
import { useToast, ToastContext } from '../App';
import { SupabaseService } from '../services/supabaseService';
import { Award } from 'lucide-react';

interface CompleteProfilePageProps {
  currentUser: User;
  onProfileComplete: (updatedUser: User) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const CompleteProfilePage: React.FC<CompleteProfilePageProps> = ({
  currentUser,
  onProfileComplete,
  addToast,
}) => {
  const { academySettings } = useContext(ToastContext);
  const defaultFee = academySettings?.monthlyFee || 150;

  const handleSaveProfile = async (formData: User) => {
    try {
      const payload: User = {
        ...formData,
        profileCompleted: true, 
      };
      const updatedUser = await SupabaseService.updateUser(payload);
      addToast("Seu perfil foi completado com sucesso! Bem-vindo(a) de volta!", "success");
      onProfileComplete(updatedUser); 
    } catch (error: any) {
      addToast(`Erro ao salvar seu perfil.`, "error");
    }
  };

  const initialFormData: Partial<User> = {
    ...currentUser,
    address: currentUser.address || {
      zipCode: '', street: '', number: '', complement: '',
      neighborhood: '', city: '', state: ''
    },
    anamnesis: currentUser.anamnesis || {
      hasInjury: false, takesMedication: false, hadSurgery: false,
      hasHeartCondition: false, emergencyContactName: '', emergencyContactPhone: '',
      updatedAt: new Date().toISOString().split('T')[0]
    },
    name: currentUser.name || '',
    email: currentUser.email || '',
    phoneNumber: currentUser.phoneNumber || '',
    cpf: currentUser.cpf || '',
    rg: currentUser.rg || '',
    nationality: currentUser.nationality || '',
    maritalStatus: currentUser.maritalStatus || '',
    profession: currentUser.profession || '',
    planValue: currentUser.planValue !== undefined ? currentUser.planValue : defaultFee,
    planDuration: currentUser.planDuration !== undefined ? currentUser.planDuration : 12,
    billingDay: currentUser.billingDay !== undefined ? currentUser.billingDay : 5,
  };


  return (
    <div className="space-y-6 animate-fade-in pt-8">
      <header className="text-center mb-8">
        <h2 className="text-3xl font-black text-white flex items-center justify-center gap-3">
          <Award size={32} className="text-brand-500" /> Complete seu Perfil!
        </h2>
        <p className="text-slate-400 text-base mt-2 max-w-lg mx-auto">
          Para começar, precisamos de mais algumas informações para personalizar seus treinos e gerar seu contrato.
        </p>
      </header>

      <UserFormPage
        editingUser={currentUser}
        initialFormData={initialFormData}
        onSave={handleSaveProfile}
        onCancel={() => {
          addToast("Por favor, complete seu perfil para acessar o aplicativo.", "info");
        }}
        addToast={addToast}
        initialActiveTab="basic"
        currentUserRole={currentUser.role}
      />
    </div>
  );
};
