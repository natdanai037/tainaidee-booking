// เปลี่ยนชื่อฟังก์ชันและ Logic การเด้งหน้า
function goToBookingDetails(pitchId) {
    // เดินทางไปหน้า Booking Details โดยส่งค่า ID สนามไปด้วยผ่าน URL
    window.location.href = `booking-details.html?fieldId=${pitchId}`;
}

// ตรวจสอบ Session (ถ้าจำเป็น)
window.onload = function() {
    // const user = localStorage.getItem('user');
    // if (!user) window.location.href = 'index.html';
};