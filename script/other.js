const getReportData = async () => {
    const countingText = document.getElementById('countReport');

    try {
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        const regRef = db.collection("reports").doc(lineUserId).collection("issues");

        const snapshot = await regRef.get();
        getLevelSystem(lineUserId);

        countingText.textContent = snapshot.size;

    } catch (error) {
        console.error("Error getting documents: ", error);
        countingText.textContent = "0"; 
    }
};

getReportData();

const getLevelSystem = async (lineUserId) => {
    const checkreportContainer = document.getElementById('checkreportContainer');
    try {
        const regRef = db.collection("registrations").doc(lineUserId);
        const snapshot = await regRef.get();
        if (snapshot.exists) {
            const data = snapshot.data();

            if (data.level === "student") {
                checkreportContainer.style.display = 'none';
            } else {
                checkreportContainer.style.display = 'block';
            }
        };
    } catch (err) {
        console.error('Error handling LINE user: ', err);
        toastAlert(3, "เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้ LINE");
    }    
}