
-- SQL Update: Cria a tabela de planos e insere os dados iniciais.
-- Execute este script no Editor de SQL do seu painel Supabase.

-- 1. Cria a tabela 'plans' se ela não existir.
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    plan_type TEXT NOT NULL, -- MENSAL, TRIMESTRAL, SEMESTRAL, KIDS, AVULSO
    frequency TEXT, -- 2x na semana, etc.
    price NUMERIC(10, 2) NOT NULL,
    duration_months INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT
);

-- 2. Limpa os dados antigos para evitar duplicatas ao re-executar.
DELETE FROM public.plans;

-- 3. Insere os planos baseados na imagem fornecida.
INSERT INTO public.plans (title, plan_type, frequency, price, duration_months, display_order) VALUES
-- Planos Trimestrais
('TRIMESTRAL - 2x na semana', 'TRIMESTRAL', '2x na semana', 100.00, 3, 1),
('TRIMESTRAL - 3x na semana', 'TRIMESTRAL', '3x na semana', 110.00, 3, 2),
('TRIMESTRAL - 4x na semana', 'TRIMESTRAL', '4x na semana', 120.00, 3, 3),
('TRIMESTRAL - 5x na semana', 'TRIMESTRAL', '5x na semana', 130.00, 3, 4),

-- Planos Mensais
('MENSAL - 2x na semana', 'MENSAL', '2x na semana', 110.00, 1, 5),
('MENSAL - 3x na semana', 'MENSAL', '3x na semana', 140.00, 1, 6),
('MENSAL - 4x na semana', 'MENSAL', '4x na semana', 150.00, 1, 7),
('MENSAL - 5x na semana', 'MENSAL', '5x na semana', 160.00, 1, 8),

-- Planos Semestrais
('SEMESTRAL - 2x na semana', 'SEMESTRAL', '2x na semana', 95.00, 6, 9),
('SEMESTRAL - 3x na semana', 'SEMESTRAL', '3x na semana', 105.00, 6, 10),
('SEMESTRAL - 4x na semana', 'SEMESTRAL', '4x na semana', 115.00, 6, 11),
('SEMESTRAL - 5x na semana', 'SEMESTRAL', '5x na semana', 125.00, 6, 12),

-- Planos Especiais
('Treinamento Kids', 'KIDS', '2x na semana', 90.00, 1, 13),
('Treinamento Avulso', 'AVULSO', '1x (acesso único)', 30.00, 0, 14);


-- Adiciona colunas ausentes à tabela 'classes' (se necessário).
-- Este bloco garante a retrocompatibilidade com atualizações anteriores.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='cycle_start_date') THEN
        ALTER TABLE classes ADD COLUMN cycle_start_date DATE;
    END IF;
END $$;


-- Adiciona a coluna plan_id à tabela de usuários, se ainda não existir.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan_id') THEN
        ALTER TABLE public.users ADD COLUMN plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Adiciona a coluna de desconto na tabela de usuários
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan_discount') THEN
        ALTER TABLE public.users ADD COLUMN plan_discount NUMERIC(10, 2) DEFAULT 0;
    END IF;
END $$;
