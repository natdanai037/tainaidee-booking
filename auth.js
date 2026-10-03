// --- ไฟล์ auth.js (ฉบับปรับปรุงสมบูรณ์) ---

// 1. ตรวจสอบสถานะการเข้าสู่ระบบค้างไว้ (Auto-Redirect)
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'booking.html';
        }
    }
});

// 2. จัดการ Event การล็อกอิน
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // ตัดช่องว่างหน้า-หลัง (Trim Space)
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';

        // ตรวจสอบการกรอกข้อมูลเบื้องต้น
        if (!username || !password) {
            alert('⚠ กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
            return;
        }

        const btnSubmit = document.querySelector('.btn-login');
        const originalBtnText = btnSubmit ? btnSubmit.innerHTML : 'Login';

        // แสดงสถานะกำลังโหลดที่ปุ่ม
        if (btnSubmit) {
            btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> กำลังเข้าสู่ระบบ...`;
            btnSubmit.disabled = true;
        }

        try {
            // ค้นหาข้อมูลจาก Supabase ที่ username และ password ตรงกัน
            const { data, error } = await supabaseDB
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single(); // ดึงมาแค่ 1 รายการ

            if (error || !data) {
                alert("❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!");
            } else {
                // บันทึกข้อมูลผู้ใช้ลง LocalStorage
                localStorage.setItem('currentUser', JSON.stringify(data));
                
                // ดึงชื่อมาแสดงผล (สำรองชื่อกรณีคอลัมน์ชื่อไม่ตรงกัน)
                const displayName = data.fullname || data.full_name || data.username || 'ผู้ใช้งาน';

                // ตรวจสอบสิทธิ์ (Role)
                if (data.role === 'admin') {
                    alert(`✅ ยินดีต้อนรับ Admin: ${displayName}`);
                    window.location.href = 'admin.html'; // ไปหน้าผู้ดูแลระบบ
                } else {
                    alert(`✅ เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ: ${displayName}`);
                    window.location.href = 'booking.html'; // ไปหน้าจองสนาม
                }
            }
        } catch (err) {
            alert("❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
            console.error("Login Error:", err);
        } finally {
            // คืนค่าปุ่มกดเดิม
            if (btnSubmit) {
                btnSubmit.innerHTML = originalBtnText;
                btnSubmit.disabled = false;
            }
        }
    });
}