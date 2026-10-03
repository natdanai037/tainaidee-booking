// --- ไฟล์ admin.js ---

// 1. ตรวจสอบสิทธิ์ว่าใช่ Admin หรือไม่
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'admin') {
    alert('⚠ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงหน้านี้ได้');
    window.location.href = 'index.html';
}

let allAdminBookings = []; // เก็บรายการทั้งหมด
let currentFilter = 'Pending'; // ฟิลเตอร์เริ่มต้น
let currentViewingId = null;

window.onload = function() {
    fetchAdminBookings();
    setupFilterTabs();
};

// 2. ดึงข้อมูลการจองทั้งหมดจาก Supabase
async function fetchAdminBookings() {
    const listContainer = document.getElementById('adminPendingList');
    listContainer.innerHTML = '<p class="loading-text"><i class="fas fa-spinner fa-spin"></i> กำลังโหลดรายการ...</p>';

    try {
        const { data, error } = await supabaseDB
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false }); // ล่าสุดขึ้นก่อน

        if (error) throw error;

        allAdminBookings = data || [];
        updateStatsCounters();
        renderAdminList();

    } catch (err) {
        listContainer.innerHTML = '<p class="error-text"><i class="fas fa-exclamation-triangle"></i> เกิดข้อผิดพลาดในการดึงข้อมูล</p>';
        console.error("Fetch Admin Error:", err);
    }
}

// 3. อัปเดตตัวเลขการ์ดสถิติ
function updateStatsCounters() {
    const pending = allAdminBookings.filter(b => (b.status || 'Pending') === 'Pending').length;
    const approved = allAdminBookings.filter(b => b.status === 'Approved').length;
    const rejected = allAdminBookings.filter(b => b.status === 'Rejected').length;

    document.getElementById('statPendingCount').textContent = pending;
    document.getElementById('statApprovedCount').textContent = approved;
    document.getElementById('statRejectedCount').textContent = rejected;
}

// 4. แสดงการ์ดรายการการจองตาม Filter
function renderAdminList() {
    const listContainer = document.getElementById('adminPendingList');
    listContainer.innerHTML = '';

    // กรองข้อมูลตามสถานะที่เลือก
    let filteredList = allAdminBookings;
    if (currentFilter !== 'all') {
        filteredList = allAdminBookings.filter(b => (b.status || 'Pending') === currentFilter);
    }

    if (filteredList.length === 0) {
        listContainer.innerHTML = `
            <div class="admin-empty-state">
                <i class="fas fa-inbox"></i>
                <p>ไม่มีรายการจองในหมวดหมู่นี้</p>
            </div>
        `;
        return;
    }

    filteredList.forEach(booking => {
        const card = document.createElement('div');
        card.className = `admin-request-card border-${(booking.status || 'Pending').toLowerCase()}`;
        
        // Badge แสดงสถานะ
        let statusBadge = '';
        if (booking.status === 'Approved') {
            statusBadge = '<span class="status-badge badge-approved"><i class="fas fa-check-circle"></i> อนุมัติแล้ว</span>';
        } else if (booking.status === 'Rejected') {
            statusBadge = '<span class="status-badge badge-rejected"><i class="fas fa-times-circle"></i> ไม่อนุมัติ</span>';
        } else {
            statusBadge = '<span class="status-badge badge-pending"><i class="fas fa-hourglass-half"></i> รอตรวจสอบ</span>';
        }

        // จัดรูปแบบวันที่
        let formattedDate = booking.booking_date;
        if (booking.booking_date) {
            const d = new Date(booking.booking_date);
            if (!isNaN(d.getTime())) {
                formattedDate = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
            }
        }

        const priceFormatted = Number(booking.total_price || 0).toLocaleString();
        const refId = booking.id ? booking.id.toString().substring(0, 8) : 'N/A';

        card.innerHTML = `
            <div class="admin-card-header">
                <div>
                    <h3 class="field-title-text"><i class="fas fa-futbol"></i> ${booking.field_name || 'สนามฟุตบอล'}</h3>
                    <span class="ref-code">Ref: #${refId}</span>
                </div>
                ${statusBadge}
            </div>

            <div class="admin-card-details">
                <p><i class="fas fa-user"></i> <strong>ผู้จอง:</strong> ${booking.user_name || 'ไม่ระบุชื่อ'}</p>
                ${booking.user_phone ? `<p><i class="fas fa-phone"></i> <strong>เบอร์โทร:</strong> ${booking.user_phone}</p>` : ''}
                <p><i class="fas fa-calendar-alt"></i> <strong>วันที่:</strong> ${formattedDate}</p>
                <p><i class="fas fa-clock"></i> <strong>เวลา:</strong> ${booking.booking_time} น.</p>
                <p><i class="fas fa-money-bill-wave"></i> <strong>ยอดชำระ:</strong> <span class="price-highlight">฿${priceFormatted}</span></p>
                <p class="created-at-text"><i class="fas fa-history"></i> ทำรายการเมื่อ: ${formatCreatedDate(booking.created_at)}</p>
            </div>

            <div class="admin-action-group">
                <button class="admin-card-btn btn-view-slip" onclick="openSlipModal('${booking.id}')">
                    <i class="fas fa-image"></i> ตรวจสลิป
                </button>
                ${booking.status === 'Pending' ? `
                    <button class="admin-card-btn btn-approve" onclick="processBooking('${booking.id}', 'Approved')">
                        <i class="fas fa-check"></i> อนุมัติ
                    </button>
                    <button class="admin-card-btn btn-reject" onclick="processBooking('${booking.id}', 'Rejected')">
                        <i class="fas fa-times"></i> ปฏิเสธ
                    </button>
                ` : `
                    <button class="admin-card-btn btn-revert" onclick="processBooking('${booking.id}', 'Pending')" title="เปลี่ยนกลับเป็นรอตรวจสอบ">
                        <i class="fas fa-undo"></i> รีเซ็ตสถานะ
                    </button>
                `}
            </div>
        `;

        listContainer.appendChild(card);
    });
}

