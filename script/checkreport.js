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

function renderReports(reports) {
    reportList.innerHTML = ''; // Clear existing content

    reports.forEach(report => {
        const reportCard = document.createElement('div');
        reportCard.classList.add('report-card');

        // Add a class for styling based on status
        const statusClass = `status-${report.status.replace(/\s+/g, '')}`;
        reportCard.classList.add(statusClass);

        // Format timestamp
        const date = new Date(report.timestamp);
        const formattedDate = date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        reportCard.innerHTML = `
                    <h3><strong>เรื่อง:</strong> ${report.topic}</h3>
                    <p><strong>สถานะ:</strong> ${report.status}</p>
                    <p><strong>ผู้แจ้ง:</strong> ${report.name} ${report.surname}</p>
                    <p><strong>รายละเอียด:</strong> ${report.detail}</p>
                    <p><strong>สถานที่:</strong> ${report.positionDetail}</p>
                    <p><strong>ประเภท:</strong> ${report.type}</p>
                    <p><strong>หมายเลขโทรศัพท์:</strong> ${report.phone}</p>
                    <p><strong>วันที่แจ้ง:</strong> ${formattedDate}</p>
                `;

        reportList.appendChild(reportCard);
    });
}