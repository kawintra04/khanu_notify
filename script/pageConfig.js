/**
 * Page Configuration
 * จัดการการตั้งค่าหน้าต่างๆ ในระบบ
 */

// หน้าต่างๆ ที่ไม่ต้องการให้ redirect ไปหน้า index.html
const EXCLUDED_FROM_REDIRECT = [
  'point',          
  'report',           
  'tracking',           
  'other',           
  'administrator/check-report',           
  'administrator/user-manager',           
];

// หน้าต่างๆ ที่ต้องการให้ redirect ไปหน้า register.html เมื่อยังไม่ได้ลงทะเบียน
const REDIRECT_TO_REGISTER = [
  'index'              // หน้าแรก
];

// หน้าต่างๆ ที่ต้องการให้ redirect ไปหน้า index.html หลังจากลงทะเบียนสำเร็จ
const REDIRECT_TO_INDEX = [
  'register'           // หน้าลงทะเบียน
];

/**
 * ตรวจสอบว่าหน้าปัจจุบันควรถูก redirect หรือไม่
 * @param {string} targetPage - หน้าที่ต้องการ redirect ไป
 * @returns {boolean} - true ถ้าควร redirect, false ถ้าไม่ควร
 */
function shouldRedirectTo(targetPage) {
  const currentPath = window.location.pathname;
  
  switch (targetPage) {
    case 'index.html':
      // ไม่ redirect ถ้าอยู่ที่ index.html อยู่แล้ว หรืออยู่ในหน้าที่ยกเว้น
      return !currentPath.endsWith("index.html") && 
             !EXCLUDED_FROM_REDIRECT.some(page => currentPath.includes(page));
      
    case 'register.html':
      // redirect ไปหน้า register เฉพาะเมื่ออยู่ที่ index.html และยังไม่ได้ลงทะเบียน
      return currentPath.endsWith("index.html");
      
    default:
      return false;
  }
}

/**
 * ตรวจสอบว่าหน้าปัจจุบันอยู่ในหมวดหมู่ใด
 * @param {string} category - หมวดหมู่ที่ต้องการตรวจสอบ
 * @returns {boolean} - true ถ้าอยู่ในหมวดหมู่ที่ระบุ
 */
function isInCategory(category) {
  const currentPath = window.location.pathname;
  
  switch (category) {
    case 'auth':
      // หน้าที่ต้องการการยืนยันตัวตน
      return ['scanner', 'invite', 'upload', 'profile', 'settings', 'dashboard', 'admin'].some(
        page => currentPath.includes(page)
      );
      
    case 'public':
      // หน้าสาธารณะที่ไม่ต้องการการยืนยันตัวตน
      return ['guide', 'manual', 'q-and-a', 'terms-and-conditions', 'help', 'about', 'contact', 'faq', 'support'].some(
        page => currentPath.includes(page)
      );
      
    case 'core':
      // หน้าหลักของระบบ
      return ['index', 'register'].some(
        page => currentPath.includes(page)
      );
      
    default:
      return false;
  }
}

/**
 * ตรวจสอบว่าหน้าปัจจุบันต้องการการยืนยันตัวตนหรือไม่
 * @returns {boolean} - true ถ้าต้องการการยืนยันตัวตน
 */
function requiresAuthentication() {
  return isInCategory('auth');
}

/**
 * ตรวจสอบว่าหน้าปัจจุบันเป็นหน้าสาธารณะหรือไม่
 * @returns {boolean} - true ถ้าเป็นหน้าสาธารณะ
 */
function isPublicPage() {
  return isInCategory('public');
}

/**
 * ตรวจสอบว่าหน้าปัจจุบันเป็นหน้าหลักของระบบหรือไม่
 * @returns {boolean} - true ถ้าเป็นหน้าหลัก
 */
function isCorePage() {
  return isInCategory('core');
}

/**
 * ดึงรายการหน้าที่ยกเว้นจากการ redirect
 * @returns {Array} - รายการหน้าที่ยกเว้น
 */
function getExcludedPages() {
  return [...EXCLUDED_FROM_REDIRECT];
}

/**
 * เพิ่มหน้าที่ยกเว้นจากการ redirect
 * @param {string} pageName - ชื่อหน้าที่ต้องการยกเว้น
 */
function addExcludedPage(pageName) {
  if (!EXCLUDED_FROM_REDIRECT.includes(pageName)) {
    EXCLUDED_FROM_REDIRECT.push(pageName);
    console.log(`เพิ่มหน้า ${pageName} ในรายการยกเว้น redirect`);
  }
}

/**
 * ลบหน้าออกจากรายการยกเว้นการ redirect
 * @param {string} pageName - ชื่อหน้าที่ต้องการลบ
 */
function removeExcludedPage(pageName) {
  const index = EXCLUDED_FROM_REDIRECT.indexOf(pageName);
  if (index > -1) {
    EXCLUDED_FROM_REDIRECT.splice(index, 1);
    console.log(`ลบหน้า ${pageName} ออกจากรายการยกเว้น redirect`);
  }
}

// Export functions for global use
window.shouldRedirectTo = shouldRedirectTo;
window.isInCategory = isInCategory;
window.requiresAuthentication = requiresAuthentication;
window.isPublicPage = isPublicPage;
window.isCorePage = isCorePage;
window.getExcludedPages = getExcludedPages;
window.addExcludedPage = addExcludedPage;
window.removeExcludedPage = removeExcludedPage;

// Export constants for use in other files
window.PAGE_CONFIG = {
  EXCLUDED_FROM_REDIRECT,
  REDIRECT_TO_REGISTER,
  REDIRECT_TO_INDEX
};

// console.log('=== Page Configuration Loaded ===');
// console.log('หน้าที่ยกเว้น redirect:', EXCLUDED_FROM_REDIRECT);