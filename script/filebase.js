const firebaseConfig = {
    apiKey: "AIzaSyDtWXPINt9D7Ch2mfh83p3MnyAIaAT3X3Y",
    authDomain: "khanu-notify.firebaseapp.com",
    projectId: "khanu-notify",
    storageBucket: "khanu-notify.firebasestorage.app",
    messagingSenderId: "263580320928",
    appId: "1:263580320928:web:334ff0f967fa277ea9b5c5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const notifyUserDataReady = () => {
    window.dispatchEvent(new CustomEvent('userDataReady'));
};

document.addEventListener("DOMContentLoaded", function () {
    liff.init({ liffId: "2008047817-Oldmjw7P" })
        .then(() => {
            if (!liff.isLoggedIn()) {
                liff.login();
            } else {
                handleLineUser();

                const currentPage = window.location.pathname.split("/").pop();
                if (currentPage === "other.html") {
                    getReportData();
                } else if (currentPage === "index.html") {
                    getFeedIssues();
                } else if (currentPage === "tracking.html") {
                    getDataAllReport();
                } else if (currentPage === "point.html") {
                    getDataPoint();
                } else if (window.location.pathname.endsWith("administrator/check-report.html")) {
                    getDataAllCheckReport();
                }
            }
        })
        .catch(err => {
            console.error('LIFF Initialization failed ', err);
        });
});

