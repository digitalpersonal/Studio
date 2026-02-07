
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { User, ClassSession, Assessment, Payment, AttendanceRecord, Route, Challenge, PersonalizedWorkout, Post, Comment, UserRole, AcademySettings, CycleSummary, Plan, Notice } from '../types';
import { SUPER_ADMIN_CONFIG } from '../constants';

export const SUPABASE_PROJECT_ID = "xdjrrxrepnnkvpdbbtot";
export const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanJyeHJlcG5ua3ZwZGJidG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjM3NzgsImV4cCI6MjA4MTg5OTc3OH0.6M4HQAVS0Z6cdvwMJCeOSvCKBkozHwQz3X9tgaZojEk";

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Erro ao inicializar Supabase:", e);
  }
}

const formatDateForDb = (dateStr?: string) => {
  if (!dateStr || dateStr.trim() === "") return null;
  return dateStr;
};

const mapNoticeFromDb = (n: any): Notice => ({
  id: n.id,
  title: n.title,
  content: n.content,
  priority: n.priority as 'INFO' | 'WARNING' | 'URGENT',
  createdAt: n.created_at
});

const mapPostFromDb = (p: any): Post => ({
  id: p.id,
  userId: p.user_id,
  userName: p.users?.name,
  userAvatar: p.users?.avatar_url,
  imageUrl: p.image_url,
  caption: p.caption,
  likes: p.likes || [],
  timestamp: p.timestamp,
  comments: (p.post_comments || []).map((c: any) => ({
    id: c.id,
    postId: c.post_id,
    userId: c.user_id,
    userName: c.users?.name,
    userAvatar: c.users?.avatar_url,
    content: c.content,
    createdAt: c.created_at
  }))
});

const mapUserFromDb = (u: any): User => ({
  ...u,
  password: u.password,
  planId: u.plan_id,
  avatarUrl: u.avatar_url,
  joinDate: u.join_date,
  phoneNumber: u.phone_number,
  birthDate: u.birth_date,
  maritalStatus: u.marital_status,
  planValue: Number(u.plan_value) || 0,
  planDiscount: Number(u.plan_discount) || 0,
  planDuration: u.plan_duration || 1,
  billingDay: u.billing_day || 5,
  planStartDate: u.plan_start_date,
  contractUrl: u.contract_url,
  contractGeneratedAt: u.contract_generated_at,
  profileCompleted: !!u.profile_completed,
  address: u.address || {},
  anamnesis: u.anamnesis || {},
  status: u.status || 'ACTIVE',
  stravaAccessToken: u.strava_access_token,
  strava_refresh_token: u.strava_refresh_token,
});

const mapClassFromDb = (c: any): ClassSession => ({
  ...c,
  dayOfWeek: c.day_of_week,
  startTime: c.start_time,
  durationMinutes: c.duration_minutes,
  maxCapacity: c.max_capacity,
  enrolledStudentIds: c.enrolled_student_ids || [],
  waitlistStudentIds: c.waitlist_student_ids || [],
  workoutDetails: c.workout_details,
  isCancelled: c.is_cancelled,
  cycleStartDate: c.cycle_start_date,
  weekOfCycle: c.week_of_cycle,
  weekFocus: c.week_focus,
  estimatedVolumeMinutes: c.estimated_volume_minutes,
  weekObjective: c.week_objective,
  referenceWorkouts: c.reference_workouts,
  mainWorkout: c.main_workout,
  distanceKm: c.distance_km,
});

const mapPaymentFromDb = (p: any): Payment => ({
  ...p,
  studentId: p.student_id,
  dueDate: p.due_date,
  amount: Number(p.amount) || 0,
  discount: Number(p.discount) || 0,
  installmentNumber: p.installment_number,
  total_installments: p.total_installments
});

