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

async function getCollectionCoupon(lineUserId) {
    try {
        const regRef = await db.collection("coupons").doc(lineUserId);
        const snapshot = await regRef.get();

        return snapshot.data();
    } catch (error) {
        console.error("Error fetching coupons: ", error);
        throw error;
    }
}