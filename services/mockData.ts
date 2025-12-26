import { ClassSession, Assessment, Post, Payment, User, Anamnesis, Route, Challenge, PersonalizedWorkout } from '../types';

// --- DATA HELPERS ---
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0].split('-').reverse().join('/'); // DD/MM/YYYY

// Datas relativas
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 4);
const todayDate = new Date(today);
const lastMonth = new Date(today); lastMonth.setMonth(today.getMonth() - 1);

// Gera uma data de nascimento genérica
const generateBirthDate = (age: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - age);
    return d.toISOString().split('T')[0];
};

// --- ALUNOS (8 Total) ---
let students: User[] = [
    { 
      id: 'student-1', 
      name: 'Mariana Costa', 
      email: 'mariana@test.com', 
      role: 'STUDENT' as any, 
      joinDate: '2023-01-15', 
      avatarUrl: 'https://ui-avatars.com/api/?name=Mariana+Costa&background=ffb6c1&color=fff', 
      phoneNumber: '5511999991111', 
      birthDate: generateBirthDate(28),
      // Fix: convert string to Address object to match User type
      address: {
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Jardins',
        city: 'São Paulo',
        state: 'SP'
      }
    },
    { 
      id: 'student-2', 
      name: 'Pedro Santos', 
      email: 'pedro@test.com', 
      role: 'STUDENT' as any, 
      joinDate: '2023-02-20', 
      avatarUrl: 'https://ui-avatars.com/api/?name=Pedro+Santos&background=0ea5e9&color=fff', 
      phoneNumber: '5511999992222', 
      birthDate: generateBirthDate(32),
      // Fix: convert string to Address object to match User type
      address: {
        zipCode: '01234-567',
        street: 'Av. Brasil',
        number: '500',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP'
      }
    },
    { 
      id: 'student-3', 
      name: 'João Silva', 
      email: 'joao@test.com', 
      role: 'STUDENT' as any, 
      joinDate: '2023-03-10', 
      avatarUrl: 'https://ui-avatars.com/api/?name=Joao+Silva&background=84cc16&color=fff', 
      phoneNumber: '5511999993333', 
      birthDate: generateBirthDate(25),
      // Fix: convert string to Address object to match User type
      address: {
        zipCode: '01234-567',
        street: 'Rua Oscar Freire',
        number: '100',
        neighborhood: 'Jardins',
        city: 'São Paulo',
        state: 'SP'
      }
    }, 
    { 
      id: 'student-4', 
      name: 'Ana Oliveira', 
      email: 'ana@test.com', 
      role: 'STUDENT' as any, 
      joinDate: '2023-05-05', 
      avatarUrl: 'https://ui-avatars.com/api/?name=Ana+Oliveira&background=a855f7&color=fff', 
      phoneNumber: '5511999994444', 
      birthDate: generateBirthDate(22),
      // Fix: convert string to Address object to match User type
      address: {
        zipCode: '01234-567',
        street: 'Rua Augusta',
        number: '1020',
        neighborhood: 'Consolação',
        city: 'São Paulo',
        state: 'SP'
      }
    },
    { 
      id: 'student-5', 
      name: 'Carlos Souza', 
      email: 'carlos@test.com', 
      role: 'STUDENT' as any, 
      joinDate: '2023-06-12', 
      avatarUrl: 'https://ui-avatars.com/api/?name=Carlos+Souza&background=64748b&color=fff', 
      phoneNumber: '5511999995555', 
      birthDate: generateBirthDate(65),
      // Fix: convert string to Address object to match User type
      address: {
        zipCode: '01234-567',
        street: 'Alameda Santos',
        number: '85',
        neighborhood: 'Paulista',
        city: 'São Paulo',
        state: 'SP'
      },
      anamnesis: {
          hasInjury: true, injuryDescription: 'Condromalácia Patelar Grau 1',
          takesMedication: true, medicationDescription: 'Losartana (Pressão)',
          hadSurgery: false, hasHeartCondition: false,
          emergencyContactName: 'Maria Souza', emergencyContactPhone: '11988887777',
          updatedAt: '2023-06-12'
      }
    },
    { 
      id: 'student-6', 
      name: 'Fernanda Lima', 
      email: 'fernanda@test.com', 
      role: 'STUDENT' as any, 
      joinDate: '2023-07-20', 
      avatarUrl: 'https://ui-avatars.com/api/?name=Fernanda+Lima&background=f43f5e&color=fff', 
      phoneNumber: '5511999996666', 
      birthDate: generateBirthDate(29),
      // Fix: convert string to Address object to match User type
      address: {
        zipCode: '01234-567',
        street: 'Rua da Consolação',
        number: '300',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP'
      }
    },
    { 
      id: 'student-7', 
      name: 'Roberto Almeida', 
      email: 'roberto@test.com', 
      role: 'STUDENT' as any, 
      joinDate: '2023-08-01', 
      avatarUrl: 'https://ui-avatars.com/api/?name=Roberto+Almeida&background=f59e0b&color=fff', 
      phoneNumber: '5511999997777', 
      birthDate: generateBirthDate(40),
      // Fix: convert string to Address object to match User type
      address: {
        zipCode: '01234-567',
        street: 'Av. Ipiranga',
        number: '200',
        neighborhood: 'República',
        city: 'São Paulo',
        state: 'SP'
      }
    },
    { 
      id: 'student-8', 
      name: 'Patrícia Rocha', 
      email: 'patricia@test.com', 
      role: 'STUDENT' as any, 
      joinDate: '2023-09-15', 
      avatarUrl: 'https://ui-avatars.com/api/?name=Patricia+Rocha&background=14b8a6&color=fff', 
      phoneNumber: '5511999998888', 
      birthDate: generateBirthDate(26),
      // Fix: convert string to Address object to match User type
      address: {
        zipCode: '01234-567',
        street: 'Rua Haddock Lobo',
        number: '50',
        neighborhood: 'Cerqueira César',
        city: 'São Paulo',
        state: 'SP'
      }
    }
];

