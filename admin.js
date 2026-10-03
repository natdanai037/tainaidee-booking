// --- ไฟล์ admin.js ---

// 1. เช็คสิทธิ์ว่าใช่ Admin หรือไม่
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'admin') {
    alert('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงหน้านี้ได้');
    window.location.href = 'index.html'; // เตะกลับไปหน้าแรก
}

let pendingBookings = []; // ตัวแปรเก็บข้อมูลที่ดึงมา
let currentViewingId = null;

window.onload = function() {
    fetchPendingBookings();
};

// 2. ฟังก์ชันดึงข้อมูลการจองที่รอตรวจสอบจาก Supabase
async function fetchPendingBookings() {
    const listContainer = document.getElementById('adminPendingList');
    listContainer.innerHTML = '<p style="text-align:center;">กำลังโหลดรายการ...</p>';

    try {
        const { data, error } = await supabaseDB
            .from('bookings')
            .select('*')
            .eq('status', 'Pending') // ดึงเฉพาะที่รอตรวจสอบ
            .order('created_at', { ascending: true }); // คิวเก่าสุดขึ้นก่อน

        if (error) throw error;
        
        pendingBookings = data;
        renderAdminList();

    } catch (err) {
        listContainer.innerHTML = '<p style="text-align:center; color:red;">เกิดข้อผิดพลาดในการดึงข้อมูล</p>';
        console.error("Fetch Error:", err);
    }
}

// 3. ฟังก์ชันสร้างการ์ดแสดงผลบนหน้าจอ
// 3. ฟังก์ชันสร้างการ์ดแสดงผลบนหน้าจอ
function renderAdminList() {
    const listContainer = document.getElementById('adminPendingList');
    listContainer.innerHTML = '';

    if (pendingBookings.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color:#888; margin-top:50px;">ไม่มีรายการรอตรวจสอบ 🎉</p>';
        return;
    }

    pendingBookings.forEach(booking => {
        const card = document.createElement('div');
        card.className = 'admin-request-card'; // ใช้คลาสหลักของกล่อง
        
        // --- เริ่มแก้ตรงนี้แทนที่ของเดิม ---
        card.innerHTML = `
            <div class="admin-card-header">
                <h3>${booking.field_name} <span style="font-size:0.8rem; color:#888;">(Ref: ${booking.id.substring(0,6)})</span></h3>
                <div class="admin-card-price">${booking.total_price} ฿</div>
            </div>

            <div class="admin-card-details">
                <p><i class="fas fa-user"></i> ${booking.user_name}</p>
                <p><i class="fas fa-calendar-alt"></i> วันที่: ${booking.booking_date}</p>
                <p><i class="fas fa-clock"></i> เวลา: ${booking.booking_time}</p>
            </div>

            <div class="admin-action-group">
                <button class="admin-card-btn btn-view-slip" onclick="openSlipModal('${booking.id}')">
                    <i class="fas fa-image"></i> ดูสลิป
                </button>
                <button class="admin-card-btn btn-approve" onclick="processBooking('${booking.id}', 'Approved')">
                    <i class="fas fa-check"></i> อนุมัติ
                </button>
                <button class="admin-card-btn btn-reject" onclick="processBooking('${booking.id}', 'Rejected')">
                    <i class="fas fa-times"></i> ปฏิเสธ
                </button>
            </div>
        `;
        // --- จบส่วนที่ต้องแก้ ---
        
        listContainer.appendChild(card);
    });
}

// 4. ฟังก์ชันเปิด Modal ดูสลิป
function openSlipModal(id) {
    const booking = pendingBookings.find(b => b.id === id);
    if(booking) {
        currentViewingId = id;
        
        document.getElementById('modalSummaryInfo').innerHTML = `
            ลูกค้า: <strong>${booking.user_name}</strong><br>
            ยอดโอน: <strong style="color:red;">${booking.total_price} บาท</strong>
        `;
        
        // เอารูปสลิปจาก Database มาโชว์
        document.getElementById('slipImagePreview').src = booking.slip_url;
        document.getElementById('slipModal').style.display = 'flex';
        
        // ผูกฟังก์ชันปุ่ม อนุมัติ/ปฏิเสธ ใน Modal
        document.getElementById('modalApproveBtn').onclick = () => { processBooking(id, 'Approved'); };
        document.getElementById('modalRejectBtn').onclick = () => { processBooking(id, 'Rejected'); };
    }
}

function closeModal() {
    document.getElementById('slipModal').style.display = 'none';
    currentViewingId = null;
}

// 5. ฟังก์ชันอัปเดตสถานะลง Database
async function processBooking(id, newStatus) {
    // ป้องกันการกดเบิ้ล
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะ ${newStatus === 'Approved' ? 'อนุมัติ' : 'ปฏิเสธ'} รายการนี้?`)) {
        return;
    }

    try {
        // สั่งอัปเดตสถานะใน Supabase
        const { error } = await supabaseDB
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) throw error;

        alert(newStatus === 'Approved' ? '✅ อนุมัติการจองเรียบร้อย!' : '❌ ปฏิเสธการจองแล้ว!');
        
        closeModal();
        fetchPendingBookings(); // โหลดรายการใหม่ (รายการที่ทำเสร็จจะหายไปจากคิว)

    } catch (err) {
        alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        console.error("Update Error:", err);
    }
}