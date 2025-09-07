const getDataAllCheckReport = async () => {
    const total = document.getElementById('total-issues');
    const progress = document.getElementById('in-progress-issues');
    const completed = document.getElementById('completed-issues');
    const withing = document.getElementById('withed-issues');

    let allCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let withedCount = 0;

    try {
        const issuesRef = db.collectionGroup("issues");
        const issuesSnapshot = await issuesRef.get();

        const allData = [];

        issuesSnapshot.forEach(issueDoc => {
            allCount++;
            const data = issueDoc.data();
            // Extract userId from the document path
            const pathParts = issueDoc.ref.path.split("/");
            const userId = pathParts[1];
            const status = data.status;

            if (status === 'ดำเนินการ') {
                inProgressCount++;
            } else if (status === 'ดำเนินการเสร็จสิ้น') {
                completedCount++;
            } else if (status === 'รอดำเนินการ') {
                withedCount++;
            }

            allData.push({
                id: issueDoc.id,
                userId,
                issueId: issueDoc.id,
                ...data
            });
        });

        total.textContent = allCount;
        progress.textContent = inProgressCount;
        completed.textContent = completedCount;
        withing.textContent = withedCount;
        // console.log("All Data:", allData);
        renderReports(allData);
        return allData;
    } catch (error) {
        console.error("Error getting documents: ", error);
        return [];
    }
};

const reportList = document.getElementById('report-list');

let currentPage = 1;
const itemsPerPage = 3;

