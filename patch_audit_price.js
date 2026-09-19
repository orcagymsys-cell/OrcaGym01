const fs = require('fs');
let text = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// =====================================
// FIX 1: Audit log records quota changes
// =====================================
// Replace the audit note section in handleSaveEditParent
text = text.replace(
  `    const adminUser = store.getCurrentUser();
    let noteMsg = 'แก้ไขข้อมูลผู้ปกครอง/ตะกร้าครอบครัว';
    let addedHrs = 0;
    let payAmt = undefined;
    if (hasPaymentFieldsFilled && isNewPaymentProof) {
        noteMsg = 'แก้ไขข้อมูลแพ็กเกจ/ยอดเงิน (อัปเดตประวัติล่าสุด)';
        addedHrs = editPurchasedHours !== '' ? Number(editPurchasedHours) : 0;
        payAmt = editPaymentAmount !== '' ? Number(editPaymentAmount) : undefined;
    }

    const newLog: AuditLog = {
      id: 'audit_' + Date.now(),
      admin_name: adminUser?.name || 'แอดมิน Orca',
      action_type: hasPaymentFieldsFilled && isNewPaymentProof ? 'topup_hours' : 'edit_parent',
      parent_name: updatedParent.name,
      child_name: \`ตะกร้าครอบครัว: \${updatedParent.name}\`,
      hours_added: addedHrs,
      total_hours: addedHrs,
      amount: payAmt,
      slip_ref: editPaymentRefNo.trim() || undefined,
      slip_url: editPaymentSlipFile || undefined,
      bank_name: selectedBank || undefined,
      payer_name: editPaymentPayerName.trim() || undefined,
      note: noteMsg
    };
    await store.saveAuditLog(newLog);`,

  `    const adminUser = store.getCurrentUser();
    const oldHours = editingParent.purchased_hours || 0;
    const newHours = editPurchasedHours !== '' ? Number(editPurchasedHours) : 0;
    const quotaChanged = oldHours !== newHours;
    
    let noteMsg = 'แก้ไขข้อมูลผู้ปกครอง/ตะกร้าครอบครัว';
    let addedHrs = 0;
    let payAmt = undefined;
    let auditActionType: AuditLog['action_type'] = 'edit_parent';
    
    if (quotaChanged) {
      noteMsg = \`แก้ไขจำนวนโควต้า: \${oldHours} ครั้ง → \${newHours} ครั้ง\`;
      addedHrs = newHours;
      auditActionType = 'topup_hours';
    }
    if (hasPaymentFieldsFilled && isNewPaymentProof) {
      noteMsg = quotaChanged
        ? \`แก้ไขโควต้า (\${oldHours}→\${newHours} ครั้ง) และข้อมูลการชำระเงิน\`
        : 'แก้ไขข้อมูลแพ็กเกจ/ยอดเงิน (อัปเดตประวัติล่าสุด)';
      addedHrs = newHours;
      payAmt = editPaymentAmount !== '' ? Number(editPaymentAmount) : undefined;
      auditActionType = 'topup_hours';
    }

    const newLog: AuditLog = {
      id: 'audit_' + Date.now(),
      admin_name: adminUser?.name || 'แอดมิน Orca',
      action_type: auditActionType,
      parent_name: updatedParent.name,
      child_name: \`ตะกร้าครอบครัว: \${updatedParent.name}\`,
      hours_added: addedHrs,
      total_hours: newHours,
      amount: payAmt,
      slip_ref: editPaymentRefNo.trim() || undefined,
      slip_url: editPaymentSlipFile || undefined,
      bank_name: selectedBank || undefined,
      payer_name: editPaymentPayerName.trim() || undefined,
      note: noteMsg
    };
    await store.saveAuditLog(newLog);`
);

// =====================================
// FIX 2: Price warning when quota/amount mismatch (create parent form)
// =====================================
// Define a price map constant near hoursToAdd validation
// Insert after the paymentAmount/paymentPayerName/paymentBank check in handleCreateParent
const priceWarningBlock = `    // Warn if payment amount is below standard price for quota
    const orcaCubsPrices: Record<number, number> = { 1: 700, 6: 4100, 12: 7800, 24: 14400 };
    const megaOrcaPrices: Record<number, number> = { 1: 800, 6: 4300, 12: 8400, 24: 15600 };
    const pricingMap = courseName === 'Mega Orca' ? megaOrcaPrices : orcaCubsPrices;
    const expectedMin = pricingMap[Number(hoursToAdd)];
    const actualAmount = paymentAmount ? Number(paymentAmount) : 0;
    if (expectedMin && actualAmount > 0 && actualAmount < expectedMin) {
      const confirmed = window.confirm(\`⚠️ ยอดเงินที่กรอก (\${actualAmount.toLocaleString()} บาท) ต่ำกว่าราคาปกติสำหรับ \${courseName} \${hoursToAdd} ครั้ง (\${expectedMin.toLocaleString()} บาท)\\n\\nกดตกลงเพื่อยืนยันต่อ หรือยกเลิกเพื่อแก้ไข\`);
      if (!confirmed) return;
    }`;

text = text.replace(
  `    if (!paymentAmount || !paymentPayerName || !paymentBank) {
      showToast('กรุณากรอกข้อมูลหลักฐานการชำระเงินให้ครบถ้วน (จำนวนเงินที่โอน, ชื่อบัญชีผู้โอน, ธนาคารต้นทาง)');
      return;
    }

    let autoUsername`,
  `    if (!paymentAmount || !paymentPayerName || !paymentBank) {
      showToast('กรุณากรอกข้อมูลหลักฐานการชำระเงินให้ครบถ้วน (จำนวนเงินที่โอน, ชื่อบัญชีผู้โอน, ธนาคารต้นทาง)');
      return;
    }
${priceWarningBlock}

    let autoUsername`
);

fs.writeFileSync('app/admin/dashboard/page.tsx', text, 'utf8');
console.log('Patched audit log + price warning');
