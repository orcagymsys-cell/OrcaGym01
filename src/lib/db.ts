import fs from 'fs';
import path from 'path';
import { DbSchema } from './types';

const DB_PATH = path.join(process.cwd(), '.data', 'db.json');

const defaultDb: DbSchema = {
  users: [
    {
      id: 'admin_1',
      role: 'admin',
      username: 'admin',
      full_name: 'Super Admin',
      phone_number: '0812345678',
      first_login: false
    },
    {
      id: 'parent_1',
      role: 'parent',
      username: 'parent',
      full_name: 'John Doe',
      phone_number: '0811111111',
      first_login: true
    }
  ],
  children: [],
  classes: [
    { 
      id: 'class_1', 
      name: 'Orca Cubs', 
      capacity: 10,
      title: 'Orca Cubs',
      subtitle: 'Class',
      description: 'เปิดประตูสู่การเรียนรู้กับคลาส ORCA Cubs (สำหรับน้องๆ อายุ 6-10 ปี)\nคลาสเรียนพื้นฐานเบื้องต้นสำหรับเด็กๆ ที่ดีไซน์มาเพื่อเสริมสร้างทักษะทางร่างกายและการเคลื่อนไหวอย่างถูกวิธี สนุกสนาน สมวัย ปูพื้นฐานแน่นเพื่อให้พร้อมต่อยอดในระดับที่สูงขึ้นได้อย่างมั่นใจ',
      ageRange: 'Age 4-10',
      durationText: '1.5 hrs/time',
      theme: 'blue',
      pricing: [
        { id: 'p1', times: '1', fees: '700 THB', duration: '-' },
        { id: 'p2', times: '6', fees: '4,100 THB (683)', duration: '2 Months' },
        { id: 'p3', times: '12', fees: '7,800 THB (650)', duration: '4 Months' },
        { id: 'p4', times: '24', fees: '14,400 THB (600)', duration: '6 Months', tag: 'free 2' },
      ],
      scheduleGrid: [
        { id: 's1', label: 'Tuesday - Friday', slots: ['10:30-12:00', '14:30-16:00', '16:00-17:30', '17:30-19:30'], tag: 'Tue-Wed', tagIndex: 3 },
        { id: 's2', label: 'Saturday - Sunday', slots: ['9:00-10:30', '10:30-12:00', '13:00-14:30', '14:30-16:00'] },
      ]
    },
    { 
      id: 'class_2', 
      name: 'Mega Orca', 
      capacity: 15,
      title: 'Mega Orca',
      subtitle: 'Class',
      description: 'ก้าวสู่ความท้าทายขั้นกว่ากับคลาส Mega Orca! (สำหรับนักกีฬา เลเวล 1 ขึ้นไป)\nคลาสยกระดับทักษะสำหรับนักกีฬารุ่นเยาว์ เน้นการฝึกซ้อมที่เข้มข้น พัฒนาเทคนิคขั้นสูง เสริมสร้างสมรรถภาพทางร่างกายและความทนทาน เพื่อเตรียมความพร้อมสู่การแข่งขันอย่างเต็มศักยภาพ',
      ageRange: 'Age 5-15',
      durationText: '2 hrs/time',
      theme: 'pink',
      pricing: [
        { id: 'm1', times: '1', fees: '800 THB', duration: '-' },
        { id: 'm2', times: '6', fees: '4,300 THB (716)', duration: '2 Months' },
        { id: 'm3', times: '12', fees: '8,400 THB (700)', duration: '4 Months' },
        { id: 'm4', times: '24', fees: '15,600 THB (650)', duration: '6 Months', tag: 'free 2' },
      ],
      scheduleGrid: [
        { id: 'ms1', label: 'Tuesday - Friday', slots: ['10:30-12:30', '17:30-19:30', '', ''] },
        { id: 'ms2', label: 'Saturday - Sunday', slots: ['10:30-12:30', '16:00-18:00', '', ''] },
      ]
    }
  ],
  schedules: [
    { id: 'sch_1', class_id: 'class_1', day_of_week: 'MON', start_time: '10:30', end_time: '12:00' },
    { id: 'sch_2', class_id: 'class_1', day_of_week: 'MON', start_time: '13:00', end_time: '14:30' },
    { id: 'sch_3', class_id: 'class_2', day_of_week: 'TUE', start_time: '10:30', end_time: '12:00' }
  ],
  bookings: [],
  auditLogs: [],
  settings: {
    max_children_allowed: 1
  }
};

export function getDb(): DbSchema {
  if (!fs.existsSync(DB_PATH)) {
    saveDb(defaultDb);
    return defaultDb;
  }
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

export function saveDb(data: DbSchema) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