// --- AULAS ---
let classes: ClassSession[] = [
  {
    id: 'c1',
    title: 'Desafio Matinal',
    description: 'Circuito funcional de alta intensidade.',
    dayOfWeek: 'Segunda',
    startTime: '07:00',
    durationMinutes: 60,
    instructor: 'Treinador Alex',
    maxCapacity: 15,
    enrolledStudentIds: ['student-1', 'student-2', 'student-4', 'student-8'],
    waitlistStudentIds: ['student-3'],
    type: 'FUNCTIONAL',
    wod: "**Aquecimento (10')**\n- 5min Trote Leve\n- Mobilidade de Quadril\n\n**Parte Principal (40')**\nAMRAP 20':\n- 10 Burpees\n- 15 Kettlebell Swings\n- 20 Box Jumps\n\n**Volta à Calma (10')**\n- Alongamento Estático",
    feedback: [{ studentId: 'student-2', rating: 8 }]
  },
  {
    id: 'c2',
    title: 'Corrida no Parque',
    description: 'Ritmo de 5k e intervalados.',
    dayOfWeek: 'Quarta',
    startTime: '18:30',
    durationMinutes: 75,
    instructor: 'Treinadora Sarah',
    maxCapacity: 20,
    enrolledStudentIds: ['student-1', 'student-6', 'student-7'],
    waitlistStudentIds: [],
    type: 'RUNNING',
    wod: "**Aquecimento**\n- 2km Trote progressivo\n\n**Principal**\n- 6x 400m forte (Pace 4:00) com 2' descanso\n\n**Desaquecimento**\n- 1km Caminhada",
    feedback: []
  },
  {
    id: 'c3',
    title: 'Força e Hipertrofia',
    description: 'Foco em técnica e carga.',
    dayOfWeek: 'Sexta',
    startTime: '19:00',
    durationMinutes: 60,
    instructor: 'Treinador Alex',
    maxCapacity: 12,
    enrolledStudentIds: ['student-2', 'student-5', 'student-8'],
    waitlistStudentIds: [],
    type: 'FUNCTIONAL',
    wod: "Foco: Deadlift\n\n5 séries de 5 repetições com 80% do RM.\nDescanso de 3 min entre séries.",
    feedback: [{ studentId: 'student-2', rating: 9 }]
  },
  {
    id: 'c4',
    title: 'Mobilidade & Alongamento',
    description: 'Melhora da flexibilidade e recuperação.',
    dayOfWeek: 'Sábado',
    startTime: '09:00',
    durationMinutes: 45,
    instructor: 'Treinadora Sarah',
    maxCapacity: 10,
    enrolledStudentIds: ['student-3', 'student-5', 'student-7', 'student-4'],
    waitlistStudentIds: [],
    type: 'FUNCTIONAL',
    wod: "Sessão focada em liberação miofascial e alongamento dinâmico.",
    feedback: []
  }
];

