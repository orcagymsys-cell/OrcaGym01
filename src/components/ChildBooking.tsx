'use client';

import { useState } from 'react';
import { Child, GymClass, Schedule, Booking } from '@/lib/types';
import { bookClass, cancelBooking } from '@/app/actions/booking';
import { useRouter } from 'next/navigation';

export default function ChildBooking({ 
  child, 
  schedules, 
  classes, 
  history 
}: { 
  child: Child; 
  schedules: Schedule[]; 
  classes: GymClass[];
  history: (Booking & { schedule: Schedule, gymClass: GymClass })[];
}) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Simple mock calendar logic for demonstration
  // In a real app, use a date-picker library like react-datepicker or react-day-picker

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select date and time');
      return;
    }
    
    setLoading(true);
    setError('');

    // find schedule that matches selected time
    const schedule = schedules.find(s => `${s.start_time}-${s.end_time}` === selectedTime);
    if (!schedule) {
      setError('Invalid schedule selected');
      setLoading(false);
      return;
    }

    const res = await bookClass(child.id, schedule.id, selectedDate);
    if (res.error) {
      setError(res.error);
    } else {
      router.refresh();
      setSelectedDate('');
      setSelectedTime('');
    }
    setLoading(false);
  };

  const handleCancel = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      const res = await cancelBooking(bookingId);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-100 mb-2 overflow-hidden">
           <span className="text-[#183363] font-bold text-3xl">{child.nickname[0]}</span>
        </div>
        <h2 className="text-[#183363] font-bold text-lg">{child.full_name}</h2>
        <p className="text-[#183363] font-medium">น้อง {child.nickname}</p>
        <p className="text-gray-500 text-sm">เกิด {child.dob}</p>
        <p className="text-gray-500 text-sm">{child.gender}</p>
      </div>

      {/* Course Status */}
      <div className="w-full border-t border-b py-3 mb-6 text-center">
        <p className="font-bold text-[#183363]">
          {child.total_classes} Classes | Used: {child.used_classes} | Remaining: {child.remaining_classes}
        </p>
        <p className="text-sm text-gray-500 font-medium">
          (Expires: {child.expiry_date || 'N/A'})
        </p>
        {child.remaining_classes <= 2 && child.remaining_classes > 0 && (
          <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
            ชั่วโมงใกล้หมด! (Low Hours Warning)
          </span>
        )}
      </div>

      <div className="flex w-full space-x-8">
        {/* Left Side: Booking & Calendar */}
        <div className="w-1/2">
          <h3 className="font-bold text-[#183363] border-b-2 border-[#183363] pb-1 mb-4 inline-block">Book a Class</h3>
          
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#183363]"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">ClassTime</label>
            <select 
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3 py-2 border border-yellow-400 rounded-md focus:outline-none bg-white font-medium"
            >
              <option value="">-- Select Time --</option>
              {['10:30-12:00', '12:00-13:30', '13:00-14:30', '14:30-16:00', '16:00-17:00', '17:30-19:30'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleBook}
            disabled={loading || child.remaining_classes <= 0 || child.status !== 'approved'}
            className="w-full py-2 bg-[#183363] text-white rounded-full font-bold hover:bg-[#112448] disabled:opacity-50"
          >
            {loading ? 'Booking...' : 'Book Class'}
          </button>
          
          <div className="mt-2 text-center text-xs text-gray-500">
            (การจองหรือยกเลิกต้องทำล่วงหน้า 1 วัน)
          </div>
        </div>

        {/* Right Side: History */}
        <div className="w-1/2">
          <h3 className="font-bold text-[#183363] mb-4 text-right">History</h3>
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="text-[#183363] border-b">
                <th className="pb-2">Date</th>
                <th className="pb-2">Time</th>
                <th className="pb-2">Class</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-gray-400">No booking history</td></tr>
              ) : (
                history.map(b => (
                  <tr key={b.id} className="border-b">
                    <td className="py-3 text-green-500 font-medium">{b.date}</td>
                    <td className="py-3 text-green-500 font-medium">{b.schedule.start_time}-{b.schedule.end_time}</td>
                    <td className="py-3 text-green-500 font-medium">{b.gymClass.name}</td>
                    <td className="py-3">
                      {b.status !== 'cancelled' && (
                        <button 
                          onClick={() => handleCancel(b.id)}
                          className="w-6 h-6 rounded-full bg-red-500 text-white font-bold flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                      {b.status === 'cancelled' && <span className="text-gray-400 text-xs">Cancelled</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
