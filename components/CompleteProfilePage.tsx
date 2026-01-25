import React from 'react';
import { User, UserRole, Address, Anamnesis } from '../types';
import { UserFormPage } from './UserFormPage';
import { useToast } from '../App';
import { SupabaseService } from '../services/supabaseService';
import { Award } from 'lucide-react'; // Example icon for header

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
        profileCompleted: true, // Mark profile as complete
      };
      
      const updatedUser = await SupabaseService.updateUser(payload);
      
      // The logic to create payments is now centralized in ManageUsersPage's onSave,
      // which is what this component's onSave prop calls. We just need to pass the flag.
      if (wasPlanNewlyAssigned) {
          addToast(`Seu plano foi ativado e as faturas geradas!`, "info");
      }

      addToast("Seu perfil foi completado com sucesso! Bem-vindo(a)!", "success");
      onProfileComplete(updatedUser); // Update global user state and navigate to Dashboard
    } catch (error: any) {
      console.error("Erro ao completar perfil:", error.message || JSON.stringify(error));
      addToast(`Erro ao salvar seu perfil: ${error.message || JSON.stringify(error)}`, "error");
    }
  };

  // Ensure initial form data has default objects for nested properties if missing
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
    // Ensure basic profile fields like name, email, phone are pre-filled
    name: currentUser.name || '',
    email: currentUser.email || '',
    phoneNumber: currentUser.phoneNumber || '',
    // Add other fields that might be missing and are required for contract/plan
    cpf: currentUser.cpf || '',
    rg: currentUser.rg || '',
    nationality: currentUser.nationality || '',
    maritalStatus: currentUser.maritalStatus || '',
    profession: currentUser.profession || '',
    planValue: currentUser.planValue !== undefined ? currentUser.planValue : 150, // Default for new student
    planDuration: currentUser.planDuration !== undefined ? currentUser.planDuration : 12, // Default for new student
    billingDay: currentUser.billingDay !== undefined ? currentUser.billingDay : 5, // Default for new student
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

      {/* UserFormPage is used here to handle the profile completion */}
      <UserFormPage
        editingUser={currentUser} // Pass the current user as the one being edited
        initialFormData={initialFormData} // Pre-fill with existing data
        onSave={handleSaveProfile}
        onCancel={() => {
          // This button won't exist in the CompleteProfilePage context if it's mandatory.
          addToast("Por favor, complete seu perfil para acessar o aplicativo.", "info");
        }}
        addToast={addToast}
        initialActiveTab="basic" // Start on the basic info tab
        currentUserRole={currentUser.role} // Pass the user's own role
        isCompletingProfile={true} // Specify this is the profile completion flow
      />
    </div>
  );
};