// --- TREINOS PERSONALIZADOS ---
let personalizedWorkouts: PersonalizedWorkout[] = [
    {
        id: 'pw1',
        title: 'Treino de Viagem - Hotel',
        description: "**Aquecimento:**\n30 Polichinelos\n20 Agachamentos Livres\n\n**Circuito (4 Rounds):**\n- 15 Flexões de Braço (Apoio no sofá se precisar)\n- 20 Afundos (cada perna)\n- 30seg Prancha Abdominal\n- 15 Tríceps no Banco/Cadeira\n\n**Descanso:** 1min entre rounds.",
        // Fix: Add missing type property
        type: 'FUNCTIONAL',
        videoUrl: 'https://youtube.com/shorts/example',
        studentIds: ['student-1', 'student-6'],
        createdAt: '2024-05-10',
        instructorName: 'Treinador Alex'
    },
    {
        id: 'pw2',
        title: 'Fortalecimento de Core (Extra)',
        description: "Realizar 3x na semana após a corrida:\n\n- 3x 15 Abdominal Remador\n- 3x 40seg Prancha Lateral (cada lado)\n- 3x 12 Elevação de Perna\n- 3x 12 Perdigueiro (cada lado)",
        // Fix: Add missing type property
        type: 'FUNCTIONAL',
        studentIds: ['student-1', 'student-2', 'student-4'],
        createdAt: '2024-05-12',
        instructorName: 'Treinadora Sarah'
    },
    {
        id: 'pw3',
        title: 'Reabilitação de Joelho',
        description: "Foco: Fortalecimento de Quadríceps sem impacto.\n\n- 3x 10 Extensão de Joelho (Cadeira extensora isométrica 3seg)\n- 3x 12 Elevação Pélvica\n- 3x 15 Abdução de Quadril com elástico",
        // Fix: Add missing type property
        type: 'FUNCTIONAL',
        studentIds: ['student-5'],
        createdAt: '2024-06-01',
        instructorName: 'Treinador Alex'
    }
];

// --- AVALIAÇÕES ---
let assessments: Assessment[] = [
  // Mariana Costa (student-1)
  {
    id: 'a1',
    studentId: 'student-1',
    date: '2024-01-15',
    status: 'DONE',
    notes: 'Boa base inicial. Focar na resistência.',
    weight: 65, height: 168, bodyFatPercentage: 22, skeletalMuscleMass: 28,
    visceralFatLevel: 5, basalMetabolicRate: 1450, hydrationPercentage: 55,
    vo2Max: 45, squatMax: 80,
    circumferences: { chest: 90, waist: 72, abdomen: 78, hips: 98, rightThigh: 56, rightCalf: 36 }
  },
  {
    id: 'a2',
    studentId: 'student-1',
    date: '2024-03-15',
    status: 'DONE',
    notes: 'Ótimo progresso no VO2 Max.',
    weight: 63, height: 168, bodyFatPercentage: 20, skeletalMuscleMass: 29,
    visceralFatLevel: 4, basalMetabolicRate: 1470, hydrationPercentage: 57,
    vo2Max: 48, squatMax: 90
  },
  // Pedro Santos (student-2)
  {
    id: 'a3',
    studentId: 'student-2',
    date: '2024-02-10',
    status: 'DONE',
    notes: 'Ganho expressivo de força.',
    weight: 85, height: 180, bodyFatPercentage: 15, skeletalMuscleMass: 42,
    visceralFatLevel: 6, basalMetabolicRate: 1900, hydrationPercentage: 60,
    vo2Max: 50, squatMax: 140
  },
  // Ana Oliveira (student-4)
  {
    id: 'a4',
    studentId: 'student-4',
    date: '2024-05-10',
    status: 'DONE',
    notes: 'Início do programa de emagrecimento.',
    weight: 78, height: 165, bodyFatPercentage: 28, skeletalMuscleMass: 24,
    visceralFatLevel: 9, basalMetabolicRate: 1350, hydrationPercentage: 50,
    vo2Max: 35, squatMax: 40
  },
  // Fernanda Lima (student-6)
  {
    id: 'a5',
    studentId: 'student-6',
    date: '2024-07-22',
    status: 'DONE',
    notes: 'Excelente condicionamento.',
    weight: 58, height: 170, bodyFatPercentage: 16, skeletalMuscleMass: 27,
    visceralFatLevel: 2, basalMetabolicRate: 1500, hydrationPercentage: 62,
    vo2Max: 58, squatMax: 85
  }
];

