-- =================================================================================================
-- STUDIO - SCRIPT DE ÚLTIMAS ATUALIZAÇÕES (EVOLUÇÃO DE CORRIDA E PERFORMANCE)
-- =================================================================================================

-- 1. Tabela de Presença (Attendance) com campos de performance
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

-- 2. Tabela de Resumos de Ciclo (Cycle Summaries) - IA
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

-- 3. Tabela de Avisos (Notices)
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'INFO', -- Valores possíveis: 'INFO', 'WARNING', 'URGENT'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Avaliações Físicas (Assessments)
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'DONE', -- 'DONE', 'SCHEDULED'
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

-- 5. Tabela de Rotas de Corrida (Routes)
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    distance_km NUMERIC(5, 2) NOT NULL,
    description TEXT,
    map_link TEXT,
    difficulty TEXT, -- 'EASY', 'MEDIUM', 'HARD'
    elevation_gain INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de Desafios (Challenges)
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

-- 7. Tabela de Entradas de Desafio (Challenge Entries)
CREATE TABLE IF NOT EXISTS public.challenge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    value NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabela de Treinos Personalizados (Personalized Workouts)
CREATE TABLE IF NOT EXISTS public.personalized_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    student_ids UUID[] DEFAULT '{}',
    instructor_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Habilitar Realtime para as novas tabelas (Ignora erro se já estiver habilitado)
DO $$ 
BEGIN 
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.attendance;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.cycle_summaries;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.notices;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.assessments;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.routes;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.challenges;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.challenge_entries;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.personalized_workouts;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 10. Desabilitar RLS para estas tabelas (controle via frontend)
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalized_workouts DISABLE ROW LEVEL SECURITY;

-- 11. Atualização de Academy Settings para chaves do Strava
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='academy_settings' AND column_name='strava_client_id') THEN
        ALTER TABLE public.academy_settings ADD COLUMN strava_client_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='academy_settings' AND column_name='strava_client_secret') THEN
        ALTER TABLE public.academy_settings ADD COLUMN strava_client_secret TEXT;
    END IF;
END $$;

SELECT 'Tabelas de performance, avisos e evolução criadas com sucesso.' as status;
