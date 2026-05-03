-- =================================================================================================
-- STUDIO - SCRIPT DE SCHEMA COMPLETO (VERSÃO FINAL CONSOLIDADA)
-- Descrição: Cria toda a estrutura do banco de dados e insere dados iniciais.
-- =================================================================================================

-- Habilita a extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Configurações da Academia
CREATE TABLE IF NOT EXISTS public.academy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    cnpj TEXT,
    address JSONB,
    phone TEXT,
    email TEXT,
    representative_name TEXT,
    mercado_pago_public_key TEXT,
    mercado_pago_access_token TEXT,
    pix_key TEXT,
    custom_domain TEXT,
    monthly_fee NUMERIC(10, 2),
    registration_invite_code TEXT DEFAULT 'BEMVINDO2024',
    strava_client_id TEXT,
    strava_client_secret TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Planos
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    plan_type TEXT NOT NULL, -- 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'KIDS', 'AVULSO'
    frequency TEXT,
    price NUMERIC(10, 2) NOT NULL,
    duration_months INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar_url TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    phone_number TEXT,
    birth_date DATE NOT NULL,
    cpf TEXT,
    rg TEXT,
    nationality TEXT,
    marital_status TEXT,
    profession TEXT,
    address JSONB,
    plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
    plan_value NUMERIC(10, 2),
    plan_discount NUMERIC(10, 2) DEFAULT 0,
    plan_duration INT,
    billing_day INT DEFAULT 5,
    plan_start_date DATE,
    anamnesis JSONB,
    contract_url TEXT,
    contract_generated_at TIMESTAMPTZ,
    profile_completed BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'ACTIVE',
    suspended_at TIMESTAMPTZ,
    strava_access_token TEXT,
    strava_refresh_token TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Aulas
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    day_of_week TEXT,
    start_time TIME,
    duration_minutes INT DEFAULT 60,
    instructor TEXT,
    max_capacity INT DEFAULT 15,
    enrolled_student_ids UUID[] DEFAULT '{}',
    waitlist_student_ids UUID[] DEFAULT '{}',
    type TEXT, -- 'FUNCTIONAL' ou 'RUNNING'
    wod TEXT,
    workout_details TEXT,
    feedback JSONB,
    date DATE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cycle_start_date DATE,
    week_of_cycle INT,
    week_focus TEXT,
    estimated_volume_minutes INT,
    week_objective TEXT,
    reference_workouts TEXT,
    main_workout TEXT,
    distance_km NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de Presença (Attendance)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_present BOOLEAN DEFAULT TRUE,
    total_time_seconds INT,
    average_pace TEXT,
    age_group_classification TEXT,
    instructor_notes TEXT,
    generated_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PAID', 'PENDING', 'OVERDUE'
    due_date DATE NOT NULL,
    description TEXT,
    installment_number INT,
    total_installments INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabela de Avaliações Físicas
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'DONE',
    weight NUMERIC(5, 2),
    height NUMERIC(5, 2),
    body_fat_percentage NUMERIC(5, 2),
    skeletal_muscle_mass NUMERIC(5, 2),
    visceral_fat_level INT,
    basal_metabolic_rate INT,
    hydration_percentage NUMERIC(5, 2),
    abdominal_test INT,
    horizontal_jump NUMERIC(5, 2),
    vertical_jump NUMERIC(5, 2),
    medicine_ball_throw NUMERIC(5, 2),
    photo_front_url TEXT,
    photo_side_url TEXT,
    photo_back_url TEXT,
    fms JSONB DEFAULT '{}',
    circumferences JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabela de Rotas de Corrida
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    distance_km NUMERIC(5, 2) NOT NULL,
    description TEXT,
    map_link TEXT,
    difficulty TEXT,
    elevation_gain INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Tabela de Desafios
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC(10, 2) NOT NULL,
    unit TEXT DEFAULT 'km',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Tabela de Entradas de Desafio
CREATE TABLE IF NOT EXISTS public.challenge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    value NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Tabela de Treinos Personalizados
CREATE TABLE IF NOT EXISTS public.personalized_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    student_ids UUID[] DEFAULT '{}',
    instructor_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Tabela de Postagens (Comunidade)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT,
    caption TEXT,
    likes UUID[] DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Tabela de Comentários
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Tabela de Resumos de Ciclo (IA)
CREATE TABLE IF NOT EXISTS public.cycle_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_end_date DATE NOT NULL,
    summary_text TEXT NOT NULL,
    start_pace TEXT,
    end_pace TEXT,
    performance_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Tabela de Avisos
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'INFO',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =================================================================================================
-- CONFIGURAÇÕES DE REALTIME E RLS
-- =================================================================================================

-- Habilitar Realtime para tabelas principais
DO $$ 
BEGIN 
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.posts;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.post_comments;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.attendance;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.notices;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- Desabilitar RLS para facilitar integração com login customizado
ALTER TABLE public.academy_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalized_workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;

-- =================================================================================================
-- CARGA INICIAL DE DADOS
-- =================================================================================================

-- Configurações Iniciais
INSERT INTO public.academy_settings (name, registration_invite_code, monthly_fee)
SELECT 'Studio', 'BEMVINDO2024', 150.00
WHERE NOT EXISTS (SELECT 1 FROM public.academy_settings);

-- Planos Padrão
INSERT INTO public.plans (title, plan_type, frequency, price, duration_months, display_order)
SELECT 'MENSAL - 3x na semana', 'MENSAL', '3x na semana', 140.00, 1, 1 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE title = 'MENSAL - 3x na semana');
INSERT INTO public.plans (title, plan_type, frequency, price, duration_months, display_order)
SELECT 'MENSAL - 4x na semana', 'MENSAL', '4x na semana', 150.00, 1, 2 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE title = 'MENSAL - 4x na semana');
INSERT INTO public.plans (title, plan_type, frequency, price, duration_months, display_order)
SELECT 'TRIMESTRAL - 3x na semana', 'TRIMESTRAL', '3x na semana', 110.00, 3, 3 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE title = 'TRIMESTRAL - 3x na semana');
INSERT INTO public.plans (title, plan_type, frequency, price, duration_months, display_order)
SELECT 'SEMESTRAL - 3x na semana', 'SEMESTRAL', '3x na semana', 105.00, 6, 4 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE title = 'SEMESTRAL - 3x na semana');
INSERT INTO public.plans (title, plan_type, frequency, price, duration_months, display_order)
SELECT 'Treinamento Kids', 'KIDS', '2x na semana', 90.00, 1, 5 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE title = 'Treinamento Kids');

SELECT 'Schema completo e dados iniciais configurados com sucesso.' as status;
