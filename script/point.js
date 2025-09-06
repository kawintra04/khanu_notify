const getDataPoint = async () => {
    try {
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        const regRef = db.collection("reports").doc(lineUserId).collection("issues");

        const snapshot = await regRef.get();

        const allData = [];

        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                const data = doc.data();
                const topic = data.topic;
                const status = data.status;
                const timestamp = new Date(data.timestamp);
                const dataShow = timestamp.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }) || '';

                allData.push({
                    topic,
                    status,
                    dataShow,
                    timestamp
                });
            });

            genaralPoint(allData);
        } else {
            console.log("No documents found.");
        }
    } catch (error) {
        console.error("Error getting documents: ", error);
    }
}


const genaralPoint = async (data) => {
    const dataContainer = document.getElementById('good-deed-history');
    const pointText = document.getElementById('good-deed-points');
    dataContainer.innerHTML = "";
    pointText.innerHTML = 0;

    if (!data) {
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

    data.sort((a, b) => b.timestamp - a.timestamp);

    const container = document.createElement('ul');
    container.classList = "list-group px-3";

    let allpoint = 0;

    data.forEach(report => {
        const list = document.createElement('li');
        list.classList = "list-group-item rounded-4 bg-class-vl d-flex justify-content-between align-items-center border-2 shadow mb-2";
        
        let points = 0;

        if (report.status === 'ดำเนินการเสร็จสิ้น') {
            points = 10;
        } else if (report.status === 'ดำเนินการ') {
            points = 5;
        } else if (report.status === 'รอดำเนินการ') {
            points = 3;
        } else if (report.status === 'ยกเลิก') {
            points = 1;
        }        

        allpoint += points;

        list.innerHTML = `
            <div>
                <span class="fw-semibold text-dark font-size-14 mb--2">${report.topic}</span><br>
                <span class="text-muted font-size-12 fw-light mt--2">${report.dataShow} น.</span>
            </div>
            <span class="badge bg-success rounded-pill fw-normal px-2">+${points}</span>
        `;

        container.appendChild(list);
    });

    pointText.textContent = allpoint;
    dataContainer.appendChild(container);
}