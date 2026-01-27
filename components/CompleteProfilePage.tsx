import React from 'react';
import { User, UserRole, Address, Anamnesis } from '../types';
import { UserFormPage } from './UserFormPage';
import { useToast } from '../App';
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
  const handleSaveProfile = async (formData: User, wasPlanNewlyAssigned?: boolean) => {
    try {
      const payload: User = {
        ...formData,
        profileCompleted: true,
      };
      
      const updatedUser = await SupabaseService.updateUser(payload);
      
      if (wasPlanNewlyAssigned) {
          addToast(`Seu plano foi ativado e as faturas geradas!`, "info");
      }

      addToast("Seu perfil foi completado com sucesso! Bem-vindo(a)!", "success");
      onProfileComplete(updatedUser);
    } catch (error: any) {
      console.error("Erro ao completar perfil:", error);
      
      if (error.message?.includes('users_email_key') || error.code === '23505') {
          addToast("Este e-mail já está sendo usado por outra conta. Escolha outro e-mail.", "error");
      } else {
          addToast(`Erro ao salvar seu perfil: ${error.message || 'Verifique sua conexão.'}`, "error");
      }
    }
  };

  const initialFormData: Partial<User> = {
    ...currentUser,
    address: currentUser.address || {
      zipCode: '', street: '', number: '', complement: '',
      neighborhood: '', city: '', state: ''
    },
    anamnesis: currentUser.anamnesis || {
      hasMedicalCondition: false, medicalConditionDescription: '',
      hasRecentSurgeryOrInjury: false, recentSurgeryOrInjuryDetails: '',
      takesMedication: false, medicationDescription: '',
      hasAllergies: false, allergiesDescription: '',
      recentExamsResults: '',
      mainGoal: '', trainingFrequency: '3-4x', activityLevel: 'MODERATE',
      trainingExperience: '', availableEquipment: '', preferredTrainingTimes: '',
      smokesOrDrinks: false, smokingDrinkingFrequency: '',
      sleepQuality: '', currentDiet: '', bodyMeasurements: '',
      emergencyContactName: '', emergencyContactPhone: '',
      updatedAt: new Date().toISOString().split('T')[0],
    },
    name: currentUser.name || '',
    email: currentUser.email || '',
    phoneNumber: currentUser.phoneNumber || '',
    cpf: currentUser.cpf || '',
    rg: currentUser.rg || '',
    nationality: currentUser.nationality || '',
    maritalStatus: currentUser.maritalStatus || '',
    profession: currentUser.profession || '',
    planValue: currentUser.planValue !== undefined ? currentUser.planValue : 150,
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
          Bem-vindo(a) ao Studio! Para garantir sua segurança, formalizar nosso contrato e personalizar sua jornada de treinos, precisamos que complete seu cadastro. É rapidinho e fundamental para começarmos com tudo!
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
        isCompletingProfile={true}
      />
    </div>
  );
};