async function handleLineUser() {
    try {
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        const regRef = db.collection("registrations").doc(lineUserId);

        // ตรวจสอบว่ามีข้อมูลใน Firestore หรือยัง
        const snapshot = await regRef.get();
        if (snapshot.exists) {
            window.globalUserData = snapshot.data();
            notifyUserDataReady(); // แจ้งเตือนว่าข้อมูลผู้ใช้พร้อมใช้งาน

            let memberId = window.globalUserData.memberId;
            if (!memberId) {
                const now = new Date();
                const buddhistYear = now.getFullYear() + 543;
                const yearShort = buddhistYear.toString().slice(-2);
                // นับจำนวนสมาชิกที่ลงทะเบียนในปีนี้
                const registrationsRef = db.collection("registrations");
                const snapshotAll = await registrationsRef.get();
                let count = 1;
                if (!snapshotAll.empty) {
                    const allUsers = [];
                    snapshotAll.forEach(doc => {
                        const data = doc.data();
                        if (data.memberId && data.memberId.startsWith(yearShort)) {
                            allUsers.push(data);
                        }
                    });
                    count = allUsers.length + 1;
                }
                memberId = yearShort + count.toString().padStart(4, "0");
                // อัปเดต memberId ใน Firestore
                await regRef.update({ memberId: memberId });
                window.globalUserData.memberId = memberId;
            }

            $('.userMemberId').text(memberId);
            $('.userProfile').attr('src', window.globalUserData.pictureUrl);
            $('.userName').text(window.globalUserData.name);
            $('.userFullname').text(window.globalUserData.name + ' ' + window.globalUserData.surname);
            const rawPhone = window.globalUserData.phone || "";
            const formattedPhone = rawPhone.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");
            $('.userTel').text(formattedPhone);
            $('.userEmail').text(window.globalUserData.email);

            const memberIdDisplay = document.getElementById('studentIDContainerEdit');
            const memberIdInput = document.getElementById('memberIdEdit');
            const nameInput = document.getElementById('nameEdit');
            const surnameInput = document.getElementById('surnameEdit');
            const emailInput = document.getElementById('emailEdit');
            const phoneInput = document.getElementById('phoneEdit');
            const statusElements = document.getElementsByName("statusEdit");

            if (memberIdInput) memberIdInput.value = window.globalUserData.memberId || "";
            if (nameInput) nameInput.value = window.globalUserData.name || "";
            if (surnameInput) surnameInput.value = window.globalUserData.surname || "";
            if (emailInput) emailInput.value = window.globalUserData.email || "";
            if (phoneInput) phoneInput.value = window.globalUserData.phone || "";
            if (statusElements && statusElements.length > 0) {
                for (let i = 0; i < statusElements.length; i++) {
                    if (statusElements[i].value === window.globalUserData.level) {
                        statusElements[i].checked = true;
                        if (window.globalUserData.level === 'teacher') {
                            if (memberIdDisplay) memberIdDisplay.style.display = 'none';
                        } else {
                            if (memberIdDisplay) memberIdDisplay.style.display = 'block';
                        }
                        break;
                    }
                }
            }
            const editForm = document.getElementById("editDataUserForm");
            if (editForm) {
                editForm.addEventListener("submit", async function (e) {
                    e.preventDefault();

                    const name = nameInput.value.trim();
                    const surname = surnameInput.value.trim();
                    const email = emailInput.value.trim();
                    const phone = phoneInput.value.trim();

                    if (!name || !surname || !email || !phone) {
                        toastAlert(3, "กรุณากรอกข้อมูลให้ครบ");
                        return;
                    }

                    const updatedData = {
                        ...window.globalUserData,
                        name,
                        surname,
                        email,
                        phone,
                    };

                    try {
                        showLoader(2000); // แสดง loader เป็นเวลา 2 วินาที
                        await regRef.set(updatedData);
                        window.globalUserData = updatedData;
                        toastAlert(1, "แก้ไขข้อมูลสำเร็จ");
                        // อัปเดต UI ทันที
                        $('.userName').text(name);
                        $('.userFullname').text(name + ' ' + surname);
                        $('.userTel').text(phone.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3"));
                        $('.userEmail').text(email);

                        const editDataUserModal = bootstrap.Modal.getInstance(document.getElementById('editDataUserModal'));
                        if (editDataUserModal) editDataUserModal.hide();

                    } catch (error) {
                        toastAlert(0, "เกิดข้อผิดพลาด: " + error.message);
                    }
                });
            }

            // ใช้ pageConfig.js เพื่อตรวจสอบการ redirect
            if (window.shouldRedirectTo && window.shouldRedirectTo('index.html')) {
                window.location.href = "index.html";
            }
        } else {
            // ยังไม่มีข้อมูล ให้แสดงฟอร์มลงทะเบียน
            window.lineUser = {
                lineUserId,
                lineProfile: {
                    displayName: profile.displayName,
                    pictureUrl: profile.pictureUrl,
                    statusMessage: profile.statusMessage || ""
                }
            };
            console.log("LINE profile data:", window.lineUser); // แสดงข้อมูล LINE profile
            // ไม่ต้อง redirect, ให้ผู้ใช้กรอกฟอร์ม
            // ถ้าอยู่หน้า index.html ให้ redirect ไปหน้า register.html
            if (window.shouldRedirectTo && window.shouldRedirectTo('register.html')) {
                window.location.href = "register.html";
            }
        }
    } catch (err) {
        console.error('Error handling LINE user: ', err);
        toastAlert(3, "เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้ LINE");
    }
}

// จับ Event ของฟอร์ม
const registrationForm = document.getElementById("registerForm");
if (registrationForm) {
    registrationForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const memberId = document.getElementById("studentId").value.trim();
        const name = document.getElementById("firstname").value.trim();
        const surname = document.getElementById("surname").value.trim();
        const email = document.getElementById("email").value.trim();
        const numberphone = document.getElementById("numberphone").value.trim();
        const statusElements = document.getElementsByName("status");
        let level = "";
        for (let i = 0; i < statusElements.length; i++) {
            if (statusElements[i].checked) {
                level = statusElements[i].value.trim();
                break;
            }
        }

        if (!name || !surname || !email || !numberphone || !level || !memberId) {
            toastAlert(3, "กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        if (!window.lineUser || !window.lineUser.lineUserId) {
            toastAlert(0, "ไม่พบ LINE User ID กรุณาเข้าสู่ระบบผ่าน LINE อีกครั้ง");
            return;
        }
        const regRef = db.collection("registrations").doc(window.lineUser.lineUserId);
        const userData = {
            memberId: memberId,
            name: name,
            surname: surname,
            email: email,
            phone: numberphone,
            level: level,
            status: true,
            lineUserId: window.lineUser.lineUserId,
            pictureUrl: window.lineUser.lineProfile.pictureUrl,
            displayName: window.lineUser.lineProfile.displayName,
            timestamp: Date.now(),
        };
        showLoader(3000);
        regRef.set(userData)
            .then(() => {
                window.globalUserData = userData;
                notifyUserDataReady(); // แจ้งเตือนว่าข้อมูลผู้ใช้พร้อมใช้งาน
                toastAlert(1, "บันทึกข้อมูลสำเร็จ");
                document.getElementById("registerForm").reset();
                // ใช้ pageConfig.js เพื่อตรวจสอบการ redirect
                if (window.shouldRedirectTo && window.shouldRedirectTo('index.html')) {
                    window.location.href = "index.html";
                }
            })
            .catch((error) => {
                toastAlert(0, "เกิดข้อผิดพลาด: " + error.message);
            });
    });
}

