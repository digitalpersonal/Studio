
-- Criação da tabela de avisos
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'INFO', -- Valores possíveis: 'INFO', 'WARNING', 'URGENT'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Como o app usa um sistema de login manual (tabela users customizada) 
-- e não o Supabase Auth Nativo, as políticas baseadas em auth.uid() falham.
-- Desabilitamos o RLS ou permitimos acesso total para a role 'anon' (usada pelo frontend).
-- Segurança: O controle de quem pode clicar no botão Criar/Editar é feito via frontend (UserRole.ADMIN).

ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;

-- Se preferir manter RLS ativado, use estas políticas que permitem acesso à role anônima:
/*
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir tudo para notices" 
ON public.notices FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);
*/