// --- PRESENÇAS ---
// Mapeia ID da Aula -> Array de IDs de Alunos Presentes
let attendanceHistory: {[classId: string]: string[]} = {
    'c1': ['student-1', 'student-2', 'student-8'], // Exemplo pré-populado
    'c2': ['student-1', 'student-6']
}; 

// --- FEED (POSTS) ---
let posts: Post[] = [
  {
    id: 'p1',
    userId: 'student-1',
    userName: 'Mariana Costa',
    userAvatar: 'https://ui-avatars.com/api/?name=Mariana+Costa&background=ffb6c1&color=fff',
    imageUrl: 'https://images.unsplash.com/photo-1552674605-469523254d7d?auto=format&fit=crop&q=80&w=800',
    caption: 'Destruí nos 10k hoje! Rumo à maratona! 🏃‍♀️🔥',
    likes: 12,
    timestamp: '2 horas atrás'
  },
  {
    id: 'p2',
    userId: 'student-2',
    userName: 'Pedro Santos',
    userAvatar: 'https://ui-avatars.com/api/?name=Pedro+Santos&background=0ea5e9&color=fff',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800',
    caption: 'Novo PR no terra. 140kg para a conta! 💪',
    likes: 24,
    timestamp: '5 horas atrás'
  },
  {
    id: 'p3',
    userId: 'student-6',
    userName: 'Fernanda Lima',
    userAvatar: 'https://ui-avatars.com/api/?name=Fernanda+Lima&background=f43f5e&color=fff',
    imageUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&q=80&w=800',
    caption: 'Treino de sábado pago com essa turma incrível!',
    likes: 35,
    timestamp: '1 dia atrás'
  }
];

// --- FINANCEIRO (PAYMENTS) ---
let payments: Payment[] = [];

// Helper para gerar pagamentos para os alunos
const createMockPayments = () => {
    const list: Payment[] = [];
    students.forEach(student => {
        // Gera 12 mensalidades
        for (let i = 1; i <= 12; i++) {
            const dueDate = new Date(2024, i - 1, 5); // Dia 5 de cada mês
            const today = new Date();
            let status: 'PAID' | 'PENDING' | 'OVERDUE' = 'PENDING';
            
            // Lógica simples de status mock
            if (dueDate < today) {
                // Se já venceu, 90% chance de estar pago, 10% atrasado (exceto Mariana e Pedro que tem regras especificas abaixo)
                status = Math.random() > 0.1 ? 'PAID' : 'OVERDUE';
            }

            // Regras específicas para demonstração
            if (student.id === 'student-1' && i === 12) status = 'PENDING'; // Mariana futuro
            if (student.id === 'student-1' && i < 12) status = 'PAID'; 
            
            if (student.id === 'student-2' && i === new Date().getMonth() + 1) {
                status = 'PENDING'; // Mês atual pendente
                const d = new Date(); d.setDate(d.getDate() + 2); // Vence daqui 2 dias
                dueDate.setDate(d.getDate()); dueDate.setMonth(d.getMonth());
            }

            if (student.id === 'student-4' && i === new Date().getMonth()) {
                status = 'OVERDUE'; // Mês passado atrasado
            }

            list.push({
                id: `pay_${student.id}_${i}`,
                studentId: student.id,
                amount: 150.00,
                status: status,
                dueDate: formatDate(dueDate),
                description: `Mensalidade ${i}/12 - Plano Anual`,
                installmentNumber: i,
                totalInstallments: 12
            });
        }
    });
    return list;
};

payments = createMockPayments();

