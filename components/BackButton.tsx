'use client';
import { useRouter } from 'next/navigation';

export default function BackButton({ text = '◀ Back', href }: { text?: string; href?: string }) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-4 py-2 rounded-full transition-all shadow-sm active:scale-95 cursor-pointer"
    >
      {text}
    </button>
  );
}
