const fs = require('fs');
let lines = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8').split('\n');

const targetStr = `  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentName || !newParentEmail) {
      showToast('กรุณากรอกชื่อและอีเมลผู้ปกครอง');
      return;
    }
    if (!hoursToAdd) {
      showToast('กรุณาเลือกจำนวนโควต้า/คลาสที่ซื้อ');
      return;
    }`;

const newStr = `  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentName || !newParentEmail || !newParentPhone) {
      showToast('กรุณากรอกข้อมูล: ชื่อ-นามสกุล, อีเมล และเบอร์โทรศัพท์ผู้ปกครองให้ครบถ้วน');
      return;
    }
    if (!hoursToAdd) {
      showToast('กรุณาเลือก คลาส & โควต้าที่ซื้อ');
      return;
    }
    if (!paymentAmount || !paymentPayerName || !paymentBank) {
      showToast('กรุณากรอกข้อมูลหลักฐานการชำระเงินให้ครบถ้วน (จำนวนเงินที่โอน, ชื่อบัญชีผู้โอน, ธนาคารต้นทาง)');
      return;
    }`;

const newText = lines.join('\n').replace(targetStr, newStr);
fs.writeFileSync('app/admin/dashboard/page.tsx', newText, 'utf8');
console.log('Patched handleCreateParent validation');
