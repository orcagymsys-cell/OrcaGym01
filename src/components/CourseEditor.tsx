'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateClass, createClass } from '@/app/actions/admin-classes';
import { GymClass, GymClassPricing, GymClassScheduleRow } from '@/lib/types';
import { Trash2, Plus } from 'lucide-react';

export default function CourseEditor({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<Partial<GymClass>>(initialData || {
    name: '',
    title: '',
    subtitle: '',
    description: '',
    ageRange: '',
    durationText: '',
    theme: 'blue',
    capacity: 20,
    pricing: [],
    scheduleGrid: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let res;
    if (initialData?.id) {
      res = await updateClass(initialData.id, formData);
    } else {
      res = await createClass({ ...formData, id: `class_${Date.now()}` } as GymClass);
    }

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/admin/classes');
    }
  };

  const updateField = (field: keyof GymClass, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Pricing Helpers
  const addPricing = () => {
    setFormData(prev => ({
      ...prev,
      pricing: [...(prev.pricing || []), { id: `p_${Date.now()}`, times: '', fees: '', duration: '' }]
    }));
  };

  const updatePricing = (index: number, field: keyof GymClassPricing, value: string) => {
    setFormData(prev => {
      const newPricing = [...(prev.pricing || [])];
      newPricing[index] = { ...newPricing[index], [field]: value };
      return { ...prev, pricing: newPricing };
    });
  };

  const removePricing = (index: number) => {
    setFormData(prev => {
      const newPricing = [...(prev.pricing || [])];
      newPricing.splice(index, 1);
      return { ...prev, pricing: newPricing };
    });
  };

  // Schedule Helpers
  const addScheduleRow = () => {
    setFormData(prev => ({
      ...prev,
      scheduleGrid: [...(prev.scheduleGrid || []), { id: `s_${Date.now()}`, label: '', slots: [''] }]
    }));
  };

  const updateScheduleRow = (rIndex: number, field: keyof GymClassScheduleRow, value: any) => {
    setFormData(prev => {
      const newGrid = [...(prev.scheduleGrid || [])];
      newGrid[rIndex] = { ...newGrid[rIndex], [field]: value };
      return { ...prev, scheduleGrid: newGrid };
    });
  };

  const updateSlot = (rIndex: number, sIndex: number, value: string) => {
    setFormData(prev => {
      const newGrid = [...(prev.scheduleGrid || [])];
      const newSlots = [...newGrid[rIndex].slots];
      newSlots[sIndex] = value;
      newGrid[rIndex].slots = newSlots;
      return { ...prev, scheduleGrid: newGrid };
    });
  };

  const addSlot = (rIndex: number) => {
    setFormData(prev => {
      const newGrid = [...(prev.scheduleGrid || [])];
      newGrid[rIndex].slots.push('');
      return { ...prev, scheduleGrid: newGrid };
    });
  };

  const removeSlot = (rIndex: number, sIndex: number) => {
    setFormData(prev => {
      const newGrid = [...(prev.scheduleGrid || [])];
      newGrid[rIndex].slots.splice(sIndex, 1);
      return { ...prev, scheduleGrid: newGrid };
    });
  };

  const removeScheduleRow = (rIndex: number) => {
    setFormData(prev => {
      const newGrid = [...(prev.scheduleGrid || [])];
      newGrid.splice(rIndex, 1);
      return { ...prev, scheduleGrid: newGrid };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-xl shadow-sm">
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name</label>
          <input required type="text" value={formData.name || ''} onChange={e => updateField('name', e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Title (e.g. Orca Cubs)</label>
          <input type="text" value={formData.title || ''} onChange={e => updateField('title', e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (e.g. Class)</label>
          <input type="text" value={formData.subtitle || ''} onChange={e => updateField('subtitle', e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age Range (e.g. Age 4-10)</label>
          <input type="text" value={formData.ageRange || ''} onChange={e => updateField('ageRange', e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration Text (e.g. 1.5 hrs/time)</label>
          <input type="text" value={formData.durationText || ''} onChange={e => updateField('durationText', e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
          <select value={formData.theme || 'blue'} onChange={e => updateField('theme', e.target.value as any)} className="w-full p-2 border rounded">
            <option value="blue">Blue (Cubs)</option>
            <option value="pink">Pink/Purple (Mega)</option>
            <option value="orange">Orange/Peach</option>
            <option value="green">Mint/Green</option>
            <option value="purple">Deep Purple</option>
            <option value="yellow">Sunny Yellow</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Supports line breaks)</label>
          <textarea rows={4} value={formData.description || ''} onChange={e => updateField('description', e.target.value)} className="w-full p-2 border rounded"></textarea>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pricing Options</h3>
          <button type="button" onClick={addPricing} className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded flex items-center">
            <Plus size={16} className="mr-1" /> Add Row
          </button>
        </div>
        <div className="space-y-3">
          {formData.pricing?.map((p, i) => (
            <div key={i} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
              <input type="text" placeholder="Times (e.g. 1)" value={p.times} onChange={e => updatePricing(i, 'times', e.target.value)} className="w-1/4 p-2 border rounded text-sm" />
              <input type="text" placeholder="Fees (e.g. 700 THB)" value={p.fees} onChange={e => updatePricing(i, 'fees', e.target.value)} className="w-1/4 p-2 border rounded text-sm" />
              <input type="text" placeholder="Duration (e.g. 2 Months)" value={p.duration} onChange={e => updatePricing(i, 'duration', e.target.value)} className="w-1/4 p-2 border rounded text-sm" />
              <input type="text" placeholder="Tag (e.g. free 2)" value={p.tag || ''} onChange={e => updatePricing(i, 'tag', e.target.value)} className="w-1/4 p-2 border rounded text-sm" />
              <button type="button" onClick={() => removePricing(i)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
            </div>
          ))}
          {(!formData.pricing || formData.pricing.length === 0) && <p className="text-sm text-gray-500 italic">No pricing rows added.</p>}
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Schedule Grid Display</h3>
          <button type="button" onClick={addScheduleRow} className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded flex items-center">
            <Plus size={16} className="mr-1" /> Add Day Group
          </button>
        </div>
        <div className="space-y-6">
          {formData.scheduleGrid?.map((row, rIndex) => (
            <div key={rIndex} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <input type="text" placeholder="Day Label (e.g. Tuesday - Friday)" value={row.label} onChange={e => updateScheduleRow(rIndex, 'label', e.target.value)} className="w-1/2 p-2 border rounded font-semibold" />
                <button type="button" onClick={() => removeScheduleRow(rIndex)} className="text-red-500 hover:text-red-700 text-sm flex items-center"><Trash2 size={16} className="mr-1"/> Remove Group</button>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  {row.slots.map((slot, sIndex) => (
                    <div key={sIndex} className="flex items-center space-x-1 bg-white p-1 rounded border">
                      <input type="text" placeholder="Time (e.g. 10:30-12:00)" value={slot} onChange={e => updateSlot(rIndex, sIndex, e.target.value)} className="w-32 p-1 text-sm outline-none" />
                      <button type="button" onClick={() => removeSlot(rIndex, sIndex)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addSlot(rIndex)} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">+ Add Time</button>
                </div>
                
                <div className="flex space-x-4 mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Highlight Tag:</label>
                    <input type="text" placeholder="e.g. Tue-Wed" value={row.tag || ''} onChange={e => updateScheduleRow(rIndex, 'tag', e.target.value)} className="p-1 text-sm border rounded w-32" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">On Slot Index (0-based):</label>
                    <input type="number" min="0" value={row.tagIndex ?? ''} onChange={e => updateScheduleRow(rIndex, 'tagIndex', parseInt(e.target.value))} className="p-1 text-sm border rounded w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!formData.scheduleGrid || formData.scheduleGrid.length === 0) && <p className="text-sm text-gray-500 italic">No schedule rows added.</p>}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button 
          type="button" 
          onClick={() => router.push('/admin/classes')}
          className="mr-4 px-6 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="px-8 py-2 bg-[#183363] text-white rounded font-bold hover:bg-blue-900 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Course'}
        </button>
      </div>
    </form>
  );
}
