// --- ไฟล์ history.js ---

// 1. เช็คว่าล็อกอินหรือยัง
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    alert('กรุณาเข้าสู่ระบบก่อนดูประวัติการจอง');
    window.location.href = 'index.html';
}

window.onload = function() {
    fetchBookingHistory();
};

async function fetchBookingHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<p style="text-align:center;">กำลังโหลดข้อมูล...</p>';

    try {
        // 2. ดึงข้อมูลจาก Supabase ตาราง bookings เฉพาะของ user คนนี้
        // และเรียงจากรายการใหม่ล่าสุดขึ้นก่อน (ascending: false)
        const { data: bookings, error } = await supabaseDB
            .from('bookings')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        historyList.innerHTML = ''; // เคลียร์ข้อความกำลังโหลด

        // 3. ถ้าไม่มีประวัติการจองเลย
        if (bookings.length === 0) {
            historyList.innerHTML = `
                <div style="text-align:center; padding: 40px 20px; background: white; border-radius: 10px;">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                    <p style="color: #666;">คุณยังไม่มีประวัติการจองสนาม</p>
                    <a href="booking.html" class="btn-booking-blue" style="display: inline-block; margin-top: 10px; text-decoration: none;">จองสนามตอนนี้</a>
                </div>
            `;
            return;
        }

        // 4. วนลูปสร้างการ์ดแสดงประวัติแต่ละรายการ
        bookings.forEach(booking => {
            // กำหนดสีและข้อความของสถานะ
            let statusBadge = '';
            if (booking.status === 'Pending') {
                statusBadge = '<span style="background:#f39c12; color:white; padding:3px 8px; border-radius:12px; font-size:0.8rem;">รอตรวจสอบ</span>';
            } else if (booking.status === 'Approved') {
                statusBadge = '<span style="background:#28a745; color:white; padding:3px 8px; border-radius:12px; font-size:0.8rem;">อนุมัติแล้ว</span>';
            } else if (booking.status === 'Rejected') {
                statusBadge = '<span style="background:#dc3545; color:white; padding:3px 8px; border-radius:12px; font-size:0.8rem;">ไม่อนุมัติ</span>';
            }

            const card = document.createElement('div');
            // ใช้ style ตรงนี้เลยเพื่อให้การ์ดดูสวยงาม
            card.style.cssText = "background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-left: 5px solid " + 
                (booking.status === 'Pending' ? '#f39c12' : (booking.status === 'Approved' ? '#28a745' : '#dc3545'));

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong>${booking.field_name}</strong>
                    ${statusBadge}
                </div>
                <div style="font-size: 0.9rem; color: #555; line-height: 1.6;">
                    <p style="margin: 0;"><i class="fas fa-calendar-alt" style="width:20px;"></i> วันที่: ${booking.booking_date}</p>
                    <p style="margin: 0;"><i class="fas fa-clock" style="width:20px;"></i> เวลา: ${booking.booking_time}</p>
                    <p style="margin: 0;"><i class="fas fa-money-bill-wave" style="width:20px;"></i> ยอดชำระ: ${booking.total_price} บาท</p>
                </div>
            `;
            historyList.appendChild(card);
        });

    } catch (err) {
        historyList.innerHTML = '<p style="text-align:center; color:red;">เกิดข้อผิดพลาดในการดึงข้อมูล</p>';
        console.error("Fetch History Error:", err);
    }
}