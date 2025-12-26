
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, ClassSession, Assessment, Post, Payment, Anamnesis } from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xdjrrxrepnnkvpdbbtot.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanJyeHJlcG5ua3ZwZGJidG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjM3NzgsImV4cCI6MjA4MTg5OTc3OH0.6M4HQAVS0Z6cdvwMJCeOSvCKBkozHwQz3X9tgaZojEk';

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_URL.startsWith('http')) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const isConfigured = () => {
  if (!supabase) return false;
  return true;
};

export const SupabaseService = {
  supabase,

  getAllUsers: async (): Promise<User[]> => {
    if (!isConfigured()) return [];
    const { data, error } = await supabase!.from('users').select('*').order('name');
    if (error) throw error;
    return data as User[];
  },

  getAllStudents: async (): Promise<User[]> => {
    if (!isConfigured()) return [];
    const { data, error } = await supabase!.from('users').select('*').eq('role', 'STUDENT').order('name');
    if (error) throw error;
    return data as User[];
  },

  addStudent: async (student: Omit<User, 'id'>): Promise<User> => {
    if (!isConfigured()) throw new Error("Supabase não configurado");
    const { data, error } = await supabase!.from('users').insert([student]).select().single();
    if (error) throw error;
    return data as User;
  },

  updateStudent: async (updatedStudent: User): Promise<User> => {
    if (!isConfigured()) throw new Error("Supabase não configurado");
    const { data, error } = await supabase!.from('users').update(updatedStudent).eq('id', updatedStudent.id).select().single();
    if (error) throw error;
    return data as User;
  },

  getPayments: async (studentId?: string): Promise<Payment[]> => {
    if (!isConfigured()) return [];
    let query = supabase!.from('payments').select('*').order('due_date');
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Payment[];
  },

  addPayment: async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
    if (!isConfigured()) throw new Error("Supabase não configurado");
    const { data, error } = await supabase!.from('payments').insert([payment]).select().single();
    if (error) throw error;
    return data as Payment;
  },

  markPaymentAsPaid: async (id: string): Promise<boolean> => {
    if (!isConfigured()) return false;
    const { error } = await supabase!.from('payments').update({ status: 'PAID' }).eq('id', id);
    if (error) throw error;
    return true;
  },

  getClasses: async (): Promise<ClassSession[]> => {
    if (!isConfigured()) return [];
    const { data, error } = await supabase!.from('classes').select('*').order('start_time');
    if (error) throw error;
    return data as ClassSession[];
  },

  getAssessments: async (studentId?: string): Promise<Assessment[]> => {
    if (!isConfigured()) return [];
    let query = supabase!.from('assessments').select('*').order('date', { ascending: false });
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Assessment[];
  },

  addAssessment: async (newAssessment: Omit<Assessment, 'id'>): Promise<Assessment> => {
    if (!isConfigured()) throw new Error("Supabase não configurado");
    const { data, error } = await supabase!.from('assessments').insert([newAssessment]).select().single();
    if (error) throw error;
    return data as Assessment;
  }
};
