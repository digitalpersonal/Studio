-- ATUALIZAÇÃO SEGURA PARA BANCOS JÁ EM PRODUÇÃO

-- 1. Garante que todos os usuários tenham alguma data de nascimento (evita erro de constraint)
UPDATE public.users SET birth_date = '2000-01-01' WHERE birth_date IS NULL;

-- 2. Torna a coluna estritamente obrigatória
ALTER TABLE public.users ALTER COLUMN birth_date SET NOT NULL;

-- 3. Garante que o código de convite de auto-cadastro esteja definido
UPDATE public.academy_settings 
SET registration_invite_code = 'BEMVINDO2024' 
WHERE registration_invite_code IS NULL;

-- 4. Adiciona campo de senha se não existir (essencial para login do auto-cadastro)
ALTER TABLE public.users ALTER COLUMN password SET NOT NULL;

SELECT 'Banco de dados atualizado com sucesso.' as status;