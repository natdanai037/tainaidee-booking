// --- ไฟล์ auth.js ---



const loginForm = document.getElementById('loginForm');



loginForm.addEventListener('submit', async (e) => {

    e.preventDefault();

   

    const username = document.getElementById('username').value;

    const password = document.getElementById('password').value;



    const btnSubmit = document.querySelector('.btn-login');

    btnSubmit.innerText = "กำลังเข้าสู่ระบบ...";

    btnSubmit.disabled = true;



    try {

        // ค้นหาข้อมูลจาก Supabase ที่ username และ password ตรงกัน

        const { data, error } = await supabaseDB

            .from('users')

            .select('*')

            .eq('username', username)

            .eq('password', password)

            .single(); // ดึงมาแค่ 1 แถว



        if (error || !data) {

            alert("❌ USER หรือ PASSWORD ไม่ถูกต้อง!");

        } else {

            // ถ้าสำเร็จ ให้เก็บข้อมูลผู้ใช้ไว้ใน LocalStorage เพื่อเอาไปใช้หน้าอื่น

            localStorage.setItem('currentUser', JSON.stringify(data));

           

            // ตรวจสอบสิทธิ์ (Role) ว่าเป็นแอดมินหรือลูกค้า

            if (data.role === 'admin') {

                alert(`✅ ยินดีต้อนรับ Admin: ${data.fullname}`);

                window.location.href = 'admin.html'; // ไปหน้าแอดมิน

            } else {

                alert(`✅ เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ: ${data.fullname}`);

                window.location.href = 'booking.html'; // ไปหน้าจองสนาม

            }

        }

    } catch (err) {

        alert("❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้");

        console.error(err);

    } finally {

        btnSubmit.innerText = "Login";

        btnSubmit.disabled = false;

    }

}); 

