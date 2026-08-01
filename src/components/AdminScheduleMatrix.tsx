'use client';

import { useState } from 'react';
import { GymClass, Schedule, Booking, Child } from '@/lib/types';
import { Calendar as CalendarIcon, Users } from 'lucide-react';

export default function AdminScheduleMatrix({ 
  classes, 
  schedules, 
  bookings,
  childrenData
}: { 
  classes: GymClass[], 
  schedules: Schedule[], 
  bookings: Booking[],
  childrenData: Child[]
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCell, setSelectedCell] = useState<{ day: string, time: string, scheduleId: string | null } | null>(null);

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const timeslots = ['10:30-12:00', '12:00-13:30', '13:00-14:30', '14:30-16:00', '16:00-17:00', '17:30-19:30'];

  const getScheduleForCell = (day: string, time: string) => {
    const [start, end] = time.split('-');
    return schedules.find(s => s.day_of_week === day && s.start_time === start);
  };

  const getBookingsForSchedule = (scheduleId: string) => {
    return bookings.filter(b => b.schedule_id === scheduleId && b.date === selectedDate && b.status !== 'cancelled');
  };

  const selectedBookings = selectedCell?.scheduleId ? getBookingsForSchedule(selectedCell.scheduleId) : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#183363]">Schedule Matrix</h1>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="text-[#183363]" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-2 border-[#183363] rounded-lg px-4 py-2 text-[#183363] font-bold focus:outline-none"
          />
        </div>
      </div>

      <p className="text-gray-600 mb-4">โชว์ตารางเรียนวันนี้มีใครจองมาบ้าง (คลิกที่ช่องเพื่อดูรายชื่อ)</p>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto mb-8">
        <table className="w-full text-center border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#183363] text-white">
              <th className="p-3 border-r border-[#2a4a8c] w-24">Day / Time</th>
              {timeslots.map(time => (
                <th key={time} className="p-3 border-r border-[#2a4a8c] text-sm whitespace-nowrap">
                  {time.split('-')[0]}<br/>-<br/>{time.split('-')[1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, rowIndex) => (
              <tr key={day} className="border-b hover:bg-gray-50">
                <td className={`p-3 font-bold border-r border-gray-200 ${
                  rowIndex % 2 === 0 ? 'bg-yellow-100/50' : 'bg-blue-100/50'
                }`}>
                  {day}
                </td>
                {timeslots.map(time => {
                  const schedule = getScheduleForCell(day, time);
                  const gymClass = schedule ? classes.find(c => c.id === schedule.class_id) : null;
                  const dayBookings = schedule ? getBookingsForSchedule(schedule.id) : [];
                  const isFull = schedule && gymClass && dayBookings.length >= gymClass.capacity;
                  
                  return (
                    <td 
                      key={time} 
                      onClick={() => schedule && setSelectedCell({ day, time, scheduleId: schedule.id })}
                      className={`p-3 border-r border-gray-200 transition-colors ${
                        schedule ? 'cursor-pointer hover:bg-blue-50' : 'bg-gray-50'
                      } ${selectedCell?.day === day && selectedCell?.time === time ? 'ring-2 ring-inset ring-blue-500 bg-blue-50' : ''}`}
                    >
                      {schedule && gymClass ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-[#183363] mb-1">{gymClass.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                          }`}>
                            {dayBookings.length}/{gymClass.capacity}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Panel */}
      {selectedCell && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-[#183363] flex items-center space-x-2 mb-4">
            <Users />
            <span>Class Roster ({selectedCell.day} {selectedCell.time})</span>
          </h2>
          
          {selectedBookings.length === 0 ? (
            <p className="text-gray-500">No students booked for this class yet.</p>
          ) : (
            <ul className="space-y-3">
              {selectedBookings.map(b => {
                const child = childrenData.find(c => c.id === b.child_id);
                return (
                  <li key={b.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="font-bold text-gray-800">{child?.full_name}</span>
                      <span className="text-gray-500 text-sm ml-2">(น้อง {child?.nickname})</span>
                    </div>
                    {b.status === 'pending' && (
                       <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">Pending Approval</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