// 5. ระบบ Modal เปิดดูและตรวจสอบสลิป
function openSlipModal(id) {
    const booking = allAdminBookings.find(b => b.id === id);
    if (!booking) return;

    currentViewingId = id;
    const priceFormatted = Number(booking.total_price || 0).toLocaleString();

    document.getElementById('modalSummaryInfo').innerHTML = `
        <div class="summary-line"><span>ผู้จอง:</span> <strong>${booking.user_name || 'ไม่ระบุ'}</strong></div>
        <div class="summary-line"><span>สนาม:</span> <strong>${booking.field_name}</strong></div>
        <div class="summary-line"><span>วัน-เวลา:</span> <strong>${booking.booking_date} (${booking.booking_time} น.)</strong></div>
        <div class="summary-line"><span>ยอดโอน:</span> <strong class="price-text">฿${priceFormatted}</strong></div>
    `;

    const slipImg = document.getElementById('slipImagePreview');
    if (booking.slip_url) {
        slipImg.src = booking.slip_url;
        slipImg.style.display = 'block';
    } else {
        slipImg.src = '';
        slipImg.style.display = 'none';
        document.getElementById('modalSummaryInfo').innerHTML += `<p class="no-slip-text">⚠ รายการนี้ไม่มีการแนบรูปสลิป</p>`;
    }

    const actionGroup = document.getElementById('modalActionGroup');
    if (booking.status === 'Pending') {
        actionGroup.style.display = 'flex';
        document.getElementById('modalApproveBtn').onclick = () => { processBooking(id, 'Approved'); };
        document.getElementById('modalRejectBtn').onclick = () => { processBooking(id, 'Rejected'); };
    } else {
        actionGroup.style.display = 'none'; // ถ้าอนุมัติหรือปฏิเสธแล้ว ไม่ต้องขึ้นปุ่มซ้ำใน Modal
    }

    document.getElementById('slipModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('slipModal').style.display = 'none';
    currentViewingId = null;
}

// 6. อัปเดตสถานะการจองเข้า Supabase
async function processBooking(id, newStatus) {
    const actionText = newStatus === 'Approved' ? 'อนุมัติ' : (newStatus === 'Rejected' ? 'ปฏิเสธ' : 'รีเซ็ตสถานะ');
    
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะ "${actionText}" รายการนี้?`)) {
        return;
    }

    try {
        const { error } = await supabaseDB
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) throw error;

        alert(`✅ ทำรายการ "${actionText}" เรียบร้อยแล้ว`);
        closeModal();
        fetchAdminBookings(); // โหลดข้อมูลใหม่ทั้งหมด

    } catch (err) {
        alert('❌ เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        console.error("Update Status Error:", err);
    }
}

// 7. จัดจัดการปุ่ม Filter Tabs
function setupFilterTabs() {
    const tabs = document.querySelectorAll('.filter-btn');
    const listTitle = document.getElementById('listTitle');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            currentFilter = this.getAttribute('data-status');

            if (currentFilter === 'Pending') {
                listTitle.innerHTML = '<i class="fas fa-hourglass-half"></i> รายการรอตรวจสอบ';
            } else if (currentFilter === 'Approved') {
                listTitle.innerHTML = '<i class="fas fa-check-circle"></i> รายการที่อนุมัติแล้ว';
            } else if (currentFilter === 'Rejected') {
                listTitle.innerHTML = '<i class="fas fa-times-circle"></i> รายการที่ไม่ผ่านการอนุมัติ';
            } else {
                listTitle.innerHTML = '<i class="fas fa-list"></i> รายการจองทั้งหมด';
            }

            renderAdminList();
        });
    });

    // ปิด Modal เมื่อคลิกที่พื้นหลังสีดำ
    const modal = document.getElementById('slipModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
}

// ฟังก์ชันแปลงรูปแบบวันที่และเวลาทำรายการ
function formatCreatedDate(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('th-TH', { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
    }) + ' น.';
}

