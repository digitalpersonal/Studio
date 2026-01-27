-- =================================================================================================
-- STUDIO - SCRIPT DE SCHEMA COMPLETO (VERSÃO ATUALIZADA)
-- Descrição: Cria a estrutura de tabelas e insere dados iniciais obrigatórios para o cadastro.
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

-- 3. Tabela de Usuários (Com Data de Nascimento Obrigatória)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar_url TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    phone_number TEXT,
    birth_date DATE NOT NULL, -- COLUNA OBRIGATÓRIA
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

-- 5. Tabela de Pagamentos
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

-- =================================================================================================
-- CARGA INICIAL DE DADOS (CRÍTICO PARA O FUNCIONAMENTO)
-- =================================================================================================

-- Garante que exista ao menos uma configuração com o código de convite
INSERT INTO public.academy_settings (name, registration_invite_code, monthly_fee)
SELECT 'Studio', 'BEMVINDO2024', 150.00
WHERE NOT EXISTS (SELECT 1 FROM public.academy_settings);

-- Atualiza caso já exista mas o código esteja nulo
UPDATE public.academy_settings SET registration_invite_code = 'BEMVINDO2024' WHERE registration_invite_code IS NULL;

-- Garante que os planos existam para o aluno escolher no cadastro
DELETE FROM public.plans; -- Opcional: limpa para reinserir os corretos
INSERT INTO public.plans (title, plan_type, frequency, price, duration_months, display_order) VALUES
('MENSAL - 3x na semana', 'MENSAL', '3x na semana', 140.00, 1, 1),
('MENSAL - 4x na semana', 'MENSAL', '4x na semana', 150.00, 1, 2),
('TRIMESTRAL - 3x na semana', 'TRIMESTRAL', '3x na semana', 110.00, 3, 3),
('SEMESTRAL - 3x na semana', 'SEMESTRAL', '3x na semana', 105.00, 6, 4),
('Treinamento Kids', 'KIDS', '2x na semana', 90.00, 1, 5);

-- Se você já tem usuários e quer tornar a coluna obrigatória agora, 
-- precisa definir uma data padrão para quem não tem, senão o comando abaixo falha:
-- UPDATE public.users SET birth_date = '2000-01-01' WHERE birth_date IS NULL;
-- ALTER TABLE public.users ALTER COLUMN birth_date SET NOT NULL;

SELECT 'Configuração concluída. O auto-cadastro agora exige data de nascimento e o convite é BEMVINDO2024.' as status;