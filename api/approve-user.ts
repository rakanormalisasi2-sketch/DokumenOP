import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Generate a secure random password (minimum 12 chars, alphanumeric + symbols)
function generateSecurePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  const randomBytes = crypto.randomBytes(16);
  let password = '';
  for (let i = 0; i < randomBytes.length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Hanya menerima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, requestId } = req.body;

    if (!email || !name || !requestId) {
      return res.status(400).json({ error: 'Email, name, dan requestId wajib diisi' });
    }

    // 1. Verifikasi Admin Access Token dari headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: Missing authorization header' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing Supabase Keys' });
    }

    // Klien biasa untuk memverifikasi siapa pengirim request (Harus Admin)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    if (user.user_metadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can approve requests' });
    }

    // 2. Gunakan Service Role Key untuk ByPass RLS & Auth Admin API
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 3. Generate Password Super Aman
    const securePassword = generateSecurePassword();

    // 4. Buat User Resmi di Supabase Auth
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email,
      password: securePassword,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: 'respondent'
      }
    });

    if (createError) {
      // Jika email sudah ada, kita tangani dengan elegan
      if (createError.message.includes('already exists') || createError.status === 422) {
        return res.status(400).json({ error: 'User dengan email ini sudah terdaftar di sistem.' });
      }
      throw createError;
    }

    // 5. Update Status di tabel access_requests menjadi "approved"
    const { error: updateError } = await adminClient
      .from('access_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })
      .eq('id', requestId);

    if (updateError) {
      // Rollback auth user creation if database update fails
      if (newUser.user?.id) {
         await adminClient.auth.admin.deleteUser(newUser.user.id);
      }
      throw updateError;
    }

    // 6. Kembalikan respons sukses ke Admin beserta Password rahasia yang dihasilkan
    return res.status(200).json({ 
      success: true, 
      message: 'Akun responden berhasil dibuat!',
      password: securePassword 
    });

  } catch (error: any) {
    console.error('Approval Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
