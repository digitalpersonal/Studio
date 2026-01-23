
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
  cpf?: string;
  rg?: string;
  nationality?: string; 
  maritalStatus?: string; 
  profession?: string; 
  address?: Address;
  planValue?: number;
  planDuration?: number; 
  billingDay?: number;
  planStartDate?: string;
  anamnesis?: Anamnesis;
  contractUrl?: string;
  contractGeneratedAt?: string;
  profileCompleted?: boolean;
  status?: 'ACTIVE' | 'SUSPENDED';
  suspendedAt?: string;
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
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  isPresent: boolean;
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
  horizontalJump?: number;
  verticalJump?: number;
  medicineBallThrow?: number;
  fms?: {
    deepSquat?: number;
    hurdleStep?: number;
    inlineLunge?: number;
    shoulderMobility?: number;
    activeStraightLegRaise?: number;
    rotationalStability?: number;
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
  | 'REPORTS';

export interface AppNavParams {
  studentId?: string;
  tab?: 'basic' | 'plan' | 'anamnesis';
}
