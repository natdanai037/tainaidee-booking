// --- ไฟล์ config.js ---

// เอา Project URL ของคุณมาใส่ในเครื่องหมายคำพูด (หาได้จาก Supabase -> Project Settings -> API)
const SUPABASE_URL = 'https://dowjgkddbmmubnasutub.supabase.co'; 

// เอา API Key (anon public) ของคุณมาใส่ในเครื่องหมายคำพูด
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvd2pna2RkYm1tdWJuYXN1dHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjI3NjcsImV4cCI6MjA4OTk5ODc2N30.lKsUfERZoxK0v3azOJ3scOFMN9A82Tgwq-IADWeUt3c';

// สร้างตัวแปรเชื่อมต่อ
const supabaseDB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);