'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { submitLeadContact } from '@/app/actions/lead';
import { Sparkles, Phone, User, CheckCircle2, ChevronDown, Lock, Shield, Award, Gift, ArrowRight, MessageCircle } from 'lucide-react';

export default function LandingPageClient() {
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState('Orca Cubs Promo (10 + 2 แถมฟรี)');

  const [form, setForm] = useState({
    parent_name: '',
    phone_number: '',
    child_info: '',
    note: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await submitLeadContact({
      ...form,
      selected_promotion: selectedPromo
    });

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(true);
      setForm({ parent_name: '', phone_number: '', child_info: '', note: '' });
    }
    setLoading(false);
  };

  const handleSelectPromoClick = (promoName: string) => {
    setSelectedPromo(promoName);
    const formElement = document.getElementById('contact-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between">
      {/* TOP HEADER BAR */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Top-Left: Logo & Orca Gymnastics Text Under Logo */}
          <Link href="/" className="flex flex-col items-center group">
            <Image 
              src="/images/logo.png" 
              alt="ORCA GYMNASTICS" 
              width={65} 
              height={65} 
              className="object-contain transition-transform group-hover:scale-105"
              priority
            />
            <span className="text-xs font-black text-[#183363] tracking-wider uppercase -mt-1 group-hover:text-sky-600 transition-colors">
              Orca gymnastics
            </span>
          </Link>

          {/* Top-Right: Sign In Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLoginMenu(!showLoginMenu)}
              className="flex items-center space-x-2 bg-[#183363] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm hover:bg-blue-900 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <User size={16} />
              <span>เข้าสู่ระบบ (Sign in)</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showLoginMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showLoginMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100 text-xs font-black text-slate-400 uppercase">
                  เลือกพอร์ตัลเข้าสู่ระบบ
                </div>
                <Link
                  href="/login"
                  onClick={() => setShowLoginMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-xs sm:text-sm font-bold text-[#183363] hover:bg-sky-50 transition-colors"
                >
                  <span className="text-lg">👨‍👩‍👧‍👦</span>
                  <div>
                    <div>เข้าสู่ระบบผู้ปกครอง</div>
                    <div className="text-[10px] text-slate-500 font-normal">สำหรับจองคลาสเรียนบุตรหลาน</div>
                  </div>
                </Link>

                <Link
                  href="/admin/login"
                  onClick={() => setShowLoginMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-50 transition-colors border-t border-slate-100"
                >
                  <span className="text-lg">🛡️</span>
                  <div>
                    <div>เข้าสู่ระบบแอดมิน (Admin)</div>
                    <div className="text-[10px] text-slate-500 font-normal">สำหรับเจ้าหน้าที่บริหารจัดการ</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="w-full bg-gradient-to-b from-sky-100/60 via-slate-50 to-slate-50 py-10 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-amber-100 border border-amber-300 px-4 py-1.5 rounded-full text-amber-900 font-black text-xs sm:text-sm shadow-xs animate-bounce">
            <Sparkles size={16} className="text-amber-600" />
            <span>🔥 โปรโมชั่นพิเศษเดือนนี้ (Special Promotions)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#183363] tracking-tight leading-tight">
            สถาบันยิมนาสติกเด็ก <span className="text-sky-600">ORCA GYMNASTICS</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            เสริมสร้างทักษะกายกรรม การทรงตัว ความแข็งแรง และความเชื่อมั่นให้แก่เด็กๆ ด้วยหลักสูตรมาตรฐานสากลและโค้ชผู้เชี่ยวชาญ
          </p>
        </div>

        {/* 2 PROMOTION CARDS */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-10">
          {/* PROMOTION CARD 1 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-sky-400 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-sky-500 transition-all group">
            <div className="absolute top-0 right-0 bg-sky-500 text-white font-black text-xs px-4 py-1.5 rounded-bl-2xl shadow-xs">
              ยอดนิยมสำหรับเด็กเล็ก 🏆
            </div>

            <div>
              <div className="text-xs font-black text-sky-600 uppercase tracking-widest mb-1">
                PROMOTION 1 (อายุ 1.5 - 3.5 ปี)
              </div>
              <h3 className="text-2xl font-black text-[#183363] mb-3">
                Orca Cubs Class (10 + 2 แถมฟรี)
              </h3>
              
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 mb-6">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-sky-700">฿5,000</span>
                  <span className="text-xs font-bold text-slate-400 line-through">฿6,000</span>
                  <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 ml-auto">
                    🎁 แถมฟรี 2 ครั้ง
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-bold mt-2">
                  ซื้อ 10 ครั้ง รับเพิ่มฟรีทันที 2 ครั้ง (รวมเป็น 12 ครั้ง)
                </p>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm font-bold text-slate-700 mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>ปูพื้นฐานการทรงตัว ความยืดหยุ่น และสมาธิ</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>เรียนสนุกสนาน ปลอดภัย อุปกรณ์มาตรฐาน</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>สามารถแบ่งชั่วโมงเรียนในระบบตะกร้าครอบครัวได้</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPromoClick('Orca Cubs Promo (10 + 2 แถมฟรี)')}
              className="w-full py-3.5 bg-sky-600 text-white rounded-2xl font-black text-sm hover:bg-sky-700 shadow-md transition-all flex items-center justify-center space-x-2 group-hover:scale-[1.02]"
            >
              <span>ลงทะเบียนรับสิทธิ์โปรนี้</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* PROMOTION CARD 2 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-amber-500 transition-all group">
            <div className="absolute top-0 right-0 bg-amber-500 text-white font-black text-xs px-4 py-1.5 rounded-bl-2xl shadow-xs">
              โปรสุดคุ้มสำหรับเด็กโต 🤸‍♂️
            </div>

            <div>
              <div className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">
                PROMOTION 2 (อายุ 3.5 - 10 ปี)
              </div>
              <h3 className="text-2xl font-black text-[#183363] mb-3">
                Mega Orca Class (24 + 4 แถมฟรี)
              </h3>

              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 mb-6">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-amber-800">฿14,400</span>
                  <span className="text-xs font-bold text-slate-400 line-through">฿17,600</span>
                  <span className="text-xs font-black text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-400 ml-auto">
                    🎁 แถมฟรี 4 ครั้ง (มูลค่า 3,200฿)
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-bold mt-2">
                  ซื้อ 24 ครั้ง รับเพิ่มฟรีทันที 4 ครั้ง (รวมเป็น 28 ครั้ง)
                </p>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm font-bold text-slate-700 mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>ฝึกทักษะยิมนาสติกขั้นสูง ตีลังกา กายกรรม</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>เสริมสร้างกล้ามเนื้อและสมรรถภาพระดับนักกีฬา</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>แถมชั่วโมงเรียนฟรีคุ้มที่สุดประจำปี</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPromoClick('Mega Orca Class (24 + 4 แถมฟรี)')}
              className="w-full py-3.5 bg-amber-600 text-white rounded-2xl font-black text-sm hover:bg-amber-700 shadow-md transition-all flex items-center justify-center space-x-2 group-hover:scale-[1.02]"
            >
              <span>ลงทะเบียนรับสิทธิ์โปรนี้</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* LEAD CONTACT FORM SECTION */}
      <section id="contact-form-section" className="w-full bg-white py-12 px-4 border-t border-slate-200">
        <div className="max-w-2xl mx-auto bg-slate-50 p-6 sm:p-10 rounded-3xl border-2 border-slate-200 shadow-lg">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-[#183363] flex items-center justify-center gap-2">
              <Phone className="text-sky-600" size={28} />
              <span>กรอกข้อมูลเพื่อให้เจ้าหน้าที่ติดต่อกลับ</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              สนใจรับโปรโมชั่นทดลองเรียนฟรี หรือสอบถามคลาสเรียน กรอกข้อมูลด้านล่างได้เลยค่ะ
            </p>
          </div>

          {successMsg ? (
            <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-3 animate-fade-in">
              <CheckCircle2 size={48} className="text-emerald-600 mx-auto" />
              <h3 className="text-xl font-black text-emerald-900">ส่งข้อมูลเรียบร้อยแล้วค่ะ!</h3>
              <p className="text-xs sm:text-sm font-bold text-emerald-800">
                ขอบพระคุณที่สนใจออก้ายิม เจ้าหน้าที่ของเราจะติดต่อกลับทางเบอร์โทรศัพท์ที่แจ้งไว้โดยเร็วที่สุดค่ะ
              </p>
              <button
                onClick={() => setSuccessMsg(false)}
                className="mt-4 px-6 py-2 bg-emerald-600 text-white font-black text-xs rounded-xl hover:bg-emerald-700 shadow-xs"
              >
                กรอกข้อมูลอีกครั้ง
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm font-semibold">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold text-center">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">โปรโมชั่นที่สนใจ (Selected Promotion)</label>
                <select
                  value={selectedPromo}
                  onChange={(e) => setSelectedPromo(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-[#183363] focus:ring-2 focus:ring-[#183363] outline-none"
                >
                  <option value="Orca Cubs Promo (10 + 2 แถมฟรี)">Orca Cubs Promo (10 + 2 แถมฟรี)</option>
                  <option value="Mega Orca Class (24 + 4 แถมฟรี)">Mega Orca Class (24 + 4 แถมฟรี)</option>
                  <option value="สอบถามข้อมูลทดลองเรียนฟรีทั่วไป">สอบถามข้อมูลทดลองเรียนฟรีทั่วไป</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ชื่อ-นามสกุล ผู้ปกครอง *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณสมชาย ใจดี"
                    value={form.parent_name}
                    onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#183363] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 0812345678"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#183363] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อเล่นและอายุของน้อง</label>
                <input
                  type="text"
                  placeholder="เช่น น้องข้าว อายุ 3 ขวบ"
                  value={form.child_info}
                  onChange={(e) => setForm({ ...form, child_info: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#183363] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ข้อความเพิ่มเติม / สอบถาม (ถ้ามี)</label>
                <textarea
                  rows={3}
                  placeholder="เช่น สะดวกเรียนวันเสาร์-อาทิตย์ หรือต้องการสอบถามเพิ่มเติม"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#183363] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#183363] text-white rounded-2xl font-black text-base hover:bg-blue-900 shadow-md transition-all disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
              >
                <span>{loading ? 'กำลังส่งข้อมูล...' : '🚀 ส่งข้อมูลให้เจ้าหน้าที่ติดต่อกลับ'}</span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-[#183363] text-white py-6 px-4 text-center text-xs font-semibold space-y-2">
        <p>© 2026 ORCA GYMNASTICS CO., LTD. All Rights Reserved.</p>
        <p className="text-slate-300">บริษัท ออก้ายิม จำกัด | สถาบันสอนยิมนาสติกเด็ก กายกรรม และพัฒนาการเคลื่อนไหว</p>
      </footer>
    </div>
  );
}
