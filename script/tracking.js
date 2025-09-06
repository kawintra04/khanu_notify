async function getDataAllReport() {
    const topic = document.getElementById('total-issues');
    const progress = document.getElementById('in-progress-issues');
    const completed = document.getElementById('completed-issues');
    const cancelled = document.getElementById('cancelled-issues');

    let allCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    try {
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        const regRef = db.collection("reports").doc(lineUserId).collection("issues");

        const snapshot = await regRef.get();

        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                allCount++;
                const data = doc.data();
                const status = data.status;

                if (status === 'ดำเนินการ') {
                    inProgressCount++;
                } else if (status === 'ดำเนินการเสร็จสิ้น') {
                    completedCount++;
                } else if (status === 'ยกเลิก') {
                    cancelledCount++;
                }
            });

        } else {
            console.log("No documents found.");
        }

        getissuelist(snapshot); // เรียกใช้ฟังก์ชันนี้หลังจากนับจำนวนเสร็จ

        topic.textContent = allCount;
        progress.textContent = inProgressCount;
        completed.textContent = completedCount;
        cancelled.textContent = cancelledCount;
    } catch (error) {
        console.error("Error getting documents: ", error);
    }
}

getDataAllReport();

const getissuelist = (snapshot) => {
    const issueList = document.getElementById('issue-list');
    issueList.innerHTML = '';

    if (snapshot.empty) {
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
        issueList.appendChild(noDataItem);
        return;
    }

    // แปลง snapshot เป็น array
    const docsArray = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

    // เรียงจาก timestamp มาก → น้อย
    docsArray.sort((a, b) => b.data.timestamp - a.data.timestamp);

    docsArray.forEach(({ id, data }) => {
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

        const statusBadge = statusMap[data.status] || '';
        const dataReport = new Date(data.timestamp) || '';
        const dataShow = dataReport.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }) || '';

        const issueItem = document.createElement('a');
        issueItem.classList = "list-group-item bg-image-logo list-group-item-action rounded-4 overflow-hidden mb-2";
        issueItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1 fw-semibold"><img class="me-2" src="asset/icons/logo_khanu512.png" width="24"
                                height="28">${data.topic}</h6>
                    </div>
                    ${statusBadge}
                </div>
                <span class="font-size-12 fw-semibold md-3 text-muted ">#${data.issueId}</span>
                <div class="d-flex flex-column">
                    <span class="text-muted font-size-12"><span class="fw-semibold">รายละเอียด:</span> ${data.detail}</span>

                    <span class="text-muted font-size-12"><span class="fw-semibold">สถานที่:</span> <a href="https://www.google.com/maps?q=${data.position}" target="_blank">${data.positionDetail || data.position}</a></span>

                    <div class="d-flex align-items-center justify-content-between">
                        <span class="text-muted font-size-12">
                            <span class="fw-semibold">วันที่แจ้ง:</span> 
                            ${dataShow} น.
                        </span>
                        <div>
                            <i class="fa-regular fa-pen-to-square text-warning ${data.status === 'รอดำเนินการ' ? '' : 'd-none'}"
                                role="button"
                                onclick="editIssue('${id}')"
                                title="แก้ไขรายการ">
                            </i> 
                            <i class="fa-solid fa-ban text-danger ${data.status === 'รอดำเนินการ' ? '' : 'd-none'}"
                                role="button"
                                onclick="cancelIssue('${id}')"
                                title="ยกเลิกรายการ">
                            </i> 
                        </div>
                    </div>
                </div>
            `;
        issueList.appendChild(issueItem);
    });
}

const cancelIssue = async (docId) => {
    const Modal = new bootstrap.Modal(document.getElementById('cancelReportModal'));
    Modal.show();

    const confirmBtn = document.getElementById('cancelReportConfirmBtn');

    confirmBtn.onclick = async () => {
        Modal.hide(); // ซ่อนโมดอลหลังทำงานเสร็จ
        showLoader(2000); // แสดง loader เป็นเวลา 2 วินาที
        try {
            const profile = await liff.getProfile();
            const lineUserId = profile.userId;
            const issueRef = db.collection("reports").doc(lineUserId).collection("issues").doc(docId);

            // เปลี่ยน status เป็น "ยกเลิก"
            await issueRef.update({ status: "ยกเลิก" });

            toastAlert(2, "ยกเลิกการแจ้งปัญหาเรียบร้อยแล้ว");
            getDataAllReport(); // รีเฟรชข้อมูล

        } catch (error) {
            console.error("Error updating document: ", error);
            toastAlert(3, "เกิดข้อผิดพลาดในการยกเลิกรายการ");
        }
    }
};

const editIssue = async (docId) => {
    const Modal = new bootstrap.Modal(document.getElementById('editReportModal'));
    Modal.show();

    const topic = document.getElementById("issueTopicEdit");
    const detail = document.getElementById("issueDetailEdit");
    const type = document.getElementById("issueTypeEdit");
    const position = document.getElementById("issuePositionEdit");
    const positionDetail = document.getElementById("issueDetailmoreEdit");

    try {
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        const issueRef = db.collection("reports").doc(lineUserId).collection("issues").doc(docId);

        const docSnap = await issueRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();

            topic.value = data.topic || "";
            detail.value = data.detail || "";
            type.value = data.type || "";
            position.value = data.position || "";
            positionDetail.value = data.positionDetail || "";
        } else {
            toastAlert(3, "ไม่พบข้อมูล!");
        }

        const confirmBtn = document.getElementById('editReportConfirmBtn');
        confirmBtn.onclick = async () => {
            Modal.hide(); 
            showLoader(2000); 
            try {
                await issueRef.update({
                    topic: topic.value.trim(),
                    detail: detail.value.trim(),
                    type: type.value.trim(),
                    position: position.value.trim(),
                    positionDetail: positionDetail.value.trim(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                toastAlert(1, "แก้ไขข้อมูลสำเร็จ");
                getDataAllReport(); // รีเฟรชข้อมูล
        
            } catch (error) {
                console.error("Error updating document: ", error);
                toastAlert(3, "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
            }
        }
    } catch (error) {
        console.error("Error updating document: ", error);
        toastAlert(3, "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
};