// --- ไฟล์ schedule.js ---

// ข้อมูลสนาม (🚨 สำคัญ: เช็คค่า id ตรงนี้ ให้ตรงกับ field_id ที่บันทึกใน Database ด้วยนะครับ เช่น "2" หรือ "F02")
const allFields = [
    { id: "1", name: "Football Pitch 1" }, 
    { id: "2", name: "Football Pitch 2 (VIP)" },
    { id: "3", name: "Football Pitch 3" },
    { id: "4", name: "Football Pitch 4" }
];

// แก้ไขเวลาใหม่เป็นรอบละ 2 ชั่วโมงตามต้องการ
const allTimeSlots = ["17:00-19:00", "18:00-20:00", "19:00-21:00", "20:00-22:00"];

window.onload = function() {
    const dateInput = document.getElementById('scheduleDate');
    const today = new Date();
    // ปรับโซนเวลาให้เป็นเวลาไทย เพื่อให้วันที่ไม่คลาดเคลื่อน
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    dateInput.value = localDate;

    fetchAndRenderSchedule(dateInput.value);

    dateInput.addEventListener('change', (e) => {
        fetchAndRenderSchedule(e.target.value);
    });
};

async function fetchAndRenderSchedule(dateStr) {
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = '<p style="text-align:center;">กำลังโหลดตารางสนาม...</p>';

    try {
        const { data: bookings, error } = await supabaseDB
            .from('bookings')
            .select('field_id, booking_time')
            .eq('booking_date', dateStr)
            .in('status', ['Approved', 'Pending']); 

        if (error) throw error;

        const bookedSlots = {};
        allFields.forEach(field => {
            bookedSlots[field.id] = [];
        });

        bookings.forEach(b => {
            // ลบช่องว่างออกเพื่อให้เวลาเช็คข้อความตรงกันเป๊ะๆ
            const timeClean = b.booking_time.replace(/\s+/g, '');
            if (bookedSlots[b.field_id]) {
                bookedSlots[b.field_id].push(timeClean);
            }
        });

        renderSchedule(bookedSlots);

    } catch (err) {
        console.error("Fetch Schedule Error:", err);
        container.innerHTML = '<p style="text-align:center; color:red;">เกิดข้อผิดพลาดในการดึงข้อมูล</p>';
    }
}

function renderSchedule(bookedSlots) {
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = ''; 

    allFields.forEach(field => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'schedule-card';
        cardDiv.style.cssText = "background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";
        
        const title = document.createElement('h3');
        title.style.cssText = "margin-top: 0; margin-bottom: 15px; color: #1a4d2e; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;";
        title.innerHTML = `<i class="fas fa-futbol"></i> ${field.name}`;
        cardDiv.appendChild(title);

        const slotsDiv = document.createElement('div');
        slotsDiv.className = 'time-slots';
        slotsDiv.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 10px;";

        allTimeSlots.forEach(time => {
            const timeSpan = document.createElement('span');
            const timeClean = time.replace(/\s+/g, '');
            
            // เช็คว่าเวลานี้ถูกจองไปแล้วหรือยัง
            const isBooked = bookedSlots[field.id].includes(timeClean);
            
            timeSpan.style.cssText = "padding: 8px 10px; border-radius: 20px; font-size: 0.9rem; font-weight: bold; text-align: center; box-sizing: border-box; width: 100%;";

            if (isBooked) {
                timeSpan.className = 'time-pill booked';
                timeSpan.style.background = '#dc3545'; // สีแดง
                timeSpan.style.color = 'white';
                timeSpan.innerText = time + " (เต็ม)";
            } else {
                timeSpan.className = 'time-pill available';
                timeSpan.style.background = '#e8f5e9'; // สีเขียว
                timeSpan.style.color = '#28a745';
                timeSpan.style.border = '1px solid #28a745';
                timeSpan.innerText = time + " (ว่าง)";
            }
            
            slotsDiv.appendChild(timeSpan);
        });

        cardDiv.appendChild(slotsDiv);
        container.appendChild(cardDiv);
    });
}