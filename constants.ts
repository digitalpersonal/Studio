
import { UserRole } from './types';

export const APP_NAME = "Studio";
export const INVITE_CODE = "STUDIO2024";

export const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

// Configuração do Administrador Geral
// Alterado ID para ser uma string simples compatível com a nova estrutura TEXT do banco
export const SUPER_ADMIN_CONFIG = {
  id: 'super-admin-primary',
  name: 'Administrador Geral',
  email: 'digitalpersonal@gmail.com',
  password: 'Mld3602#?+',
  role: UserRole.SUPER_ADMIN,
  avatarUrl: 'https://ui-avatars.com/api/?name=Digital+Personal&background=000&color=fff',
  joinDate: '2024-01-01'
};

export const WORKOUT_TYPES = ['FUNCIONAL', 'CORRIDA'];
export const DEFAULT_REGISTRATION_INVITE_CODE = 'BEMVINDO2024';
