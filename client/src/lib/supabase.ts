import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://obgowfcelmoztoaotoos.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZ293ZmNlbG1venRvYW90b29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NTU1MzgsImV4cCI6MjA4MzIzMTUzOH0.pc32rvD79BsYYgQZTixEJy38ho7Ark10tzRKHDnvwi8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);