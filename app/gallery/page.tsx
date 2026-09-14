'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/supabase';

export default function GalleryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = store.getCurrentUser();
    if (!user) {
      router.push('/');
    } else {
      setLoading(false);
    }
  }, [router]);

  

  const images = [
    { id: 1, src: '/images/gallery/1.jpg', alt: 'Orca Gymnastics Exterior' },
    { id: 2, src: '/images/gallery/2.jpg', alt: 'Orca Gymnastics Interior Floor' },
    { id: 3, src: '/images/gallery/3.jpg', alt: 'Orca Gymnastics Trampoline' },
    { id: 4, src: '/images/gallery/4.jpg', alt: 'Orca Gymnastics Floor Setup' },
    { id: 5, src: '/images/gallery/5.jpg', alt: 'Orca Gymnastics Beam' },
  ];

  return (
    <div className="max-w-6xl mx-auto font-['Anuphan',sans-serif] pb-24 px-4 sm:px-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-[#001a3a] mb-3 flex items-center justify-center gap-3">
          <span>📸</span> แกลลอรี่ (Gallery)
        </h1>
        <p className="text-slate-600 text-lg font-medium">ภาพบรรยากาศสถานที่และอุปกรณ์ของเรา Orca Gymnastics</p>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {images.map((img, index) => (
          <div 
            key={img.id} 
            className="break-inside-avoid overflow-hidden rounded-3xl shadow-md border border-slate-200 bg-white group hover:shadow-xl transition-all duration-300"
          >
            <div className="relative overflow-hidden cursor-pointer" onClick={() => window.open(img.src, '_blank')}>
              <img 
                src={img.src} 
                alt={img.alt}
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-[#001a3a] font-bold py-2 px-4 rounded-full text-sm shadow-lg backdrop-blur-sm">
                  🔍 ขยายภาพ
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <div className="inline-block bg-sky-50 text-sky-800 font-medium px-6 py-3 rounded-full text-sm border border-sky-100 shadow-sm">
          ยินดีต้อนรับน้องๆ ทุกคนมาร่วมสนุกและฝึกฝนทักษะไปด้วยกัน 🐋💙
        </div>
      </div>
    </div>
  );
}
