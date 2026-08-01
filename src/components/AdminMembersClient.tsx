'use client';

import { useState } from 'react';
import { Child } from '@/lib/types';
import { approveChild, addCoursesToChild } from '@/app/actions/admin';
import { Check, Edit, PlusCircle, Trash2 } from 'lucide-react';

export default function AdminMembersClient({ initialChildren }: { initialChildren: Child[] }) {
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [addAmount, setAddAmount] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleApprove = async (childId: string) => {
    const res = await approveChild(childId);
    if (res.success) {
      setChildren(children.map(c => c.id === childId ? { ...c, status: 'approved' } : c));
    }
  };

  const handleAddCourses = async () => {
    if (!selectedChild) return;
    setLoading(true);
    const res = await addCoursesToChild(selectedChild.id, addAmount);
    if (res.success) {
      setChildren(children.map(c => 
        c.id === selectedChild.id 
          ? { ...c, total_classes: c.total_classes + addAmount, remaining_classes: c.remaining_classes + addAmount }
          : c
      ));
      setSelectedChild(null);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#183363]">Student Information</h1>
        <button className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600">
          <PlusCircle size={20} />
          <span>เพิ่มเด็กทดลองเรียน</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-50 text-[#183363]">
              <th className="p-4 font-bold border-b">Name</th>
              <th className="p-4 font-bold border-b">Nickname</th>
              <th className="p-4 font-bold border-b text-center">Remaining</th>
              <th className="p-4 font-bold border-b text-center">Status</th>
              <th className="p-4 font-bold border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {children.map(child => (
              <tr key={child.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{child.full_name}</td>
                <td className="p-4 text-gray-600">น้อง {child.nickname}</td>
                <td className="p-4 text-center">
                  <span className={`font-bold ${child.remaining_classes <= 2 ? 'text-red-500' : 'text-green-600'}`}>
                    {child.remaining_classes}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {child.status === 'pending' ? (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pending</span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Approved</span>
                  )}
                </td>
                <td className="p-4 flex justify-center space-x-3">
                  {child.status === 'pending' && (
                    <button 
                      onClick={() => handleApprove(child.id)}
                      className="text-green-600 hover:text-green-800 flex items-center space-x-1 border border-green-600 px-2 py-1 rounded"
                    >
                      <Check size={16} /> <span className="text-xs font-bold">Approve</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedChild(child)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit/Add Courses"
                  >
                    <Edit size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedChild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-[#183363] mb-4">Add Courses: {selectedChild.nickname}</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Classes to Add</label>
              <input 
                type="number" 
                value={addAmount}
                onChange={e => setAddAmount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183363]"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setSelectedChild(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCourses}
                disabled={loading}
                className="px-4 py-2 bg-[#183363] text-white rounded-lg font-bold hover:bg-[#112448] disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
