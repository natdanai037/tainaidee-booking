// --- ไฟล์ payment.js ---

// 1. เช็คการล็อกอิน
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    alert('กรุณาเข้าสู่ระบบก่อนทำการจองครับ');
    window.location.href = 'index.html';
}

// 2. ดึงข้อมูลการจองจากหน้า booking-details (แก้ชื่อ Key เป็น 'pendingBooking' ให้ตรงกัน)
const bookingDataStr = localStorage.getItem('pendingBooking');

// ถ้าหาข้อมูลไม่เจอ ให้เด้งกลับไปหน้าหลัก
if (!bookingDataStr) {
    alert("ไม่พบข้อมูลการจอง กรุณาทำรายการใหม่ครับ");
    window.location.href = 'booking.html';
}

const bookingData = JSON.parse(bookingDataStr);

// 3. เอาข้อมูลมาแสดงบนหน้าจอ HTML ตอนเปิดหน้า
window.onload = function() {
    // แก้ไขการเรียกชื่อตัวแปรให้ตรงกับที่ส่งมาจาก booking-details.js
    document.getElementById('payFieldName').innerText = bookingData.fieldName;
    document.getElementById('payDate').innerText = bookingData.date;
    document.getElementById('payTime').innerText = bookingData.time;
    document.getElementById('payPrice').innerText = bookingData.price;
};

// --- จัดการเรื่องการอัปโหลดรูปภาพ ---
const slipInput = document.getElementById('slipInput');
const triggerUploadBtn = document.getElementById('triggerUploadBtn');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const slipPreview = document.getElementById('slipPreview');
const confirmBtn = document.getElementById('confirmBtn');

// 4. พอกดปุ่ม "เลือกรูปสลิป" ให้ระบบไปกดที่ input file
triggerUploadBtn.addEventListener('click', () => {
    slipInput.click();
});

// 5. เมื่อผู้ใช้เลือกไฟล์เสร็จ ให้โชว์ชื่อและรูปตัวอย่าง (Preview)
slipInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        fileNameDisplay.innerText = "ไฟล์ที่เลือก: " + file.name;
        
        // สร้าง Preview รูปภาพ
        const reader = new FileReader();
        reader.onload = function(e) {
            slipPreview.src = e.target.result;
            slipPreview.style.display = 'block'; // แสดงรูปขึ้นมา
        }
        reader.readAsDataURL(file);
    }
});

confirmBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    if (!slipInput || slipInput.files.length === 0) {
        alert('กรุณาแนบรูปภาพสลิปโอนเงินก่อนยืนยันครับ');
        return;
    }

    // 🚩 [เพิ่มตรงนี้] ขั้นตอนที่ 1: Double Check กับ Database ก่อนเริ่มงานหนัก
    try {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังตรวจสอบคิว...';
        confirmBtn.disabled = true;

        const { data: alreadyBooked, error: checkError } = await supabaseDB
            .from('bookings')
            .select('id')
            .eq('field_id', bookingData.fieldId)
            .eq('booking_date', bookingData.date)
            .eq('booking_time', bookingData.time)
            .in('status', ['Approved', 'Pending', 'อนุมัติแล้ว', 'รอการตรวจสอบ']); // เช็คสถานะให้ครบทุกแบบ

        if (checkError) throw checkError;

        if (alreadyBooked && alreadyBooked.length > 0) {
            // 🚫 มีคนจองตัดหน้าไปแล้ว!
            alert('❌ ขออภัยครับ! เวลานี้เพิ่งถูกจองไปเมื่อครู่ กรุณากลับไปเลือกเวลาใหม่');
            localStorage.removeItem('pendingBooking'); // ล้างข้อมูลเก่าทิ้ง
            window.location.href = 'booking-details.html';
            return;
        }

        // --- 🚩 จบขั้นตอนการเช็ค ถ้าผ่านถึงจะทำข้างล่างต่อ ---

        const file = slipInput.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `slip-${Date.now()}.${fileExt}`;

        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังอัปโหลด...';

        // (โค้ดอัปโหลดรูปเดิมของคุณ...)
        const { error: uploadError } = await supabaseDB
            .storage
            .from('slips')
            .upload(fileName, file);

        if (uploadError) throw new Error('อัปโหลดสลิปไม่สำเร็จ: ' + uploadError.message);

        const { data: publicUrlData } = supabaseDB
            .storage
            .from('slips')
            .getPublicUrl(fileName);
        
        const slipUrl = publicUrlData.publicUrl;

        // บันทึกข้อมูลลงตาราง bookings
        const { error: insertError } = await supabaseDB
            .from('bookings')
            .insert([
                {
                    user_id: currentUser.id,
                    user_name: currentUser.fullname,
                    field_id: bookingData.fieldId,
                    field_name: bookingData.fieldName,
                    booking_date: bookingData.date,
                    booking_time: bookingData.time,
                    total_price: bookingData.price,
                    slip_url: slipUrl,
                    status: 'Pending'
                }
            ]);

        if (insertError) throw new Error('บันทึกข้อมูลไม่สำเร็จ: ' + insertError.message);

        alert('✅ ยืนยันการจองเรียบร้อย! รอแอดมินตรวจสอบสักครู่นะครับ');
        localStorage.removeItem('pendingBooking');
        window.location.href = 'history.html'; 

    } catch (err) {
        alert('❌ เกิดข้อผิดพลาด: ' + err.message);
        console.error(err);
        confirmBtn.innerText = "ยืนยันการชำระเงิน";
        confirmBtn.disabled = false;
    }
});