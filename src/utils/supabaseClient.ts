import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fypoeqyjbvfwrbalrxab.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5cG9lcXlqYnZmd3JiYWxyeGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDA2MDUsImV4cCI6MjA2NzgxNjYwNX0.W8og5coDHsOSqOFMm_SrkFCLAbnOQzLyHrtSk9a53J0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 