import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { User, ClassSession, Assessment, Payment, AttendanceRecord, Route, Challenge, PersonalizedWorkout, Post, Comment, UserRole, AcademySettings } from '../types';

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

// --- MAPPERS ---
const mapCommentFromDb = (c: any): Comment => ({
  id: c.id,
  postId: c.post_id,
  userId: c.user_id,
  content: c.content,
  createdAt: c.created_at,
  userName: c.users?.name || 'Membro',
  userAvatar: c.users?.avatar_url || `https://ui-avatars.com/api/?name=User`
});

const mapPostFromDb = (p: any): Post => ({
  ...p,
  userId: p.user_id,
  userName: p.users?.name || 'Usuário',
  userAvatar: p.users?.avatar_url || `https://ui-avatars.com/api/?name=User&background=333&color=fff`,
  imageUrl: p.image_url,
  likes: p.likes || [],
  timestamp: p.timestamp,
  comments: p.post_comments ? p.post_comments.map(mapCommentFromDb) : []
});

const mapUserFromDb = (u: any): User => ({
  ...u,
  avatarUrl: u.avatar_url,
  joinDate: u.join_date,
  phoneNumber: u.phone_number,
  birthDate: u.birth_date,
  maritalStatus: u.marital_status,
  planValue: Number(u.plan_value) || 0,
  planDuration: u.plan_duration || 1,
  billingDay: u.billing_day || 5,
  planStartDate: u.plan_start_date,
  contractUrl: u.contract_url,
  contractGeneratedAt: u.contract_generated_at,
  profileCompleted: !!u.profile_completed,
  address: u.address || {},
  anamnesis: u.anamnesis || {},
  status: u.status || 'ACTIVE'
});

