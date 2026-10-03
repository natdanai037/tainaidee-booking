// --- ไฟล์ booking.js ---

// ฟังก์ชันนำทางไปยังหน้า Booking Details พร้อมส่งค่า fieldId ผ่าน URL
function goToBookingDetails(pitchId) {
    if (!pitchId) return;
    window.location.href = `booking-details.html?fieldId=${pitchId}`;
}

// ตรวจสอบสถานะผู้ใช้เมื่อโหลดหน้าเว็บ
window.onload = function() {
    // สามารถเปิดใช้งานการตรวจสอบ Login ได้ที่นี่
    // const user = localStorage.getItem('user');
    // if (!user) {
    //     window.location.href = 'index.html';
    // }
};