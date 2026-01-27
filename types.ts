
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER',
  STUDENT = 'STUDENT'
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface Anamnesis {
  // Saúde e Histórico Médico
  hasMedicalCondition?: boolean;
  medicalConditionDescription?: string;
  hasRecentSurgeryOrInjury?: boolean;
  recentSurgeryOrInjuryDetails?: string;
  takesMedication?: boolean;
  medicationDescription?: string;
  hasAllergies?: boolean;
  allergiesDescription?: string;
  recentExamsResults?: string;

  // Objetivos e Estilo de Vida
  mainGoal?: string;
  trainingFrequency?: '1-2x' | '3-4x' | '5x+';
  activityLevel?: 'SEDENTARY' | 'MODERATE' | 'ATHLETE';
  trainingExperience?: string;
  availableEquipment?: string;
  preferredTrainingTimes?: string;

  // Hábitos e Avaliação
  smokesOrDrinks?: boolean;
  smokingDrinkingFrequency?: string;
  sleepQuality?: string;
  currentDiet?: string;
  bodyMeasurements?: string;

  // Contato de Emergência
  emergencyContactName: string;
  emergencyContactPhone: string;
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

export interface Plan {
  id: string;
  title: string;
  planType: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'KIDS' | 'AVULSO';
  frequency?: string;
  price: number;
  durationMonths: number;
  isActive: boolean;
  displayOrder: number;
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
  cpf?: string;
  rg?: string;
  nationality?: string; 
  maritalStatus?: string; 
  profession?: string; 
  address?: Address;
  planId?: string;
  planValue?: number; // Armazena o preço ORIGINAL do plano
  planDiscount?: number; // Armazena o desconto fixo
  planDuration?: number; 
  billingDay?: number;
  planStartDate?: string;
  anamnesis?: Anamnesis;
  contractUrl?: string;
  contractGeneratedAt?: string;
  profileCompleted?: boolean;
  status?: 'ACTIVE' | 'SUSPENDED';
  suspendedAt?: string;
  // Campos para Integração Strava
  stravaAccessToken?: string;
  stravaRefreshToken?: string;
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
  comments?: Comment[];
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
  wod: string;
  workoutDetails: string;
  feedback?: { studentId: string, rating: number }[];
  date?: string;
  isCancelled?: boolean;
  // Campos específicos para Corrida
  cycleStartDate?: string; // NOVO CAMPO
  weekOfCycle?: number;
  weekFocus?: string;
  estimatedVolumeMinutes?: number;
  weekObjective?: string;
  referenceWorkouts?: string;
  mainWorkout?: string;
  distanceKm?: number;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  isPresent: boolean;
  // Campos de desempenho para Corrida
  totalTimeSeconds?: number;
  averagePace?: string;
  ageGroupClassification?: string;
  instructorNotes?: string;
  generatedFeedback?: string;
}

export interface CycleSummary {
  id: string;
  studentId: string;
  cycleEndDate: string;
  summaryText: string;
  startPace?: string;
  endPace?: string;
  performanceData?: any;
  createdAt: string;
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
  abdominalTest?: number;
  squatMax?: number;
  horizontalJump?: number;
  verticalJump?: number;
  medicineBallThrow?: number;
  photoFrontUrl?: string;
  photoSideUrl?: string;
  photoBackUrl?: string;
  fms?: {
    deepSquat?: number;
    trunkStability?: number;
    hurdleStep_L?: number;
    hurdleStep_R?: number;
    inlineLunge_L?: number;
    inlineLunge_R?: number;
    shoulderMobility_L?: number;
    shoulderMobility_R?: number;
    activeStraightLegRaise_L?: number;
    activeStraightLegRaise_R?: number;
    rotationalStability_L?: number;
    rotationalStability_R?: number;
  };
  circumferences?: {
    chest?: number;
    waist?: number;
    abdomen?: number;
    hips?: number;
    rightArm?: number;
    leftArm?: number;
    rightForearm?: number;
    leftForearm?: number;
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
  pixKey: string;
  customDomain: string; 
  monthlyFee: number;
  inviteCode: string;
  registrationInviteCode: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  discount?: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  dueDate: string;
  description: string;
  installmentNumber?: number;
  total_installments?: number;
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
  | 'REPORTS'
  | 'RUNNING_EVOLUTION'
  | 'HELP_CENTER'
  | 'STRAVA_CONNECT';

export interface AppNavParams {
  studentId?: string;
  tab?: 'basic' | 'plan' | 'anamnesis';
}
