import { GymClass } from '@/lib/types';
import Image from 'next/image';

export default function CourseCard({ course }: { course: GymClass }) {
  let gradient = 'bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-200'; // default blue
  switch (course.theme) {
    case 'pink': gradient = 'bg-gradient-to-br from-pink-200 via-purple-100 to-blue-200'; break;
    case 'orange': gradient = 'bg-gradient-to-br from-orange-200 via-amber-100 to-red-100'; break;
    case 'green': gradient = 'bg-gradient-to-br from-green-200 via-emerald-100 to-teal-200'; break;
    case 'purple': gradient = 'bg-gradient-to-br from-purple-300 via-indigo-200 to-blue-200'; break;
    case 'yellow': gradient = 'bg-gradient-to-br from-yellow-200 via-orange-100 to-amber-200'; break;
  }

  return (
    <div className={`w-full rounded-xl overflow-hidden shadow-xl p-6 md:p-8 ${gradient} border border-white/50 relative`} style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif" }}>
      <div className="flex flex-col md:flex-row md:space-x-8">
        
        {/* Left Column: Title & Description */}
        <div className="w-full md:w-1/3 flex flex-col mb-6 md:mb-0">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1a2d5c] mb-1" style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.8)' }}>
            {course.title || course.name}
          </h2>
          <p className="text-red-500 font-bold text-xl italic mb-6 ml-2">{course.subtitle}</p>
          
          <div className="bg-white/80 p-4 rounded-lg shadow-sm border border-white/50 flex-1">
            <p className="text-[#1a2d5c] font-semibold text-[15px] leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
          </div>
        </div>

        {/* Right Column: Pricing Table & Age/Duration */}
        <div className="w-full md:w-2/3 flex flex-col">
          <div className="flex justify-end items-end space-x-6 mb-2">
            {course.ageRange && (
              <span className="text-[#1a2d5c] font-bold text-2xl md:text-3xl mb-1">{course.ageRange}</span>
            )}
            {course.durationText && (
              <div className="bg-[#1a2d5c] text-white px-6 py-2 rounded-t-lg rounded-bl-lg font-bold text-lg md:text-xl shadow-md">
                {course.durationText}
              </div>
            )}
          </div>

          <div className="w-full border-[3px] border-[#1a2d5c] rounded-lg overflow-hidden bg-white shadow-md">
            <table className="w-full text-center text-[#1a2d5c] font-bold border-collapse">
              <thead>
                <tr className="bg-[#1a2d5c] text-white text-lg">
                  <th className="py-3 px-2 w-1/4 font-bold border-b border-white border-r">Times</th>
                  <th className="py-3 px-2 w-2/4 font-bold border-b border-white border-r">Course Fees</th>
                  <th className="py-3 px-2 w-1/4 font-bold border-b border-white">Duration</th>
                </tr>
              </thead>
              <tbody>
                {course.pricing?.map((p, idx) => (
                  <tr key={p.id} className={idx !== (course.pricing?.length || 0) - 1 ? "border-b-[3px] border-[#1a2d5c]" : ""}>
                    <td className="py-4 px-2 text-xl border-r-[3px] border-[#1a2d5c]">{p.times}</td>
                    <td className="py-4 px-2 text-lg relative border-r-[3px] border-[#1a2d5c]">
                      {p.fees}
                      {p.tag && (
                        <span className="absolute -top-1 right-2 text-red-500 text-sm transform rotate-[-10deg] font-extrabold" style={{ fontFamily: 'sans-serif' }}>
                          {p.tag}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-2 text-lg">{p.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="mt-8 flex flex-col md:flex-row md:space-x-8 items-end">
        
        {/* Left: Class Schedule Title */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-end mb-4 md:mb-0">
          <h3 className="text-red-500 font-extrabold text-3xl underline underline-offset-4 decoration-2 mb-4">
            Class Schedule
          </h3>
          <div className="w-20 h-20 relative opacity-80">
            <Image src="/images/LOGOORCA01.png" alt="ORCA" fill className="object-contain grayscale" />
          </div>
        </div>

        {/* Right: Schedule Grid */}
        <div className="w-full md:w-2/3 border-[3px] border-[#1a2d5c] rounded-lg overflow-hidden bg-white shadow-md">
          <div className="flex flex-col">
            {course.scheduleGrid?.map((row, idx) => (
              <div key={row.id} className={idx !== (course.scheduleGrid?.length || 0) - 1 ? "border-b-[3px] border-[#1a2d5c]" : ""}>
                <div className="bg-[#2a4387] text-white text-center py-2 font-bold text-lg border-b-[3px] border-[#1a2d5c]">
                  {row.label}
                </div>
                <div className="flex text-[#1a2d5c] font-bold text-center">
                  {row.slots.map((slot, sIdx) => (
                    <div 
                      key={sIdx} 
                      className={`flex-1 py-3 px-1 flex flex-col justify-center items-center relative ${sIdx !== row.slots.length - 1 ? "border-r-[3px] border-[#1a2d5c]" : ""}`}
                    >
                      <span className="text-sm md:text-[15px]">{slot}</span>
                      {row.tag && row.tagIndex === sIdx && (
                        <span className="text-red-500 text-xs font-bold mt-1">
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