function renderReports(reports, page = 1) {
    reportList.innerHTML = ''; // เคลียร์เก่า
    currentPage = page;

    if (!reports) {
        const noDataItem = document.createElement('div');
        noDataItem.classList = "text-center text-muted py-4";
        noDataItem.innerHTML = `
            <lord-icon
                src="https://cdn.lordicon.com/msoeawqm.json"
                trigger="loop"
                colors="primary:#121331,secondary:#08a88a"
                style="width:100px;height:100px">
            </lord-icon>
            <p class="mt-3 font-size-14">ไม่มีข้อมูลการแจ้งปัญหา</p>
        `;
        reportList.appendChild(noDataItem);
        return;
    }

    reports.sort((a, b) => b.timestamp - a.timestamp);

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedReports = reports.slice(start, end);

    paginatedReports.forEach(report => {
        const reportCard = document.createElement('div');
        reportCard.classList.add('report-card');

        const statusClass = `status-${report.status.replace(/\s+/g, '')}`;
        reportCard.classList.add(statusClass);

        const date = new Date(report.timestamp);
        const formattedDate = date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const typeMap = {
            'infrastructure': 'ปัญหาโครงสร้างพื้นฐาน',
            'facilities': 'ปัญหาอุปกรณ์และสิ่งอำนวยความสะดวก',
            'safety': 'ปัญหาด้านความปลอดภัย',
            'cleanliness': 'ปัญหาด้านความสะอาด',
            'other': 'อื่นๆ',
        };

        const statusMap = {
            'รอดำเนินการ': `<span class="badge bg-gradient-with text-white font-size-12 py-2 px-3 fw-normal rounded-pill">
                                <i class="fa-solid fa-business-time me-1"></i>รอรับเรื่อง
                            </span>`,
            'ดำเนินการ': `<span class="badge bg-gradient-process text-dark font-size-12 py-2 px-3 fw-normal rounded-pill">
                                <i class="fa-solid fa-hammer-brush me-1"></i>ดำเนินการ
                            </span>`,
            'ดำเนินการเสร็จสิ้น': `<span class="badge bg-gradient-success text-white font-size-12 py-2 px-3 fw-normal rounded-pill">
                                <i class="fa-solid fa-thumbs-up me-1"></i> เสร็จสิ้น
                            </span>`,
            'ยกเลิก': `<span class="badge bg-gradient-cencel text-white font-size-12 py-2 px-3 fw-normal rounded-pill">
                                <i class="fa-solid fa-ban me-1"></i> ยกเลิก
                            </span>`,
        };

        let fileContainerHtml = "";   // ใช้ let และเริ่มจาก string ว่าง
        const files = report.files || [];

        if (files.length > 0) {
            files.forEach(file => {
                fileContainerHtml += `
                    <img src="${file.fileUrl}" 
                        class="rounded-3 clickable-image" 
                        style="width:40px; height:40px; object-fit:cover; cursor:pointer;">
                `;
            });
        }

        reportCard.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <h5><i class="fa-solid fa-bullhorn"></i> ${report.topic}</h5>
                <i class="fa-solid fa-xmark fa-lg text-danger ${report.status === 'รอดำเนินการ' ? '' : 'd-none'}" onclick="cancelIssue('${report.userId}', '${report.id}')"></i>
            </div>
            <p><strong>สถานะ:</strong> ${statusMap[report.status] || report.status}</p>
            <div class="d-flex font-size-14 text-p-color">
                <strong>ผู้แจ้ง:</strong>
                <div class="d-flex align-items-center gap-2 ms-2 mt-1">
                    <img src="${report.profile}" alt="user profile line"
                        class="rounded-circle shadow bg-light"
                        width="40" height="40" role="button">
                    <div class="d-flex flex-column">
                        <span>${report.name} ${report.surname}</span>
                        <span class="font-size-12">${report.phone}</span>
                    </div>
                </div>
            </div>

            <div class="row gx-2">
                <p class="col-auto"><strong>รายละเอียด:</strong></p>
                <p class="col"> ${report.detail}</p>
            </div>    
            <p><strong>สถานที่:</strong> <a href="https://www.google.com/maps?q=${report.position}" target="_blank">
                <i class="fa-regular fa-map-location-dot text-primary"></i>
            ${report.positionDetail} </a></p>
            <p><strong>ประเภท:</strong> ${typeMap[report.type] || 'ไม่ระบุ'}</p>
            <p><strong>วันที่แจ้ง:</strong> ${formattedDate} น.</p>
            <div>
                ${fileContainerHtml}
            <div>
            <div class="d-flex justify-content-end w-100 mt-2">            
                <button class="btn btn-sm btn-outline-check rounded-4 font-size-14 px-3 ${report.status === 'รอดำเนินการ' ? '' : 'd-none'}" onclick="receiveIssue('${report.userId}', '${report.id}')"><i class="fa-regular fa-triple-chevrons-right"></i> รับเรื่อง</button>      
                <button class="btn btn-sm btn-outline-green rounded-4 font-size-14 px-3 ${report.status === 'ดำเนินการ' ? '' : 'd-none'}" onclick="closedjobIssue('${report.userId}', '${report.id}')"><i class="fa-solid fa-thumbs-up"></i> ปิดงาน</button>   
            </div>
        `;

        reportList.appendChild(reportCard);
    });

    // เพิ่ม event ให้แต่ละภาพ
    document.querySelectorAll('.clickable-image').forEach(img => {
        img.addEventListener('click', () => {
            const modalImage = document.getElementById('modalImage');
            modalImage.src = img.src;
            const modal = new bootstrap.Modal(document.getElementById('imageModal'));
            modal.show();
        });
    });

    renderPagination(reports);
}

function renderPagination(reports) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const totalPages = Math.ceil(reports.length / itemsPerPage);
    const maxVisible = 5; // จำนวนปุ่มเลขหน้าที่โชว์ได้มากที่สุด

    if (totalPages <= 1) return; // ไม่ต้องทำ pagination ถ้ามีหน้าเดียว

    // ปุ่ม Previous
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.className = `btn btn-sm mx-1 ${currentPage === 1 ? "btn-secondary disabled" : "btn-outline-primary"}`;
    prevBtn.onclick = () => {
        if (currentPage > 1) renderReports(reports, currentPage - 1);
    };
    pagination.appendChild(prevBtn);

    // คำนวณช่วงหน้าที่จะแสดง
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // ปุ่มเลขหน้า
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = `btn btn-sm mx-1 ${i === currentPage ? "btn-primary" : "btn-outline-primary"}`;
        btn.onclick = () => renderReports(reports, i);
        pagination.appendChild(btn);
    }

    // ปุ่ม Next
    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.className = `btn btn-sm mx-1 ${currentPage === totalPages ? "btn-secondary disabled" : "btn-outline-primary"}`;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) renderReports(reports, currentPage + 1);
    };
    pagination.appendChild(nextBtn);
}


const receiveIssue = async (userId, docId) => {
    const Modal = new bootstrap.Modal(document.getElementById('receiveReportModal'));
    Modal.show();

    const confirmBtn = document.getElementById('receiveReportConfirmBtn');

    confirmBtn.onclick = async () => {
        Modal.hide();
        showLoader(2000);
        try {
            const issueRef = db.collection("reports")
                .doc(userId)
                .collection("issues")
                .doc(docId);

            const docSnap = await issueRef.get();
            if (!docSnap.exists) {
                toastAlert(3, "ไม่พบข้อมูลปัญหานี้");
                return;
            }
            const issueData = docSnap.data();
            const topic = issueData.topic || "ไม่มีหัวข้อ";

            await sendLineMessageGAS(
                userId,
                `ปัญหาที่คุณแจ้ง "${topic}" อยู่ระหว่างดำเนินการแก้ไข 🔄️`
            );

            await issueRef.update({ status: "ดำเนินการ" });

            toastAlert(1, "รับเรื่องแจ้งปัญหาเรียบร้อยแล้ว");
            getDataAllCheckReport();
        } catch (error) {
            console.error("Error updating document: ", error);
            toastAlert(3, "เกิดข้อผิดพลาดในการอัปเดต");
        }
    }
};

const closedjobIssue = async (userId, docId) => {
    const Modal = new bootstrap.Modal(document.getElementById('closedjobReportModal'));
    Modal.show();
    const confirmBtn = document.getElementById('closedjobReportConfirmBtn');

    confirmBtn.onclick = async () => {
        Modal.hide();
        showLoader(2000);
        try {
            const issueRef = db.collection("reports")
                .doc(userId)
                .collection("issues")
                .doc(docId);

            const docSnap = await issueRef.get();
            if (!docSnap.exists) {
                toastAlert(3, "ไม่พบข้อมูลปัญหานี้");
                return;
            }
            const issueData = docSnap.data();
            const topic = issueData.topic || "ไม่มีหัวข้อ";

            await sendLineMessageGAS(
                userId,
                `ปัญหาที่คุณแจ้ง "${topic}" ได้รับการแก้ไขเรียบร้อยแล้ว ✅`
            );

            await issueRef.update({ status: "ดำเนินการเสร็จสิ้น" });

            toastAlert(1, "แก้ปัญหาเรียบร้อยแล้ว");
            getDataAllCheckReport();
        } catch (error) {
            console.error("Error updating document: ", error);
            toastAlert(3, "เกิดข้อผิดพลาดในการอัปเดต");
        }
    };
};


const cancelIssue = async (userId, docId) => {
    const Modal = new bootstrap.Modal(document.getElementById('cancelReportModal'));
    Modal.show();

    const confirmBtn = document.getElementById('cancelReportConfirmBtn');
    confirmBtn.onclick = async () => {
        Modal.hide();
        showLoader(2000);
        try {
            const issueRef = db.collection("reports")
                .doc(userId)
                .collection("issues")
                .doc(docId);

            const docSnap = await issueRef.get();
            if (!docSnap.exists) {
                toastAlert(3, "ไม่พบข้อมูลปัญหานี้");
                return;
            }
            const issueData = docSnap.data();
            const topic = issueData.topic || "ไม่มีหัวข้อ";

            await sendLineMessageGAS(
                userId,
                `ปัญหาที่คุณแจ้ง "${topic}" ถูกยกเลิก ❌`
            );

            await issueRef.update({ status: "ยกเลิก" });

            toastAlert(2, "ยกเลิกการแจ้งปัญหาเรียบร้อยแล้ว");
            getDataAllCheckReport();
        } catch (error) {
            console.error("Error updating document: ", error);
            toastAlert(3, "เกิดข้อผิดพลาดในการอัปเดต");
        }
    }
};

async function sendLineMessageGAS(userId, message) {
    const url = "https://script.google.com/macros/s/AKfycbytaRUK_2W_AnkObBJ5t4cDQwLuT4qRYA6fBWvmR73Io8Y6cG7daUOErmfVJaxeFpEd/exec";

    const fullUrl = `${url}?userId=${encodeURIComponent(userId)}&message=${encodeURIComponent(message)}`;

    try {
        const response = await fetch(fullUrl, { method: "GET" });
        const result = await response.text();
        // console.log("GAS response:", result);
    } catch (error) {
        console.error("Error sending message:", error);
    }
}