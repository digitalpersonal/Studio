
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

-- 3. INSERIR DESAFIO INICIAL SE NÃO EXISTIR
INSERT INTO challenges (title, description, target_value, unit, start_date, end_date)
SELECT 'Volta ao Mundo', 'Acumular 40.000km corridos somando todos os alunos.', 40000, 'km', '2024-01-01', '2024-12-31'
WHERE NOT EXISTS (SELECT 1 FROM challenges LIMIT 1);

-- 4. GARANTIR QUE AS COLUNAS DE STATUS EXISTAM NA TABELA USERS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
        ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='suspended_at') THEN
        ALTER TABLE users ADD COLUMN suspended_at TEXT;
    END IF;
END $$;
