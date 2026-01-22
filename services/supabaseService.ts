
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, ClassSession, Assessment, Payment, Anamnesis, AttendanceRecord, Route, Challenge, PersonalizedWorkout, Post } from '../types';
import { UserRole } from '../types';

const SUPABASE_URL = "https://xdjrrxrepnnkvpdbbtot.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanJyeHJlcG5ua3ZwZGJidG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjM3NzgsImV4cCI6MjA4MTg5OTc3OH0.6M4HQAVS0Z6cdvwMJCeOSvCKBkozHwQz3X9tgaZojEk";

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Erro ao inicializar cliente Supabase:", e);
  }
}

const mapUserFromDb = (dbUser: any): User => {
  if (!dbUser) return {} as User;
  return {
    ...dbUser,
    role: (dbUser.role as UserRole) || UserRole.STUDENT,
    avatarUrl: dbUser.avatar_url || '',
    joinDate: dbUser.join_date || new Date().toISOString(),
    phoneNumber: dbUser.phone_number || '',
    birthDate: dbUser.birth_date || '',
    maritalStatus: dbUser.marital_status || '',
    planValue: dbUser.plan_value || 0,
    planDuration: dbUser.plan_duration || 12,
    billingDay: dbUser.billing_day || 5,
    planStartDate: dbUser.plan_start_date || '',
    profileCompleted: !!dbUser.profile_completed,
    address: dbUser.address || {},
    anamnesis: dbUser.anamnesis || {}
  };
};

const mapUserToDb = (u: Partial<User>) => ({
    name: u.name,
    email: u.email,
    password: u.password,
    role: u.role,
    avatar_url: u.avatarUrl,
    join_date: u.joinDate,
    phone_number: u.phoneNumber,
    birth_date: u.birthDate,
    marital_status: u.maritalStatus,
    plan_value: u.planValue,
    plan_duration: u.planDuration,
    billing_day: u.billingDay,
    plan_start_date: u.planStartDate,
    profile_completed: u.profileCompleted,
    address: u.address || {},
    anamnesis: u.anamnesis || {}
});

