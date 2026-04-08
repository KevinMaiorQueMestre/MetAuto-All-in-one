-- ==============================================================================
-- KEVQUEST PLATFORM - SUPABASE SCHEMA & RLS setup V2 (Otimizado)
-- Cole este código no "SQL Editor" do Supabase.
-- ATENÇÃO: As políticas temporárias de acesso livre foram substituídas por 
-- RLS rigoroso, Cascade Adicionado e Índices criados.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- FUNÇÃO GLOBAL DE UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. TABELA DE PROFILES (Alunos vs Admin)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    nome TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'aluno' CHECK (role IN ('admin', 'aluno')),
    nivel_acesso TEXT DEFAULT 'basico' CHECK (nivel_acesso IN ('basico', 'pro', 'premium')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Livre acesso temporario Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin All Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Self Profile or Admin View" ON public.profiles;
DROP POLICY IF EXISTS "Aluno Self Update" ON public.profiles;

-- FUNÇÃO PARA CHECAR ADMIN (SECURITY DEFINER para pular recursões)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GESTÃO EXATA DE POLÍTICAS SEM RECURSÃO DE LOOP
CREATE POLICY "Admin All Profiles" ON public.profiles FOR ALL USING (
  public.is_admin()
);
CREATE POLICY "Self Profile or Admin View" ON public.profiles FOR SELECT USING (
  id = auth.uid() OR role = 'admin'
);
-- Aluno pode fazer update em si mesmo (ex: mudar avatar/nome)
CREATE POLICY "Aluno Self Update" ON public.profiles FOR UPDATE USING (id = auth.uid());


-- 2. TRIGGER AUTOMÁTICO NA CRIAÇÃO DE USUÁRIOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, avatar_url, role, nivel_acesso)
  VALUES (
      new.id, 
      COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Cursista'), 
      new.raw_user_meta_data->>'avatar_url',
      'aluno',
      'basico' 
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. TABELA DE TEMAS DE REDAÇÃO (Criados pelo Admin)
CREATE TABLE IF NOT EXISTS public.temas_redacao (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    eixo_tematico TEXT,
    descricao_html TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS handle_temas_updated_at ON public.temas_redacao;
CREATE TRIGGER handle_temas_updated_at BEFORE UPDATE ON public.temas_redacao FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.temas_redacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Livre acesso temporario Temas" ON public.temas_redacao;
DROP POLICY IF EXISTS "Admin All Temas" ON public.temas_redacao;
DROP POLICY IF EXISTS "Aluno Ver Temas Publicados" ON public.temas_redacao;
CREATE POLICY "Admin All Temas" ON public.temas_redacao FOR ALL USING (
  public.is_admin()
);
CREATE POLICY "Aluno Ver Temas Publicados" ON public.temas_redacao FOR SELECT USING (
  is_published = true
);


-- 4. TABELA DE REDAÇÕES DOS ALUNOS
CREATE TABLE IF NOT EXISTS public.redacoes_aluno (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    aluno_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tema_id UUID REFERENCES public.temas_redacao(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'A_FAZER' CHECK (status IN ('A_FAZER', 'EM_AVALIACAO', 'DEVOLVIDA')),
    pdf_url TEXT,
    nota INTEGER DEFAULT NULL,
    feedback_admin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_redacoes_aluno_id ON public.redacoes_aluno(aluno_id);
DROP TRIGGER IF EXISTS handle_redacoes_updated_at ON public.redacoes_aluno;
CREATE TRIGGER handle_redacoes_updated_at BEFORE UPDATE ON public.redacoes_aluno FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.redacoes_aluno ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Livre acesso temporario Redacoes" ON public.redacoes_aluno;
DROP POLICY IF EXISTS "Admin All Redacoes" ON public.redacoes_aluno;
DROP POLICY IF EXISTS "Aluno CRUD Redacoes" ON public.redacoes_aluno;
CREATE POLICY "Admin All Redacoes" ON public.redacoes_aluno FOR ALL USING (
  public.is_admin()
);
CREATE POLICY "Aluno CRUD Redacoes" ON public.redacoes_aluno FOR ALL USING (
  aluno_id = auth.uid()
);


-- 5. TABELA GERAL DO CALENDÁRIO
CREATE TABLE IF NOT EXISTS public.calendario_eventos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    date_iso DATE NOT NULL,
    time_slot TEXT NOT NULL,
    color_class TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT DEFAULT 'pessoal' CHECK (tipo IN ('pessoal', 'aviso_admin')),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calendario_user_id ON public.calendario_eventos(user_id);
DROP TRIGGER IF EXISTS handle_calendario_updated_at ON public.calendario_eventos;
CREATE TRIGGER handle_calendario_updated_at BEFORE UPDATE ON public.calendario_eventos FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.calendario_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Livre acesso temporario Calendario" ON public.calendario_eventos;
DROP POLICY IF EXISTS "Admin All Calendario" ON public.calendario_eventos;
DROP POLICY IF EXISTS "Aluno CRUD Pessoal e Select Avisos" ON public.calendario_eventos;
CREATE POLICY "Admin All Calendario" ON public.calendario_eventos FOR ALL USING (
  public.is_admin()
);
CREATE POLICY "Aluno CRUD Pessoal e Select Avisos" ON public.calendario_eventos FOR ALL USING (
  user_id = auth.uid() 
  OR 
  (tipo = 'aviso_admin' AND is_published = true AND current_setting('request.method', true) = 'GET')
);
