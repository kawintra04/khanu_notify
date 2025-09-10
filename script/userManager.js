const getDataAllusers = async () => {
    const total = document.getElementById('total-user');
    const student = document.getElementById('student-user');
    const council = document.getElementById('council-user');
    const teacher = document.getElementById('teacher-user');

    let allCount = 0;
    let studentCount = 0;
    let councilCount = 0;
    let teacherCount = 0;
    try {
        const userRef = db.collectionGroup("registrations");
        const userSnapshot = await userRef.get();
        const allData = [];

        userSnapshot.forEach(userDoc => {
            allCount++;
            const data = userDoc.data();
            const level = data.level;

            if (level === 'student') {
                studentCount++;
            } else if (level === 'council') {
                councilCount++;
            } else if (level === 'teacher') {
                teacherCount++;
            }

            allData.push({
                userId: userDoc.id,
                ...data
            });
        })

        total.textContent = allCount;
        student.textContent = studentCount;
        council.textContent = councilCount;
        teacher.textContent = teacherCount;
        genaralUser(allData);
        return allData;
    } catch {
        console.error("Error getting documents: ", error);
        return [];
    }
}

const genaralUser = async (users) => {
    const dataContainer = document.getElementById('user-list');
    const pagination = document.getElementById('pagination');

    // เรียงลำดับ level: teacher > council > student
    const levelOrder = { teacher: 1, council: 2, student: 3 };
    users.sort((a, b) => (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99));

    // Pagination
    let currentPage = 1;
    const itemsPerPage = 6;
    const totalPages = Math.ceil(users.length / itemsPerPage);

    const renderPage = (page) => {
        dataContainer.innerHTML = "";

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageUsers = users.slice(start, end);

        pageUsers.forEach(user => {
            const col = document.createElement("div");
            col.className = "col-md-4 mb-3 px-4";

            const levelMap = {
                'teacher': `<span class="badge bg-danger mt-1 fw-normal rounded-pill px-4">คุณครู</span>`,
                'student': `<span class="badge bg-primary mt-1 fw-normal rounded-pill px-4">นักเรียน</span>`,
                'council': `<span class="badge bg-warning mt-1 fw-normal rounded-pill px-4">สภานักเรียน</span>`,
            } 
            
            col.innerHTML = `
                <div class="card h-100 shadow rounded-5">
                    <div class="card-body d-flex align-items-center">
                        <img src="${user.pictureUrl}" 
                             class="rounded-circle me-3 border" 
                             width="60" height="60" 
                             alt="${user.name}">
                        <div>
                            <div class="w-100 mb-1">
                                <span>${user.name} ${user.surname || ""}</span>
                            </div>
                            <p class="mb-0 font-size-14 text-muted small">
                                <i class="fa-light fa-envelope"></i> ${user.email}
                            </p>
                            <p class="mb-0 font-size-14 text-muted small">
                                <i class="fa-light fa-phone-rotary"></i> ${user.phone || "-"}
                            </p>
                            ${levelMap[user.level] || 'ไม่ระบุ'}
                            <p class="badge fw-normal rounded-pill px-2 ${user.status ? "bg-success" : "bg-danger"}">
                                ${user.status ? "ใช้งานอยู่" : "ปิดการใช้งาน"}
                            </p>
                        </div>
                    </div>
                    <div class="card-footer d-flex justify-content-between align-items-center">
                        <!-- dropdown เปลี่ยน level -->
                        <select class="form-select rounded-pill form-select-sm w-auto level-select">
                            <option value="teacher" ${user.level === "teacher" ? "selected" : ""}>คุณครู</option>
                            <option value="council" ${user.level === "council" ? "selected" : ""}>สภานักเรียน</option>
                            <option value="student" ${user.level === "student" ? "selected" : ""}>นักเรียน</option>
                        </select>

                        <button class="btn rounded-4 px-4 btn-sm ${user.status ? "btn-danger" : "btn-success"} toggle-btn">
                            ${user.status ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                        </button>
                    </div>
                </div>
            `;

            // ปุ่ม toggle
            const toggleBtn = col.querySelector(".toggle-btn");
            toggleBtn.addEventListener("click", () => {
                user.status = !user.status;
                renderPage(page); // refresh UI

                // update Firestore
                db.collection("registrations").doc(user.userId).update({ status: user.status });
            });

            // dropdown เปลี่ยน level
            const levelSelect = col.querySelector(".level-select");
            levelSelect.addEventListener("change", (e) => {
                const newLevel = e.target.value;
                user.level = newLevel;
                renderPage(page); // refresh UI

                // update Firestore
                db.collection("registrations").doc(user.userId).update({ level: newLevel });
            });

            dataContainer.appendChild(col);
        });

        // Pagination
        pagination.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement("li");
            li.className = `page-item ${i === page ? "active" : ""}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener("click", (e) => {
                e.preventDefault();
                currentPage = i;
                renderPage(i);
            });
            pagination.appendChild(li);
        }
    };

    renderPage(currentPage);
};
