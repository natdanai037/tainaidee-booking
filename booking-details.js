// --- ไฟล์ booking-details.js (ฉบับแก้ไขจุดบอด) ---

const fieldSelect = document.getElementById('fieldSelect');
const dateInput = document.getElementById('dateInput');
const timeSelect = document.getElementById('timeSelect');
const detailsForm = document.getElementById('detailsForm');

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const fieldId = urlParams.get('fieldId');
    
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    dateInput.value = localDate;

    if (fieldId) {
        fieldSelect.value = fieldId;
    }

    checkAvailability();
};

fieldSelect.addEventListener('change', checkAvailability);
dateInput.addEventListener('change', checkAvailability);

async function checkAvailability() {
    const selectedDate = dateInput.value;
    const selectedField = fieldSelect.value;

    if (!selectedDate || !selectedField) return;

    timeSelect.disabled = true;

    try {
        // 1. ดึงข้อมูล (ลองเช็คสถานะทั้งไทยและอังกฤษเผื่อไว้)
        const { data: bookings, error } = await supabaseDB
            .from('bookings')
            .select('booking_time, status')
            .eq('booking_date', selectedDate)
            .eq('field_id', selectedField)
            .in('status', ['Approved', 'Pending', 'อนุมัติแล้ว', 'รอการตรวจสอบ']); 

        if (error) throw error;

        // 2. ล้างช่องว่างออกให้หมดเพื่อการเปรียบเทียบที่แม่นยำ
        const bookedTimes = bookings.map(b => b.booking_time.replace(/\s+/g, ''));
        
        console.log("จองไปแล้ววันนี้:", bookedTimes); // ดูใน Console (F12) ว่ามีข้อมูลขึ้นไหม

        // 3. วนลูปจัดการ Option
        Array.from(timeSelect.options).forEach(option => {
            if (option.value === "") return;

            // ล้างช่องว่างของค่าใน Option
            const optionValueClean = option.value.replace(/\s+/g, '');

            if (bookedTimes.includes(optionValueClean)) {
                option.disabled = true;
                option.text = option.value + " (เต็มแล้ว)";
                option.style.color = "red";
            } else {
                option.disabled = false;
                option.text = option.value;
                option.style.color = "";
            }
        });

        // ถ้าตัวที่เลือกอยู่ดันถูก Disable ให้ดีดกลับไปค่าว่าง
        if (timeSelect.selectedOptions[0] && timeSelect.selectedOptions[0].disabled) {
            timeSelect.value = "";
        }

    } catch (err) {
        console.error("Check Error:", err);
    } finally {
        timeSelect.disabled = false;
    }
}

// ส่วน Submit เหมือนเดิม
detailsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // เช็คอีกรอบว่าเผลอกดจองตัวที่เต็มไหม (ดักคนโกงหน้าเว็บ)
    if (timeSelect.selectedOptions[0].disabled) {
        alert("เวลานี้มีคนจองแล้วครับ กรุณาเลือกเวลาอื่น");
        return;
    }

    const fieldId = fieldSelect.value;
    let fieldName = fieldSelect.options[fieldSelect.selectedIndex].text;
    let price = fieldId === "2" ? 1500 : 1200;

    const bookingData = {
        fieldId: fieldId,
        fieldName: fieldName,
        date: dateInput.value,
        time: timeSelect.value,
        price: price
    };
    
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    window.location.href = 'payment.html';
});