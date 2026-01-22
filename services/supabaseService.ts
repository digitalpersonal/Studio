
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, ClassSession, Assessment, Payment, Anamnesis, AttendanceRecord, Route, Challenge, PersonalizedWorkout, Post } from '../types';
import { UserRole } from '../types';

const SUPABASE_URL = "https://xdjrrxrepnnkvpdbbtot.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanJyeHJlcG5ua3ZwZGJidG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjM3NzgsImV4cCI6MjA4MTg5OTc3OH0.6M4HQAVS0Z6cdvwMJCeOSvCKBkozHwQz3X9tgaZojEk";

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const getSupabaseConfigError = (): Error | null => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !supabase) {
    return new Error("Erro de Configuração Supabase: Verifique as chaves e a conexão.");
  }
  return null;
};

const mapUserFromDb = (dbUser: any): User => ({
  id: dbUser.id,
  name: dbUser.name,
  email: dbUser.email,
  password: dbUser.password,
  role: dbUser.role as UserRole,
  avatarUrl: dbUser.avatar_url,
  joinDate: dbUser.join_date,
  phoneNumber: dbUser.phone_number,
  birthDate: dbUser.birth_date,
  maritalStatus: dbUser.marital_status,
  cpf: dbUser.cpf,
  rg: dbUser.rg,
  nationality: dbUser.nationality,
  profession: dbUser.profession,
  planValue: dbUser.plan_value,
  planDuration: dbUser.plan_duration,
  billingDay: dbUser.billing_day,
  planStartDate: dbUser.plan_start_date,
  contractUrl: dbUser.contract_url,
  contractGeneratedAt: dbUser.contract_generated_at,
  profileCompleted: dbUser.profile_completed,
  address: dbUser.address || {},
  anamnesis: dbUser.anamnesis || {}
});

const mapUserToDb = (user: Partial<User>) => {
  const dbObj: any = {};
  if (user.id) dbObj.id = user.id;
  if (user.name) dbObj.name = user.name;
  if (user.email) dbObj.email = user.email;
  if (user.password) dbObj.password = user.password;
  if (user.role) dbObj.role = user.role;
  
  // GARANTIA: Nunca enviar null para colunas JSONB
  dbObj.address = user.address || {};
  dbObj.anamnesis = user.anamnesis || {};
  
  if (user.cpf) dbObj.cpf = user.cpf;
  if (user.rg) dbObj.rg = user.rg;
  if (user.nationality) dbObj.nationality = user.nationality;
  if (user.maritalStatus) dbObj.marital_status = user.maritalStatus;
  if (user.profession) dbObj.profession = user.profession;
  if (user.avatarUrl !== undefined) dbObj.avatar_url = user.avatarUrl;
  if (user.joinDate !== undefined) dbObj.join_date = user.joinDate;
  if (user.phoneNumber !== undefined) dbObj.phone_number = user.phoneNumber;
  if (user.birthDate !== undefined) dbObj.birth_date = user.birthDate;
  
  // Sanitização de tipos numéricos para evitar erro de casting
  dbObj.plan_value = user.planValue !== undefined ? Number(user.planValue) : 0;
  dbObj.plan_duration = user.planDuration !== undefined ? Math.floor(Number(user.planDuration)) : 12;
  dbObj.billing_day = user.billingDay !== undefined ? Math.floor(Number(user.billingDay)) : 5;
  
  if (user.planStartDate !== undefined) dbObj.plan_start_date = user.planStartDate;
  if (user.contractUrl !== undefined) dbObj.contract_url = user.contractUrl;
  if (user.contractGeneratedAt !== undefined) dbObj.contract_generated_at = user.contractGeneratedAt;
  if (user.profileCompleted !== undefined) dbObj.profile_completed = user.profileCompleted;
  return dbObj;
};

