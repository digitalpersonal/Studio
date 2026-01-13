
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // Administrador Geral
  ADMIN = 'ADMIN',             // Administrador
  TRAINER = 'TRAINER',         // Treinador
  STUDENT = 'STUDENT'          // Aluno
}

export interface Anamnesis {
  hasInjury: boolean;
  injuryDescription?: string;
  takesMedication: boolean;
  medicationDescription?: string;
  hadSurgery: boolean;
  surgeryDescription?: string;
  hasHeartCondition: boolean;
  heartConditionDescription?: string; 
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodType?: string;
  notes?: string;
  updatedAt: string;
}

export interface Address {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatarUrl?: string;
  joinDate: string;
  phoneNumber?: string;
  birthDate?: string;
  
  // Contrato e Documentos
  cpf?: string;
  rg?: string;
  nationality?: string; 
  maritalStatus?: string; 
  profession?: string; 
  address?: Address;
  
  // Recorrência e Financeiro
  planValue?: number;
  planDuration?: number; // em meses
  billingDay?: number;
  planStartDate?: string;
  
  anamnesis?: Anamnesis;
  contractUrl?: string;
  contractGeneratedAt?: string;

  profileCompleted?: boolean; // Sinaliza se o perfil do aluno está completo
}

export interface ClassSession {
  id: string;
  title: string;
  description: string;
  dayOfWeek: string;
  date?: string; // Data específica (opcional, para aulas não recorrentes ou fixas)
  startTime: string;
  durationMinutes: number;
  instructor: string;
  maxCapacity: number;
  enrolledStudentIds: string[]; // JSONB array no Supabase
  waitlistStudentIds?: string[]; // JSONB array no Supabase
  type: 'FUNCTIONAL' | 'RUNNING';
  isCancelled?: boolean;
  wod?: string; // Workout Of the Day
  workoutDetails?: string; // Detalhes adicionais sobre o treino
  feedback?: { studentId: string, rating: number, comment?: string }[]; // JSONB array no Supabase
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  isPresent: boolean;
}

export interface FMSData {
  deepSquat: number;           // Agachamento Profundo
  hurdleStep: number;          // Passa por cima da barreira
  inlineLunge: number;         // Avanço em linha reta
  shoulderMobility: number;    // Mobilidade Ombro
  activeStraightLegRaise: number; // Elevação de pernas estendida
  rotationalStability: number; // Estabilidade Rotacional
}

export interface Assessment {
  id: string;
  studentId: string;
  date: string;
  status: 'DONE' | 'SCHEDULED';
  notes: string;
  weight: number;
  height: number;
  bodyFatPercentage: number;
  skeletalMuscleMass?: number;
  visceralFatLevel?: number;
  basalMetabolicRate?: number;
  hydrationPercentage?: number;
  vo2Max?: number;
  squatMax?: number;
  
  // Testes de Performance / Potência
  horizontalJump?: number; // metros
  verticalJump?: number;   // cm
  wallBallThrow?: number;  // metros

  // Protocolo FMS
  fms?: FMSData;
  correctivePlan?: string;

  // Evolução Visual
  photos?: {
    front?: string;
    side?: string;
    back?: string;
  };

  circumferences?: {
    chest?: number;
    waist?: number;
    abdomen?: number;
    hips?: number;
    rightThigh?: number;
    leftThigh?: number;
    rightCalf?: number;
    leftCalf?: number;
  };
}

export interface Route {
  id: string;
  title: string;
  distanceKm: number;
  description: string;
  mapLink: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  elevationGain: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  currentProgress?: number;
}

export interface PersonalizedWorkout {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  studentIds: string[];
  createdAt: string;
  instructorName: string;
}

export interface AcademySettings {
  name: string;
  cnpj: string;
  academyAddress: Address; 
  phone: string;
  email: string;
  representativeName: string;
  mercadoPagoPublicKey: string;
  mercadoPagoAccessToken: string;
  customDomain: string; 
  monthlyFee: number;
  inviteCode: string;
  registrationInviteCode: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  likes: string[];
  timestamp: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  dueDate: string;
  description: string;
  installmentNumber?: number;
  totalInstallments?: number;
}

export type ViewState = 
  | 'LOGIN' 
  | 'REGISTRATION'
  | 'COMPLETE_PROFILE' 
  | 'DASHBOARD' 
  | 'SCHEDULE' 
  | 'ASSESSMENTS' 
  | 'FINANCIAL' 
  | 'MANAGE_USERS'
  | 'SETTINGS'
  | 'RANKING'
  | 'ROUTES'
  | 'PERSONAL_WORKOUTS'
  | 'FEED'
  | 'REPORTS';

export interface AppNavParams {
  studentId?: string;
  tab?: 'basic' | 'plan' | 'anamnesis';
}
