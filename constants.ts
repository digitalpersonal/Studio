
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

export const WORKOUT_TYPES = ['FUNCTIONAL', 'RUNNING'];
export const DEFAULT_REGISTRATION_INVITE_CODE = 'BEMVINDO2024';

export const RUNNING_CYCLE_METHODOLOGY: { [week: number]: Partial<any> } = {
  1: {
    weekFocus: 'Base Aeróbica',
    estimatedVolumeMinutes: 20,
    weekObjective: 'Adaptação e construção de base cardiovascular.',
    referenceWorkouts: 'Corrida leve, trote progressivo, intervalados leves (ex: 4x 400m leve com 1\' de descanso).',
  },
  2: {
    weekFocus: 'Velocidade',
    estimatedVolumeMinutes: 25,
    weekObjective: 'Melhora de pace e estímulo neuromuscular para velocidade.',
    referenceWorkouts: 'Tiros curtos (ex: 8x 200m forte com 1\' de descanso), progressivo, contínuo moderado.',
  },
  3: {
    weekFocus: 'Ritmo',
    estimatedVolumeMinutes: 28,
    weekObjective: 'Desenvolver constância e controle de ritmo de prova.',
    referenceWorkouts: 'Treino de ritmo alvo (ex: 3km em pace de prova), tiros médios (ex: 3x 1km em pace alvo), contínuo.',
  },
  4: {
    weekFocus: 'Pico + Teste',
    estimatedVolumeMinutes: 24,
    weekObjective: 'Avaliação final do ciclo e aplicação do pico de performance.',
    mainWorkout: 'Teste de corrida na distância alvo (ex: Teste de 3km ou 5km para tempo).',
  }
};