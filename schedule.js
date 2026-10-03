// --- ไฟล์ schedule.js ---

// ข้อมูลสนาม
const allFields = [
    { id: "1", name: "Football Pitch 1", price: "1,200" },
    { id: "2", name: "Football Pitch 2 (VIP)", price: "1,500" },
    { id: "3", name: "Football Pitch 3", price: "1,200" },
    { id: "4", name: "Football Pitch 4", price: "1,200" }
];

// รอบเวลา (รอบละ 2 ชั่วโมง)
const allTimeSlots = ["17:00-19:00", "18:00-20:00", "19:00-21:00", "20:00-22:00"];

window.onload = function() {
    const dateInput = document.getElementById('scheduleDate');
    
    // ตั้งค่าเป็นวันปัจจุบัน (เวลาไทย)
    const today = new Date();
    const localDate = getLocalDateString(today);
    dateInput.value = localDate;

    // โหลดตารางสนามครั้งแรก
    fetchAndRenderSchedule(dateInput.value);

    // Event Listener เมื่อเปลี่ยนวันที่
    dateInput.addEventListener('change', (e) => {
        updateQuickDateActiveBtn(e.target.value);
        fetchAndRenderSchedule(e.target.value);
    });
};

// 1. ดึงข้อมูลการจองจาก Supabase
async function fetchAndRenderSchedule(dateStr) {
    const container = document.getElementById('scheduleContainer');
    const statsSummary = document.getElementById('scheduleStatsSummary');
    
    container.innerHTML = `
        <div class="loading-box">
            <i class="fas fa-spinner fa-spin"></i>
            <p>กำลังโหลดตารางสนาม...</p>
        </div>
    `;

    try {
        // ดึงรายการจองของวันที่เลือก (ทั้ง Approved และ Pending)
        const { data: bookings, error } = await supabaseDB
            .from('bookings')
            .select('field_id, booking_time, status')
            .eq('booking_date', dateStr)
            .in('status', ['Approved', 'Pending']);

        if (error) throw error;

        // จัดโครงสร้างข้อมูล: { "1": { "17:00-19:00": "Approved" }, ... }
        const bookedSlotsMap = {};
        allFields.forEach(field => {
            bookedSlotsMap[field.id] = {};
        });

        bookings.forEach(b => {
            const timeClean = b.booking_time.replace(/\s+/g, '');
            if (bookedSlotsMap[b.field_id]) {
                bookedSlotsMap[b.field_id][timeClean] = b.status || 'Pending';
            }
        });

        renderSchedule(bookedSlotsMap, dateStr);

    } catch (err) {
        console.error("Fetch Schedule Error:", err);
        container.innerHTML = `
            <div class="error-box">
                <i class="fas fa-exclamation-circle"></i>
                <p>เกิดข้อผิดพลาดในการโหลดข้อมูลสนาม</p>
                <button onclick="fetchAndRenderSchedule('${dateStr}')" class="btn-retry">ลองอีกครั้ง</button>
            </div>
        `;
        statsSummary.innerHTML = '';
    }
}

// 2. แสดงผลตารางสนามและการ์ดเวลา
function renderSchedule(bookedSlotsMap, dateStr) {
    const container = document.getElementById('scheduleContainer');
    const statsSummary = document.getElementById('scheduleStatsSummary');
    container.innerHTML = '';

    let totalAvailable = 0;
    let totalBooked = 0;

    allFields.forEach(field => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'schedule-card';

        // ส่วนหัวของการ์ดสนาม
        const cardHeader = document.createElement('div');
        cardHeader.className = 'schedule-card-header';
        cardHeader.innerHTML = `
            <h3><i class="fas fa-futbol"></i> ${field.name}</h3>
            <span class="field-price-tag">฿${field.price}/รอบ</span>
        `;
        cardDiv.appendChild(cardHeader);

        // Grid ช่วงเวลา
        const slotsDiv = document.createElement('div');
        slotsDiv.className = 'time-slots-grid';

        allTimeSlots.forEach(time => {
            const timeClean = time.replace(/\s+/g, '');
            const slotStatus = bookedSlotsMap[field.id][timeClean]; // undefined | 'Approved' | 'Pending'

            const slotBtn = document.createElement('div');
            
            if (slotStatus === 'Approved') {
                totalBooked++;
                slotBtn.className = 'time-pill booked';
                slotBtn.innerHTML = `<span>${time}</span> <small>(จองแล้ว)</small>`;
            } else if (slotStatus === 'Pending') {
                totalBooked++;
                slotBtn.className = 'time-pill pending';
                slotBtn.innerHTML = `<span>${time}</span> <small>(รอตรวจสอบ)</small>`;
            } else {
                totalAvailable++;
                slotBtn.className = 'time-pill available';
                slotBtn.innerHTML = `<span>${time}</span> <small>(ว่าง - คลิกจอง)</small>`;
                
                // คลิกช่วงเวลาว่างเพื่อไปยังหน้าจองทันที
                slotBtn.onclick = () => {
                    quickBookShortcut(field.id, field.name, time, dateStr);
                };
            }

            slotsDiv.appendChild(slotBtn);
        });

        cardDiv.appendChild(slotsDiv);
        container.appendChild(cardDiv);
    });

    // แสดงสรุปจำนวนสล็อตว่าง/จองแล้ว
    statsSummary.innerHTML = `
        <div class="summary-text">
            <span>ตารางประจำวันที่: <strong>${formatThaiDate(dateStr)}</strong></span>
            <div class="summary-badges">
                <span class="badge-count green"><i class="fas fa-check-circle"></i> ว่าง ${totalAvailable} รอบ</span>
                <span class="badge-count red"><i class="fas fa-times-circle"></i> ไม่ว่าง ${totalBooked} รอบ</span>
            </div>
        </div>
    `;
}

// 3. ฟังก์ชันคลิกทางลัดไปหน้าจองสนาม
function quickBookShortcut(fieldId, fieldName, timeSlot, dateStr) {
    const bookingPrefill = {
        fieldId: fieldId,
        fieldName: fieldName,
        bookingTime: timeSlot,
        bookingDate: dateStr
    };

    // บันทึกลง SessionStorage เพื่อส่งต่อข้อมูลไปยังหน้า booking.html
    sessionStorage.setItem('prefillBooking', JSON.stringify(bookingPrefill));
    
    // ย้ายไปหน้าจองสนาม
    window.location.href = 'booking.html';
}

// 4. ปุ่มเลือกวันที่เร่งด่วน (วันนี้ / พรุ่งนี้ / มะรืนนี้)
function setQuickDate(offsetDays) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + offsetDays);
    
    const dateStr = getLocalDateString(targetDate);
    const dateInput = document.getElementById('scheduleDate');
    dateInput.value = dateStr;

    updateQuickDateActiveBtn(dateStr);
    fetchAndRenderSchedule(dateStr);
}

// 5. อัปเดตการแสดงผลปุ่ม Active ของทางลัดวัน
function updateQuickDateActiveBtn(selectedDateStr) {
    const todayStr = getLocalDateString(new Date());
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrow);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = getLocalDateString(dayAfter);

    document.getElementById('btnToday').classList.toggle('active', selectedDateStr === todayStr);
    document.getElementById('btnTomorrow').classList.toggle('active', selectedDateStr === tomorrowStr);
    document.getElementById('btnDayAfter').classList.toggle('active', selectedDateStr === dayAfterStr);
}

// Utility: แปลง Date Object เป็น YYYY-MM-DD เวลาไทย
function getLocalDateString(dateObj) {
    const local = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
}

// Utility: จัดฟอร์แมตวันที่ไทย
function formatThaiDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}