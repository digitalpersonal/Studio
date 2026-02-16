
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

-- 3. Habilitar Realtime para estas tabelas
ALTER publication supabase_realtime ADD TABLE public.posts;
ALTER publication supabase_realtime ADD TABLE public.post_comments;

-- 4. Desabilitar RLS ou configurar políticas públicas (já que o login é customizado)
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments DISABLE ROW LEVEL SECURITY;

SELECT 'Tabelas da comunidade criadas com suporte a Realtime e armazenamento otimizado.' as status;