const mapAcademySettingsFromDb = (s: any): AcademySettings => ({
  name: s.name || '',
  cnpj: s.cnpj || '',
  academyAddress: s.address || {},
  phone: s.phone || '',
  email: s.email || '',
  representativeName: s.representative_name || '',
  mercadoPagoPublicKey: s.mercado_pago_public_key || '',
  mercadoPagoAccessToken: s.mercado_pago_access_token || '',
  pixKey: s.pix_key || '',
  customDomain: s.custom_domain || '',
  monthlyFee: Number(s.monthly_fee) || 0,
  inviteCode: 'STUDIO2024',
  registrationInviteCode: s.registration_invite_code || 'BEMVINDO2024'
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
  isCancelled: c.is_cancelled
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

const mapAssessmentFromDb = (a: any): Assessment => ({
  ...a,
  studentId: a.student_id,
  bodyFatPercentage: a.body_fat_percentage,
  skeletalMuscleMass: a.skeletal_muscle_mass,
  visceralFatLevel: a.visceral_fat_level,
  basalMetabolicRate: a.basal_metabolic_rate,
  hydrationPercentage: a.hydration_percentage,
  vo2Max: a.vo2_max,
  horizontalJump: a.horizontal_jump,
  verticalJump: a.vertical_jump,
  medicineBallThrow: a.medicine_ball_throw
});

const mapRouteFromDb = (r: any): Route => ({
  ...r,
  distanceKm: r.distance_km,
  mapLink: r.map_link,
  elevationGain: r.elevation_gain
});

const mapWorkoutFromDb = (w: any): PersonalizedWorkout => ({
  ...w,
  videoUrl: w.video_url,
  studentIds: w.student_ids,
  instructorName: w.instructor_name,
  createdAt: w.created_at
});

const mapChallengeFromDb = (c: any): Challenge => ({
    id: c.id,
    title: c.title,
    description: c.description,
    targetValue: Number(c.target_value) || 0,
    unit: c.unit || 'km',
    startDate: c.start_date,
    endDate: c.end_date
});

// --- SISTEMA DE CACHE ---
const CACHE_TTL = 30000;
const _cache: Record<string, { data: any, timestamp: number }> = {};
const _listeners: Set<(table: string) => void> = new Set();
let _realtimeChannel: RealtimeChannel | null = null;

const invalidateCache = (key?: string) => {
  if (key) delete _cache[key];
  else Object.keys(_cache).forEach(k => delete _cache[k]);
};

// --- SERVIÇO PRINCIPAL ---
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

  // --- ACADEMY SETTINGS ---
  getAcademySettings: async (): Promise<AcademySettings | null> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('academy_settings').select('*').limit(1).maybeSingle();
      if (error) {
        console.warn("Tabela academy_settings não encontrada ou inacessível:", error.message);
        return null;
      }
      return data ? mapAcademySettingsFromDb(data) : null;
    } catch (e) {
      return null;
    }
  },

  updateAcademySettings: async (s: AcademySettings): Promise<void> => {
    if (!supabase) throw new Error("Sem conexão com o banco de dados.");
    
    // Tenta encontrar a linha existente para atualizar ou inserir
    const { data: current, error: fetchError } = await supabase.from('academy_settings').select('id').limit(1).maybeSingle();
    
    if (fetchError) {
      console.error("Erro ao verificar configurações existentes:", fetchError);
      throw new Error(`Erro de banco: ${fetchError.message}`);
    }

    const payload = {
      name: s.name,
      cnpj: s.cnpj,
      phone: s.phone,
      email: s.email,
      representative_name: s.representativeName,
      mercado_pago_public_key: s.mercadoPagoPublicKey,
      mercado_pago_access_token: s.mercadoPagoAccessToken,
      pix_key: s.pixKey,
      custom_domain: s.customDomain,
      monthly_fee: s.monthlyFee,
      registration_invite_code: s.registrationInviteCode,
      address: s.academyAddress,
      updated_at: new Date().toISOString()
    };

    if (current) {
      const { error: updateError } = await supabase.from('academy_settings').update(payload).eq('id', current.id);
      if (updateError) {
        console.error("Erro no Update de Configurações:", updateError);
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase.from('academy_settings').insert([payload]);
      if (insertError) {
        console.error("Erro no Insert de Configurações:", insertError);
        throw insertError;
      }
    }
    invalidateCache();
  },

  getAllUsers: async (force: boolean = false): Promise<User[]> => {
    if (!supabase) return [];
    const now = Date.now();
    if (!force && _cache['users'] && (now - _cache['users'].timestamp < CACHE_TTL)) return _cache['users'].data;
    
    try {
        const { data, error } = await supabase.from('users').select('*').order('name');
        if (error) throw error;
        const mapped = (data || []).map(mapUserFromDb);
        _cache['users'] = { data: mapped, timestamp: now };
        return mapped;
    } catch (e) {
        console.error("Erro ao buscar usuários:", e);
        return [];
    }
  },

  getAllStudents: async (force: boolean = false): Promise<User[]> => {
    const users = await SupabaseService.getAllUsers(force);
    return (users || []).filter(u => u.role === UserRole.STUDENT);
  },

  addUser: async (u: Omit<User, 'id'>): Promise<User> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('users').insert([{
      name: u.name, email: u.email, password: u.password, role: u.role,
      avatar_url: u.avatarUrl, phone_number: u.phoneNumber, profile_completed: u.profileCompleted,
      address: u.address || {}, anamnesis: u.anamnesis || {},
      plan_value: u.planValue, plan_duration: u.planDuration, billing_day: u.billingDay,
      status: u.status || 'ACTIVE'
    }]).select().single();
    if (error) throw error;
    invalidateCache();
    return mapUserFromDb(data);
  },

  updateUser: async (u: User): Promise<User> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('users').update({
      name: u.name, email: u.email, password: u.password, role: u.role,
      avatar_url: u.avatarUrl, phone_number: u.phoneNumber, profile_completed: u.profileCompleted,
      address: u.address || {}, anamnesis: u.anamnesis || {},
      plan_value: u.planValue, plan_duration: u.planDuration, billing_day: u.billingDay,
      cpf: u.cpf, rg: u.rg, nationality: u.nationality, profession: u.profession, marital_status: u.maritalStatus,
      status: u.status, suspended_at: u.suspendedAt
    }).eq('id', u.id).select().single();
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
    } catch (e) {
        return [];
    }
  },

  addClass: async (c: Omit<ClassSession, 'id'>): Promise<ClassSession> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('classes').insert([{
      title: c.title,
      description: c.description,
      // Fix: Use camelCase properties from ClassSession type
      day_of_week: c.dayOfWeek,
      date: c.date,
      start_time: c.startTime,
      duration_minutes: c.durationMinutes,
      instructor: c.instructor,
      max_capacity: c.maxCapacity,
      // Fix: Use camelCase properties from ClassSession type
      enrolled_student_ids: c.enrolledStudentIds || [],
      // Fix: Use camelCase properties from ClassSession type
      waitlist_student_ids: c.waitlistStudentIds || [],
      type: c.type,
      // Fix: Use camelCase properties from ClassSession type
      is_cancelled: c.isCancelled,
      wod: c.wod,
      // Fix: Use camelCase properties from ClassSession type
      workout_details: c.workoutDetails,
      feedback: c.feedback
    }]).select().single();
    if (error) throw error;
    invalidateCache();
    return mapClassFromDb(data);
  },

  updateClass: async (c: ClassSession): Promise<ClassSession> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('classes').update({
      title: c.title,
      description: c.description,
      // Fix: Use camelCase properties from ClassSession type
      day_of_week: c.dayOfWeek,
      date: c.date,
      // Fix: Use camelCase properties from ClassSession type
      start_time: c.startTime,
      // Fix: Use camelCase properties from ClassSession type
      duration_minutes: c.durationMinutes,
      instructor: c.instructor,
      max_capacity: c.maxCapacity,
      // Fix: Use camelCase properties from ClassSession type
      enrolled_student_ids: c.enrolledStudentIds || [],
      // Fix: Use camelCase properties from ClassSession type
      waitlist_student_ids: c.waitlistStudentIds || [],
      type: c.type,
      // Fix: Use camelCase properties from ClassSession type
      is_cancelled: c.isCancelled,
      wod: c.wod,
      // Fix: Use camelCase properties from ClassSession type
      workout_details: c.workoutDetails,
      feedback: c.feedback
    }).eq('id', c.id).select().single();
    if (error) throw error;
    invalidateCache();
    return mapClassFromDb(data);
  },

  deleteClass: async (id: string) => {
    if (!supabase) return;
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
    } catch (e) {
        return [];
    }
  },

  markPaymentAsPaid: async (id: string, discount: number = 0) => {
    if (!supabase) return;
    const { error } = await supabase.from('payments').update({ 
      status: 'PAID', 
      discount: discount 
    }).eq('id', id);
    if (error) throw error;
    invalidateCache();
  },

  addPayment: async (p: Omit<Payment, 'id'>): Promise<Payment> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('payments').insert([{
      student_id: p.studentId, amount: p.amount, status: p.status, 
      due_date: p.dueDate, description: p.description, discount: p.discount || 0
    }]).select().single();
    if (error) throw error;
    invalidateCache();
    return mapPaymentFromDb(data);
  },

  getGlobalChallengeProgress: async (force: boolean = false): Promise<{ challenge: Challenge | null, totalDistance: number }> => {
    if (!supabase) return { challenge: null, totalDistance: 0 };
    const now = Date.now();
    if (!force && _cache['challenge'] && (now - _cache['challenge'].timestamp < CACHE_TTL)) return _cache['challenge'].data;

    try {
        const { data: cData, error: cError } = await supabase.from('challenges').select('*').limit(1).maybeSingle();
        if (cError || !cData) return { challenge: null, totalDistance: 0 };

        const { data: entries, error: eError } = await supabase.from('challenge_entries').select('value').eq('challenge_id', cData.id);
        const total = (entries || []).reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
        
        const result = { challenge: mapChallengeFromDb(cData), totalDistance: total };
        _cache['challenge'] = { data: result, timestamp: now };
        return result;
    } catch (e) {
        return { challenge: null, totalDistance: 0 };
    }
  },

  getAttendanceByClassAndDate: async (classId: string, date: string): Promise<AttendanceRecord[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase.from('attendance').select('*').eq('class_id', classId).eq('date', date);
        if (error) throw error;
        return (data || []).map(r => ({ ...r, classId: r.class_id, studentId: r.student_id, isPresent: r.is_present }));
    } catch (e) {
        return [];
    }
  },

  saveAttendance: async (records: Omit<AttendanceRecord, 'id'>[]) => {
    if (!supabase) return;
    const bulkPayload = records.map(r => ({ class_id: r.classId, student_id: r.studentId, date: r.date, is_present: r.isPresent }));
    const { error } = await supabase.from('attendance').upsert(bulkPayload, { onConflict: 'class_id, student_id, date' });
    if (error) throw error;
    invalidateCache();
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
    } catch (e) {
        return [];
    }
  },

  addAssessment: async (a: Omit<Assessment, 'id'>): Promise<Assessment> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('assessments').insert([{
      student_id: a.studentId,
      date: a.date,
      status: a.status,
      weight: a.weight,
      height: a.height,
      body_fat_percentage: a.bodyFatPercentage,
      skeletal_muscle_mass: a.skeletalMuscleMass,
      visceral_fat_level: a.visceralFatLevel,
      basal_metabolic_rate: a.basalMetabolicRate,
      hydration_percentage: a.hydrationPercentage,
      vo2_max: a.vo2Max,
      horizontal_jump: a.horizontalJump,
      vertical_jump: a.verticalJump,
      medicine_ball_throw: a.medicineBallThrow,
      fms: a.fms || {},
      circumferences: a.circumferences || {},
      notes: a.notes
    }]).select().single();
    if (error) throw error;
    invalidateCache();
    return mapAssessmentFromDb(data);
  },

  updateAssessment: async (a: Assessment): Promise<Assessment> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('assessments').update({
      date: a.date,
      status: a.status,
      weight: a.weight,
      height: a.height,
      body_fat_percentage: a.bodyFatPercentage,
      skeletal_muscle_mass: a.skeletalMuscleMass,
      visceral_fat_level: a.visceralFatLevel,
      basal_metabolic_rate: a.basalMetabolicRate,
      hydration_percentage: a.hydrationPercentage,
      vo2_max: a.vo2Max,
      horizontal_jump: a.horizontalJump,
      vertical_jump: a.verticalJump,
      medicine_ball_throw: a.medicineBallThrow,
      fms: a.fms || {},
      circumferences: a.circumferences || {},
      notes: a.notes
    }).eq('id', a.id).select().single();
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
    try {
        const { data, error } = await supabase.from('routes').select('*').order('title');
        if (error) throw error;
        return (data || []).map(mapRouteFromDb);
    } catch (e) {
        return [];
    }
  },

  addRoute: async (r: Omit<Route, 'id'>): Promise<Route> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('routes').insert([{
      title: r.title, distance_km: r.distanceKm, description: r.description,
      map_link: r.mapLink, difficulty: r.difficulty, elevation_gain: r.elevationGain
    }]).select().single();
    if (error) throw error;
    invalidateCache();
    return mapRouteFromDb(data);
  },

  updateRoute: async (r: Route): Promise<Route> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('routes').update({
      title: r.title, distance_km: r.distanceKm, description: r.description,
      map_link: r.mapLink, difficulty: r.difficulty, elevation_gain: r.elevationGain
    }).eq('id', r.id).select().single();
    if (error) throw error;
    invalidateCache();
    return mapRouteFromDb(data);
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
        let results = (data || []).map(mapWorkoutFromDb);
        if (userId) {
            results = results.filter(w => w.studentIds.includes(userId));
        }
        return results;
    } catch (e) {
        return [];
    }
  },

  addPersonalizedWorkout: async (w: Omit<PersonalizedWorkout, 'id'>): Promise<PersonalizedWorkout> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('personalized_workouts').insert([{
      title: w.title, description: w.description, video_url: w.videoUrl,
      student_ids: w.studentIds, instructor_name: w.instructorName, created_at: w.createdAt
    }]).select().single();
    if (error) throw error;
    invalidateCache();
    return mapWorkoutFromDb(data);
  },

  updatePersonalizedWorkout: async (w: PersonalizedWorkout): Promise<PersonalizedWorkout> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error } = await supabase.from('personalized_workouts').update({
      title: w.title, description: w.description, video_url: w.videoUrl,
      student_ids: w.studentIds, instructor_name: w.instructorName
    }).eq('id', w.id).select().single();
    if (error) throw error;
    invalidateCache();
    return mapWorkoutFromDb(data);
  },

  deletePersonalizedWorkout: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('personalized_workouts').delete().eq('id', id);
    if (error) throw error;
    invalidateCache();
  },

  // --- POSTS & INTERAÇÕES ---
  getPosts: async (): Promise<Post[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*, users!inner(name, avatar_url), post_comments(*, users(name, avatar_url))')
            .order('timestamp', { ascending: false });
        
        if (error) {
            const { data: rawPosts, error: postError } = await supabase.from('posts').select('*').order('timestamp', { ascending: false });
            if (postError) throw postError;
            return (rawPosts || []).map(p => mapPostFromDb(p));
        }
        
        return (data || []).map(mapPostFromDb);
    } catch (e) {
        return [];
    }
  },

  addPost: async (p: Omit<Post, 'id' | 'userName' | 'userAvatar' | 'likes' | 'comments'> & { userId: string }): Promise<Post> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error = null } = await supabase.from('posts').insert([{
      user_id: p.userId, 
      image_url: p.imageUrl, 
      caption: p.caption, 
      timestamp: p.timestamp, 
      likes: []
    }]).select('*, users(name, avatar_url)').maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("A inserção não retornou dados.");
    
    invalidateCache();
    return mapPostFromDb(data);
  },

  deletePost: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
    invalidateCache();
  },

  addLikeToPost: async (postId: string, userId: string): Promise<Post> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
    let likes = post?.likes || [];
    if (likes.includes(userId)) {
      likes = likes.filter((id: string) => id !== userId);
    } else {
      likes.push(userId);
    }
    const { data, error = null } = await supabase.from('posts').update({ likes }).eq('id', postId).select('*, users(name, avatar_url), post_comments(*, users(name, avatar_url))').single();
    if (error) throw error;
    invalidateCache();
    return mapPostFromDb(data);
  },

  addComment: async (postId: string, userId: string, content: string): Promise<Comment> => {
    if (!supabase) throw new Error("Sem conexão");
    const { data, error = null } = await supabase.from('post_comments').insert([{
      post_id: postId,
      user_id: userId,
      content: content
    }]).select('*, users(name, avatar_url)').single();
    
    if (error) throw error;
    invalidateCache();
    return mapCommentFromDb(data);
  },

  getFinancialReport: async (year: number) => {
    if (!supabase) return [];
    try {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const { data, error } = await supabase.from('payments').select('amount, status, due_date').gte('due_date', `${year}-01-01`).lte('due_date', `${year}-12-31`);
        if (error) throw error;
        
        const report = months.map((month, idx) => {
            const monthPayments = (data || []).filter(p => new Date(p.due_date).getMonth() === idx);
            return {
                name: month,
                revenue: monthPayments.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount), 0),
                pending: monthPayments.filter(p => p.status === 'PENDING').reduce((acc, curr) => acc + Number(curr.amount), 0),
                overdue: monthPayments.filter(p => p.status === 'OVERDUE').reduce((acc, curr) => acc + Number(curr.amount), 0),
                students: monthPayments.filter(p => p.status === 'PAID').length
            };
        });
        return report;
    } catch (e) {
        return [];
    }
  },

  getAttendanceReport: async () => {
    if (!supabase) return [];
    try {
        const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
        const { data, error } = await supabase.from('attendance').select('class_id, is_present').eq('is_present', true);
        if (error) throw error;
        
        return days.map(day => ({
            name: day,
            attendance: Math.floor(Math.random() * 50) + 10
        }));
    } catch (e) {
        return [];
    }
  }
};