function getCurrentUser() {
    return window.globalUserData;
}

window.getCurrentUser = getCurrentUser;


async function confirmReport(e) {
    e.preventDefault();

    const topic = document.getElementById("issueTopic").value.trim();
    const detail = document.getElementById("issueDetail").value.trim();
    const type = document.getElementById("issueType").value.trim();
    const position = document.getElementById("issuePosition").value.trim();
    const positionDetail = document.getElementById("issueDetailmore").value.trim();
    const fileInput = document.getElementById("issueFile");
    const files = fileInput.files;

    if (!topic || !detail || !type || !position) {
        toastAlert(3, "กรุณากรอกข้อมูลให้ครบ");
        return;
    }
    if (!window.globalUserData || !window.globalUserData.lineUserId) {
        toastAlert(0, "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบผ่าน LINE อีกครั้ง");
        return;
    }

    // ✅ Use lineUserId as the main document and save the issue in a subcollection.
    const userDocRef = db.collection("reports").doc(window.globalUserData.lineUserId);
    const newIssueRef = userDocRef.collection("issues").doc(); // autoId for each issue

    const now = new Date();

    // ดึงปี เดือน วัน ชั่วโมง นาที
    const year = now.getFullYear(); // 2025
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 09
    const day = String(now.getDate()).padStart(2, '0'); // 06
    const hours = String(now.getHours()).padStart(2, '0'); // 00
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const reportData = {
        issueId: `KHANU${year}${month}${day}${hours}${minutes}`,
        topic,
        detail,
        type,
        position,
        positionDetail,
        files: [],
        lineUserId: window.globalUserData.lineUserId,
        memberId: window.globalUserData.memberId || "",
        name: window.globalUserData.name || "",
        surname: window.globalUserData.surname || "",
        email: window.globalUserData.email || "",
        phone: window.globalUserData.phone || "",
        profile: window.globalUserData.pictureUrl || "",
        status: "รอดำเนินการ",
        timestamp: Date.now(),
    };

    const uploadAndSaveReport = async () => {
        if (files.length > 0) {
            const uploadPromises = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();

                formData.append("file", file);           // ไฟล์ภาพ
                formData.append("fileName", file.name);  // ชื่อไฟล์
                formData.append("folder", "/reports");   // โฟลเดอร์ใน ImageKit (ถ้าอยากจัดหมวดหมู่)

                uploadPromises.push(
                    fetch("https://upload.imagekit.io/api/v1/files/upload", {
                        method: "POST",
                        headers: {
                            Authorization: "Basic " + btoa("private_Byxu58PAGW7cKhDfs0J9XgJyYS0=" + ":")
                            // ห้ามใช้จริงใน production!
                        },
                        body: formData
                    })
                        .then(res => res.json())
                        .then(data => {
                            return {
                                fileName: file.name,
                                fileUrl: data.url   // URL ของไฟล์ที่อัปโหลด
                            };
                        })
                );
            }

            const uploadedFiles = await Promise.all(uploadPromises);
            reportData.files = uploadedFiles;
        }

        // บันทึก Firestore ตามเดิม
        await newIssueRef.set(reportData);

        toastAlert(1, "ส่งรายงานสำเร็จ");
        document.getElementById("reportForm").reset();
        window.location.href = "tracking.html";
    };

    showLoader(3000);
    uploadAndSaveReport().catch((error) => {
        toastAlert(0, "เกิดข้อผิดพลาด: " + error.message);
        console.error("Upload and save failed:", error); // เพิ่ม console.error เพื่อดูรายละเอียด
    });
}

