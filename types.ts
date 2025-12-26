
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER',
  STUDENT = 'STUDENT',
  GUEST = 'GUEST'
}

export interface Anamnesis {
  hasInjury: boolean;
  injuryDescription?: string;
  takesMedication: boolean;
  medicationDescription?: string;
  hadSurgery: boolean;
  surgeryDescription?: string;
  hasHeartCondition: boolean;
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
}

export interface ClassSession {
  id: string;
  title: string;
  description: string;
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
  instructor: string;
  maxCapacity: number;
  enrolledStudentIds: string[];
  waitlistStudentIds: string[];
  type: 'FUNCTIONAL' | 'RUNNING';
  isCancelled?: boolean;
  wod?: string;
  feedback?: { studentId: string, rating: number }[];
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
  circumferences?: {
    chest?: number;
    waist?: number;
    abdomen?: number;
    hips?: number;
    rightThigh?: number;
    rightCalf?: number;
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

// Added missing Challenge interface to fix import errors
export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  startDate: string;
  endDate: string;
}

// Added missing PersonalizedWorkout interface to fix import errors
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
  address: string;
  phone: string;
  email: string;
  representativeName: string;
  mercadoPagoPublicKey: string;
  mercadoPagoAccessToken: string;
  customDomain: string; // Novo campo para domínio próprio
  monthlyFee: number;
  inviteCode: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  likes: number;
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
