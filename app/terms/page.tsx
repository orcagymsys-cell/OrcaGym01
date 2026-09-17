'use client';
import BackButton from '@/components/BackButton';

export default function TermsPage() {
  return (
    <div className="font-sans max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <BackButton />
        <div className="home-badge-header">TERMS & CONDITIONS</div>
      </div>

      <div className="flex flex-col items-center text-center my-6">
        <div className="w-28 flex justify-center items-center mb-2">
          <img
            src="/images/orca_logo.png"
            alt="ORCA GYMNASTICS"
            style={{ width: '120px', height: 'auto', maxWidth: '100%' }}
            className="object-contain"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#001a3a] tracking-wider font-['Comic_Neue',sans-serif] mt-1">
          ORCA GYMNASTICS
        </h1>
      </div>

      <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-10 space-y-8">
        
        <div className="text-center pb-6 border-b border-slate-100">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1e3a66] mb-2">
            ระเบียบและข้อปฏิบัติสำหรับผู้เรียน
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            ยิมนาสติก Orca Cubs โรงยิม ORCA
          </p>
        </div>

        <div className="space-y-8 text-sm text-slate-700 leading-relaxed font-sans">
          
          <section>
            <h4 className="font-bold text-[#1e3a66] text-base mb-3 flex items-center">
              <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 text-sm">1</span>
              การแต่งกายและการเตรียมความพร้อม
            </h4>
            <ul className="list-none pl-10 space-y-2 text-slate-600">
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">สวมชุดฝึกซ้อมของโรงยิม ORCA ให้เรียบร้อย</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">รวบผมให้เป็นระเบียบ (สำหรับผู้เรียนผมยาว)</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">ถอดเครื่องประดับทุกชนิดก่อนเข้าพื้นที่ฝึกซ้อม เช่น สร้อย แหวน ต่างหู และนาฬิกา</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-[#1e3a66] text-base mb-3 flex items-center">
              <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 text-sm">2</span>
              การตรงต่อเวลาและการรับ-ส่ง
            </h4>
            <ul className="list-none pl-10 space-y-2 text-slate-600">
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">ควรมาถึงโรงยิมก่อนเวลาเรียน 10–15 นาที หากมาสายกรุณาแจ้งเจ้าหน้าที่ล่วงหน้า</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">ผู้ปกครองควรมารับผู้เรียนตรงตามเวลาที่กำหนด หากมอบหมายให้ผู้อื่นมารับแทน กรุณาแจ้งโรงยิมล่วงหน้า</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">โรงยิมจะดูแลความปลอดภัยของผู้เรียนเฉพาะช่วงเวลาเรียนเท่านั้น</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-[#1e3a66] text-base mb-3 flex items-center">
              <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 text-sm">3</span>
              ความปลอดภัยและพฤติกรรมระหว่างการฝึก
            </h4>
            <ul className="list-none pl-10 space-y-2 text-slate-600">
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">ปฏิบัติตามคำแนะนำของผู้ฝึกสอนอย่างเคร่งครัด</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">ห้ามใช้อุปกรณ์โดยไม่ได้รับอนุญาต และห้ามวิ่งเล่นหรือหยอกล้อในลักษณะที่อาจก่อให้เกิดอันตราย</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">หากผู้เรียนมีพฤติกรรมที่ไม่ปลอดภัยต่อตนเองหรือผู้อื่น โรงยิมขอสงวนสิทธิ์ในการให้หยุดพักการฝึกซ้อมชั่วคราว</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">ช่วยกันดูแลรักษาความสะอาดและอุปกรณ์ของโรงยิม</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-[#1e3a66] text-base mb-3 flex items-center">
              <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 text-sm">4</span>
              สุขภาพและความปลอดภัยของผู้เรียน
            </h4>
            <ul className="list-none pl-10 space-y-2 text-slate-600">
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">หากมีโรคประจำตัว อาการบาดเจ็บ หรือข้อจำกัดทางร่างกาย กรุณาแจ้งโรงยิมก่อนเริ่มเรียน</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">หากมีไข้ เจ็บป่วย หรือมีอาการติดเชื้อ ควรงดเรียนจนกว่าจะหายเป็นปกติ</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">หากได้รับบาดเจ็บระหว่างการฝึก กรุณาแจ้งผู้ฝึกสอนทันที</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">กีฬายิมนาสติกมีความเสี่ยงต่อการบาดเจ็บ โรงยิมเน้นย้ำเรื่องความปลอดภัยสูงสุด แต่จะไม่รับผิดชอบต่ออุบัติเหตุที่เกิดจากการไม่ปฏิบัติตามคำสั่งของผู้ฝึกสอน รวมถึงการสูญหายหรือเสียหายของทรัพย์สินส่วนตัว</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-[#1e3a66] text-base mb-3 flex items-center">
              <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 text-sm">5</span>
              การขาดเรียน การชดเชย และวันหยุด
            </h4>
            <ul className="list-none pl-10 space-y-2 text-slate-600">
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">กรณีลาเรียน กรุณาแจ้งล่วงหน้าอย่างน้อย 24 ชั่วโมง การขาดเรียนโดยไม่แจ้งล่วงหน้าจะไม่สามารถขอเรียนชดเชยได้</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">สิทธิ์การเรียนชดเชยให้เป็นไปตามเงื่อนไขของโรงยิม (กำหนดไม่เกินจำนวนครั้งต่อคอร์ส และต้องใช้สิทธิ์ภายในระยะเวลาที่กำหนด)</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">วันหยุดนักขัตฤกษ์หรือวันปิดปรับปรุง โรงยิมจะแจ้งให้ทราบล่วงหน้า โดยจะไม่นับรวมเป็นรอบวันเรียนในคอร์ส</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">ขอสงวนสิทธิ์ไม่คืนค่าเรียนทุกกรณีหลังจากเริ่มคอร์สแล้ว (เว้นแต่มีใบรับรองแพทย์ยืนยันการเจ็บป่วย/บาดเจ็บเรื้อรังที่ไม่สามารถเล่นกีฬาได้)</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-[#1e3a66] text-base mb-3 flex items-center">
              <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 text-sm">6</span>
              การจองคลาสเรียนและข้อตกลงการใช้บริการ
            </h4>
            <ul className="list-none pl-10 space-y-2 text-slate-600">
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">ชั่วโมงเรียนมีอายุการใช้งานตามแพ็กเกจที่สมัคร</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">การจองคลาสเรียนขึ้นอยู่กับจำนวน Quotas ว่างในแต่ละรอบเวลา (สูงสุด 20 คนต่อรอบ)</li>
              <li className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-300">ชั่วโมงเรียนไม่สามารถโอนสิทธิ์ให้ผู้อื่น หรือเปลี่ยนเป็นเงินสดได้ทุกกรณี</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
