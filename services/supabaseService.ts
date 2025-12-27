

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

export const SupabaseService = {
  supabase,

  // --- User Management ---
  getAllUsers: async (): Promise<User[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('users').select('*').order('name');
    if (error) throw error;
    return data as User[];
  },

  addUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const userToInsert = {
      ...user,
      profileCompleted: user.role === UserRole.STUDENT && user.profileCompleted === undefined 
                        ? false 
                        : user.profileCompleted
    };
    const { data, error } = await supabase!.from('users').insert([userToInsert]).select().single();
    if (error) throw error;
    return data as User;
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('users').update(updatedUser).eq('id', updatedUser.id).select().single();
    if (error) throw error;
    return data as User;
  },

  getAllStudents: async (): Promise<User[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('users').select('*').eq('role', 'STUDENT').order('name');
    if (error) throw error;
    return data as User[];
  },

  // --- Payment Management ---
  getPayments: async (userId?: string): Promise<Payment[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    let query = supabase!.from('payments').select('*').order('due_date');
    if (userId) query = query.eq('student_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(p => ({ ...p, studentId: p.student_id, dueDate: p.due_date })) as Payment[];
  },

  addPayment: async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('payments').insert([{
      student_id: payment.studentId,
      amount: payment.amount,
      status: payment.status,
      due_date: payment.dueDate,
      description: payment.description,
      installment_number: payment.installmentNumber,
      total_installments: payment.totalInstallments
    }]).select().single();
    if (error) throw error;
    return { ...data, studentId: data.student_id, dueDate: data.due_date } as Payment;
  },

  markPaymentAsPaid: async (id: string): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { error } = await supabase!.from('payments').update({ status: 'PAID' }).eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Class Session Management ---
  getClasses: async (): Promise<ClassSession[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('classes').select('*').order('day_of_week').order('start_time');
    if (error) throw error;
    return data.map(c => ({
      ...c,
      dayOfWeek: c.day_of_week,
      startTime: c.start_time,
      enrolledStudentIds: c.enrolled_student_ids,
      waitlistStudentIds: c.waitlist_student_ids,
    })) as ClassSession[];
  },

  addClass: async (newClass: Omit<ClassSession, 'id'>): Promise<ClassSession> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('classes').insert([
      {
        ...newClass,
        day_of_week: newClass.dayOfWeek,
        start_time: newClass.startTime,
        enrolled_student_ids: newClass.enrolledStudentIds,
        waitlist_student_ids: newClass.waitlistStudentIds,
      }
    ]).select().single();
    if (error) throw error;
    return {
      ...data,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      enrolledStudentIds: data.enrolled_student_ids,
      waitlistStudentIds: data.waitlist_student_ids
    } as ClassSession;
  },

  updateClass: async (updatedClass: ClassSession): Promise<ClassSession> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('classes').update({
      ...updatedClass,
      day_of_week: updatedClass.dayOfWeek,
      start_time: updatedClass.startTime,
      enrolled_student_ids: updatedClass.enrolledStudentIds,
      waitlist_student_ids: updatedClass.waitlistStudentIds
    }).eq('id', updatedClass.id).select().single();
    if (error) throw error;
    return {
      ...data,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      enrolledStudentIds: data.enrolled_student_ids,
      waitlistStudentIds: data.waitlist_student_ids
    } as ClassSession;
  },

  deleteClass: async (id: string): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { error } = await supabase!.from('classes').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  enrollStudent: async (classId: string, userId: string): Promise<ClassSession> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data: currentClass, error: fetchError } = await supabase!.from('classes').select('enrolled_student_ids, max_capacity').eq('id', classId).single();
    if (fetchError) throw fetchError;
    if (!currentClass) throw new Error("Aula não encontrada.");

    const enrolled = new Set(currentClass.enrolled_student_ids || []);
    if (enrolled.has(userId)) throw new Error("Usuário já matriculado.");
    if (enrolled.size >= currentClass.max_capacity) throw new Error("Capacidade máxima atingida.");

    enrolled.add(userId);
    const { data, error } = await supabase!.from('classes').update({ enrolled_student_ids: Array.from(enrolled) }).eq('id', classId).select().single();
    if (error) throw error;
    return { ...data, dayOfWeek: data.day_of_week, startTime: data.start_time, enrolledStudentIds: data.enrolled_student_ids, waitlistStudentIds: data.waitlist_student_ids } as ClassSession;
  },

  removeStudentFromClass: async (classId: string, userId: string): Promise<ClassSession> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data: currentClass, error: fetchError } = await supabase!.from('classes').select('enrolled_student_ids').eq('id', classId).single();
    if (fetchError) throw fetchError;
    if (!currentClass) throw new Error("Aula não encontrada.");

    const enrolled = new Set(currentClass.enrolled_student_ids || []);
    if (!enrolled.has(userId)) throw new Error("Usuário não matriculado nesta aula.");

    enrolled.delete(userId);
    const { data, error } = await supabase!.from('classes').update({ enrolled_student_ids: Array.from(enrolled) }).eq('id', classId).select().single();
    if (error) throw error;
    return { ...data, dayOfWeek: data.day_of_week, startTime: data.start_time, enrolledStudentIds: data.enrolled_student_ids, waitlistStudentIds: data.waitlist_student_ids } as ClassSession;
  },

  joinWaitlist: async (classId: string, userId: string): Promise<ClassSession> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data: currentClass, error: fetchError } = await supabase!.from('classes').select('waitlist_student_ids').eq('id', classId).single();
    if (fetchError) throw fetchError;
    if (!currentClass) throw new Error("Aula não encontrada.");

    const waitlist = new Set(currentClass.waitlist_student_ids || []);
    if (waitlist.has(userId)) throw new Error("Usuário já na lista de espera.");

    waitlist.add(userId);
    const { data, error } = await supabase!.from('classes').update({ waitlist_student_ids: Array.from(waitlist) }).eq('id', classId).select().single();
    if (error) throw error;
    return { ...data, dayOfWeek: data.day_of_week, startTime: data.start_time, enrolledStudentIds: data.enrolled_student_ids, waitlistStudentIds: data.waitlist_student_ids } as ClassSession;
  },

  leaveWaitlist: async (classId: string, userId: string): Promise<ClassSession> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data: currentClass, error: fetchError } = await supabase!.from('classes').select('waitlist_student_ids').eq('id', classId).single();
    if (fetchError) throw fetchError;
    if (!currentClass) throw new Error("Aula não encontrada.");

    const waitlist = new Set(currentClass.waitlist_student_ids || []);
    if (!waitlist.has(userId)) throw new Error("Usuário não encontrado na lista de espera.");

    waitlist.delete(userId);
    const { data, error } = await supabase!.from('classes').update({ waitlist_student_ids: Array.from(waitlist) }).eq('id', classId).select().single();
    if (error) throw error;
    return { ...data, dayOfWeek: data.day_of_week, startTime: data.start_time, enrolledStudentIds: data.enrolled_student_ids, waitlistStudentIds: data.waitlist_student_ids } as ClassSession;
  },

  // --- Attendance Management ---
  saveAttendance: async (classId: string, date: string, presentUserIds: string[]): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    await supabase!.from('attendance').delete().eq('class_id', classId).eq('date', date);

    const records = presentUserIds.map(userId => ({
      class_id: classId,
      student_id: userId,
      date: date,
      is_present: true
    }));
    const { error } = await supabase!.from('attendance').insert(records);
    if (error) throw error;
    return true;
  },

  getClassAttendance: async (classId: string, date: string): Promise<AttendanceRecord[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('attendance').select('*').eq('class_id', classId).eq('date', date);
    if (error) throw error;
    return data.map(record => ({ ...record, classId: record.class_id, studentId: record.student_id, isPresent: record.is_present })) as AttendanceRecord[];
  },

  hasAttendance: async (classId: string, date: string): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { count, error } = await supabase!.from('attendance').select('*', { count: 'exact' }).eq('class_id', classId).eq('date', date);
    if (error) throw error;
    return (count || 0) > 0;
  },

  getStudentAttendanceStats: async (userId: string): Promise<{ percentage: number; totalClasses: number; presentCount: number; }> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
  
    const { data: enrolledClasses, error: classesError } = await supabase!
      .from('classes')
      .select('id, enrolled_student_ids');
  
    if (classesError) throw classesError;
  
    const userEnrolledClassIds = enrolledClasses
      .filter(cls => cls.enrolled_student_ids?.includes(userId))
      .map(cls => cls.id);
  
    const { data: attendanceRecords, error: attendanceError } = await supabase!
      .from('attendance')
      .select('class_id, is_present')
      .eq('student_id', userId)
      .eq('is_present', true);
  
    if (attendanceError) throw attendanceError;
  
    const presentCount = attendanceRecords ? attendanceRecords.length : 0;
    const totalClasses = userEnrolledClassIds.length;
    const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;
  
    return { percentage, totalClasses, presentCount };
  },

  // --- Assessment Management ---
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
      student_id: newAssessment.studentId
    }]).select().single();
    if (error) throw error;
    return { ...data, studentId: data.student_id } as Assessment;
  },

  updateAssessment: async (updatedAssessment: Assessment): Promise<Assessment> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('assessments').update({
      ...updatedAssessment,
      student_id: updatedAssessment.studentId
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

  // --- Route Management ---
  getRoutes: async (): Promise<Route[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('routes').select('*').order('title');
    if (error) throw error;
    return data as Route[];
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

  // --- Personalized Workout Management ---
  getPersonalizedWorkouts: async (userId?: string): Promise<PersonalizedWorkout[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    let query = supabase!.from('personalized_workouts').select('*').order('created_at', { ascending: false });
    if (userId) query = query.filter('student_ids', 'cs', [userId]);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(workout => ({ ...workout, studentIds: workout.student_ids, createdAt: workout.created_at })) as PersonalizedWorkout[];
  },

  addPersonalizedWorkout: async (newWorkout: Omit<PersonalizedWorkout, 'id'>): Promise<PersonalizedWorkout> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('personalized_workouts').insert([{
      ...newWorkout,
      student_ids: newWorkout.studentIds,
      created_at: newWorkout.createdAt
    }]).select().single();
    if (error) throw error;
    return { ...data, studentIds: data.student_ids, createdAt: data.created_at } as PersonalizedWorkout;
  },

  updatePersonalizedWorkout: async (updatedWorkout: PersonalizedWorkout): Promise<PersonalizedWorkout> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('personalized_workouts').update({
      ...updatedWorkout,
      student_ids: updatedWorkout.studentIds,
      created_at: updatedWorkout.createdAt
    }).eq('id', updatedWorkout.id).select().single();
    if (error) throw error;
    return { ...data, studentIds: data.student_ids, createdAt: data.created_at } as PersonalizedWorkout;
  },

  deletePersonalizedWorkout: async (id: string): Promise<boolean> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { error } = await supabase!.from('personalized_workouts').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Feed (Post) Management ---
  getPosts: async (): Promise<Post[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('posts').select(`
      *,
      users(name, avatarUrl)
    `).order('timestamp', { ascending: false });

    if (error) throw error;
    return data.map(post => ({
      ...post,
      userId: post.user_id,
      userName: post.users.name,
      userAvatar: post.users.avatarUrl,
      users: undefined
    })) as Post[];
  },

  addPost: async (newPost: Omit<Post, 'id' | 'userName' | 'userAvatar' | 'likes'> & { userId: string }): Promise<Post> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data, error } = await supabase!.from('posts').insert([{
      user_id: newPost.userId,
      image_url: newPost.imageUrl,
      caption: newPost.caption,
      likes: [],
      timestamp: newPost.timestamp
    }]).select().single();
    if (error) throw error;
    const { data: user, error: userError } = await supabase!.from('users').select('name, avatarUrl').eq('id', newPost.userId).single();
    if (userError) throw userError;
    return { ...data, userId: data.user_id, userName: user.name, userAvatar: user.avatarUrl } as Post;
  },

  addLikeToPost: async (postId: string, userId: string): Promise<Post> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const { data: currentPost, error: fetchError } = await supabase!.from('posts').select('likes').eq('id', postId).single();
    if (fetchError) throw fetchError;
    if (!currentPost) throw new Error("Post não encontrado.");

    const likes = new Set(currentPost.likes || []);
    if (!likes.has(userId)) {
      likes.add(userId);
    } else {
      likes.delete(userId);
    }
    
    const { data, error } = await supabase!.from('posts').update({ likes: Array.from(likes) }).eq('id', postId).select().single();
    if (error) throw error;
    const { data: fullPost, error: fullPostError } = await supabase!.from('posts').select(`*, users(name, avatarUrl)`).eq('id', postId).single();
    if (fullPostError) throw fullPostError;
    return { ...fullPost, userId: fullPost.user_id, userName: fullPost.users.name, userAvatar: fullPost.users.avatarUrl, users: undefined } as Post;
  },

  // --- Challenge & Ranking ---
  getGlobalChallengeProgress: async (): Promise<{ challenge: Challenge | null; totalDistance: number; }> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    let { data: challengeData, error: challengeError } = await supabase!.from('challenges').select('*').limit(1).single();
    
    if (challengeError && challengeError.code !== 'PGRST116') {
        const defaultChallenge: Omit<Challenge, 'id'> = {
            title: 'Desafio Global de Corrida',
            description: 'Acumular 50.000km corridos somando todos os alunos da academia.',
            targetValue: 50000,
            unit: 'km',
            startDate: '2024-01-01',
            endDate: '2024-12-31'
        };
        const { data: newChallenge, error: createError } = await supabase!.from('challenges').insert([
          {
            ...defaultChallenge,
            start_date: defaultChallenge.startDate,
            end_date: defaultChallenge.endDate
          }
        ]).select().single();
        if (createError) throw createError;
        challengeData = { ...newChallenge, startDate: newChallenge.start_date, endDate: newChallenge.end_date };
    }

    let totalDistance = 0;
    if (challengeData) {
        const startDate = new Date(challengeData.startDate || challengeData.start_date);
        const endDate = new Date(challengeData.endDate || challengeData.end_date);
        const today = new Date();

        if (today >= startDate && today <= endDate) {
            const totalDuration = endDate.getTime() - startDate.getTime();
            const elapsedDuration = today.getTime() - startDate.getTime();
            const baseProgressPerDay = challengeData.targetValue / (totalDuration / (1000 * 60 * 60 * 24));
            const simulatedProgress = baseProgressPerDay * (elapsedDuration / (1000 * 60 * 60 * 24));
            totalDistance = Math.min(challengeData.targetValue, Math.round(simulatedProgress + (Math.random() * (challengeData.targetValue * 0.05))));
        } else if (today > endDate) {
            totalDistance = challengeData.targetValue;
        }
    }

    return { challenge: challengeData as Challenge, totalDistance };
  },

  // --- Reports ---
  getFinancialReport: async (year: number): Promise<{ name: string; students: number; revenue: number; }[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyData = monthNames.map(name => ({ name, students: 0, revenue: 0 }));

    const { data: payments, error } = await supabase!.from('payments')
      .select('amount, due_date')
      .eq('status', 'PAID')
      .gte('due_date', `${year}-01-01`)
      .lte('due_date', `${year}-12-31`);

    if (error) throw error;

    payments.forEach(p => {
       const [y, m, d] = String(p.due_date).split('-').map(Number);
       if (y === year) {
           const idx = m - 1;
           if (idx >= 0 && idx < 12) {
               monthlyData[idx].revenue += p.amount;
               monthlyData[idx].students += 1; 
           }
       }
    });
    return monthlyData;
  },

  getAttendanceReport: async (): Promise<{ name: string; attendance: number; }[]> => {
    const configError = getSupabaseConfigError();
    if (configError) throw configError;

    const { data: attendanceRecords, error: attendanceError } = await supabase!
        .from('attendance')
        .select('date, is_present')
        .eq('is_present', true);

    if (attendanceError) throw attendanceError;

    const dayOfWeekCounts: { [key: string]: number } = {};
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    attendanceRecords.forEach(record => {
        const recordDate = new Date(String(record.date));
        const dayIndex = recordDate.getDay();
        const dayName = dayNames[dayIndex];
        dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
    });

    const reportData = dayNames.map(dayName => ({
        name: dayName.substring(0, 3),
        attendance: dayOfWeekCounts[dayName] || 0
    }));

    return reportData;
  },
};