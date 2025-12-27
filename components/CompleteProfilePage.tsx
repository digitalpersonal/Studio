

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
  const handleSaveProfile = async (formData: User) => {
    try {
      const payload: User = {
        ...formData,
        profileCompleted: true, // Mark profile as complete
      };
      const updatedUser = await SupabaseService.updateUser(payload);
      addToast("Seu perfil foi completado com sucesso! Bem-vindo(a) de volta!", "success");
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
      hasInjury: false, takesMedication: false, hadSurgery: false,
      hasHeartCondition: false, emergencyContactName: '', emergencyContactPhone: '',
      updatedAt: new Date().toISOString().split('T')[0]
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
          Bem-vindo(a) ao Studio! Para começar, precisamos de mais algumas informações. Isso nos ajuda a oferecer o melhor serviço e personalizar seus treinos.
        </p>
      </header>

      {/* UserFormPage is used here to handle the profile completion */}
      <UserFormPage
        editingUser={currentUser} // Pass the current user as the one being edited
        initialFormData={initialFormData} // Pre-fill with existing data
        onSave={handleSaveProfile}
        onCancel={() => {
          // This button won't exist in the CompleteProfilePage context if it's mandatory.
          // If it were optional, we would navigate to Dashboard.
          // For now, it's mandatory, so no direct "cancel" to bypass.
          addToast("Por favor, complete seu perfil para acessar o aplicativo.", "info");
        }}
        addToast={addToast}
        initialActiveTab="basic" // Start on the basic info tab
        currentUserRole={currentUser.role} // Pass the user's own role
      />
    </div>
  );
};