
-- 1. TABELA DE DESAFIOS (METAS DA ACADEMIA)
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'km',
    start_date TEXT,
    end_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABELA DE ENTRADAS (PONTUAÇÃO DOS ALUNOS NO RANKING)
CREATE TABLE IF NOT EXISTS challenge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    value NUMERIC DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABELA DE CONFIGURAÇÕES DA ACADEMIA
CREATE TABLE IF NOT EXISTS academy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    cnpj TEXT,
    phone TEXT,
    email TEXT,
    representative_name TEXT,
    mercado_pago_public_key TEXT,
    mercado_pago_access_token TEXT,
    pix_key TEXT,
    custom_domain TEXT,
    monthly_fee NUMERIC DEFAULT 0,
    registration_invite_code TEXT DEFAULT 'BEMVINDO2024',
    address JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. INSERIR CONFIGURAÇÃO INICIAL (Obrigatório para o primeiro carregamento)
INSERT INTO academy_settings (name, registration_invite_code)
SELECT 'Studio', 'BEMVINDO2024'
WHERE NOT EXISTS (SELECT 1 FROM academy_settings);

-- 5. GARANTIR QUE AS COLUNAS DE STATUS EXISTAM NA TABELA USERS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
        ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='suspended_at') THEN
        ALTER TABLE users ADD COLUMN suspended_at TEXT;
    END IF;
END $$;
