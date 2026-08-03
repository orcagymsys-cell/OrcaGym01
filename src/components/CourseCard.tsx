import { GymClass } from '@/lib/types';
import Image from 'next/image';
import { Calendar, Clock, Sparkles, Award } from 'lucide-react';

export default function CourseCard({ course }: { course: GymClass }) {
  // Theme gradients & accent colors
  let cardBg = 'from-sky-100 via-blue-50 to-indigo-100 border-sky-200';
  let accentColor = '#183363';
  let headerBg = 'from-[#183363] to-[#2a4a8c]';

  switch (course.theme) {
    case 'pink':
      cardBg = 'from-pink-100 via-rose-50 to-purple-100 border-pink-200';
      accentColor = '#9f1239';
      headerBg = 'from-[#9f1239] to-[#be123c]';
      break;
    case 'orange':
      cardBg = 'from-amber-100 via-orange-50 to-yellow-100 border-orange-200';
      accentColor = '#c2410c';
      headerBg = 'from-[#c2410c] to-[#ea580c]';
      break;
    case 'green':
      cardBg = 'from-emerald-100 via-teal-50 to-green-100 border-emerald-200';
      accentColor = '#047857';
      headerBg = 'from-[#047857] to-[#059669]';
      break;
    case 'purple':
      cardBg = 'from-purple-100 via-fuchsia-50 to-indigo-100 border-purple-200';
      accentColor = '#6b21a8';
      headerBg = 'from-[#6b21a8] to-[#7e22ce]';
      break;
    case 'yellow':
      cardBg = 'from-yellow-100 via-amber-50 to-orange-100 border-yellow-200';
      accentColor = '#b45309';
      headerBg = 'from-[#b45309] to-[#d97706]';
      break;
  }

  return (
    <div 
      className={`w-full rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 bg-gradient-to-br ${cardBg} border-2 relative transition-all`}
      style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif" }}
    >
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-black/10 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-3xl md:text-5xl font-black text-[#183363] tracking-tight">
              {course.title || course.name}
            </h2>
            <Sparkles className="text-amber-500 animate-pulse hidden sm:inline-block" size={28} />
          </div>
          {course.subtitle && (
            <p className="text-rose-500 font-bold text-lg md:text-xl italic mt-0.5">
              ✨ {course.subtitle}
            </p>
          )}
        </div>

        {/* Badges (Age & Duration) */}
        <div className="flex flex-wrap items-center gap-3">
          {course.ageRange && (
            <div className="flex items-center space-x-1.5 bg-amber-400 text-amber-950 px-4 py-2 rounded-full font-black text-sm md:text-base shadow-sm border border-amber-300">
              <Award size={18} />
              <span>{course.ageRange}</span>
            </div>
          )}
          {course.durationText && (
            <div className="flex items-center space-x-1.5 bg-[#183363] text-white px-5 py-2 rounded-full font-bold text-sm md:text-base shadow-md">
              <Clock size={18} />
              <span>{course.durationText}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Description */}
        <div className="lg:col-span-4 flex flex-col h-full min-w-0">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-md border border-white flex-1 flex flex-col justify-between text-left min-w-0 overflow-hidden">
            <div className="text-left w-full min-w-0">
              <div className="flex items-center space-x-2 mb-3 text-left">
                <Sparkles size={20} className="text-[#183363] shrink-0" />
                <h3 className="text-[#183363] font-black text-base md:text-lg tracking-tight text-left">
                  รายละเอียดคลาสเรียน
                </h3>
              </div>
              
              <div className="space-y-3 my-2 text-left w-full min-w-0">
                {(course.description || '')
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line.length > 0)
                  .map((line, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-slate-700 font-semibold text-xs md:text-sm leading-relaxed text-left min-w-0">
                      <span className="text-rose-500 font-bold shrink-0 mt-0.5 text-xs">✦</span>
                      <span className="text-left flex-1 min-w-0 whitespace-normal break-words">{line}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between min-w-0">
              <span className="text-xs text-slate-500 font-bold tracking-wider">ORCA GYMNASTICS</span>
              <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
                <Image 
                  src="/images/logo.png" 
                  alt="ORCA" 
                  width={40}
                  height={40}
                  className="object-contain" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Course Fees Table */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className={`bg-gradient-to-r ${headerBg} text-white text-sm md:text-base font-bold`}>
                  <th className="py-3 px-3 w-1/4 border-r border-white/20">Times (จำนวนครั้ง)</th>
                  <th className="py-3 px-3 w-2/4 border-r border-white/20">Course Fees (ค่าเรียน)</th>
                  <th className="py-3 px-3 w-1/4">Duration (ระยะเวลา)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {course.pricing?.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-black text-slate-800 text-lg border-r border-slate-100">
                      {p.times}
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-[#183363] text-base md:text-lg relative border-r border-slate-100">
                      {p.fees}
                      {p.tag && (
                        <span className="ml-2 inline-block bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                          🔥 {p.tag}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-600 text-sm md:text-base">
                      {p.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="mt-8 pt-6 border-t border-black/10 flex flex-col lg:flex-row items-stretch lg:items-center gap-6">
        
        {/* Left: Schedule Badge Header & Transparent Logo */}
        <div className="lg:w-4/12 flex flex-row lg:flex-col items-center justify-between lg:justify-center p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="text-rose-500" size={24} />
            <h3 className="text-xl md:text-2xl font-black text-[#183363] tracking-wide">
              Class Schedule
            </h3>
          </div>
          
          <div className="w-16 h-16 md:w-20 md:h-20 relative mt-0 lg:mt-2">
            <Image 
              src="/images/logo.png" 
              alt="ORCA Logo" 
              fill 
              className="object-contain" 
            />
          </div>
        </div>

        {/* Right: Schedule Grid */}
        <div className="lg:w-8/12 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="flex flex-col divide-y-2 divide-slate-200">
            {course.scheduleGrid?.map((row, idx) => (
              <div key={row.id || idx}>
                <div className={`bg-gradient-to-r ${headerBg} text-white text-center py-2.5 px-4 font-bold text-sm md:text-base`}>
                  {row.label}
                </div>
                <div className="flex text-[#183363] font-bold text-center">
                  {row.slots.map((slot, sIdx) => (
                    <div 
                      key={sIdx} 
                      className="flex-1 py-3 px-1 flex flex-col justify-center items-center relative min-h-[58px] bg-white border-r border-slate-200 last:border-r-0 hover:bg-blue-50/40 transition-colors"
                    >
                      <span className="text-xs md:text-sm font-extrabold">{slot || '-'}</span>
                      {row.tag && (row.tagIndex === sIdx || row.tagIndex === sIdx + 1) && (
                        <span className="text-rose-500 font-black text-xs md:text-sm mt-0.5 tracking-tight">
                          {row.tag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

