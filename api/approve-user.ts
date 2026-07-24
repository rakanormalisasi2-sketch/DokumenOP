import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing env vars:', { url: !!supabaseUrl, anon: !!supabaseAnonKey, service: !!supabaseServiceKey });
      return res.status(500).json({ error: 'Server configuration error: Missing Supabase Keys' });
    }

    // 1. Verifikasi token admin via HTTP menggunakan Anon Key (Wajib untuk Auth)
    const token = authHeader.replace('Bearer ', '');
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey
      }
    });

    if (!userRes.ok) {
      const errorText = await userRes.text();
      console.error('Auth verification error:', errorText);
      return res.status(401).json({ 
        error: `Unauthorized: Invalid token. Details: ${errorText}` 
      });
    }

    const user = await userRes.json();

    if (user.user_metadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can approve requests' });
    }

    // 2. Gunakan Service Role Key untuk operasi Admin Auth & Bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
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
    // Kita simpan UID Auth user yang baru dibuat ke dalam kolom 'code' untuk referensi penghapusan nanti
    const { error: updateError } = await adminClient
      .from('access_requests')
      .update({
        status: 'approved',
        code: newUser.user?.id, 
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

    // 6. Kirim Email Otomatis Menggunakan Nodemailer (jika SMTP dikonfigurasi)
    let emailSent = false;
    let emailErrorMsg = '';
    
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail', // Asumsi menggunakan Gmail (App Password)
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const mailOptions = {
          from: `"PUSDAOP Admin" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Akses Portal PUSDAOP Disetujui',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #0ea5e9; margin-top: 0;">Permohonan Akses Disetujui</h2>
              <p>Yth. <strong>${name}</strong>,</p>
              <p>Permohonan akses Anda ke Portal Operasi Dokumen Pemerintah (PUSDAOP) telah <strong>disetujui</strong>.</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;">Berikut adalah kredensial login Anda:</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Password Sementara:</strong> <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-family: monospace; letter-spacing: 1px; font-weight: bold;">${securePassword}</span></p>
              </div>
              <p style="color: #64748b; font-size: 14px;">Silakan login menggunakan kredensial di atas. Jaga kerahasiaan password ini.</p>
              <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
              <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">Email ini dikirim secara otomatis oleh sistem PUSDAOP. Harap tidak membalas email ini.</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (err: any) {
        console.error('Failed to send email:', err);
        emailErrorMsg = err.message || 'Gagal mengirim email';
      }
    }

    // 7. Kembalikan respons sukses ke Admin
    return res.status(200).json({ 
      success: true, 
      message: emailSent 
        ? 'Akun responden berhasil dibuat dan password telah dikirim ke email.'
        : 'Akun responden berhasil dibuat. (Email belum terkirim: SMTP belum dikonfigurasi)',
      password: securePassword, // Tetap kirimkan ke UI untuk berjaga-jaga
      emailSent: emailSent,
      emailError: emailErrorMsg
    });

  } catch (error: any) {
    console.error('Approval Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
