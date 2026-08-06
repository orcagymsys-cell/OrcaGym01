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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between" id="home">
      {/* TOP CONTACT BAR */}
      <div className="w-full bg-[#183363] text-white text-xs font-bold py-2.5 px-4 border-b border-blue-900/40">
        <div className="max-w-6xl mx-auto flex items-center justify-center sm:justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8 text-xs sm:text-sm font-semibold">
            <span className="flex items-center space-x-2 text-sky-200">
              <Phone size={14} className="text-amber-400" />
              <span>TEL: <strong className="text-white font-bold">081-234-5678</strong></span>
            </span>
            <span className="flex items-center space-x-2 text-sky-200">
              <span className="text-amber-400">✉️</span>
              <span>Email: <strong className="text-white font-bold">orcagymsys@gmail.com</strong></span>
            </span>
            <span className="hidden sm:flex items-center space-x-2 text-emerald-300">
              <span className="text-emerald-400">💬</span>
              <span>LINE: <strong className="text-white font-bold">@orcagym</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* TOP HEADER BAR & NAVBAR */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          {/* Top-Left: Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img 
              src="/orca-logo.png" 
              alt="ORCA GYMNASTICS" 
              className="h-12 sm:h-16 object-contain transition-transform hover:scale-105"
            />
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs sm:text-sm font-extrabold text-[#183363]">
            <button 
              onClick={() => scrollToSection('home')} 
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              หน้าแรก
            </button>
            <button 
              onClick={() => scrollToSection('about-section')} 
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              เกี่ยวกับเรา
            </button>
            <button 
              onClick={() => scrollToSection('classes-section')} 
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              คลาสเรียน
            </button>
            <button 
              onClick={() => scrollToSection('enrollment-section')} 
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              การสมัครเรียน
            </button>
            <button 
              onClick={() => scrollToSection('gallery-section')} 
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              แกลลอรี่
            </button>
          </nav>

          {/* Top-Right: Direct Sign In Button (Parent Login) */}
          <Link
            href="/login"
            className="flex items-center space-x-2 bg-[#183363] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl font-black text-xs sm:text-sm hover:bg-blue-900 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer shrink-0"
          >
            <User size={16} />
            <span>เข้าสู่ระบบ (Sign in)</span>
          </Link>
        </div>

        {/* Mobile Navigation Links Bar */}
        <div className="lg:hidden bg-slate-100/90 border-t border-slate-200 py-2 px-3 overflow-x-auto flex space-x-4 text-xs font-black text-[#183363] no-scrollbar">
          <button onClick={() => scrollToSection('home')} className="shrink-0 px-2 py-1 hover:bg-white rounded-lg">หน้าแรก</button>
          <button onClick={() => scrollToSection('about-section')} className="shrink-0 px-2 py-1 hover:bg-white rounded-lg">เกี่ยวกับเรา</button>
          <button onClick={() => scrollToSection('classes-section')} className="shrink-0 px-2 py-1 hover:bg-white rounded-lg">คลาสเรียน</button>
          <button onClick={() => scrollToSection('enrollment-section')} className="shrink-0 px-2 py-1 hover:bg-white rounded-lg">การสมัครเรียน</button>
          <button onClick={() => scrollToSection('gallery-section')} className="shrink-0 px-2 py-1 hover:bg-white rounded-lg">แกลลอรี่</button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="classes-section" className="w-full bg-gradient-to-b from-sky-100/60 via-slate-50 to-slate-50 py-10 sm:py-16 px-4">
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
          {/* PROMOTION CARD 1: ORCA CUBS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-sky-400 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-sky-500 transition-all group">
            <div className="absolute top-0 right-0 bg-sky-500 text-white font-black text-xs px-4 py-1.5 rounded-bl-2xl shadow-xs">
              คลาสเด็กเล็กยอดนิยม 🏆
            </div>

            <div>
              <div className="flex items-center space-x-2 text-xs font-black text-sky-600 uppercase tracking-widest mb-1">
                <span>Age 4-10</span>
                <span>•</span>
                <span>⏱️ 1.5 hrs/time</span>
              </div>
              
              <h3 className="text-3xl font-black text-[#183363] mb-1">
                Orca Cubs <span className="text-rose-500 text-lg font-bold">Class</span>
              </h3>

              <p className="text-xs text-slate-600 font-semibold mb-5 leading-relaxed bg-sky-50/70 p-3 rounded-2xl border border-sky-100">
                เปิดประตูสู่การเรียนรู้กับคลาส ORCA Cubs (สำหรับน้องๆ อายุ 4-10 ปี) คลาสเรียนพื้นฐานเบื้องต้นสำหรับเด็กๆ เพื่อเสริมสร้างทักษะทางร่างกายและการเคลื่อนไหวอย่างถูกวิธี สนุกสนาน สมวัย ปูพื้นฐานแน่นมั่นใจ
              </p>

              {/* HIGHLIGHT PROMO BOX */}
              <div className="p-4 bg-gradient-to-r from-sky-50 to-amber-50 rounded-2xl border-2 border-amber-300 mb-5 relative">
                <div className="absolute -top-3 right-3 bg-rose-500 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-xs animate-pulse">
                  🔥 HOT PROMOTION: Free 2 Times
                </div>
                
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-[#183363]">฿14,400</span>
                  <span className="text-xs font-bold text-slate-400">/ 24 ครั้ง</span>
                  <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300 ml-auto">
                    🎁 แถมฟรี 2 ครั้ง (รวม 26 ครั้ง)
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 font-bold mt-1.5 flex items-center justify-between">
                  <span>เฉลี่ยเพียง 600.- / ครั้ง</span>
                  <span>อายุแพ็กเกจ 6 Months</span>
                </p>
              </div>

              {/* ALL PRICING TABLE MINI */}
              <div className="space-y-1.5 mb-6 text-xs font-bold text-slate-700">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">อัตราค่าเรียนทั้งหมด (Course Fees):</div>
                
                <div className="flex justify-between items-center py-1 px-3 bg-slate-50 rounded-lg">
                  <span>ทดลองเรียน 1 ครั้ง (Single Class)</span>
                  <span className="font-extrabold text-[#183363]">700 THB</span>
                </div>
                
                <div className="flex justify-between items-center py-1 px-3 bg-slate-50 rounded-lg">
                  <span>คลาส 6 ครั้ง (อายุ 2 เดือน)</span>
                  <span className="font-extrabold text-[#183363]">4,100 THB <span className="text-[10px] text-slate-500 font-normal">(683.-/ครั้ง)</span></span>
                </div>

                <div className="flex justify-between items-center py-1 px-3 bg-slate-50 rounded-lg">
                  <span>คลาส 12 ครั้ง (อายุ 4 เดือน)</span>
                  <span className="font-extrabold text-[#183363]">7,800 THB <span className="text-[10px] text-slate-500 font-normal">(650.-/ครั้ง)</span></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSelectPromoClick('Orca Cubs - 24 ครั้ง (แถมฟรี 2 ครั้ง 🔥) / 6 เดือน (14,400 THB)')}
              className="w-full py-3.5 bg-[#183363] text-white rounded-2xl font-black text-sm hover:bg-blue-900 shadow-md transition-all flex items-center justify-center space-x-2 group-hover:scale-[1.02]"
            >
              <span>สนใจลงทะเบียนจอง Orca Cubs</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* PROMOTION CARD 2: MEGA ORCA */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-purple-300 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-purple-400 transition-all group">
            <div className="absolute top-0 right-0 bg-purple-600 text-white font-black text-xs px-4 py-1.5 rounded-bl-2xl shadow-xs">
              สำหรับเด็กโต & นักกีฬา ⚡
            </div>

            <div>
              <div className="flex items-center space-x-2 text-xs font-black text-purple-700 uppercase tracking-widest mb-1">
                <span>Age 5-15</span>
                <span>•</span>
                <span>⏱️ 2 hrs/time</span>
              </div>
              
              <h3 className="text-3xl font-black text-[#183363] mb-1">
                Mega Orca <span className="text-rose-500 text-lg font-bold">Class</span>
              </h3>

              <p className="text-xs text-slate-600 font-semibold mb-5 leading-relaxed bg-purple-50/70 p-3 rounded-2xl border border-purple-100">
                ก้าวสู่ความท้าทายขั้นกว่ากับคลาส Mega Orca! (สำหรับนักกีฬา เลเวล 1 ขึ้นไป) คลาสยกระดับทักษะสำหรับนักกีฬารุ่นเยาว์ เน้นการฝึกซ้อมที่เข้มข้น พัฒนาเทคนิคขั้นสูง เสริมความแข็งแรงเพื่อการแข่งขัน
              </p>

              {/* HIGHLIGHT PROMO BOX */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-amber-50 rounded-2xl border-2 border-amber-300 mb-5 relative">
                <div className="absolute -top-3 right-3 bg-rose-500 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-xs animate-pulse">
                  🔥 HOT PROMOTION: Free 2 Times
                </div>
                
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-[#183363]">฿15,600</span>
                  <span className="text-xs font-bold text-slate-400">/ 24 ครั้ง</span>
                  <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300 ml-auto">
                    🎁 แถมฟรี 2 ครั้ง (รวม 26 ครั้ง)
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 font-bold mt-1.5 flex items-center justify-between">
                  <span>เฉลี่ยเพียง 650.- / ครั้ง</span>
                  <span>อายุแพ็กเกจ 6 Months</span>
                </p>
              </div>

              {/* ALL PRICING TABLE MINI */}
              <div className="space-y-1.5 mb-6 text-xs font-bold text-slate-700">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">อัตราค่าเรียนทั้งหมด (Course Fees):</div>
                
                <div className="flex justify-between items-center py-1 px-3 bg-slate-50 rounded-lg">
                  <span>ทดลองเรียน 1 ครั้ง (Single Class)</span>
                  <span className="font-extrabold text-[#183363]">800 THB</span>
                </div>
                
                <div className="flex justify-between items-center py-1 px-3 bg-slate-50 rounded-lg">
                  <span>คลาส 6 ครั้ง (อายุ 2 เดือน)</span>
                  <span className="font-extrabold text-[#183363]">4,300 THB <span className="text-[10px] text-slate-500 font-normal">(716.-/ครั้ง)</span></span>
                </div>

                <div className="flex justify-between items-center py-1 px-3 bg-slate-50 rounded-lg">
                  <span>คลาส 12 ครั้ง (อายุ 4 เดือน)</span>
                  <span className="font-extrabold text-[#183363]">8,400 THB <span className="text-[10px] text-slate-500 font-normal">(700.-/ครั้ง)</span></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSelectPromoClick('Mega Orca - 24 ครั้ง (แถมฟรี 2 ครั้ง 🔥) / 6 เดือน (15,600 THB)')}
              className="w-full py-3.5 bg-purple-700 text-white rounded-2xl font-black text-sm hover:bg-purple-800 shadow-md transition-all flex items-center justify-center space-x-2 group-hover:scale-[1.02]"
            >
              <span>สนใจลงทะเบียนจอง Mega Orca</span>
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
                  className="w-full p-3.5 bg-white border-2 border-slate-300 rounded-xl font-bold text-[#183363] focus:ring-2 focus:ring-[#183363] outline-none"
                >
                  <optgroup label="🏆 Orca Cubs Class (อายุ 4 - 10 ปี | 1.5 ชม./ครั้ง)">
                    <option value="Orca Cubs - 24 ครั้ง (แถมฟรี 2 ครั้ง 🔥) / 6 เดือน (14,400 THB)">Orca Cubs - 24 ครั้ง (แถมฟรี 2 ครั้ง 🔥) / 6 เดือน (14,400 THB)</option>
                    <option value="Orca Cubs - 12 ครั้ง / 4 เดือน (7,800 THB)">Orca Cubs - 12 ครั้ง / 4 เดือน (7,800 THB)</option>
                    <option value="Orca Cubs - 6 ครั้ง / 2 เดือน (4,100 THB)">Orca Cubs - 6 ครั้ง / 2 เดือน (4,100 THB)</option>
                    <option value="Orca Cubs - ทดลองเรียน 1 ครั้ง (700 THB)">Orca Cubs - ทดลองเรียน 1 ครั้ง (700 THB)</option>
                  </optgroup>

                  <optgroup label="⚡ Mega Orca Class (อายุ 5 - 15 ปี | 2 ชม./ครั้ง)">
                    <option value="Mega Orca - 24 ครั้ง (แถมฟรี 2 ครั้ง 🔥) / 6 เดือน (15,600 THB)">Mega Orca - 24 ครั้ง (แถมฟรี 2 ครั้ง 🔥) / 6 เดือน (15,600 THB)</option>
                    <option value="Mega Orca - 12 ครั้ง / 4 เดือน (8,400 THB)">Mega Orca - 12 ครั้ง / 4 เดือน (8,400 THB)</option>
                    <option value="Mega Orca - 6 ครั้ง / 2 เดือน (4,300 THB)">Mega Orca - 6 ครั้ง / 2 เดือน (4,300 THB)</option>
                    <option value="Mega Orca - ทดลองเรียน 1 ครั้ง (800 THB)">Mega Orca - ทดลองเรียน 1 ครั้ง (800 THB)</option>
                  </optgroup>

                  <optgroup label="💬 สอบถามทั่วไป">
                    <option value="สอบถามข้อมูลทดลองเรียนฟรีทั่วไป">สอบถามข้อมูลทดลองเรียนฟรีทั่วไป</option>
                  </optgroup>
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

      {/* ABOUT US SECTION */}
      <section id="about-section" className="w-full bg-slate-100/80 py-16 px-4 border-t border-slate-200">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <div className="inline-block bg-sky-100 text-sky-800 font-black text-xs px-3.5 py-1.5 rounded-full border border-sky-200">
              ℹ️ เกี่ยวกับเรา (ABOUT ORCA GYM)
            </div>
            <h2 className="text-3xl font-black text-[#183363]">
              บริษัท ออก้ายิม จำกัด (ORCA GYM CO., LTD.)
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
              สถาบันสอนและฝึกทักษะกีฬายิมนาสติก กายกรรม โยคะ การเต้นรำ ทุกรูปแบบ และเชียร์ลีดเดอร์ ให้แก่ เด็ก เยาวชน และบุคคลทั่วไป 
              เพื่อพัฒนาศักยภาพทางร่างกาย การทรงตัว ความคล่องตัว และเสริมสร้างสมาธิความมั่นใจในตนเอง ปูพื้นฐานแน่นด้วยทีมโค้ชระดับมืออาชีพ
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-white rounded-2xl border border-slate-200">
                <div className="text-xl font-black text-sky-600 mb-0.5">100% Safe</div>
                <div className="text-[11px] font-bold text-slate-600">อุปกรณ์ยิมมาตรฐานความปลอดภัยสูง</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200">
                <div className="text-xl font-black text-amber-600 mb-0.5">Pro Coaches</div>
                <div className="text-[11px] font-bold text-slate-600">ดูแลใกล้ชิด ใส่ใจเด็กทุกคน</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-md space-y-4 text-xs font-bold text-slate-700">
            <h3 className="text-base font-black text-[#183363] border-b pb-2">📍 ข้อมูลการติดต่อ (Contact Info)</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="text-base">🏢</span>
                <div>
                  <div className="font-extrabold text-slate-900">บริษัท ออก้ายิม จำกัด</div>
                  <div className="text-[11px] font-normal text-slate-500">เลขทะเบียนนิติบุคคล: 0105569135935</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-base">📞</span>
                <div>
                  <div className="text-slate-500">เบอร์โทรศัพท์ติดต่อ (TEL):</div>
                  <div className="font-extrabold text-sky-700 text-sm">081-234-5678</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-base">✉️</span>
                <div>
                  <div className="text-slate-500">อีเมล (Email):</div>
                  <div className="font-extrabold text-sky-700">orcagymsys@gmail.com</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-base">🏠</span>
                <div>
                  <div className="text-slate-500">ที่ตั้งสถาบัน:</div>
                  <div className="font-medium text-slate-700">289/240 ซอย ร่มเกล้า 6/1 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENROLLMENT STEPS SECTION */}
      <section id="enrollment-section" className="w-full bg-white py-16 px-4 border-t border-slate-200">
        <div className="max-w-5xl mx-auto text-center space-y-3 mb-10">
          <div className="inline-block bg-amber-100 text-amber-800 font-black text-xs px-3.5 py-1.5 rounded-full border border-amber-300">
            📝 ขั้นตอนการสมัครเรียน (HOW TO ENROLL)
          </div>
          <h2 className="text-3xl font-black text-[#183363]">
            สมัครเรียนง่ายๆ ใน 3 ขั้นตอน
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center space-y-3 relative">
            <div className="w-12 h-12 bg-sky-600 text-white font-black text-xl rounded-2xl flex items-center justify-center mx-auto shadow-md">1</div>
            <h3 className="font-black text-[#183363] text-base">เลือกคลาสเรียน & โปรโมชั่น</h3>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              เลือกคลาส Orca Cubs (อายุ 4-10 ปี) หรือ Mega Orca (อายุ 5-15 ปี) ตามช่วงอายุและแพ็กเกจที่ต้องการ
            </p>
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center space-y-3 relative">
            <div className="w-12 h-12 bg-amber-500 text-white font-black text-xl rounded-2xl flex items-center justify-center mx-auto shadow-md">2</div>
            <h3 className="font-black text-[#183363] text-base">กรอกข้อมูลติดต่อกลับ</h3>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              กรอกชื่อผู้ปกครอง เบอร์โทรศัพท์ และข้อมูลน้องในฟอร์มเพื่อให้เจ้าหน้าที่ประสานงานนัดหมาย
            </p>
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center space-y-3 relative">
            <div className="w-12 h-12 bg-emerald-600 text-white font-black text-xl rounded-2xl flex items-center justify-center mx-auto shadow-md">3</div>
            <h3 className="font-black text-[#183363] text-base">รับ Username & จองคลาสเรียน</h3>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              ชำระเงินและรับ Username/Password จากแอดมิน เพื่อเข้าสู่ระบบจองรอบเวลาเรียนด้วยตนเอง
            </p>
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section id="gallery-section" className="w-full bg-slate-50 py-16 px-4 border-t border-slate-200">
        <div className="max-w-5xl mx-auto text-center space-y-3 mb-10">
          <div className="inline-block bg-purple-100 text-purple-800 font-black text-xs px-3.5 py-1.5 rounded-full border border-purple-200">
            🖼️ แกลลอรี่ภาพบรรยากาศ (ORCA GALLERY)
          </div>
          <h2 className="text-3xl font-black text-[#183363]">
            ภาพบรรยากาศการเรียนและกิจกรรม ออก้ายิม
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            รวมภาพความสนุกสนานและพัฒนาการการฝึกซ้อมกีฬายิมนาสติกของน้องๆ
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md text-center space-y-2 group hover:scale-105 transition-transform overflow-hidden">
            <div className="h-48 relative rounded-xl overflow-hidden shadow-xs">
              <Image
                src="/images/gallery_balance.jpg"
                alt="การฝึกทรงตัวบนคานบาลานซ์"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="text-xs font-black text-[#183363] pt-1">การฝึกทรงตัวบนคานบาลานซ์</div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md text-center space-y-2 group hover:scale-105 transition-transform overflow-hidden">
            <div className="h-48 relative rounded-xl overflow-hidden shadow-xs">
              <Image
                src="/images/gallery_cartwheel.jpg"
                alt="การตีลังกาและกายกรรมเบื้องต้น"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="text-xs font-black text-[#183363] pt-1">การตีลังกาและกายกรรมเบื้องต้น</div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md text-center space-y-2 group hover:scale-105 transition-transform overflow-hidden">
            <div className="h-48 relative rounded-xl overflow-hidden shadow-xs">
              <Image
                src="/images/gallery_rhythmic.jpg"
                alt="โปรแกรมการยิมนาสติกลีลา"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="text-xs font-black text-[#183363] pt-1">โปรแกรมการยิมนาสติกลีลา</div>
          </div>
        </div>
      </section>

      {/* FLOATING LINE BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <button
          onClick={() => scrollToSection('contact-form-section')}
          className="flex items-center space-x-2 bg-[#06C755] text-white px-5 py-3.5 rounded-full font-black text-xs sm:text-sm shadow-2xl hover:bg-[#05b34c] transition-all border-2 border-white cursor-pointer"
        >
          <MessageCircle size={20} className="text-white fill-white" />
          <span>แอดไลน์พูดคุยกับแอดมิน</span>
        </button>
      </div>

      {/* FOOTER */}
      <footer className="w-full bg-[#183363] text-white py-8 px-4 text-center text-xs font-semibold space-y-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-blue-900 pb-6 text-slate-300">
          <div className="flex items-center space-x-2">
            <img src="/images/logo.png" alt="Logo" className="w-9 h-9 object-contain" />

            <span className="font-extrabold text-white text-sm">ORCA GYMNASTICS</span>
          </div>
          <div className="flex space-x-4 text-[11px]">
            <span>📞 TEL: 081-234-5678</span>
            <span>•</span>
            <span>✉️ Email: orcagymsys@gmail.com</span>
            <span>•</span>
            <span className="text-emerald-300 font-bold">💬 LINE: @orcagym</span>
          </div>
        </div>

        <p className="text-slate-400 pt-2">© 2026 ORCA GYMNASTICS CO., LTD. All Rights Reserved.</p>
        <p className="text-slate-300 font-normal">บริษัท ออก้ายิม จำกัด | สถาบันสอนยิมนาสติกเด็ก กายกรรม และพัฒนาการเคลื่อนไหว</p>
      </footer>
    </div>
  );
}
