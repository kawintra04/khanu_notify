/**
 * User Data Manager - จัดการข้อมูลผู้ใช้แบบ global
 * สามารถใช้ได้ในทุกหน้าในโปรเจค
 */

// ตัวแปร global สำหรับเก็บข้อมูลผู้ใช้
window.globalUserData = null;

// Event สำหรับแจ้งเตือนเมื่อข้อมูลผู้ใช้พร้อมใช้งาน
window.userDataReadyEvent = new CustomEvent('userDataReady');

/**
 * ฟังก์ชันสำหรับเข้าถึงข้อมูลผู้ใช้
 * @returns {Object|null} ข้อมูลผู้ใช้หรือ null ถ้ายังไม่มีข้อมูล
 */
const getUserData = () => {
  return window.globalUserData || null;
};

const getCouponUser = () => {
  return window.globaldataCoupon || null;
};

/**
 * ฟังก์ชันสำหรับรอข้อมูลผู้ใช้พร้อมใช้งาน
 * @param {Function} callback - ฟังก์ชันที่จะเรียกเมื่อข้อมูลพร้อม
 * @param {number} maxWaitTime - เวลารอสูงสุด (มิลลิวินาที)
 */
const waitForUserData = (callback, maxWaitTime = 10000) => {
  const startTime = Date.now();
  
  const checkData = () => {
    if (window.globalUserData) {
      callback(window.globalUserData);
      return;
    }
    
    if (Date.now() - startTime > maxWaitTime) {
      console.warn('Timeout waiting for user data');
      callback(null);
      return;
    }
    
    setTimeout(checkData, 100);
  };
  
  checkData();
};

/**
 * ฟังก์ชันสำหรับตรวจสอบว่าผู้ใช้เข้าสู่ระบบแล้วหรือยัง
 * @returns {boolean} true ถ้าผู้ใช้เข้าสู่ระบบแล้ว
 */
const isUserLoggedIn = () => {
  return window.globalUserData !== null && window.globalUserData !== undefined;
};

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูลผู้ใช้
 * @param {Object} newData - ข้อมูลใหม่
 */
const updateUserData = (newData) => {
  window.globalUserData = { ...window.globalUserData, ...newData };
  // แจ้งเตือนว่าข้อมูลมีการเปลี่ยนแปลง
  window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: window.globalUserData }));
};

/**
 * ฟังก์ชันสำหรับล้างข้อมูลผู้ใช้ (ออกจากระบบ)
 */
const clearUserData = () => {
  window.globalUserData = null;
  // แจ้งเตือนว่าข้อมูลถูกล้าง
  window.dispatchEvent(new CustomEvent('userDataCleared'));
};

/**
 * ฟังก์ชันสำหรับรับข้อมูลเฉพาะส่วนของผู้ใช้
 * @param {string} field - ชื่อฟิลด์ที่ต้องการ
 * @returns {any} ค่าของฟิลด์หรือ null ถ้าไม่มี
 */
const getUserField = (field) => {
  return window.globalUserData ? window.globalUserData[field] : null;
};

/**
 * ฟังก์ชันสำหรับรับข้อมูลผู้ใช้แบบ async
 * @returns {Promise<Object|null>} Promise ที่ resolve ด้วยข้อมูลผู้ใช้
 */
const getUserDataAsync = () => {
  return new Promise((resolve) => {
    if (window.globalUserData) {
      resolve(window.globalUserData);
    } else {
      waitForUserData(resolve);
    }
  });
};

// Export functions to global scope
window.getUserData = getUserData;
window.waitForUserData = waitForUserData;
window.isUserLoggedIn = isUserLoggedIn;
window.updateUserData = updateUserData;
window.clearUserData = clearUserData;
window.getUserField = getUserField;
window.getUserDataAsync = getUserDataAsync;

// Event listeners สำหรับการจัดการข้อมูลผู้ใช้
window.addEventListener('userDataReady', () => {
  // console.log('User data is ready:', window.globalUserData);
  // console.log('User data is ready:', window.globaldataCoupon);
});

window.addEventListener('userDataUpdated', (event) => {
  // console.log('User data updated:', event.detail);
});

window.addEventListener('userDataCleared', () => {
  // console.log('User data cleared');
});


// ตัวอย่างการใช้งาน:
// 
// 1. เข้าถึงข้อมูลผู้ใช้ทันที:
// const userData = getUserData();
// 
// 2. รอข้อมูลผู้ใช้พร้อมใช้งาน:
// waitForUserData((userData) => {
//   console.log('User data ready:', userData);
// });
// 
// 3. ตรวจสอบสถานะการเข้าสู่ระบบ:
// if (isUserLoggedIn()) {
//   console.log('User is logged in');
// }
// 
// 4. อัปเดตข้อมูลผู้ใช้:
// updateUserData({ name: 'New Name' });
// 
// 5. รับข้อมูลเฉพาะฟิลด์:
// const userName = getUserField('name');
// 
// 6. ใช้แบบ async:
// getUserDataAsync().then(userData => {
//   console.log('User data:', userData);
// });