const mapAttendanceFromDb = (r: any): AttendanceRecord => ({
  id: r.id,
  classId: r.class_id,
  studentId: r.student_id,
  date: r.date,
  isPresent: r.is_present,
  totalTimeSeconds: r.total_time_seconds,
  averagePace: r.average_pace,
  ageGroupClassification: r.age_group_classification,
  instructorNotes: r.instructor_notes,
  generatedFeedback: r.generated_feedback,
});

const mapAssessmentFromDb = (a: any): Assessment => ({
  id: a.id,
  studentId: a.student_id,
  date: a.date,
  status: a.status as 'DONE' | 'SCHEDULED',
  notes: a.notes || '',
  weight: Number(a.weight) || 0,
  height: Number(a.height) || 0,
  bodyFatPercentage: Number(a.body_fat_percentage) || 0,
  skeletalMuscleMass: Number(a.skeletal_muscle_mass) || 0,
  visceralFatLevel: Number(a.visceral_fat_level) || 0,
  basalMetabolicRate: Number(a.basal_metabolic_rate) || 0,
  hydrationPercentage: Number(a.hydration_percentage) || 0,
  abdominalTest: Number(a.abdominal_test) || 0,
  horizontalJump: Number(a.horizontal_jump) || 0,
  verticalJump: Number(a.vertical_jump) || 0,
  medicineBallThrow: Number(a.medicine_ball_throw) || 0,
  photoFrontUrl: a.photo_front_url || '',
  photoSideUrl: a.photo_side_url || '',
  photoBackUrl: a.photo_back_url || '',
  fms: a.fms || {},
  circumferences: a.circumferences || {}
});

const CACHE_TTL = 30000;
const _cache: Record<string, { data: any, timestamp: number }> = {};
const _listeners: Set<(table: string) => void> = new Set();
let _realtimeChannel: RealtimeChannel | null = null;

const invalidateCache = (key?: string) => {
  if (key) delete _cache[key];
  else Object.keys(_cache).forEach(k => delete _cache[k]);
};

