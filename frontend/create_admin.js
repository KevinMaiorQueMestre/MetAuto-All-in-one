import { readFileSync } from 'fs';

// Lê do .env.local puxando manualmente pra não precisar de pacote
const env = readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function createAdmin() {
  console.log('Criando usuário na nuvem usando REST Supabase...');
  
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@plataforma.com',
      password: 'curso123',
      data: {
        full_name: 'Super Admin'
      }
    })
  });

  const body = await response.json();
  if (!response.ok) {
    console.error('Falhou:', body);
  } else {
    console.log('ID criado:', body.user?.id);
  }
}

createAdmin();
