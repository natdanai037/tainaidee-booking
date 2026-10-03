// --- ไฟล์ register.js ---

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บรีโหลด
    
    // ดึงค่าจากช่องกรอกข้อมูล (พร้อมตัดช่องว่างหน้า-หลัง)
    const fullname = document.getElementById('fullname').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 🔥 1. เช็ครหัสผ่านให้ตรงกัน "ก่อน" ทำอย่างอื่น 🔥
    if (password !== confirmPassword) {
        alert("❌ รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน กรุณาลองอีกครั้ง!");
        return; // สั่งหยุดการทำงานทันที
    }

    // 2. เปลี่ยนข้อความปุ่มเพื่อบอกผู้ใช้ว่ากำลังประมวลผล
    const btnSubmit = document.querySelector('.btn-login');
    btnSubmit.innerText = "กำลังสมัครสมาชิก...";
    btnSubmit.disabled = true;

    try {
        // 3. ส่งข้อมูลเข้าตาราง users ใน Supabase
        const { data, error } = await supabaseDB
            .from('users')
            .insert([
                { 
                    fullname: fullname, 
                    username: username, 
                    password: password,
                    role: 'user' // กำหนดสิทธิ์พื้นฐานเป็น user
                }
            ]);

        if (error) {
            // กรณีไอดีซ้ำ หรือมีข้อผิดพลาดอื่นๆ
            if (error.code === '23505') {
                alert("❌ ชื่อ USER นี้มีคนใช้แล้ว กรุณาเปลี่ยนใหม่");
            } else {
                alert("❌ เกิดข้อผิดพลาด: " + error.message);
            }
        } else {
            alert("✅ สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
            window.location.href = 'index.html'; // เด้งไปหน้า Login
        }

    } catch (err) {
        alert("❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
        console.error(err);
    } finally {
        // คืนค่าปุ่มกลับมาเหมือนเดิม
        btnSubmit.innerText = "Register";
        btnSubmit.disabled = false;
    }
});