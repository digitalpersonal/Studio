
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, ClassSession, Assessment, Post, Payment, Anamnesis, PersonalizedWorkout, UserRole } from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xdjrrxrepnnkvpdbbtot.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanJyeHJlcG5ua3ZwZGJidG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjM3NzgsImV4cCI6MjA4MTg5OTc3OH0.6M4HQAVS0Z6cdvwMJCeOSvCKBkozHwQz3X9tgaZojEk';

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_URL.startsWith('http')) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const isConfigured = () => !!supabase;

export const SupabaseService = {
  supabase,

  login: async (email: string, password: string): Promise<User | null> => {
    if (!isConfigured()) return null;
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    
    if (error || !data) {
        console.error("Login Error:", error);
        return null;
    }
    return data as User;
  },

  getAllUsers: async (): Promise<User[]> => {
    if (!isConfigured()) return [];
    const { data, error } = await supabase!.from('users').select('*').order('name');
    if (error) throw error;
    return data as User[];
  },

  getAllStudents: async (): Promise<User[]> => {
    if (!isConfigured()) return [];
    const { data, error } = await supabase!.from('users').select('*').eq('role', UserRole.STUDENT).order('name');
    if (error) throw error;
    return data as User[];
  },

  addUser: async (user: Omit<User, 'id'>): Promise<User> => {
    if (!isConfigured()) throw new Error("Supabase não configurado");
    const { data, error } = await supabase!.from('users').insert([user]).select().single();
    if (error) throw error;
    return data as User;
  },

  deleteUser: async (id: string): Promise<boolean> => {
    if (!isConfigured()) return false;
    const { error } = await supabase!.from('users').delete().eq('id', id);
    return !error;
  },

  // --- AGENDA DE AULAS ---
  getClasses: async (): Promise<ClassSession[]> => {
    if (!isConfigured()) return [];
    const { data, error } = await supabase!.from('classes').select('*').order('startTime');
    if (error) throw error;
    return data as ClassSession[];
  },

  addClass: async (session: Omit<ClassSession, 'id'>): Promise<ClassSession> => {
    const { data, error } = await supabase!.from('classes').insert([session]).select().single();
    if (error) throw error;
    return data as ClassSession;
  },

  enrollStudent: async (classId: string, studentIds: string[]): Promise<boolean> => {
    const { error } = await supabase!.from('classes').update({ enrolledStudentIds: studentIds }).eq('id', classId);
    return !error;
  },

  // --- AVALIAÇÕES ---
  getAssessments: async (studentId?: string): Promise<Assessment[]> => {
    if (!isConfigured()) return [];
    let query = supabase!.from('assessments').select('*').order('date', { ascending: false });
    if (studentId) query = query.eq('studentId', studentId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Assessment[];
  },

  addAssessment: async (assessment: Omit<Assessment, 'id'>): Promise<Assessment> => {
    const { data, error } = await supabase!.from('assessments').insert([assessment]).select().single();
    if (error) throw error;
    return data as Assessment;
  },

  // --- TREINOS ---
  getPersonalizedWorkouts: async (studentId?: string): Promise<PersonalizedWorkout[]> => {
    if (!isConfigured()) return [];
    let query = supabase!.from('personalized_workouts').select('*').order('createdAt', { ascending: false });
    if (studentId) query = query.contains('studentIds', [studentId]);
    const { data, error } = await query;
    if (error) throw error;
    return data as PersonalizedWorkout[];
  },

  addPersonalizedWorkout: async (workout: Omit<PersonalizedWorkout, 'id'>): Promise<PersonalizedWorkout> => {
    const { data, error } = await supabase!.from('personalized_workouts').insert([workout]).select().single();
    if (error) throw error;
    return data as PersonalizedWorkout;
  },

  deletePersonalizedWorkout: async (id: string): Promise<boolean> => {
    const { error } = await supabase!.from('personalized_workouts').delete().eq('id', id);
    return !error;
  },

  // --- FINANCEIRO ---
  getPayments: async (studentId?: string): Promise<Payment[]> => {
    if (!isConfigured()) return [];
    let query = supabase!.from('payments').select('*').order('dueDate', { ascending: false });
    if (studentId) query = query.eq('studentId', studentId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Payment[];
  },

  addPayment: async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
    const { data, error } = await supabase!.from('payments').insert([payment]).select().single();
    if (error) throw error;
    return data as Payment;
  },

  updatePaymentStatus: async (id: string, status: string): Promise<boolean> => {
    const { error } = await supabase!.from('payments').update({ status }).eq('id', id);
    return !error;
  }
};