export const SupabaseService = {
  supabase,

  getAllUsers: async (): Promise<User[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('users').select('*').order('name');
    if (error) throw error;
    return (data as any[]).map(mapUserFromDb);
  },

  addUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const dbPayload = mapUserToDb(user);
    const { data, error } = await supabase!.from('users').insert([dbPayload]).select().single();
    if (error) {
      console.error("Erro Supabase (AddUser):", error);
      throw new Error(`Falha ao registrar: ${error.message}`);
    }
    return mapUserFromDb(data);
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const dbPayload = mapUserToDb(updatedUser);
    const { data, error } = await supabase!.from('users').update(dbPayload).eq('id', updatedUser.id).select().single();
    if (error) {
      console.error("Erro Supabase (UpdateUser):", error);
      throw new Error(`Falha ao atualizar: ${error.message}`);
    }
    return mapUserFromDb(data);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { error } = await supabase!.from('users').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  getPayments: async (userId?: string): Promise<Payment[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    let query = supabase!.from('payments').select('*').order('due_date');
    if (userId) query = query.eq('student_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(p => ({ ...p, studentId: p.student_id, dueDate: p.due_date })) as Payment[];
  },

  markPaymentAsPaid: async (id: string): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { error } = await supabase!.from('payments').update({ status: 'PAID' }).eq('id', id);
    if (error) throw error;
    return true;
  },

  getClasses: async (): Promise<ClassSession[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('classes').select('*').order('day_of_week').order('start_time');
    if (error) throw error;
    return data.map(c => ({
      ...c,
      dayOfWeek: c.day_of_week,
      startTime: c.start_time,
      enrolledStudentIds: c.enrolled_student_ids || [],
      waitlistStudentIds: c.waitlist_student_ids || [],
    })) as ClassSession[];
  },

  addClass: async (newClass: Omit<ClassSession, 'id'>): Promise<ClassSession> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('classes').insert([{
      ...newClass,
      day_of_week: newClass.dayOfWeek,
      start_time: newClass.startTime,
      enrolled_student_ids: newClass.enrolledStudentIds || [],
      waitlist_student_ids: newClass.waitlistStudentIds || [],
    }]).select().single();
    if (error) throw error;
    return { ...data, dayOfWeek: data.day_of_week, startTime: data.start_time, enrolledStudentIds: data.enrolled_student_ids, waitlistStudentIds: data.waitlist_student_ids } as ClassSession;
  },

  updateClass: async (updatedClass: ClassSession): Promise<ClassSession> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('classes').update({
      ...updatedClass,
      day_of_week: updatedClass.dayOfWeek,
      start_time: updatedClass.startTime,
      enrolled_student_ids: updatedClass.enrolledStudentIds || [],
      waitlist_student_ids: updatedClass.waitlistStudentIds || []
    }).eq('id', updatedClass.id).select().single();
    if (error) throw error;
    return { ...data, dayOfWeek: data.day_of_week, startTime: data.start_time, enrolledStudentIds: data.enrolled_student_ids, waitlistStudentIds: data.waitlist_student_ids } as ClassSession;
  },

  deleteClass: async (id: string): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { error } = await supabase!.from('classes').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  getAssessments: async (userId?: string): Promise<Assessment[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    let query = supabase!.from('assessments').select('*').order('date', { ascending: false });
    if (userId) query = query.eq('student_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(assessment => ({ ...assessment, studentId: assessment.student_id })) as Assessment[];
  },

  addAssessment: async (newAssessment: Omit<Assessment, 'id'>): Promise<Assessment> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('assessments').insert([{
      ...newAssessment,
      student_id: newAssessment.studentId,
      fms: newAssessment.fms || {},
      circumferences: newAssessment.circumferences || {}
    }]).select().single();
    if (error) throw error;
    return { ...data, studentId: data.student_id } as Assessment;
  },

  updateAssessment: async (updatedAssessment: Assessment): Promise<Assessment> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('assessments').update({
      ...updatedAssessment,
      student_id: updatedAssessment.studentId,
      fms: updatedAssessment.fms || {},
      circumferences: updatedAssessment.circumferences || {}
    }).eq('id', updatedAssessment.id).select().single();
    if (error) throw error;
    return { ...data, studentId: data.student_id } as Assessment;
  },

  deleteAssessment: async (id: string): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { error } = await supabase!.from('assessments').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  getRoutes: async (): Promise<Route[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('routes').select('*').order('title');
    if (error) throw error;
    return data as Route[];
  },

  getPersonalizedWorkouts: async (userId?: string): Promise<PersonalizedWorkout[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    let query = supabase!.from('personalized_workouts').select('*').order('created_at', { ascending: false });
    if (userId) query = query.filter('student_ids', 'cs', [userId]);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(workout => ({ ...workout, studentIds: workout.student_ids, createdAt: workout.created_at })) as PersonalizedWorkout[];
  },

  getPosts: async (): Promise<Post[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('posts').select(`*, users(name, avatar_url)`).order('timestamp', { ascending: false });
    if (error) throw error;
    return data.map(post => ({
      ...post,
      userId: post.user_id,
      userName: post.users.name,
      userAvatar: post.users.avatar_url,
      users: undefined
    })) as Post[];
  },

  getGlobalChallengeProgress: async (): Promise<{ challenge: Challenge | null; totalDistance: number; }> => {
    try {
        const configError = getSupabaseConfigError();
        if (configError) return { challenge: null, totalDistance: 0 };
        const { data: challengeData, error } = await supabase!.from('challenges').select('*').limit(1).maybeSingle();
        if (error || !challengeData) return { challenge: null, totalDistance: 0 };
        return { challenge: challengeData as Challenge, totalDistance: 0 };
    } catch (err) {
        return { challenge: null, totalDistance: 0 };
    }
  },

  getFinancialReport: async (year: number): Promise<{ name: string; students: number; revenue: number; }[]> => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyData = monthNames.map(name => ({ name, students: 0, revenue: 0 }));
    try {
        const { data: payments, error } = await supabase!.from('payments')
          .select('amount, due_date')
          .eq('status', 'PAID')
          .gte('due_date', `${year}-01-01`)
          .lte('due_date', `${year}-12-31`);
        if (error || !payments) return monthlyData;
        payments.forEach(p => {
           const [y, m, d] = String(p.due_date).split('-').map(Number);
           const idx = m - 1;
           if (idx >= 0 && idx < 12) {
               monthlyData[idx].revenue += Number(p.amount);
               monthlyData[idx].students += 1; 
           }
        });
    } catch (e) {}
    return monthlyData;
  },

  getAttendanceReport: async (): Promise<{ name: string; attendance: number; }[]> => {
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const reportData = dayNames.map(name => ({ name, attendance: 0 }));
    try {
        const { data: attendanceRecords, error } = await supabase!.from('attendance').select('date').eq('is_present', true);
        if (error || !attendanceRecords) return reportData;
        attendanceRecords.forEach(record => {
            const dayIndex = new Date(String(record.date)).getDay();
            if (reportData[dayIndex]) reportData[dayIndex].attendance += 1;
        });
    } catch (e) {}
    return reportData;
  },

  addRoute: async (newRoute: Omit<Route, 'id'>): Promise<Route> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('routes').insert([newRoute]).select().single();
    if (error) throw error;
    return data as Route;
  },

  updateRoute: async (updatedRoute: Route): Promise<Route> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('routes').update(updatedRoute).eq('id', updatedRoute.id).select().single();
    if (error) throw error;
    return data as Route;
  },

  deleteRoute: async (id: string): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { error } = await supabase!.from('routes').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  addPersonalizedWorkout: async (newWorkout: Omit<PersonalizedWorkout, 'id'>): Promise<PersonalizedWorkout> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('personalized_workouts').insert([{
      title: newWorkout.title,
      description: newWorkout.description,
      video_url: newWorkout.videoUrl,
      student_ids: newWorkout.studentIds || [],
      created_at: newWorkout.createdAt,
      instructor_name: newWorkout.instructorName
    }]).select().single();
    if (error) throw error;
    return { ...data, studentIds: data.student_ids, createdAt: data.created_at, videoUrl: data.video_url, instructorName: data.instructor_name } as PersonalizedWorkout;
  },

  updatePersonalizedWorkout: async (updatedWorkout: PersonalizedWorkout): Promise<PersonalizedWorkout> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('personalized_workouts').update({
      title: updatedWorkout.title,
      description: updatedWorkout.description,
      video_url: updatedWorkout.videoUrl,
      student_ids: updatedWorkout.studentIds || [],
      created_at: updatedWorkout.createdAt,
      instructor_name: updatedWorkout.instructorName
    }).eq('id', updatedWorkout.id).select().single();
    if (error) throw error;
    return { ...data, studentIds: data.student_ids, createdAt: data.created_at, videoUrl: data.video_url, instructorName: data.instructor_name } as PersonalizedWorkout;
  },

  deletePersonalizedWorkout: async (id: string): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { error } = await supabase!.from('personalized_workouts').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  addPost: async (newPost: Omit<Post, 'id' | 'userName' | 'userAvatar' | 'likes'> & { userId: string }): Promise<Post> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('posts').insert([{
      user_id: newPost.userId,
      image_url: newPost.imageUrl,
      caption: newPost.caption,
      timestamp: newPost.timestamp,
      likes: []
    }]).select(`*, users(name, avatar_url)`).single();
    if (error) throw error;
    return {
      ...data,
      userId: data.user_id,
      userName: data.users.name,
      userAvatar: data.users.avatar_url,
      users: undefined
    } as Post;
  },

  addLikeToPost: async (postId: string, userId: string): Promise<Post> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data: post, error: getError } = await supabase!.from('posts').select('likes').eq('id', postId).single();
    if (getError) throw getError;
    let likes = post.likes || [];
    if (likes.includes(userId)) {
      likes = likes.filter((id: string) => id !== userId);
    } else {
      likes.push(userId);
    }
    const { data, error } = await supabase!.from('posts').update({ likes }).eq('id', postId).select(`*, users(name, avatar_url)`).single();
    if (error) throw error;
    return {
      ...data,
      userId: data.user_id,
      userName: data.users.name,
      userAvatar: data.users.avatar_url,
      users: undefined
    } as Post;
  },

  getAllStudents: async (): Promise<User[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('users').select('*').eq('role', UserRole.STUDENT).order('name');
    if (error) throw error;
    return (data as any[]).map(mapUserFromDb);
  },

  addPayment: async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('payments').insert([{
      student_id: payment.studentId,
      amount: Number(payment.amount),
      status: payment.status,
      due_date: payment.dueDate,
      description: payment.description,
      installment_number: payment.installmentNumber,
      total_installments: payment.totalInstallments
    }]).select().single();
    if (error) throw error;
    return { ...data, studentId: data.student_id, dueDate: data.due_date } as Payment;
  },

  getAttendanceByClassAndDate: async (classId: string, date: string): Promise<AttendanceRecord[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!
      .from('attendance')
      .select('*')
      .eq('class_id', classId)
      .eq('date', date);
    if (error) throw error;
    return data.map(r => ({
      id: r.id,
      classId: r.class_id,
      studentId: r.student_id,
      date: r.date,
      isPresent: r.is_present
    })) as AttendanceRecord[];
  },

  saveAttendance: async (records: Omit<AttendanceRecord, 'id'>[]): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    
    const payload = records.map(r => ({
      class_id: r.classId,
      student_id: r.studentId,
      date: r.date,
      is_present: r.isPresent
    }));

    const { error } = await supabase!.from('attendance').upsert(payload, { 
      onConflict: 'class_id,student_id,date' 
    });

    if (error) throw error;
    return true;
  }
};
