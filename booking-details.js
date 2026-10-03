// --- ไฟล์ booking-details.js ---

const fieldSelect = document.getElementById('fieldSelect');
const dateInput = document.getElementById('dateInput');
const timeSelect = document.getElementById('timeSelect');
const detailsForm = document.getElementById('detailsForm');
const displayPrice = document.getElementById('displayPrice');

// ตารางราคาประจำแต่ละสนาม (ตรงกับหน้า booking.html)
const fieldPrices = {
    "1": 800,   // Pitch 1 Standard
    "2": 1200,  // Pitch 2 VIP Indoor
    "3": 1500,  // Pitch 3 Full Stadium
    "4": 800    // Pitch 4 Standard
};

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const fieldId = urlParams.get('fieldId');
    
    // ตั้งค่าใส่วันที่ปัจจุบัน และกำหนด min ไม่ให้เลือกวันย้อนหลัง
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    dateInput.value = localDate;
    dateInput.min = localDate; // ป้องกันเลือกวันอดีต

    if (fieldId && fieldPrices[fieldId]) {
        fieldSelect.value = fieldId;
    }

    updatePriceDisplay();
    checkAvailability();
};

// เมื่อมีการเปลี่ยนสนามหรือวันที่ ให้เช็คเวลาว่างและอัปเดตราคา
fieldSelect.addEventListener('change', () => {
    updatePriceDisplay();
    checkAvailability();
});
dateInput.addEventListener('change', checkAvailability);

// ฟังก์ชันอัปเดตราคาสนามที่เลือกบนหน้าจอ
function updatePriceDisplay() {
    const selectedField = fieldSelect.value;
    const price = fieldPrices[selectedField] || 800;
    if (displayPrice) {
        displayPrice.innerText = `฿${price.toLocaleString()}`;
    }
}

// ฟังก์ชันตรวจสอบรอบเวลาที่ถูกจองแล้วจาก Supabase
async function checkAvailability() {
    const selectedDate = dateInput.value;
    const selectedField = fieldSelect.value;

    if (!selectedDate || !selectedField) return;

    timeSelect.disabled = true;

    try {
        // 1. ดึงข้อมูลการจองที่มีในระบบ
        const { data: bookings, error } = await supabaseDB
            .from('bookings')
            .select('booking_time, status')
            .eq('booking_date', selectedDate)
            .eq('field_id', selectedField)
            .in('status', ['Approved', 'Pending', 'อนุมัติแล้ว', 'รอการตรวจสอบ']); 

        if (error) throw error;

        // 2. จัดรูปแบบข้อความเวลาให้เปรียบเทียบง่าย
        const bookedTimes = bookings.map(b => b.booking_time.replace(/\s+/g, ''));

        // 3. ปรับเปลี่ยน Option ในตัวเลือกเวลา
        Array.from(timeSelect.options).forEach(option => {
            if (option.value === "") return;

            const optionValueClean = option.value.replace(/\s+/g, '');

            if (bookedTimes.includes(optionValueClean)) {
                option.disabled = true;
                option.text = option.value + " ❌ (เต็มแล้ว)";
                option.style.color = "#d32f2f";
            } else {
                option.disabled = false;
                option.text = option.value;
                option.style.color = "";
            }
        });

        // หากตัวเลือกที่เลือกอยู่ติดสถานะจองแล้ว ให้รีเซ็ตเป็นค่าว่าง
        if (timeSelect.selectedOptions[0] && timeSelect.selectedOptions[0].disabled) {
            timeSelect.value = "";
        }

    } catch (err) {
        console.error("Check Availability Error:", err);
    } finally {
        timeSelect.disabled = false;
    }
}

// บันทึกข้อมูลและส่งไปยังหน้า payment.html
detailsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (timeSelect.selectedOptions[0].disabled) {
        alert("❌ เวลานี้มีคนจองแล้วครับ กรุณาเลือกช่วงเวลาอื่น");
        return;
    }

    const fieldId = fieldSelect.value;
    const fieldName = fieldSelect.options[fieldSelect.selectedIndex].text.split('(')[0].trim();
    const price = fieldPrices[fieldId] || 800;

    const bookingData = {
        fieldId: fieldId,
        fieldName: fieldName,
        date: dateInput.value,
        time: timeSelect.value,
        price: price
    };
    
    // บันทึกลง LocalStorage
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    
    // ย้ายไปหน้าชำระเงิน
    window.location.href = 'payment.html';
});