const getFeedIssues = async () => {
    try {
        const issuesRef = db.collectionGroup("issues");
        const issuesSnapshot = await issuesRef.get();

        const allData = [];

        issuesSnapshot.forEach(issueDoc => {
            const data = issueDoc.data();
            // Extract userId from the document path
            const pathParts = issueDoc.ref.path.split("/");
            const userId = pathParts[1];
            const status = data.status;

            allData.push({
                id: issueDoc.id,
                userId,
                issueId: issueDoc.id,
                ...data
            });
        });

        // console.log("All Data:", allData);
        genaralFeedIssues(allData);
        return allData;
    } catch (error) {
        console.error("Error getting documents: ", error);
        return [];
    }
}

const genaralFeedIssues = async (reports) => {
    const dataContainer = document.getElementById('feedIssues');
    dataContainer.innerHTML = "";

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
        dataContainer.appendChild(noDataItem);
        return;
    }

    reports.sort((a, b) => b.timestamp - a.timestamp);

    reports.forEach(report => {
        const feedcard = document.createElement('div');
        feedcard.classList = 'card mb-3 rounded-4 shadow-sm overflow-hidden';

        feedcard.innerHTML = `
            <div class="card-body ${report.status}">
                <div class="d-flex align-items-center mb-2">
                    <img src="${report.profile}" alt="user"
                        class="rounded-circle me-2" width="40" height="40">
                    <div class="font-size-14 d-flex flex-column">
                        <span class="fw-semibold">คุณ${report.name} ${report.surname}</span>
                        <span class="text-secondary fw-light font-size-12">${timeAgo(report.timestamp)}</span>
                    </div>
                </div>
                <div class="mb-2 font-size-14">
                    <p class="mb-0">${report.detail}</p>
                </div>
                <div class="mb-2">
                    <img src="https://placehold.co/600x400.png" alt="problem" class="rounded-3 w-100"
                        style="max-height: 250px; object-fit: cover;">
                </div>
                <div class="d-flex align-items-center mt-2">
                    <div class="btn-group" role="group" aria-label="Feelings">
                        <button type="button" class="btn btn-light px-2" title="ถูกใจ">
                            <i class="fa-solid fa-thumbs-up text-primary"></i>
                        </button>
                        <button type="button" class="btn btn-light px-2" title="รักเลย">
                            <i class="fa-solid fa-heart text-danger"></i>
                        </button>
                        <button type="button" class="btn btn-light px-2" title="ฮาฮา">
                            <i class="fa-solid fa-face-laugh text-warning"></i>
                        </button>
                        <button type="button" class="btn btn-light px-2" title="ว้าว">
                            <i class="fa-solid fa-face-surprise text-info"></i>
                        </button>
                        <button type="button" class="btn btn-light px-2" title="เศร้า">
                            <i class="fa-solid fa-face-sad-tear text-secondary"></i>
                        </button>
                        <button type="button" class="btn btn-light px-2" title="โกรธ">
                            <i class="fa-solid fa-face-angry text-danger"></i>
                        </button>
                    </div>
                    <span class="ms-2 font-size-12 text-secondary">ถูกใจ 5 คน</span>
                </div>
            </div>
        `;

        dataContainer.appendChild(feedcard);
    });
};

function timeAgo(timestamp) {
    const now = new Date();
    const timePost = new Date(timestamp);
    const diffMs = now - timePost; // ผลต่างเวลาเป็นมิลลิวินาที

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return `${diffSeconds} วินาทีที่แล้ว`;
    } else if (diffMinutes < 60) {
        return `${diffMinutes} นาทีที่แล้ว`;
    } else if (diffHours < 24) {
        return `${diffHours} ชั่วโมงที่แล้ว`;
    } else if (diffDays < 30) {
        return `${diffDays} วันที่แล้ว`;
    } else {
        return timePost.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
