// --- ไฟล์ payment.js ---

// 1. ตรวจสอบการเข้าสู่ระบบ
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    alert('⚠️ กรุณาเข้าสู่ระบบก่อนทำการจองครับ');
    window.location.href = 'index.html';
}

// 2. ดึงข้อมูลรายการจองที่ค้างอยู่จาก localStorage
const bookingDataStr = localStorage.getItem('pendingBooking');
if (!bookingDataStr) {
    alert("⚠️ ไม่พบข้อมูลการจอง กรุณาทำรายการใหม่อีกครั้ง");
    window.location.href = 'booking.html';
}

const bookingData = JSON.parse(bookingDataStr);

// Elements
const slipInput = document.getElementById('slipInput');
const triggerUploadBtn = document.getElementById('triggerUploadBtn');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const slipPreview = document.getElementById('slipPreview');
const confirmBtn = document.getElementById('confirmBtn');
const btnCopyAcc = document.getElementById('btnCopyAcc');

// 3. โหลดข้อมูลแสดงผลบน Ticket
window.onload = function() {
    document.getElementById('payFieldName').innerText = bookingData.fieldName || 'สนามฟุตบอล';
    
    // ฟอร์แมตวันที่ให้สวยงาม
    if (bookingData.date) {
        const d = new Date(bookingData.date);
        const thaiDate = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        document.getElementById('payDate').innerText = thaiDate;
    } else {
        document.getElementById('payDate').innerText = '-';
    }

    document.getElementById('payTime').innerText = (bookingData.time || '-') + ' น.';
    
    // ฟอร์แมตราคาด้วยใส่จุลภาค
    const priceNum = Number(bookingData.price) || 0;
    document.getElementById('payPrice').innerText = priceNum.toLocaleString();
};

// 4. ปุ่มคัดลอกเลขบัญชี
if (btnCopyAcc) {
    btnCopyAcc.addEventListener('click', () => {
        const accNumber = "0673329268"; // ตัวเลขเพียวๆ เพื่อคัดลอกง่าย
        navigator.clipboard.writeText(accNumber).then(() => {
            btnCopyAcc.innerHTML = '<i class="fas fa-check"></i> คัดลอกแล้ว';
            btnCopyAcc.classList.add('copied');
            setTimeout(() => {
                btnCopyAcc.innerHTML = '<i class="far fa-copy"></i> คัดลอก';
                btnCopyAcc.classList.remove('copied');
            }, 2000);
        }).catch(() => {
            alert('ไม่สามารถคัดลอกได้ กรุณาพิมพ์ด้วยตนเอง: 067-3-32926-8');
        });
    });
}

// 5. คลิกกล่องเพื่อเลือกรูปสลิป
triggerUploadBtn.addEventListener('click', () => {
    slipInput.click();
});

// 6. Preview รูปภาพเมื่อเลือกไฟล์
slipInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];

        // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('❌ ขนาดไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์สลิปที่มีขนาดไม่เกิน 5MB');
            this.value = '';
            return;
        }

        fileNameDisplay.innerText = "📄 ไฟล์ที่เลือก: " + file.name;
        fileNameDisplay.classList.add('has-file');

        const reader = new FileReader();
        reader.onload = function(e) {
            slipPreview.src = e.target.result;
            slipPreview.style.display = 'block';
            if (uploadPlaceholder) {
                uploadPlaceholder.style.display = 'none';
            }
        }
        reader.readAsDataURL(file);
    }
});

// 7. ยืนยันการชำระเงิน
confirmBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    if (!slipInput || slipInput.files.length === 0) {
        alert('⚠️ กรุณาแนบรูปภาพสลิปโอนเงินก่อนยืนยันรายการครับ');
        return;
    }

    try {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังตรวจสอบคิวสนาม...';
        confirmBtn.disabled = true;

        // ขั้นตอนที่ 1: ตรวจสอบอีกครั้งว่าเวลานี้ถูกจองไปแล้วหรือยัง (ป้องกันการจองซ้ำซ้อน)
        const { data: alreadyBooked, error: checkError } = await supabaseDB
            .from('bookings')
            .select('id')
            .eq('field_id', bookingData.fieldId)
            .eq('booking_date', bookingData.date)
            .eq('booking_time', bookingData.time)
            .in('status', ['Approved', 'Pending', 'อนุมัติแล้ว', 'รอการตรวจสอบ']);

        if (checkError) throw checkError;

        if (alreadyBooked && alreadyBooked.length > 0) {
            alert('❌ ขออภัยครับ! รอบเวลานี้เพิ่งถูกจองไปเมื่อครู่ กรุณาเลือกช่วงเวลาอื่น');
            localStorage.removeItem('pendingBooking');
            window.location.href = 'booking-details.html';
            return;
        }

        // ขั้นตอนที่ 2: อัปโหลดสลิปเข้า Supabase Storage (Bucket: slips)
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังอัปโหลดสลิป...';
        const file = slipInput.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `slip_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;

        const { error: uploadError } = await supabaseDB
            .storage
            .from('slips')
            .upload(fileName, file);

        if (uploadError) {
            throw new Error('อัปโหลดสลิปไม่สำเร็จ: ' + uploadError.message);
        }

        // ดึง Public URL ของสลิป
        const { data: publicUrlData } = supabaseDB
            .storage
            .from('slips')
            .getPublicUrl(fileName);
        
        const slipUrl = publicUrlData.publicUrl;

        // ขั้นตอนที่ 3: บันทึกข้อมูลการจองลงตาราง bookings
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึกการจอง...';
        
        const userName = currentUser.fullname || currentUser.username || currentUser.name || 'ลูกค้า';

        const { error: insertError } = await supabaseDB
            .from('bookings')
            .insert([
                {
                    user_id: currentUser.id,
                    user_name: userName,
                    field_id: bookingData.fieldId,
                    field_name: bookingData.fieldName,
                    booking_date: bookingData.date,
                    booking_time: bookingData.time,
                    total_price: bookingData.price,
                    slip_url: slipUrl,
                    status: 'Pending'
                }
            ]);

        if (insertError) {
            throw new Error('บันทึกข้อมูลการจองไม่สำเร็จ: ' + insertError.message);
        }

        // สำเร็จ! ล้างข้อมูลชั่วคราวแล้วเปลี่ยนไปหน้า History
        alert('🎉 ยืนยันการจองเรียบร้อยแล้ว! กรุณารอแอดมินตรวจสอบสลิปการโอนสักครู่ครับ');
        localStorage.removeItem('pendingBooking');
        window.location.href = 'history.html'; 

    } catch (err) {
        alert('❌ เกิดข้อผิดพลาด: ' + err.message);
        console.error("Payment Submission Error:", err);
        confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> ยืนยันการชำระเงิน';
        confirmBtn.disabled = false;
    }
});