/**
 * Orca Gymnastics - Google Apps Script Backend
 * Spreadsheet ID: 13pzfV9iHXjySYL5g4spa7wwuf3VRUZqtGgvZs4oT2Sw
 * Drive Folder ID: 16pDp_FOgn4w8RMiZc-wJbEONuMRhDjNT
 */

const SPREADSHEET_ID = "13pzfV9iHXjySYL5g4spa7wwuf3VRUZqtGgvZs4oT2Sw";
const DRIVE_FOLDER_ID = "16pDp_FOgn4w8RMiZc-wJbEONuMRhDjNT";

function getDb() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getFolder() {
  return DriveApp.getFolderById(DRIVE_FOLDER_ID);
}

function setupSheets() {
  const db = getDb();
  const sheets = {
    Users: ["id", "name", "phone", "password", "role", "createdAt"],
    Children: ["id", "parentId", "fullName", "nickname", "dob", "gender", "avatar", "photoUrl", "driveFileId", "status", "courseName", "totalHours", "usedHours", "expiryDate", "createdAt"],
    Bookings: ["id", "childId", "childNickname", "childFullName", "courseName", "date", "timeSlot", "status", "bookedAt"],
    AuditLogs: ["id", "timestamp", "adminName", "childId", "childName", "hoursAdded", "courseName", "note"],
    Quotas: ["slotKey", "quota"]
  };

  for (let sheetName in sheets) {
    let sheet = db.getSheetByName(sheetName);
    if (!sheet) {
      sheet = db.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      sheet.getRange(1, 1, 1, sheets[sheetName].length).setFontWeight("bold").setBackground("#001a3a").setFontColor("#ffffff");
    }
  }

  // Seed default admin if Users empty
  const usersSheet = db.getSheetByName("Users");
  if (usersSheet.getLastRow() <= 1) {
    usersSheet.appendRow(["admin_1", "แอดมิน Orca", "0800000000", "123", "admin", new Date().toISOString()]);
  }

  return "Setup completed successfully!";
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === "setup") {
    return jsonResponse({ status: "success", message: setupSheets() });
  }

  if (action === "getAllData") {
    return jsonResponse({
      status: "success",
      users: readSheetData("Users"),
      children: readSheetData("Children"),
      bookings: readSheetData("Bookings"),
      auditLogs: readSheetData("AuditLogs"),
      quotas: readSheetData("Quotas")
    });
  }

  return jsonResponse({ status: "success", message: "Orca Gymnastics GAS API is Running!" });
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;

    if (action === "registerParent") {
      return registerParent(contents.data);
    }
    if (action === "addChild") {
      return addChildWithPhoto(contents.data);
    }
    if (action === "approveAndTopUp") {
      return approveAndTopUp(contents.data);
    }
    if (action === "bookClass") {
      return bookClass(contents.data);
    }
    if (action === "cancelBooking") {
      return cancelBooking(contents.data);
    }

    return jsonResponse({ status: "error", message: "Unknown action" });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function addChildWithPhoto(data) {
  const db = getDb();
  const folder = getFolder();
  let photoUrl = "";
  let driveFileId = "";

  // Upload image to Google Drive if photoBase64 is provided
  if (data.photoBase64) {
    try {
      const splitData = data.photoBase64.split(",");
      const contentType = splitData[0].match(/:(.*?);/)[1];
      const bytes = Utilities.base64Decode(splitData[1]);
      const fileName = `child_${data.id}_${data.nickname}.png`;
      const blob = Utilities.newBlob(bytes, contentType, fileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      driveFileId = file.getId();
      photoUrl = `https://lh3.googleusercontent.com/d/${driveFileId}`;
    } catch (e) {
      Logger.log("Drive upload error: " + e.toString());
    }
  }

  const childrenSheet = db.getSheetByName("Children");
  childrenSheet.appendRow([
    data.id,
    data.parentId,
    data.fullName,
    data.nickname,
    data.dob,
    data.gender,
    data.avatar || 'girl',
    photoUrl,
    driveFileId,
    data.status || 'pending',
    data.courseName || 'Orca Cubs',
    data.totalHours || 0,
    data.usedHours || 0,
    data.expiryDate || '-',
    new Date().toISOString()
  ]);

  return jsonResponse({ status: "success", photoUrl: photoUrl, message: "บันทึกข้อมูลและอัปโหลดรูปขึ้น Google Drive เรียบร้อยแล้ว" });
}

function registerParent(data) {
  const db = getDb();
  const sheet = db.getSheetByName("Users");
  sheet.appendRow([
    data.id,
    data.name,
    data.phone,
    data.password,
    "parent",
    new Date().toISOString()
  ]);
  return jsonResponse({ status: "success", message: "ลงทะเบียนสมาชิกสำเร็จ" });
}

function approveAndTopUp(data) {
  const db = getDb();
  const sheet = db.getSheetByName("Children");
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.childId) {
      sheet.getRange(i + 1, 10).setValue("approved");
      sheet.getRange(i + 1, 11).setValue(data.courseName);
      sheet.getRange(i + 1, 12).setValue(Number(rows[i][11]) + Number(data.hoursAdded));
      sheet.getRange(i + 1, 14).setValue(data.expiryDate);
      break;
    }
  }

  // Record Audit Log
  const auditSheet = db.getSheetByName("AuditLogs");
  auditSheet.appendRow([
    'audit_' + Date.now(),
    new Date().toISOString(),
    data.adminName,
    data.childId,
    data.childName,
    data.hoursAdded,
    data.courseName,
    data.note || '-'
  ]);

  return jsonResponse({ status: "success", message: "อนุมัติและเติมชั่วโมงลง Google Sheet เรียบร้อยแล้ว" });
}

function bookClass(data) {
  const db = getDb();
  const bookingSheet = db.getSheetByName("Bookings");
  bookingSheet.appendRow([
    data.id,
    data.childId,
    data.childNickname,
    data.childFullName,
    data.courseName,
    data.date,
    data.timeSlot,
    "confirmed",
    new Date().toISOString()
  ]);

  // Update child used hours
  const childSheet = db.getSheetByName("Children");
  const rows = childSheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.childId) {
      const currentUsed = Number(rows[i][12]) || 0;
      childSheet.getRange(i + 1, 13).setValue(currentUsed + 1);
      break;
    }
  }

  return jsonResponse({ status: "success", message: "บันทึกการจองลง Google Sheet เรียบร้อยแล้ว" });
}

function cancelBooking(data) {
  const db = getDb();
  const bookingSheet = db.getSheetByName("Bookings");
  const rows = bookingSheet.getDataRange().getValues();
  let childId = null;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.bookingId) {
      childId = rows[i][1];
      bookingSheet.deleteRow(i + 1);
      break;
    }
  }

  if (childId) {
    const childSheet = db.getSheetByName("Children");
    const childRows = childSheet.getDataRange().getValues();
    for (let i = 1; i < childRows.length; i++) {
      if (childRows[i][0] == childId) {
        const currentUsed = Math.max(0, Number(childRows[i][12]) - 1);
        childSheet.getRange(i + 1, 13).setValue(currentUsed);
        break;
      }
    }
  }

  return jsonResponse({ status: "success", message: "ยกเลิกการจองใน Google Sheet เรียบร้อยแล้ว" });
}

function readSheetData(sheetName) {
  const db = getDb();
  const sheet = db.getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    let obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    result.push(obj);
  }
  return result;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
