import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Ping the database to keep it active
    const { data, error } = await supabase.from('app_fields').select('id').limit(1);
    
    if (error) {
      console.error('Supabase ping error:', error);
      return res.status(500).json({ error: 'Failed to ping Supabase' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Supabase pinged successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
