
-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE USUÁRIOS (Corrigida e Completa)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    avatar_url TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    phone_number TEXT,
    birth_date DATE,
    marital_status TEXT,
    cpf TEXT,
    rg TEXT,
    nationality TEXT,
    profession TEXT,
    plan_value NUMERIC(10,2) DEFAULT 0,
    plan_duration INTEGER DEFAULT 1,
    billing_day INTEGER DEFAULT 5,
    plan_start_date DATE,
    contract_url TEXT,
    contract_generated_at TIMESTAMP WITH TIME ZONE,
    profile_completed BOOLEAN DEFAULT FALSE,
    address JSONB DEFAULT '{}'::jsonb,
    anamnesis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE AULAS (Classes)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    day_of_week TEXT NOT NULL,
    date DATE,
    start_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    instructor TEXT NOT NULL,
    max_capacity INTEGER DEFAULT 15,
    enrolled_student_ids JSONB DEFAULT '[]'::jsonb,
    waitlist_student_ids JSONB DEFAULT '[]'::jsonb,
    type TEXT NOT NULL DEFAULT 'FUNCTIONAL',
    is_cancelled BOOLEAN DEFAULT FALSE,
    wod TEXT,
    workout_details TEXT,
    feedback JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE PAGAMENTOS (Payments)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    description TEXT,
    installment_number INTEGER,
    total_installments INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE CHAMADA (Attendance)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_present BOOLEAN DEFAULT FALSE,
    UNIQUE(class_id, student_id, date)
);

-- 6. TABELA DE AVALIAÇÕES (Assessments)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'DONE',
    weight NUMERIC(5,2),
    height NUMERIC(5,2),
    body_fat_percentage NUMERIC(5,2),
    skeletal_muscle_mass NUMERIC(5,2),
    visceral_fat_level INTEGER,
    basal_metabolic_rate INTEGER,
    hydration_percentage NUMERIC(5,2),
    vo2_max NUMERIC(5,2),
    squat_max NUMERIC(5,2),
    horizontal_jump NUMERIC(5,2),
    vertical_jump NUMERIC(5,2),
    medicine_ball_throw NUMERIC(5,2),
    fms JSONB DEFAULT '{}'::jsonb,
    circumferences JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE TREINOS PERSONALIZADOS
CREATE TABLE IF NOT EXISTS personalized_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    video_url TEXT,
    student_ids JSONB DEFAULT '[]'::jsonb,
    instructor_name TEXT,
    created_at DATE DEFAULT CURRENT_DATE
);

-- 8. TABELA DE POSTS (Comunidade)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT,
    caption TEXT,
    likes JSONB DEFAULT '[]'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABELA DE DESAFIOS (Challenges)
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC(15,2) NOT NULL,
    unit TEXT DEFAULT 'km',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- 10. TABELA DE ROTAS (Routes)
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    distance_km NUMERIC(10,2) NOT NULL,
    description TEXT,
    map_link TEXT,
    difficulty TEXT DEFAULT 'MEDIUM',
    elevation_gain INTEGER DEFAULT 0
);

-- POLÍTICAS DE ACESSO (Opcional - se quiser desabilitar RLS para testes rápidos)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE personalized_workouts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
