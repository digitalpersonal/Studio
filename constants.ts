

import { UserRole } from './types';

export const APP_NAME = "Studio";
export const INVITE_CODE = "STUDIO2024";

export const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

// Administrador Geral Conforme Solicitado
export const SUPER_ADMIN_CONFIG = {
  id: 'super-admin-01',
  name: 'Administrador Geral',
  email: 'digitalpersonal@gmail.com',
  password: 'Mld3602#?+',
  role: UserRole.SUPER_ADMIN,
  avatarUrl: 'https://ui-avatars.com/api/?name=Digital+Personal&background=000&color=fff',
  joinDate: '2024-01-01'
};

export const MOCK_USER_ADMIN = {
  id: 'admin-1',
  name: 'Treinador Alex',
  email: 'admin@studio.com',
  role: UserRole.ADMIN,
  avatarUrl: 'https://ui-avatars.com/api/?name=Treinador+Alex&background=f97316&color=fff',
  joinDate: '2023-01-01',
  phoneNumber: '5511999999999',
  address: 'Rua do Studio, 100 - Centro, SP'
};

export const WORKOUT_TYPES = ['FUNCIONAL', 'CORRIDA']; // Traduzido
// Os tipos 'FORÇA' e 'MOBILIDADE' foram removidos para evitar inconsistência com o enum 'FUNCTIONAL' e 'RUNNING' na ClassSession
// Se forem necessários, o ClassSession.type deve ser expandido.

// Default for new AcademySettings in SettingsService
export const DEFAULT_REGISTRATION_INVITE_CODE = 'BEMVINDO2024';