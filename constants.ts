
import { UserRole } from './types';

export const APP_NAME = "Studio";
export const INVITE_CODE = "STUDIO2024";

export const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

// Administradores de Sistema (Safe Entry Points)
export const SYSTEM_ADMINS = [
  {
    id: 'super-admin-01',
    name: 'Digital Personal',
    email: 'digitalpersonal@gmail.com',
    password: 'Mld3602#?+',
    role: UserRole.SUPER_ADMIN,
    avatarUrl: 'https://ui-avatars.com/api/?name=Digital+Personal&background=000&color=fff',
    joinDate: '2024-01-01',
    profileCompleted: true
  },
  {
    id: 'admin-rosinaldo',
    name: 'Rosinaldo Admin',
    email: 'rosinaldo@studio.com.br',
    password: 'Mld3602#?+', // Assumindo a mesma base de senha conforme sua indicação
    role: UserRole.ADMIN,
    avatarUrl: 'https://ui-avatars.com/api/?name=Rosinaldo+Admin&background=1e293b&color=fff',
    joinDate: '2024-01-01',
    profileCompleted: true
  }
];

// Fallback para compatibilidade com código antigo que referenciava SUPER_ADMIN_CONFIG
export const SUPER_ADMIN_CONFIG = SYSTEM_ADMINS[0];

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

export const WORKOUT_TYPES = ['FUNCIONAL', 'CORRIDA'];
export const DEFAULT_REGISTRATION_INVITE_CODE = 'BEMVINDO2024';
