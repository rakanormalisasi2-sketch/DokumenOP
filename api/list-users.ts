import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: Missing authorization header' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing Supabase Keys' });
    }

    // 1. Verifikasi token admin menggunakan Anon Key
    const token = authHeader.replace('Bearer ', '');
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey
      }
    });

    if (!userRes.ok) {
      const errorText = await userRes.text();
      return res.status(401).json({ error: `Unauthorized: Invalid token. Details: ${errorText}` });
    }

    const adminUser = await userRes.json();
    if (adminUser.user_metadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can list users' });
    }

    // 2. Gunakan Service Role Key untuk mengambil seluruh users
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await adminClient.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    // 3. Filter hanya user dengan role 'respondent' dan petakan ke struktur yang dibutuhkan
    const respondents = data.users
      .filter(user => user.user_metadata?.role === 'respondent')
      .map(user => ({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'Tanpa Nama',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      }));

    return res.status(200).json({ users: respondents });

  } catch (error: any) {
    console.error('List Users Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
