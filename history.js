// --- ไฟล์ history.js ---

// 1. ตรวจสอบการเข้าสู่ระบบ
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    alert('⚠️️ กรุณาเข้าสู่ระบบก่อนดูประวัติการจองครับ');
    window.location.href = 'index.html';
}

let allBookingsData = []; // เก็บข้อมูลทั้งหมดไว้ใช้กรอง (Filter)

window.onload = function() {
    fetchBookingHistory();
    setupFilterEvents();
    setupModalEvents();
};

// 2. ดึงข้อมูลประวัติการจองจาก Supabase
async function fetchBookingHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>กำลังโหลดข้อมูลประวัติการจอง...</p>
        </div>
    `;

    try {
        const { data: bookings, error } = await supabaseDB
            .from('bookings')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allBookingsData = bookings || [];
        renderBookings(allBookingsData);

    } catch (err) {
        historyList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                <button onclick="fetchBookingHistory()" class="btn-retry">ลองใหม่อีกครั้ง</button>
            </div>
        `;
        console.error("Fetch History Error:", err);
    }
}

// 3. แสดงผลรายการการ์ดประวัติ
function renderBookings(bookings) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    if (!bookings || bookings.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history-card">
                <div class="empty-icon-box">
                    <i class="fas fa-calendar-times"></i>
                </div>
                <h3>ไม่พบประวัติการจอง</h3>
                <p>คุณยังไม่มีรายการจองสนามในหมวดหมู่นี้</p>
                <a href="booking.html" class="btn-action btn-go-booking">
                    <i class="fas fa-plus-circle"></i> จองสนามตอนนี้
                </a>
            </div>
        `;
        return;
    }

    bookings.forEach(booking => {
        // กำหนดป้ายสถานะ (Badge)
        let statusBadge = '';
        let cardBorderClass = '';

        const currentStatus = booking.status ? booking.status.trim() : 'Pending';

        if (currentStatus === 'Pending' || currentStatus === 'รอการตรวจสอบ') {
            statusBadge = '<span class="status-badge badge-pending"><i class="fas fa-hourglass-half"></i> รอตรวจสอบ</span>';
            cardBorderClass = 'border-pending';
        } else if (currentStatus === 'Approved' || currentStatus === 'อนุมัติแล้ว') {
            statusBadge = '<span class="status-badge badge-approved"><i class="fas fa-check-circle"></i> อนุมัติแล้ว</span>';
            cardBorderClass = 'border-approved';
        } else if (currentStatus === 'Rejected' || currentStatus === 'ไม่อนุมัติ') {
            statusBadge = '<span class="status-badge badge-rejected"><i class="fas fa-times-circle"></i> ไม่อนุมัติ</span>';
            cardBorderClass = 'border-rejected';
        } else {
            statusBadge = `<span class="status-badge badge-pending">${currentStatus}</span>`;
            cardBorderClass = 'border-pending';
        }

        // แปลงวันที่เป็นฟอร์แมตภาษาไทย
        let formattedDate = booking.booking_date;
        if (booking.booking_date) {
            const dateObj = new Date(booking.booking_date);
            if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toLocaleDateString('th-TH', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                });
            }
        }

        // ฟอร์แมตราคา
        const priceNum = Number(booking.total_price) || 0;

        const card = document.createElement('div');
        card.className = `history-card ${cardBorderClass}`;

        card.innerHTML = `
            <div class="history-card-header">
                <div class="field-title">
                    <i class="fas fa-futbol field-icon"></i>
                    <strong>${booking.field_name || 'สนามฟุตบอล'}</strong>
                </div>
                ${statusBadge}
            </div>

            <div class="history-card-body">
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-calendar-alt"></i> วันที่เข้าใช้:</span>
                    <span class="info-value">${formattedDate}</span>
                </div>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-clock"></i> ช่วงเวลา:</span>
                    <span class="info-value">${booking.booking_time} น.</span>
                </div>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-money-bill-wave"></i> ยอดชำระ:</span>
                    <span class="info-value price-text">฿${priceNum.toLocaleString()}</span>
                </div>
            </div>

            <div class="history-card-footer">
                <small class="created-time">ทำรายการเมื่อ: ${formatCreatedDate(booking.created_at)}</small>
                ${booking.slip_url ? `
                    <button type="button" class="btn-view-slip" onclick="openSlipModal('${booking.slip_url}')">
                        <i class="fas fa-image"></i> ดูสลิป
                    </button>
                ` : ''}
            </div>
        `;

        historyList.appendChild(card);
    });
}

// 4. จัดรูปแบบวันที่ทำรายการ
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

// 5. ระบบ Filter ปรับปุ่มตัวกรอง
function setupFilterEvents() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filterType = this.getAttribute('data-filter');

            if (filterType === 'all') {
                renderBookings(allBookingsData);
            } else {
                const filtered = allBookingsData.filter(b => {
                    const status = b.status ? b.status.trim() : 'Pending';
                    if (filterType === 'Pending') return status === 'Pending' || status === 'รอการตรวจสอบ';
                    if (filterType === 'Approved') return status === 'Approved' || status === 'อนุมัติแล้ว';
                    if (filterType === 'Rejected') return status === 'Rejected' || status === 'ไม่อนุมัติ';
                    return status === filterType;
                });
                renderBookings(filtered);
            }
        });
    });
}

// 6. ระบบดูสลิปรูปใหญ่ (Modal)
function openSlipModal(url) {
    const modal = document.getElementById('slipModal');
    const modalImg = document.getElementById('modalSlipImage');
    if (modal && modalImg) {
        modalImg.src = url;
        modal.style.display = 'flex';
    }
}

function setupModalEvents() {
    const modal = document.getElementById('slipModal');
    const closeBtn = document.getElementById('closeSlipModal');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}