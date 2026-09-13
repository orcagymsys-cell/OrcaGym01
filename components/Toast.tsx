'use client';
import { useState, useEffect } from 'react';

let toastSubscriber: ((msg: string) => void) | null = null;

export function showToast(message: string) {
  if (toastSubscriber) {
    toastSubscriber(message);
  }
}

export default function Toast() {
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    toastSubscriber = (msg: string) => {
      setMessage(msg);
      setTimeout(() => {
        setMessage(null);
      }, 3200);
    };
    return () => {
      toastSubscriber = null;
    };
  }, []);

  if (!mounted || !message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full text-base font-bold shadow-2xl z-50 animate-bounce font-sans text-center max-w-[90%]">
      {message}
    </div>
  );
}