export const SupabaseService = {
  supabase,

  subscribe: (callback: (table: string) => void) => {
    _listeners.add(callback);
    if (!_realtimeChannel && supabase) {
      _realtimeChannel = supabase.channel('app-realtime')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          invalidateCache();
          _listeners.forEach(fn => fn(payload.table));
        })
        .subscribe();
    }
    return () => {
      _listeners.delete(callback);
      if (_listeners.size === 0 && _realtimeChannel) {
        _realtimeChannel.unsubscribe();
        _realtimeChannel = null;
      }
    };
  },

  getNotices: async (): Promise<Notice[]> => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapNoticeFromDb);
    } catch (e) {
      console.error("Erro ao buscar avisos:", e);
      return [];
    }
  },

  addNotice: async (n: Omit<Notice, 'id' | 'createdAt'>): Promise<Notice> => {
    if (!supabase) throw new Error("Sem conexão com o banco");
    try {
      const { data, error } = await supabase.from('notices').insert([{
        title: n.title, 
        content: n.content, 
        priority: n.priority
      }]).select().single();
      
      if (error) throw error;
      invalidateCache();
      return mapNoticeFromDb(data);
    } catch (e: any) {
      throw e;
    }
  },

  updateNotice: async (n: Notice): Promise<Notice> => {
    if (!supabase) throw new Error("Sem conexão com o banco");
    try {
      const { data, error } = await supabase.from('notices').update({
        title: n.title, 
        content: n.content, 
        priority: n.priority
      }).eq('id', n.id).select().single();
      
      if (error) throw error;
      invalidateCache();
      return mapNoticeFromDb(data);
    } catch (e: any) {
      throw e;
    }
  },

  deleteNotice: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) throw error;
    invalidateCache();
  },

  getAllUsers: async (force: boolean = false): Promise<User[]> => {
    const now = Date.now();
    if (!force && _cache['users'] && (now - _cache['users'].timestamp < CACHE_TTL)) return _cache['users'].data;
    let dbUsers: User[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').order('name');
        if (error) throw error;
        dbUsers = (data || []).map(mapUserFromDb);
      } catch (e) {
        dbUsers = [];
      }
    }
    const superAdminInDb = dbUsers.some(user => user.email === SUPER_ADMIN_CONFIG.email);
    let finalUserList = dbUsers;
    if (!superAdminInDb) finalUserList = [...dbUsers, SUPER_ADMIN_CONFIG as User];
    _cache['users'] = { data: finalUserList, timestamp: now };
    return finalUserList;
  },

  getAllStudents: async (force: boolean = false): Promise<User[]> => {
    const users = await SupabaseService.getAllUsers(force);
    return (users || []).filter(u => u.role === UserRole.STUDENT);
  },

  addUser: async (u: Omit<User, 'id'>): Promise<User> => {
    if (!supabase) throw new Error("Sem conexão");
    const payload = {
      name: u.name, email: u.email, password: u.password, role: u.role,
      avatar_url: u.avatarUrl, phone_number: u.phoneNumber, profile_completed: u.profileCompleted,
      status: u.status || 'ACTIVE', join_date: formatDateForDb(u.joinDate),
      birth_date: formatDateForDb(u.birthDate), cpf: u.cpf, rg: u.rg, address: u.address || {},
      plan_id: u.planId, plan_value: u.planValue, plan_discount: u.planDiscount || 0,
      plan_duration: u.planDuration, billing_day: u.billingDay, plan_start_date: formatDateForDb(u.planStartDate),
      anamnesis: u.anamnesis || {},
    };
    const { data, error } = await supabase.from('users').insert([payload]).select().single();
    if (error) throw error;
    invalidateCache();
    return mapUserFromDb(data);
  },

  updateUser: async (u: User): Promise<User> => {
    if (!supabase) throw new Error("Sem conexão");
    const updatePayload = {
      name: u.name, email: u.email, password: u.password, role: u.role,
      avatar_url: u.avatarUrl, phone_number: u.phoneNumber, profile_completed: u.profileCompleted,
      status: u.status, suspended_at: u.suspendedAt, birth_date: formatDateForDb(u.birthDate),
      cpf: u.cpf, rg: u.rg, address: u.address || {}, plan_id: u.planId,
      plan_value: u.planValue, plan_discount: u.planDiscount || 0, plan_duration: u.planDuration,
      billing_day: u.billingDay, plan_start_date: formatDateForDb(u.planStartDate),
      anamnesis: u.anamnesis || {}, strava_access_token: u.stravaAccessToken,
      strava_refresh_token: u.stravaRefreshToken,
    };
    const { data, error } = await supabase.from('users').update(updatePayload).eq('id', u.id).select().single();
    if (error) throw error;
    invalidateCache();
    return mapUserFromDb(data);
  },

  deleteUser: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    invalidateCache();
  },

  getClasses: async (force: boolean = false): Promise<ClassSession[]> => {
    if (!supabase) return [];
    const now = Date.now();
    if (!force && _cache['classes'] && (now - _cache['classes'].timestamp < CACHE_TTL)) return _cache['classes'].data;
    try {
        const { data, error } = await supabase.from('classes').select('*').order('day_of_week').order('start_time');
        if (error) throw error;
        const mapped = (data || []).map(mapClassFromDb);
        _cache['classes'] = { data: mapped, timestamp: now };
        return mapped;
    } catch (e) { return []; }
  },

  addClass: async (c: Omit<ClassSession, 'id'>): Promise<ClassSession> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('classes').insert([{
      title: c.title, description: c.description, day_of_week: c.dayOfWeek,
      date: formatDateForDb(c.date), start_time: c.startTime, duration_minutes: c.durationMinutes,
      instructor: c.instructor, max_capacity: c.maxCapacity, enrolled_student_ids: c.enrolledStudentIds || [],
      // Fix: Changed from c.waitlist_student_ids to c.waitlistStudentIds
      waitlist_student_ids: c.waitlistStudentIds || [], type: c.type, is_cancelled: c.isCancelled,
      wod: c.wod, workout_details: c.workoutDetails, cycle_start_date: formatDateForDb(c.cycleStartDate),
      week_of_cycle: c.weekOfCycle, week_focus: c.weekFocus, distance_km: c.distanceKm,
    }]).select().single();
    if (error) throw error;
    invalidateCache();
    return mapClassFromDb(data);
  },

  updateClass: async (c: ClassSession): Promise<ClassSession> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('classes').update({
      title: c.title, description: c.description, day_of_week: c.dayOfWeek,
      date: formatDateForDb(c.date), start_time: c.startTime, duration_minutes: c.durationMinutes,
      instructor: c.instructor, max_capacity: c.maxCapacity, enrolled_student_ids: c.enrolledStudentIds || [],
      // Fix: Changed from c.waitlist_student_ids to c.waitlistStudentIds
      waitlist_student_ids: c.waitlistStudentIds || [], type: c.type, is_cancelled: c.isCancelled,
      wod: c.wod, workout_details: c.workoutDetails, cycle_start_date: formatDateForDb(c.cycleStartDate),
      week_of_cycle: c.weekOfCycle, week_focus: c.weekFocus, distance_km: c.distanceKm,
    }).eq('id', c.id).select().single();
    if (error) throw error;
    invalidateCache();
    return mapClassFromDb(data);
  },

  deleteClass: async (id: string) => {
    if (!supabase) throw new Error("Sem conexão");
    await supabase.from('attendance').delete().eq('class_id', id);
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) throw error;
    invalidateCache();
  },

  getPayments: async (userId?: string, force: boolean = false): Promise<Payment[]> => {
    if (!supabase) return [];
    const key = userId ? `payments_${userId}` : 'payments_all';
    const now = Date.now();
    if (!force && _cache[key] && (now - _cache[key].timestamp < CACHE_TTL)) return _cache[key].data;
    try {
        let query = supabase.from('payments').select('*, users!student_id(name, avatar_url, phone_number, plan_value, plan_duration)').order('due_date', { ascending: false });
        if (userId) query = query.eq('student_id', userId);
        const { data, error } = await query;
        if (error) throw error;
        const mapped = (data || []).map(p => ({
            ...mapPaymentFromDb(p),
            studentName: p.users?.name,
            studentAvatar: p.users?.avatar_url,
            studentPhone: p.users?.phone_number
        }));
        _cache[key] = { data: mapped, timestamp: now };
        return mapped;
    } catch (e) { return []; }
  },

  markPaymentAsPaid: async (id: string, discount: number = 0) => {
    if (!supabase) return;
    const { error } = await supabase.from('payments').update({ status: 'PAID', discount: discount }).eq('id', id);
    if (error) throw error;
    invalidateCache();
  },

  deletePendingPaymentsForStudent: async (studentId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('payments').delete().eq('student_id', studentId).eq('status', 'PENDING');
    if (error) throw error;
    invalidateCache();
  },

  addPayment: async (p: Omit<Payment, 'id'>): Promise<Payment> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('payments').insert([{
      student_id: p.studentId, amount: p.amount, status: p.status, 
      due_date: formatDateForDb(p.dueDate), description: p.description, discount: p.discount || 0
    }]).select().single();
    if (error) throw error;
    invalidateCache();
    return mapPaymentFromDb(data);
  },

  updatePayment: async (p: Payment): Promise<Payment> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('payments').update({
      student_id: p.studentId, amount: p.amount, status: p.status, 
      due_date: formatDateForDb(p.dueDate), description: p.description, discount: p.discount
    }).eq('id', p.id).select().single();
    if (error) throw error;
    invalidateCache();
    return mapPaymentFromDb(data);
  },

  deletePayment: async (id: string) => {
    if (!supabase) throw new Error("Sem conexão");
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
    invalidateCache();
  },

  addMultiplePayments: async (payments: Omit<Payment, 'id'>[]) => {
    if (!supabase || payments.length === 0) return;
    const payload = payments.map(p => ({
      student_id: p.studentId, amount: p.amount, status: p.status, 
      due_date: formatDateForDb(p.dueDate), description: p.description, discount: p.discount || 0
    }));
    const { error } = await supabase.from('payments').insert(payload);
    if (error) throw error;
    invalidateCache();
  },

  getGlobalChallengeProgress: async (force: boolean = false): Promise<{ challenge: Challenge | null, totalDistance: number }> => {
    if (!supabase) return { challenge: null, totalDistance: 0 };
    const now = Date.now();
    if (!force && _cache['challenge'] && (now - _cache['challenge'].timestamp < CACHE_TTL)) return _cache['challenge'].data;
    try {
        const { data: cData } = await supabase.from('challenges').select('*').limit(1).maybeSingle();
        if (!cData) return { challenge: null, totalDistance: 0 };
        const { data: entries } = await supabase.from('challenge_entries').select('value').eq('challenge_id', cData.id);
        const total = (entries || []).reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
        const result = { challenge: { ...cData, targetValue: Number(cData.target_value), startDate: cData.start_date, endDate: cData.end_date } as Challenge, totalDistance: total };
        _cache['challenge'] = { data: result, timestamp: now };
        return result;
    } catch (e) { return { challenge: null, totalDistance: 0 }; }
  },

  addChallengeEntry: async (studentId: string, value: number) => {
    if (!supabase) return;
    const { data: challenge } = await supabase.from('challenges').select('id').limit(1).single();
    if (!challenge) return;
    await supabase.from('challenge_entries').insert([{ challenge_id: challenge.id, student_id: studentId, value }]);
    invalidateCache('challenge');
  },

  getAttendanceByClassAndDate: async (classId: string, date: string): Promise<AttendanceRecord[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('attendance').select('*').eq('class_id', classId).eq('date', formatDateForDb(date));
    if (error) throw error;
    return (data || []).map(mapAttendanceFromDb);
  },

  saveAttendance: async (records: Omit<AttendanceRecord, 'id'>[]) => {
    if (!supabase || records.length === 0) return;
    const promises = records.map(async r => {
        // Fix: Use correct camelCase property names from the records object (Omit<AttendanceRecord, 'id'>)
        const payload = { 
            class_id: r.classId, student_id: r.studentId, date: formatDateForDb(r.date), is_present: r.isPresent,
            total_time_seconds: r.totalTimeSeconds, average_pace: r.averagePace,
            age_group_classification: r.ageGroupClassification, instructor_notes: r.instructorNotes,
            generated_feedback: r.generatedFeedback,
        };
        const { data: existing } = await supabase.from('attendance').select('id').eq('class_id', r.classId).eq('student_id', r.studentId).eq('date', formatDateForDb(r.date)).maybeSingle();
        if (existing) await supabase.from('attendance').update(payload).eq('id', existing.id);
        else await supabase.from('attendance').insert(payload);
    });
    await Promise.all(promises);
    invalidateCache();
  },

  getAttendanceForStudent: async (studentId: string, type?: 'RUNNING' | 'FUNCTIONAL'): Promise<(AttendanceRecord & { classDetails?: ClassSession })[]> => {
    if (!supabase) return [];
    try {
      let query = supabase.from('attendance').select('*, class:classes!inner(*)').eq('student_id', studentId).eq('is_present', true).order('date', { ascending: false });
      if (type) query = query.eq('class.type', type);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(r => ({ ...mapAttendanceFromDb(r), classDetails: r.class ? mapClassFromDb(r.class) : undefined }));
    } catch (e) { return []; }
  },

  getAttendanceForStudentInDateRange: async (studentId: string, startDate: string, endDate: string): Promise<(AttendanceRecord & { classDetails?: ClassSession })[]> => {
    if (!supabase) return [];
    try {
      let query = supabase.from('attendance').select('*, class:classes!inner(*)').eq('student_id', studentId).eq('is_present', true).gte('date', formatDateForDb(startDate)).lte('date', formatDateForDb(endDate)).order('date', { ascending: true });
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(r => ({ ...mapAttendanceFromDb(r), classDetails: r.class ? mapClassFromDb(r.class) : undefined }));
    } catch (e) { return []; }
  },

  getCycleSummariesForStudent: async (studentId: string): Promise<CycleSummary[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('cycle_summaries').select('*').eq('student_id', studentId).order('cycle_end_date', { ascending: false });
    if (error) return [];
    return (data || []).map(s => ({ ...s, id: s.id, studentId: s.student_id, cycleEndDate: s.cycle_end_date, summary_text: s.summary_text, start_pace: s.start_pace, end_pace: s.end_pace, performanceData: s.performance_data, createdAt: s.created_at }));
  },

  addCycleSummary: async (s: Omit<CycleSummary, 'id' | 'createdAt'>): Promise<CycleSummary> => {
    if (!supabase) throw new Error("Sem conexão");
    const payload = {
      student_id: s.studentId, cycle_end_date: formatDateForDb(s.cycleEndDate),
      summary_text: s.summaryText, start_pace: s.startPace, end_pace: s.end_pace,
      performance_data: s.performanceData
    };
    const { data, error } = await supabase.from('cycle_summaries').insert([payload]).select().single();
    if (error) throw error;
    return { ...data, id: data.id, studentId: data.student_id, cycleEndDate: data.cycle_end_date, summaryText: data.summary_text, startPace: data.start_pace, end_pace: data.end_pace, performanceData: data.performance_data, createdAt: data.created_at };
  },

  getRankingData: async (): Promise<{ student_id: string, classes: { distance_km: number } }[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('attendance').select('student_id, classes!inner(distance_km)').eq('is_present', true).eq('classes.type', 'RUNNING');
    if (error) return [];
    return data as any;
  },

  getAssessments: async (userId?: string, force: boolean = false): Promise<Assessment[]> => {
    if (!supabase) return [];
    const key = userId ? `assessments_${userId}` : 'assessments_all';
    const now = Date.now();
    if (!force && _cache[key] && (now - _cache[key].timestamp < CACHE_TTL)) return _cache[key].data;
    try {
        let query = supabase.from('assessments').select('*').order('date', { ascending: false });
        if (userId) query = query.eq('student_id', userId);
        const { data, error } = await query;
        if (error) throw error;
        const mapped = (data || []).map(mapAssessmentFromDb);
        _cache[key] = { data: mapped, timestamp: now };
        return mapped;
    } catch (e) { return []; }
  },

  addAssessment: async (a: Omit<Assessment, 'id'>): Promise<Assessment> => {
    if (!supabase) throw new Error("Sem conexão");
    const payload = {
      student_id: a.studentId, date: formatDateForDb(a.date), status: a.status, weight: a.weight, height: a.height,
      body_fat_percentage: a.bodyFatPercentage, skeletal_muscle_mass: a.skeletalMuscleMass,
      visceral_fat_level: a.visceralFatLevel, basal_metabolic_rate: a.basalMetabolicRate,
      hydration_percentage: a.hydrationPercentage, abdominal_test: a.abdominalTest,
      horizontal_jump: a.horizontalJump, vertical_jump: a.verticalJump,
      medicine_ball_throw: a.medicineBallThrow, photo_front_url: a.photoFrontUrl,
      photo_side_url: a.photoSideUrl, photo_back_url: a.photoBackUrl,
      fms: a.fms || {}, circumferences: a.circumferences || {}, notes: a.notes
    };
    const { data, error } = await supabase.from('assessments').insert([payload]).select().single();
    if (error) throw error;
    invalidateCache();
    return mapAssessmentFromDb(data);
  },

  updateAssessment: async (a: Assessment): Promise<Assessment> => {
    if (!supabase) throw new Error("Sem conexão");
    const payload = {
      date: formatDateForDb(a.date), status: a.status, weight: a.weight, height: a.height,
      body_fat_percentage: a.bodyFatPercentage, skeletal_muscle_mass: a.skeletalMuscleMass,
      visceral_fat_level: a.visceralFatLevel, basal_metabolic_rate: a.basalMetabolicRate,
      hydration_percentage: a.hydrationPercentage, abdominal_test: a.abdominalTest,
      horizontal_jump: a.horizontalJump, vertical_jump: a.verticalJump,
      medicine_ball_throw: a.medicineBallThrow, photo_front_url: a.photoFrontUrl,
      photo_side_url: a.photoSideUrl, photo_back_url: a.photoBackUrl,
      fms: a.fms || {}, circumferences: a.circumferences || {}, notes: a.notes
    };
    const { data, error } = await supabase.from('assessments').update(payload).eq('id', a.id).select().single();
    if (error) throw error;
    invalidateCache();
    return mapAssessmentFromDb(data);
  },

  deleteAssessment: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('assessments').delete().eq('id', id);
    if (error) throw error;
    invalidateCache();
  },

  getRoutes: async (): Promise<Route[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('routes').select('*').order('title');
    if (error) return [];
    return (data || []).map(r => ({ ...r, distanceKm: r.distance_km, mapLink: r.map_link, elevationGain: r.elevation_gain }));
  },

  addRoute: async (r: Omit<Route, 'id'>): Promise<Route> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('routes').insert([{ title: r.title, distance_km: r.distanceKm, description: r.description, map_link: r.mapLink, difficulty: r.difficulty, elevation_gain: r.elevationGain }]).select().single();
    if (error) throw error;
    return { ...data, distanceKm: data.distance_km, mapLink: data.map_link, elevationGain: data.elevation_gain };
  },

  updateRoute: async (r: Route): Promise<Route> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('routes').update({ title: r.title, distance_km: r.distanceKm, description: r.description, map_link: r.mapLink, difficulty: r.difficulty, elevation_gain: r.elevationGain }).eq('id', r.id).select().single();
    if (error) throw error;
    return { ...data, distanceKm: data.distance_km, mapLink: data.map_link, elevationGain: data.elevation_gain };
  },

  deleteRoute: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('routes').delete().eq('id', id);
    if (error) throw error;
    invalidateCache();
  },

  getPersonalizedWorkouts: async (userId?: string): Promise<PersonalizedWorkout[]> => {
    if (!supabase) return [];
    try {
        let query = supabase.from('personalized_workouts').select('*').order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        let results = (data || []).map(w => ({ ...w, videoUrl: w.video_url, studentIds: w.student_ids, instructorName: w.instructor_name, createdAt: w.created_at }));
        if (userId) results = results.filter(w => w.studentIds.includes(userId));
        return results;
    } catch (e) { return []; }
  },

  addPersonalizedWorkout: async (w: Omit<PersonalizedWorkout, 'id'>): Promise<PersonalizedWorkout> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('personalized_workouts').insert([{ title: w.title, description: w.description, video_url: w.videoUrl, student_ids: w.studentIds, instructor_name: w.instructorName }]).select().single();
    if (error) throw error;
    return { ...data, videoUrl: data.video_url, studentIds: data.student_ids, instructor_name: data.instructor_name, createdAt: data.created_at };
  },

  updatePersonalizedWorkout: async (w: PersonalizedWorkout): Promise<PersonalizedWorkout> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('personalized_workouts').update({ title: w.title, description: w.description, video_url: w.videoUrl, student_ids: w.studentIds, instructor_name: w.instructorName }).eq('id', w.id).select().single();
    if (error) throw error;
    return { ...data, videoUrl: data.video_url, studentIds: data.student_ids, instructor_name: data.instructor_name, createdAt: data.created_at };
  },

  deletePersonalizedWorkout: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('personalized_workouts').delete().eq('id', id);
    if (error) throw error;
    invalidateCache();
  },

  getPosts: async (): Promise<Post[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('posts').select('*, users!inner(name, avatar_url), post_comments(*, users(name, avatar_url))').order('timestamp', { ascending: false });
    if (error) return [];
    return (data || []).map(mapPostFromDb);
  },

  addPost: async (p: any): Promise<Post> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('posts').insert([{ user_id: p.userId, image_url: p.imageUrl, caption: p.caption, timestamp: p.timestamp, likes: [] }]).select('*, users(name, avatar_url)').maybeSingle();
    if (error) throw error;
    return mapPostFromDb(data);
  },

  addLikeToPost: async (postId: string, userId: string): Promise<Post> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
    let likes = post?.likes || [];
    if (likes.includes(userId)) likes = likes.filter((id: string) => id !== userId);
    else likes.push(userId);
    const { data, error } = await supabase.from('posts').update({ likes }).eq('id', postId).select('*, users(name, avatar_url), post_comments(*, users(name, avatar_url))').single();
    if (error) throw error;
    return mapPostFromDb(data);
  },

  addComment: async (postId: string, userId: string, content: string): Promise<Comment> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('post_comments').insert([{ post_id: postId, user_id: userId, content: content }]).select('*, users(name, avatar_url)').single();
    if (error) throw error;
    return { ...data, postId: data.post_id, userId: data.user_id, userName: data.users?.name, userAvatar: data.users?.avatar_url, createdAt: data.created_at };
  },

  getFinancialReport: async (year: number) => {
    if (!supabase) return [];
    try {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const { data, error } = await supabase.from('payments').select('amount, status, due_date').gte('due_date', `${year}-01-01`).lte('due_date', `${year}-12-31`);
        if (error) throw error;
        return months.map((month, idx) => {
            const monthPayments = (data || []).filter(p => new Date(p.due_date).getMonth() === idx);
            return {
                name: month,
                revenue: monthPayments.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount), 0),
                overdue: monthPayments.filter(p => p.status === 'OVERDUE').reduce((acc, curr) => acc + Number(curr.amount), 0),
                students: monthPayments.filter(p => p.status === 'PAID').length
            };
        });
    } catch (e) { return []; }
  },

  getAcademySettings: async (): Promise<AcademySettings | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase.from('academy_settings').select('*').limit(1).maybeSingle();
    if (error) return null;
    return {
        name: data.name || '',
        cnpj: data.cnpj || '',
        academyAddress: data.address || {},
        phone: data.phone || '',
        email: data.email || '',
        representativeName: data.representative_name || '',
        mercadoPagoPublicKey: data.mercado_pago_public_key || '',
        mercadoPagoAccessToken: data.mercado_pago_access_token || '',
        pix_key: data.pix_key || '',
        customDomain: data.custom_domain || '',
        monthlyFee: Number(data.monthly_fee) || 0,
        inviteCode: 'STUDIO2024',
        registrationInviteCode: data.registration_invite_code || 'BEMVINDO2024'
    };
  },

  updateAcademySettings: async (s: AcademySettings): Promise<void> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data: current } = await supabase.from('academy_settings').select('id').limit(1).maybeSingle();
    const payload = { name: s.name, cnpj: s.cnpj, phone: s.phone, email: s.email, representative_name: s.representativeName, mercado_pago_public_key: s.mercadoPagoPublicKey, mercado_pago_access_token: s.mercadoPagoAccessToken, pix_key: s.pixKey, custom_domain: s.customDomain, monthly_fee: s.monthlyFee, registration_invite_code: s.registration_invite_code, address: s.academyAddress, updated_at: new Date().toISOString() };
    if (current) await supabase.from('academy_settings').update(payload).eq('id', current.id);
    else await supabase.from('academy_settings').insert([payload]);
    invalidateCache();
  },

  getPlans: async (): Promise<Plan[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('plans').select('*').eq('is_active', true).order('display_order');
    if (error) return [];
    return (data || []).map(p => ({
        id: p.id,
        title: p.title,
        planType: p.plan_type,
        frequency: p.frequency,
        price: Number(p.price),
        durationMonths: p.duration_months,
        isActive: p.is_active,
        displayOrder: p.display_order,
    }));
  },
};
