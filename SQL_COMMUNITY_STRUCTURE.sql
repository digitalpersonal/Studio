
-- 1. Tabela de Postagens
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT, -- Base64 comprimido
    caption TEXT,
    likes UUID[] DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Comentários
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar Realtime para estas tabelas (de forma segura caso já existam na publicação)
DO $$ 
BEGIN 
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.posts;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER publication supabase_realtime ADD TABLE public.post_comments;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 4. Habilitar RLS e Configurar Políticas Públicas de Segurança (RLS)
-- Isso garante o funcionamento seguro mesmo se o RLS estiver ativado no painel do Supabase.
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflito na reinstalação
DROP POLICY IF EXISTS "Permitir leitura de posts" ON public.posts;
DROP POLICY IF EXISTS "Permitir inserção de posts" ON public.posts;
DROP POLICY IF EXISTS "Permitir atualização de posts" ON public.posts;
DROP POLICY IF EXISTS "Permitir exclusão de posts" ON public.posts;

DROP POLICY IF EXISTS "Permitir leitura de comentários" ON public.post_comments;
DROP POLICY IF EXISTS "Permitir inserção de comentários" ON public.post_comments;
DROP POLICY IF EXISTS "Permitir atualização de comentários" ON public.post_comments;
DROP POLICY IF EXISTS "Permitir exclusão de comentários" ON public.post_comments;

-- Políticas para POSTS (Leitura, Criação, Atualização, Exclusão para anon e authenticated)
CREATE POLICY "Permitir leitura de posts" ON public.posts
    FOR SELECT TO public USING (true);

CREATE POLICY "Permitir inserção de posts" ON public.posts
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Permitir atualização de posts" ON public.posts
    FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão de posts" ON public.posts
    FOR DELETE TO public USING (true);

-- Políticas para POST_COMMENTS (comentários das publicações)
CREATE POLICY "Permitir leitura de comentários" ON public.post_comments
    FOR SELECT TO public USING (true);

CREATE POLICY "Permitir inserção de comentários" ON public.post_comments
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Permitir atualização de comentários" ON public.post_comments
    FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão de comentários" ON public.post_comments
    FOR DELETE TO public USING (true);

-- 5. Configurar Storage para Imagens do Feed ('app-assets')
-- Garante o bucket de armazenamento e configura as políticas de RLS para que qualquer upload/leitura de imagens funcione.
-- Supabase armazena seus buckets na tabela storage.buckets e objetos na tabela storage.objects.

-- Garante que o bucket 'app-assets' existe e é público para as imagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Limpar políticas antigas de storage para este bucket para evitar conflitos na reinstalação
DROP POLICY IF EXISTS "Acesso público de leitura para app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Permitir inserção de imagens no bucket app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de imagens no bucket app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de imagens no bucket app-assets" ON storage.objects;

-- Políticas para storage.objects focado no bucket 'app-assets'
CREATE POLICY "Acesso público de leitura para app-assets" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'app-assets');

CREATE POLICY "Permitir inserção de imagens no bucket app-assets" ON storage.objects
    FOR INSERT TO public WITH CHECK (bucket_id = 'app-assets');

CREATE POLICY "Permitir atualização de imagens no bucket app-assets" ON storage.objects
    FOR UPDATE TO public USING (bucket_id = 'app-assets') WITH CHECK (bucket_id = 'app-assets');

CREATE POLICY "Permitir exclusão de imagens no bucket app-assets" ON storage.objects
    FOR DELETE TO public USING (bucket_id = 'app-assets');

SELECT 'Tabelas da comunidade criadas com suporte a Realtime, políticas de RLS para posts/comentários e bucket de armazenamento (app-assets) totalmente liberados e configurados.' as status;
