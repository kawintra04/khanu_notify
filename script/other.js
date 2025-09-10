const getReportData = async () => {
    const countingText = document.getElementById('countReport');

    try {
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        const regRef = db.collection("reports").doc(lineUserId).collection("issues");

        const snapshot = await regRef.get();
        getLevelSystem(lineUserId);

        countingText.textContent = snapshot.size;

        const issuesRef = db.collectionGroup("issues");
        const issuesSnapshot = await issuesRef.get();

        let alltopic = 0;
        issuesSnapshot.forEach(issueDoc => {
            const data = issueDoc.data();
            // Extract userId from the document path
            const pathParts = issueDoc.ref.path.split("/");
            const status = data.status;

            if (status === 'ดำเนินการ' || status === 'รอดำเนินการ') {
                alltopic++;
            }
        });
        document.getElementById('allTopicProcess').textContent = alltopic;
    } catch (error) {
        console.error("Error getting documents: ", error);
        countingText.textContent = "0"; 
    }
};

const getLevelSystem = async (lineUserId) => {
    const checkreportContainer = document.getElementById('checkreportContainer');
    const userManagerContianer = document.getElementById('userManagerContianer');
    try {
        const regRef = db.collection("registrations").doc(lineUserId);
        const snapshot = await regRef.get();
        if (snapshot.exists) {
            const data = snapshot.data();

            if (data.level === "student") {
                checkreportContainer.style.display = 'none';
                userManagerContianer.style.display = 'none';
            } else if (data.level === "council") {
                checkreportContainer.style.display = '';
                userManagerContianer.style.display = 'none';
            } else if (data.level === "teacher") {
                checkreportContainer.style.display = '';
                userManagerContianer.style.display = '';
            }
        };

        let allpoint = 0;
        const reportregRef = db.collection("reports").doc(lineUserId).collection("issues");
        const reportsnapshot = await reportregRef.get();
        if (!reportsnapshot.empty) {
            reportsnapshot.forEach(doc => {
                const data = doc.data();
                const status = data.status;

                if (status === 'ดำเนินการเสร็จสิ้น') {
                    allpoint += 10;
                } else if (status === 'ดำเนินการ') {
                    allpoint += 5;
                } else if (status === 'รอดำเนินการ') {
                    allpoint += 3;
                } else if (status === 'ยกเลิก') {
                    allpoint += 1;
                }  
            });
        }

        document.getElementById('point-reward').textContent = allpoint;
    } catch (err) {
        console.error('Error handling LINE user: ', err);
        toastAlert(3, "เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้ LINE");
    }    
}