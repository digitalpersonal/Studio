
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, ClassSession, Assessment, Payment, Anamnesis, AttendanceRecord, Route, Challenge, PersonalizedWorkout, Post } from '../types';
import { UserRole } from '../types';

const SUPABASE_URL = "https://xdjrrxrepnnkvpdbbtot.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanJyeHJlcG5ua3ZwZGJidG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjM3NzgsImV4cCI6MjA4MTg5OTc3OH0.6M4HQAVS0Z6cdvwMJCeOSvCKBkozHwQz3X9tgaZojEk";

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const mapUserFromDb = (dbUser: any): User => ({
  ...dbUser,
  role: dbUser.role as UserRole,
  avatarUrl: dbUser.avatar_url,
  joinDate: dbUser.join_date,
  phoneNumber: dbUser.phone_number,
  birthDate: dbUser.birth_date,
  maritalStatus: dbUser.marital_status,
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

export const SupabaseService = {
  supabase,

  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase!.from('users').select('*').order('name');
    if (error) throw error;
    return (data as any[]).map(mapUserFromDb);
  },

  getAllStudents: async (): Promise<User[]> => {
    const { data, error } = await supabase!.from('users').select('*').eq('role', UserRole.STUDENT).order('name');
    if (error) throw error;
    return (data as any[]).map(mapUserFromDb);
  },

  addUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const { data, error } = await supabase!.from('users').insert([{
      ...user,
      avatar_url: user.avatarUrl,
      join_date: user.joinDate,
      phone_number: user.phoneNumber,
      birth_date: user.birthDate,
      marital_status: user.maritalStatus,
      plan_value: user.planValue,
      plan_duration: user.planDuration,
      billing_day: user.billingDay,
      plan_start_date: user.planStartDate,
      profile_completed: user.profileCompleted
    }]).select().single();
    if (error) throw error;
    return mapUserFromDb(data);
  },

  updateUser: async (u: User): Promise<User> => {
    const { data, error } = await supabase!.from('users').update({
      ...u,
      avatar_url: u.avatarUrl,
      phone_number: u.phoneNumber,
      birth_date: u.birthDate,
      marital_status: u.maritalStatus,
      plan_value: u.planValue,
      plan_duration: u.planDuration,
      billing_day: u.billingDay,
      plan_start_date: u.planStartDate,
      profile_completed: u.profileCompleted
    }).eq('id', u.id).select().single();
    if (error) throw error;
    return mapUserFromDb(data);
  },

  deleteUser: async (id: string) => {
    const { error } = await supabase!.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  // --- PAYMENTS ---
  getPayments: async (userId?: string): Promise<Payment[]> => {
    let query = supabase!.from('payments').select('*').order('due_date');
    if (userId) query = query.eq('student_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(p => ({ ...p, studentId: p.student_id, dueDate: p.due_date })) as Payment[];
  },

  markPaymentAsPaid: async (id: string) => {
    const { error } = await supabase!.from('payments').update({ status: 'PAID' }).eq('id', id);
    if (error) throw error;
  },

  updatePayment: async (p: any) => {
    const { error } = await supabase!.from('payments').update({
        amount: p.amount,
        due_date: p.due_date,
        status: p.status || 'PENDING'
    }).eq('id', p.id);
    if (error) throw error;
  },

  addPayment: async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
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

  // --- CLASSES ---
  getClasses: async (): Promise<ClassSession[]> => {
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

  addClass: async (c: Omit<ClassSession, 'id'>): Promise<ClassSession> => {
    const { data, error } = await supabase!.from('classes').insert([{
      title: c.title,
      description: c.description,
      day_of_week: c.dayOfWeek,
      date: c.date,
      start_time: c.startTime,
      duration_minutes: c.durationMinutes,
      instructor: c.instructor,
      max_capacity: c.maxCapacity,
      type: c.type,
      wod: c.wod,
      workout_details: c.workoutDetails,
      enrolled_student_ids: c.enrolledStudentIds || [],
      waitlist_student_ids: c.waitlistStudentIds || []
    }]).select().single();
    if (error) throw error;
    return { ...data, dayOfWeek: data.day_of_week, startTime: data.start_time, enrolledStudentIds: data.enrolled_student_ids, waitlistStudentIds: data.waitlist_student_ids } as ClassSession;
  },

  updateClass: async (c: ClassSession): Promise<ClassSession> => {
    const { data, error } = await supabase!.from('classes').update({
      title: c.title,
      description: c.description,
      day_of_week: c.dayOfWeek,
      date: c.date,
      start_time: c.startTime,
      duration_minutes: c.durationMinutes,
      instructor: c.instructor,
      max_capacity: c.maxCapacity,
      type: c.type,
      wod: c.wod,
      workout_details: c.workoutDetails,
      enrolled_student_ids: c.enrolledStudentIds,
      waitlist_student_ids: c.waitlistStudentIds
    }).eq('id', c.id).select().single();
    if (error) throw error;
    return { ...data, dayOfWeek: data.day_of_week, startTime: data.start_time, enrolledStudentIds: data.enrolled_student_ids, waitlistStudentIds: data.waitlist_student_ids } as ClassSession;
  },

  deleteClass: async (id: string) => {
    const { error } = await supabase!.from('classes').delete().eq('id', id);
    if (error) throw error;
  },

  getAttendanceByClassAndDate: async (classId: string, date: string): Promise<AttendanceRecord[]> => {
    const { data, error } = await supabase!.from('attendance').select('*').eq('class_id', classId).eq('date', date);
    if (error) throw error;
    return data.map(r => ({ ...r, classId: r.class_id, studentId: r.student_id, isPresent: r.is_present })) as AttendanceRecord[];
  },

  saveAttendance: async (records: Omit<AttendanceRecord, 'id'>[]) => {
    for (const record of records) {
      const { error } = await supabase!.from('attendance').upsert({
        class_id: record.classId,
        student_id: record.studentId,
        date: record.date,
        is_present: record.isPresent
      }, { onConflict: 'class_id,student_id,date' });
      if (error) throw error;
    }
  },

  getGlobalChallengeProgress: async (): Promise<{ challenge: Challenge | null; totalDistance: number; ranking: {studentId: string, total: number}[] }> => {
    try {
        const { data: challengeData, error } = await supabase!.from('challenges').select('*').order('start_date', { ascending: false }).limit(1).maybeSingle();
        if (error || !challengeData) return { challenge: null, totalDistance: 0, ranking: [] };
        const { data: entries, error: entriesError } = await supabase!.from('challenge_entries').select('student_id, value').eq('challenge_id', challengeData.id);
        if (entriesError) return { challenge: challengeData as Challenge, totalDistance: 0, ranking: [] };
        const total = entries.reduce((acc, curr) => acc + Number(curr.value), 0);
        const rankingMap: Record<string, number> = {};
        entries.forEach(e => { rankingMap[e.student_id] = (rankingMap[e.student_id] || 0) + Number(e.value); });
        const ranking = Object.entries(rankingMap).map(([studentId, total]) => ({ studentId, total })).sort((a,b) => b.total - a.total);
        return { challenge: challengeData as Challenge, totalDistance: total, ranking };
    } catch (err) {
        return { challenge: null, totalDistance: 0, ranking: [] };
    }
  },

  saveChallenge: async (challenge: Omit<Challenge, 'id'>): Promise<Challenge> => {
    const { data, error } = await supabase!.from('challenges').insert([{
      title: challenge.title,
      description: challenge.description,
      target_value: challenge.targetValue,
      unit: challenge.unit,
      start_date: challenge.startDate,
      end_date: challenge.endDate
    }]).select().single();
    if (error) throw error;
    return { ...data, targetValue: data.target_value, startDate: data.start_date, endDate: data.end_date } as Challenge;
  },

  addChallengeEntry: async (challengeId: string, studentId: string, value: number) => {
    const { error } = await supabase!.from('challenge_entries').insert([{ challenge_id: challengeId, student_id: studentId, value: Number(value) }]);
    if (error) throw error;
  },

  getPersonalizedWorkouts: async (userId?: string): Promise<PersonalizedWorkout[]> => {
    let query = supabase!.from('personalized_workouts').select('*').order('created_at', { ascending: false });
    if (userId) query = query.filter('student_ids', 'cs', `["${userId}"]`);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(w => ({ ...w, studentIds: w.student_ids || [], createdAt: w.created_at, videoUrl: w.video_url, instructorName: w.instructor_name })) as PersonalizedWorkout[];
  },

  addPersonalizedWorkout: async (w: Omit<PersonalizedWorkout, 'id'>): Promise<PersonalizedWorkout> => {
    const { data, error } = await supabase!.from('personalized_workouts').insert([{
      title: w.title,
      description: w.description,
      video_url: w.videoUrl,
      student_ids: w.studentIds || [],
      instructor_name: w.instructorName,
      created_at: w.createdAt
    }]).select().single();
    if (error) throw error;
    return { ...data, studentIds: data.student_ids, instructorName: data.instructor_name, videoUrl: data.video_url, createdAt: data.created_at } as PersonalizedWorkout;
  },

  updatePersonalizedWorkout: async (w: PersonalizedWorkout): Promise<PersonalizedWorkout> => {
    const { data, error } = await supabase!.from('personalized_workouts').update({
      title: w.title,
      description: w.description,
      video_url: w.videoUrl,
      student_ids: w.studentIds,
      instructor_name: w.instructorName
    }).eq('id', w.id).select().single();
    if (error) throw error;
    return { ...data, studentIds: data.student_ids, instructorName: data.instructor_name, videoUrl: data.video_url, createdAt: data.created_at } as PersonalizedWorkout;
  },

  deletePersonalizedWorkout: async (id: string) => {
    const { error } = await supabase!.from('personalized_workouts').delete().eq('id', id);
    if (error) throw error;
  },

  getAssessments: async (studentId?: string): Promise<Assessment[]> => {
    let query = supabase!.from('assessments').select('*').order('date', { ascending: false });
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(a => ({
      ...a,
      studentId: a.student_id,
      bodyFatPercentage: a.body_fat_percentage,
      horizontalJump: a.horizontal_jump,
      verticalJump: a.vertical_jump,
      medicineBallThrow: a.medicine_ball_throw
    })) as Assessment[];
  },

  addAssessment: async (a: Omit<Assessment, 'id'>): Promise<Assessment> => {
    const { data, error } = await supabase!.from('assessments').insert([{
      student_id: a.studentId,
      date: a.date,
      status: a.status,
      notes: a.notes,
      weight: a.weight,
      height: a.height,
      body_fat_percentage: a.bodyFatPercentage,
      horizontal_jump: a.horizontalJump,
      vertical_jump: a.verticalJump,
      medicine_ball_throw: a.medicineBallThrow,
      fms: a.fms,
      circumferences: a.circumferences
    }]).select().single();
    if (error) throw error;
    return { ...data, studentId: data.student_id, bodyFatPercentage: data.body_fat_percentage } as Assessment;
  },

  updateAssessment: async (a: Assessment): Promise<Assessment> => {
    const { data, error } = await supabase!.from('assessments').update({
      date: a.date,
      status: a.status,
      notes: a.notes,
      weight: a.weight,
      height: a.height,
      body_fat_percentage: a.bodyFatPercentage,
      horizontal_jump: a.horizontalJump,
      vertical_jump: a.verticalJump,
      medicine_ball_throw: a.medicineBallThrow,
      fms: a.fms,
      circumferences: a.circumferences
    }).eq('id', a.id).select().single();
    if (error) throw error;
    return { ...data, studentId: data.student_id, bodyFatPercentage: data.body_fat_percentage } as Assessment;
  },

  deleteAssessment: async (id: string) => {
    const { error } = await supabase!.from('assessments').delete().eq('id', id);
    if (error) throw error;
  },

  getRoutes: async (): Promise<Route[]> => {
    const { data, error } = await supabase!.from('routes').select('*').order('title');
    if (error) throw error;
    return data.map(r => ({ ...r, distanceKm: r.distance_km, mapLink: r.map_link, elevationGain: r.elevation_gain })) as Route[];
  },

  addRoute: async (r: Omit<Route, 'id'>): Promise<Route> => {
    const { data, error } = await supabase!.from('routes').insert([{
      title: r.title,
      description: r.description,
      distance_km: r.distanceKm,
      map_link: r.mapLink,
      difficulty: r.difficulty,
      elevation_gain: r.elevationGain
    }]).select().single();
    if (error) throw error;
    return { ...data, distanceKm: data.distance_km, mapLink: data.map_link, elevationGain: data.elevation_gain } as Route;
  },

  updateRoute: async (r: Route): Promise<Route> => {
    const { data, error } = await supabase!.from('routes').update({
      title: r.title,
      description: r.description,
      distance_km: r.distanceKm,
      map_link: r.mapLink,
      difficulty: r.difficulty,
      elevation_gain: r.elevationGain
    }).eq('id', r.id).select().single();
    if (error) throw error;
    return { ...data, distanceKm: data.distance_km, mapLink: data.map_link, elevationGain: data.elevation_gain } as Route;
  },

  deleteRoute: async (id: string) => {
    const { error } = await supabase!.from('routes').delete().eq('id', id);
    if (error) throw error;
  },

  getPosts: async (): Promise<Post[]> => {
    const { data, error } = await supabase!.from('posts').select(`
      *,
      users:user_id (name, avatar_url)
    `).order('timestamp', { ascending: false });
    if (error) throw error;
    return data.map(p => ({
      ...p,
      userId: p.user_id,
      userName: p.users?.name || 'Desconhecido',
      userAvatar: p.users?.avatar_url || '',
      imageUrl: p.image_url,
    })) as Post[];
  },

  addPost: async (p: Omit<Post, 'id' | 'userName' | 'userAvatar' | 'likes'>): Promise<Post> => {
    const { data, error } = await supabase!.from('posts').insert([{
      user_id: p.userId,
      image_url: p.imageUrl,
      caption: p.caption,
      timestamp: p.timestamp,
      likes: []
    }]).select(`
      *,
      users:user_id (name, avatar_url)
    `).single();
    if (error) throw error;
    return {
      ...data,
      userId: data.user_id,
      userName: data.users?.name || 'Desconhecido',
      userAvatar: data.users?.avatar_url || '',
      imageUrl: data.image_url,
    } as Post;
  },

  addLikeToPost: async (postId: string, userId: string): Promise<Post> => {
    const { data: post, error: fetchError } = await supabase!.from('posts').select('likes').eq('id', postId).single();
    if (fetchError) throw fetchError;
    let likes = post.likes || [];
    if (likes.includes(userId)) {
      likes = likes.filter((id: string) => id !== userId);
    } else {
      likes.push(userId);
    }
    const { data, error } = await supabase!.from('posts').update({ likes }).eq('id', postId).select(`
      *,
      users:user_id (name, avatar_url)
    `).single();
    if (error) throw error;
    return {
      ...data,
      userId: data.user_id,
      userName: data.users?.name || 'Desconhecido',
      userAvatar: data.users?.avatar_url || '',
      imageUrl: data.image_url,
    } as Post;
  },

  getFinancialReport: async (year: number): Promise<any[]> => {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const { data, error } = await supabase!.from('payments').select('amount, due_date, status').eq('status', 'PAID').gte('due_date', start).lte('due_date', end);
    if (error) throw error;
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const report = months.map(m => ({ name: m, revenue: 0, students: 0 }));
    data.forEach(p => {
      const monthIndex = new Date(p.due_date).getMonth();
      report[monthIndex].revenue += Number(p.amount);
      report[monthIndex].students += 1;
    });
    return report;
  },

  getAttendanceReport: async (): Promise<any[]> => {
    const { data, error } = await supabase!.from('attendance').select('date').eq('is_present', true);
    if (error) throw error;
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const report: Record<string, number> = {};
    days.forEach(d => report[d] = 0);
    data.forEach(a => {
      const dayName = days[new Date(a.date).getDay()];
      report[dayName] += 1;
    });
    return Object.entries(report).map(([name, attendance]) => ({ name, attendance }));
  }
};
