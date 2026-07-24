import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { authUserId, requestId } = req.body;

    if (!authUserId) {
      return res.status(400).json({ error: 'authUserId wajib diisi' });
    }

    // 1. Verifikasi Admin Access Token dari headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: Missing authorization header' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing Supabase Keys' });
    }

    // Gunakan Service Role Key untuk semua operasi server-side
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verifikasi token admin langsung via adminClient
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    if (user.user_metadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can delete accounts' });
    }

    // 3. Hapus akun pengguna di Supabase Auth System
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(authUserId);

    if (deleteAuthError) {
      console.error('Delete Auth Error:', deleteAuthError);
      return res.status(400).json({ error: `Gagal menghapus akun sistem: ${deleteAuthError.message}` });
    }

    // 4. Hapus riwayat dari tabel access_requests (opsional tapi disarankan agar bersih)
    if (requestId) {
      const { error: deleteDbError } = await adminClient
        .from('access_requests')
        .delete()
        .eq('id', requestId);
        
      if (deleteDbError) {
        console.warn('Gagal menghapus riwayat access_requests:', deleteDbError);
      }
    }

    // 5. Kembalikan respons sukses
    return res.status(200).json({ 
      success: true, 
      message: 'Akun responden berhasil dihapus permanen!'
    });

  } catch (error: any) {
    console.error('Delete User Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