export const SupabaseService = {
  supabase,

  getAllUsers: async (): Promise<User[]> => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('users').select('*').order('name');
      if (error) throw error;
      return (data || []).map(mapUserFromDb);
    } catch (e) {
      console.error("Erro em getAllUsers:", e);
      return [];
    }
  },

  addUser: async (user: Omit<User, 'id'>): Promise<User> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('users').insert([mapUserToDb(user)]).select().single();
    if (error) throw error;
    return mapUserFromDb(data);
  },

  updateUser: async (u: User): Promise<User> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('users').update(mapUserToDb(u)).eq('id', u.id).select().single();
    if (error) throw error;
    return mapUserFromDb(data);
  },

  deleteUser: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  getPayments: async (userId?: string): Promise<Payment[]> => {
    if (!supabase) return [];
    try {
      let query = supabase.from('payments').select('*').order('due_date', { ascending: false });
      if (userId) query = query.eq('student_id', userId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(p => ({ ...p, studentId: p.student_id, dueDate: p.due_date })) as Payment[];
    } catch (e) {
      console.error("Erro em getPayments:", e);
      return [];
    }
  },

  markPaymentAsPaid: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('payments').update({ status: 'PAID' }).eq('id', id);
    if (error) throw error;
  },

  getClasses: async (): Promise<ClassSession[]> => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('classes').select('*').order('day_of_week').order('start_time');
      if (error) throw error;
      return (data || []).map(c => ({
        ...c,
        dayOfWeek: c.day_of_week,
        startTime: c.start_time,
        durationMinutes: c.duration_minutes,
        maxCapacity: c.max_capacity,
        enrolledStudentIds: c.enrolled_student_ids || [],
        waitlistStudentIds: c.waitlist_student_ids || [],
        workoutDetails: c.workout_details
      })) as ClassSession[];
    } catch (e) {
      return [];
    }
  },

  addClass: async (c: Omit<ClassSession, 'id'>): Promise<ClassSession> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('classes').insert([{
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
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('classes').update({
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
    if (!supabase) return;
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) throw error;
  },

  getAttendanceByClassAndDate: async (classId: string, date: string): Promise<AttendanceRecord[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('attendance').select('*').eq('class_id', classId).eq('date', date);
    if (error) return [];
    return (data || []).map(r => ({ ...r, classId: r.class_id, studentId: r.student_id, isPresent: r.is_present })) as AttendanceRecord[];
  },

  saveAttendance: async (records: Omit<AttendanceRecord, 'id'>[]) => {
    if (!supabase) return;
    for (const record of records) {
      await supabase.from('attendance').upsert({
        class_id: record.classId,
        student_id: record.studentId,
        date: record.date,
        is_present: record.isPresent
      }, { onConflict: 'class_id,student_id,date' });
    }
  },

  getAssessments: async (studentId?: string): Promise<Assessment[]> => {
    if (!supabase) return [];
    let query = supabase.from('assessments').select('*').order('date', { ascending: false });
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map((a: any) => ({
      ...a,
      studentId: a.student_id,
      bodyFatPercentage: a.body_fat_percentage,
      horizontalJump: a.horizontal_jump,
      verticalJump: a.vertical_jump,
      medicineBallThrow: a.medicine_ball_throw
    })) as Assessment[];
  },

  addAssessment: async (a: Omit<Assessment, 'id'>): Promise<Assessment> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('assessments').insert([{
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
      fms: a.fms || {},
      circumferences: a.circumferences || {}
    }]).select().single();
    if (error) throw error;
    return { 
      ...data, 
      studentId: data.student_id, 
      bodyFatPercentage: data.body_fat_percentage,
      horizontalJump: data.horizontal_jump,
      verticalJump: data.vertical_jump,
      medicineBallThrow: data.medicine_ball_throw
    } as Assessment;
  },

  updateAssessment: async (a: Assessment): Promise<Assessment> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('assessments').update({
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
      fms: a.fms || {},
      circumferences: a.circumferences || {}
    }).eq('id', a.id).select().single();
    if (error) throw error;
    return { 
      ...data, 
      studentId: data.student_id, 
      bodyFatPercentage: data.body_fat_percentage,
      horizontalJump: data.horizontal_jump,
      verticalJump: data.vertical_jump,
      medicineBallThrow: data.medicine_ball_throw
    } as Assessment;
  },

  deleteAssessment: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('assessments').delete().eq('id', id);
    if (error) throw error;
  },

  getPersonalizedWorkouts: async (studentId?: string): Promise<PersonalizedWorkout[]> => {
    if (!supabase) return [];
    let query = supabase.from('personalized_workouts').select('*').order('created_at', { ascending: false });
    if (studentId) query = query.contains('student_ids', [studentId]);
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(pw => ({
      ...pw,
      studentIds: pw.student_ids,
      createdAt: pw.created_at,
      instructorName: pw.instructor_name
    })) as PersonalizedWorkout[];
  },

  addPersonalizedWorkout: async (pw: Omit<PersonalizedWorkout, 'id'>): Promise<PersonalizedWorkout> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('personalized_workouts').insert([{
      title: pw.title,
      description: pw.description,
      video_url: pw.videoUrl,
      student_ids: pw.studentIds,
      created_at: pw.createdAt,
      instructor_name: pw.instructorName
    }]).select().single();
    if (error) throw error;
    return { ...data, studentIds: data.student_ids, createdAt: data.created_at, instructorName: data.instructor_name } as PersonalizedWorkout;
  },

  updatePersonalizedWorkout: async (pw: PersonalizedWorkout): Promise<PersonalizedWorkout> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('personalized_workouts').update({
      title: pw.title,
      description: pw.description,
      video_url: pw.videoUrl,
      student_ids: pw.studentIds,
      instructor_name: pw.instructorName
    }).eq('id', pw.id).select().single();
    if (error) throw error;
    return { ...data, studentIds: data.student_ids, createdAt: data.created_at, instructorName: data.instructor_name } as PersonalizedWorkout;
  },

  deletePersonalizedWorkout: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('personalized_workouts').delete().eq('id', id);
    if (error) throw error;
  },

  getGlobalChallengeProgress: async () => {
    if (!supabase) return { challenge: null, totalDistance: 0, ranking: [] };
    try {
        const { data: challengeData } = await supabase.from('challenges').select('*').order('start_date', { ascending: false }).limit(1).maybeSingle();
        if (!challengeData) return { challenge: null, totalDistance: 0, ranking: [] };
        const { data: entries } = await supabase.from('challenge_entries').select('student_id, value').eq('challenge_id', challengeData.id);
        const total = (entries || []).reduce((acc, curr) => acc + Number(curr.value), 0);
        const rankingMap: Record<string, number> = {};
        (entries || []).forEach(e => { rankingMap[e.student_id] = (rankingMap[e.student_id] || 0) + Number(e.value); });
        const ranking = Object.entries(rankingMap).map(([studentId, total]) => ({ studentId, total })).sort((a,b) => b.total - a.total);
        return { 
          challenge: { 
            ...challengeData, 
            targetValue: challengeData.target_value, 
            startDate: challengeData.start_date, 
            endDate: challengeData.end_date 
          } as Challenge, 
          totalDistance: total, 
          ranking 
        };
    } catch (err) {
        return { challenge: null, totalDistance: 0, ranking: [] };
    }
  },

  saveChallenge: async (c: Omit<Challenge, 'id'>): Promise<Challenge> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('challenges').insert([{
      title: c.title,
      description: c.description,
      target_value: c.targetValue,
      unit: c.unit,
      start_date: c.startDate,
      end_date: c.endDate
    }]).select().single();
    if (error) throw error;
    return { ...data, targetValue: data.target_value, startDate: data.start_date, endDate: data.end_date } as Challenge;
  },

  addChallengeEntry: async (challengeId: string, studentId: string, value: number) => {
    if (!supabase) return;
    const { error } = await supabase.from('challenge_entries').insert([{
      challenge_id: challengeId,
      student_id: studentId,
      value: value
    }]);
    if (error) throw error;
  },

  getFinancialReport: async (year: number): Promise<any[]> => {
    if (!supabase) return [];
    const { data } = await supabase.from('payments').select('amount, due_date').eq('status', 'PAID').gte('due_date', `${year}-01-01`).lte('due_date', `${year}-12-31`);
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const report = months.map(m => ({ name: m, revenue: 0, students: 0 }));
    (data || []).forEach(p => {
      const m = new Date(p.due_date).getMonth();
      if (m >= 0 && m < 12) {
        report[m].revenue += Number(p.amount);
        report[m].students += 1;
      }
    });
    return report;
  },

  getAttendanceReport: async (): Promise<any[]> => {
    if (!supabase) return [];
    const { data } = await supabase.from('attendance').select('date').eq('is_present', true);
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const report: Record<string, number> = {};
    days.forEach(d => report[d] = 0);
    (data || []).forEach(a => { report[days[new Date(a.date).getDay()]] += 1; });
    return Object.entries(report).map(([name, attendance]) => ({ name, attendance }));
  },

  getRoutes: async (): Promise<Route[]> => {
    if (!supabase) return [];
    const { data } = await supabase.from('routes').select('*').order('title');
    return (data || []).map(r => ({ ...r, distanceKm: r.distance_km, mapLink: r.map_link, elevationGain: r.elevation_gain })) as Route[];
  },

  addRoute: async (r: Omit<Route, 'id'>): Promise<Route> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('routes').insert([{
      title: r.title,
      distance_km: r.distanceKm,
      description: r.description,
      map_link: r.mapLink,
      difficulty: r.difficulty,
      elevation_gain: r.elevationGain
    }]).select().single();
    if (error) throw error;
    return { ...data, distanceKm: data.distance_km, mapLink: data.map_link, elevationGain: data.elevation_gain } as Route;
  },

  updateRoute: async (r: Route): Promise<Route> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('routes').update({
      title: r.title,
      distance_km: r.distanceKm,
      description: r.description,
      map_link: r.mapLink,
      difficulty: r.difficulty,
      elevation_gain: r.elevationGain
    }).eq('id', r.id).select().single();
    if (error) throw error;
    return { ...data, distanceKm: data.distance_km, mapLink: data.map_link, elevationGain: data.elevation_gain } as Route;
  },

  deleteRoute: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('routes').delete().eq('id', id);
    if (error) throw error;
  },

  getPosts: async (): Promise<Post[]> => {
    if (!supabase) return [];
    const { data } = await supabase.from('posts').select('*, users(name, avatar_url)').order('timestamp', { ascending: false });
    return (data || []).map(p => ({
      ...p,
      userId: p.user_id,
      userName: p.users?.name || 'Membro',
      userAvatar: p.users?.avatar_url || '',
      imageUrl: p.image_url,
    })) as Post[];
  },

  addPost: async (p: any): Promise<Post> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('posts').insert([{
      user_id: p.userId,
      image_url: p.imageUrl,
      caption: p.caption,
      timestamp: new Date().toISOString(),
      likes: []
    }]).select('*, users(name, avatar_url)').single();
    if (error) throw error;
    return { ...data, userId: data.user_id, userName: data.users?.name, userAvatar: data.users?.avatar_url, imageUrl: data.image_url } as Post;
  },

  addLikeToPost: async (postId: string, userId: string) => {
    if (!supabase) return;
    const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
    let likes = post?.likes || [];
    if (likes.includes(userId)) likes = likes.filter((id: string) => id !== userId);
    else likes.push(userId);
    const { data, error } = await supabase.from('posts').update({ likes }).eq('id', postId).select('*, users(name, avatar_url)').single();
    if (error) throw error;
    return { ...data, userId: data.user_id, userName: data.users?.name, userAvatar: data.users?.avatar_url, imageUrl: data.image_url } as Post;
  }
};