// --- ROTAS ---
let routes: Route[] = [
  {
    id: 'r1',
    title: 'Volta do Lago',
    distanceKm: 5.2,
    description: 'Percurso plano ideal para iniciantes em volta do lago principal.',
    mapLink: 'https://maps.google.com',
    difficulty: 'EASY',
    elevationGain: 10
  },
  {
    id: 'r2',
    title: 'Desafio da Colina',
    distanceKm: 8.5,
    description: 'Treino de força com subidas íngremes.',
    mapLink: 'https://maps.google.com',
    difficulty: 'HARD',
    elevationGain: 150
  },
  {
    id: 'r3',
    title: 'Trilha da Mata',
    distanceKm: 12.0,
    description: 'Percurso misto com trechos de terra e asfalto.',
    mapLink: 'https://maps.google.com',
    difficulty: 'MEDIUM',
    elevationGain: 80
  }
];

let globalChallenge: Challenge = {
  id: 'ch1',
  title: 'Volta ao Mundo',
  description: 'Acumular 40.000km corridos somando todos os alunos da academia.',
  targetValue: 40000,
  unit: 'km',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
};

// --- MOCK SERVICE API ---
export const MockService = {
  getClasses: () => Promise.resolve(classes),
  
  addClass: (newClass: Omit<ClassSession, 'id'>) => {
    const newItem = { 
        ...newClass, 
        id: Math.random().toString(36).substr(2, 9), 
        enrolledStudentIds: [],
        waitlistStudentIds: [] 
    };
    classes = [...classes, newItem];
    return Promise.resolve(newItem);
  },
  
  updateClass: (updatedClass: ClassSession) => {
    classes = classes.map(c => c.id === updatedClass.id ? updatedClass : c);
    return Promise.resolve(updatedClass);
  },

  deleteClass: (id: string) => {
    classes = classes.filter(c => c.id !== id);
    return Promise.resolve(true);
  },

  enrollStudent: (classId: string, studentId: string) => {
    classes = classes.map(c => {
      if (c.id === classId && !c.enrolledStudentIds.includes(studentId)) {
        if (c.enrolledStudentIds.length >= c.maxCapacity) return c;
        return { ...c, enrolledStudentIds: [...c.enrolledStudentIds, studentId] };
      }
      return c;
    });
    return Promise.resolve(true);
  },
  
  removeStudentFromClass: (classId: string, studentId: string) => {
    classes = classes.map(c => {
      if (c.id === classId) {
        const newEnrolled = c.enrolledStudentIds.filter(id => id !== studentId);
        let newWaitlist = [...(c.waitlistStudentIds || [])];
        if (newWaitlist.length > 0 && newEnrolled.length < c.maxCapacity) {
            newEnrolled.push(newWaitlist.shift()!);
        }
        return { ...c, enrolledStudentIds: newEnrolled, waitlistStudentIds: newWaitlist };
      }
      return c;
    });
    return Promise.resolve(true);
  },

  joinWaitlist: (classId: string, studentId: string) => {
      classes = classes.map(c => {
          if (c.id === classId && !c.waitlistStudentIds?.includes(studentId)) {
               return { ...c, waitlistStudentIds: [...(c.waitlistStudentIds || []), studentId] };
          }
          return c;
      });
      return Promise.resolve(true);
  },

  leaveWaitlist: (classId: string, studentId: string) => {
      classes = classes.map(c => {
          if (c.id === classId) {
               return { ...c, waitlistStudentIds: (c.waitlistStudentIds || []).filter(id => id !== studentId) };
          }
          return c;
      });
      return Promise.resolve(true);
  },

  // --- ATTENDANCE SYSTEM IMPROVED ---
  saveAttendance: (classId: string, presentStudentIds: string[]) => {
      attendanceHistory[classId] = presentStudentIds;
      return Promise.resolve(true);
  },

  // Recupera quem estava presente em uma aula específica
  getClassAttendance: (classId: string) => {
      return Promise.resolve(attendanceHistory[classId] || []);
  },

  // Helper para verificar se uma aula já teve chamada
  hasAttendance: (classId: string) => {
      return Promise.resolve(!!attendanceHistory[classId]);
  },

  getStudentAttendanceStats: (studentId: string) => {
      let totalClasses = 0;
      let presentCount = 0;

      classes.forEach(cls => {
         if (cls.enrolledStudentIds.includes(studentId)) {
             totalClasses++;
             // Se houve chamada e aluno está nela, ou se não houve chamada (assume presente para mock)
             if (attendanceHistory[cls.id]) {
                 if (attendanceHistory[cls.id].includes(studentId)) presentCount++;
             } else {
                 presentCount++; // Mock otimista
             }
         }
      });
      
      const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;
      return Promise.resolve({ percentage, totalClasses, presentCount });
  },

  getAttendanceReport: () => {
    // Retorna dados para o gráfico de frequência geral da academia
    const data = [
        { name: 'Seg', attendance: 85 },
        { name: 'Ter', attendance: 78 },
        { name: 'Qua', attendance: 92 },
        { name: 'Qui', attendance: 88 },
        { name: 'Sex', attendance: 70 },
        { name: 'Sáb', attendance: 95 }
    ];
    return Promise.resolve(data);
  },
  
  getAssessments: (studentId?: string) => {
    if (studentId) return Promise.resolve(assessments.filter(a => a.studentId === studentId));
    return Promise.resolve(assessments);
  },
  
  addAssessment: (newAssessment: Omit<Assessment, 'id'>) => {
    const newItem = { ...newAssessment, id: Math.random().toString(36).substr(2, 9) };
    assessments = [...assessments, newItem];
    return Promise.resolve(newItem);
  },

  updateAssessment: (updatedAssessment: Assessment) => {
    assessments = assessments.map(a => a.id === updatedAssessment.id ? updatedAssessment : a);
    return Promise.resolve(updatedAssessment);
  },

  deleteAssessment: (id: string) => {
    assessments = assessments.filter(a => a.id !== id);
    return Promise.resolve(true);
  },

  getPosts: () => Promise.resolve(posts),
  addPost: (newPost: Post) => {
    posts = [newPost, ...posts];
    return Promise.resolve(newPost);
  },

  getPayments: (studentId?: string) => {
    if (studentId) return Promise.resolve(payments.filter(p => p.studentId === studentId));
    return Promise.resolve(payments);
  },

  getAllStudents: () => Promise.resolve(students),
  
  addStudent: (student: Omit<User, 'id'>) => {
      const newId = Math.random().toString(36).substr(2, 9);
      const newStudent = { ...student, id: newId } as User;
      students = [...students, newStudent];
      
      // Gera pagamentos para o novo aluno
      for (let i = 1; i <= 12; i++) {
        const d = new Date(); d.setMonth(d.getMonth() + i - 1); d.setDate(5);
        payments.push({
            id: `pay_${newId}_${i}`,
            studentId: newId,
            amount: 150.00,
            status: 'PENDING',
            dueDate: formatDate(d),
            description: `Mensalidade ${i}/12`,
            installmentNumber: i, totalInstallments: 12
        });
      }
      return Promise.resolve(newStudent);
  },

  updateStudent: (updatedStudent: User) => {
      students = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
      return Promise.resolve(updatedStudent);
  },

  deleteStudent: (id: string) => {
      students = students.filter(s => s.id !== id);
      return Promise.resolve(true);
  },

  saveAnamnesis: (userId: string, anamnesis: Anamnesis) => {
      students = students.map(s => s.id === userId ? { ...s, anamnesis: anamnesis } : s);
      return Promise.resolve(true);
  },

  markPaymentAsPaid: (id: string) => {
    payments = payments.map(p => p.id === id ? { ...p, status: 'PAID' } : p);
    return Promise.resolve(true);
  },

  getPaymentAlerts: () => {
    const alerts: { payment: Payment, student: User, type: 'OVERDUE' | 'TODAY' | 'UPCOMING', daysDiff: number }[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    payments.forEach(p => {
        const student = students.find(s => s.id === p.studentId);
        if (!student) return;

        const [day, month, year] = p.dueDate.split('/').map(Number);
        const due = new Date(year, month - 1, day);
        due.setHours(0,0,0,0);
        
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (p.status === 'OVERDUE') {
            alerts.push({ payment: p, student, type: 'OVERDUE', daysDiff: Math.abs(diffDays) });
        } else if (p.status === 'PENDING') {
            if (diffDays === 0) {
                 alerts.push({ payment: p, student, type: 'TODAY', daysDiff: 0 });
            } else if (diffDays > 0 && diffDays <= 5) {
                alerts.push({ payment: p, student, type: 'UPCOMING', daysDiff: diffDays });
            }
        }
    });

    return Promise.resolve(alerts.sort((a, b) => {
        const priority = { 'OVERDUE': 1, 'TODAY': 2, 'UPCOMING': 3 };
        if (priority[a.type] !== priority[b.type]) return priority[a.type] - priority[b.type];
        return a.daysDiff - b.daysDiff;
    }));
  },

  getStudentPendingPayments: (studentId: string) => {
      const pending: { payment: Payment, type: 'OVERDUE' | 'TODAY' | 'UPCOMING', daysDiff: number }[] = [];
      const today = new Date();
      today.setHours(0,0,0,0);

      payments.filter(p => p.studentId === studentId).forEach(p => {
         const [day, month, year] = p.dueDate.split('/').map(Number);
         const due = new Date(year, month - 1, day);
         due.setHours(0,0,0,0);
         const diffTime = due.getTime() - today.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

         if (p.status === 'OVERDUE') {
             pending.push({ payment: p, type: 'OVERDUE', daysDiff: Math.abs(diffDays) });
         } else if (p.status === 'PENDING') {
             if (diffDays === 0) pending.push({ payment: p, type: 'TODAY', daysDiff: 0 });
             else if (diffDays > 0 && diffDays <= 5) pending.push({ payment: p, type: 'UPCOMING', daysDiff: diffDays });
         }
      });
      
      return Promise.resolve(pending.sort((a, b) => {
          const priority = { 'OVERDUE': 1, 'TODAY': 2, 'UPCOMING': 3 };
          return priority[a.type] - priority[b.type];
      }));
  },

  getFinancialReport: (year: number) => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyData = monthNames.map(name => ({ name, students: 0, revenue: 0 }));

    payments.forEach(p => {
       if (p.status !== 'PAID') return;
       const [day, month, y] = p.dueDate.split('/').map(Number);
       if (y === year) {
           const idx = month - 1;
           if (idx >= 0 && idx < 12) {
               monthlyData[idx].revenue += p.amount;
               monthlyData[idx].students += 1; 
           }
       }
    });
    return Promise.resolve(monthlyData);
  },

  getReportData: (range: 'week' | 'month' | 'year') => {
      // Mock de dados de relatório mais robusto
      return Promise.resolve([
        { name: 'Jan', students: 85, revenue: 12500 },
        { name: 'Fev', students: 88, revenue: 13200 },
        { name: 'Mar', students: 92, revenue: 13800 },
        { name: 'Abr', students: 95, revenue: 14250 },
        { name: 'Mai', students: 98, revenue: 14700 },
        { name: 'Jun', students: 102, revenue: 15300 },
      ]);
  },

  getRoutes: () => Promise.resolve(routes),
  
  addRoute: (newRoute: Route) => {
    const r = { ...newRoute, id: Math.random().toString(36).substr(2, 9) };
    routes = [...routes, r];
    return Promise.resolve(r);
  },

  updateRoute: (updatedRoute: Route) => {
      routes = routes.map(r => r.id === updatedRoute.id ? updatedRoute : r);
      return Promise.resolve(updatedRoute);
  },

  deleteRoute: (id: string) => {
      routes = routes.filter(r => r.id !== id);
      return Promise.resolve(true);
  },

  getGlobalChallengeProgress: () => {
    return Promise.resolve({ challenge: globalChallenge, totalDistance: 12500 });
  },

  getPersonalizedWorkouts: (studentId?: string) => {
      if (studentId) return Promise.resolve(personalizedWorkouts.filter(w => w.studentIds.includes(studentId)));
      return Promise.resolve(personalizedWorkouts);
  },

  addPersonalizedWorkout: (workout: Omit<PersonalizedWorkout, 'id'>) => {
      const newItem = { ...workout, id: Math.random().toString(36).substr(2, 9) };
      personalizedWorkouts = [...personalizedWorkouts, newItem];
      return Promise.resolve(newItem);
  },

  updatePersonalizedWorkout: (updatedWorkout: PersonalizedWorkout) => {
      personalizedWorkouts = personalizedWorkouts.map(w => w.id === updatedWorkout.id ? updatedWorkout : w);
      return Promise.resolve(updatedWorkout);
  },

  deletePersonalizedWorkout: (id: string) => {
      personalizedWorkouts = personalizedWorkouts.filter(w => w.id !== id);
      return Promise.resolve(true);
  }
};