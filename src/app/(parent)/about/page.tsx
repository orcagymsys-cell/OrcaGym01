export default function AboutUsPage() {
  return (
    <div className="flex flex-col items-center py-8">
      <h1 className="text-3xl font-bold text-[#183363] mb-8">About Us</h1>
      
      <div className="w-full max-w-2xl bg-slate-50 p-8 rounded-xl border border-gray-200 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-[#183363] mb-2">บริษัท ออก้ายิม จำกัด</h2>
        <h3 className="text-xl font-semibold text-gray-700 mb-6">ORCA GYM CO., LTD.</h3>
        
        <div className="space-y-4 text-gray-600 text-left mx-auto max-w-md">
          <div className="flex border-b pb-2">
            <span className="font-bold w-32">เลขทะเบียน:</span>
            <span>0105569135935</span>
          </div>
          <div className="flex border-b pb-2">
            <span className="font-bold w-32">ประกอบธุรกิจ:</span>
            <span className="flex-1">สถาบันสอนและฝึกทักษะกีฬายิมนาสติก กายกรรม โยคะ การเต้นรำ ทุกรูปแบบ และเชียร์ลีดเดอร์ ให้แก่ เด็ก เยาวชน และบุคคลทั่วไป เมื่อได้รับอนุญาตจากหน่วยงานที่เกี่ยวข้องแล้ว</span>
          </div>
          <div className="flex">
            <span className="font-bold w-32">ที่ตั้ง:</span>
            <span className="flex-1">289/240 ซอย ร่มเกล้า 6/1 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510</span>
          </div>
        </div>
      </div>
    </div>
  );
}
