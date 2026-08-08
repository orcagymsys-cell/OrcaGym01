import { getClasses, deleteClass } from '@/app/actions/admin-classes';
import Link from 'next/link';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { redirect } from 'next/navigation';
import PreviewCourseModal from '@/components/PreviewCourseModal';

export const runtime = 'edge';

export default async function AdminClassesPage() {
  const res = await getClasses();
  if (res.error) redirect('/admin/login');

  const classes = res.classes || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#183363]">Manage Courses</h1>
        <Link 
          href="/admin/classes/new" 
          className="flex items-center space-x-2 bg-[#183363] text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
        >
          <Plus size={20} />
          <span>Add Course</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.map((cls) => (
              <tr key={cls.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cls.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls.title || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls.capacity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls.theme === 'pink' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}`}>
                    {cls.theme || 'blue'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-4">
                    <PreviewCourseModal course={cls} />
                    <Link href={`/admin/classes/${cls.id}`} className="text-indigo-600 hover:text-indigo-900" title="Edit">
                      <Pencil size={18} />
                    </Link>
                    {/* In a real app we'd use a form action for delete to prevent CSRF, but a Link works for mock */}
                    <form action={async () => {
                      'use server';
                      await deleteClass(cls.id);
                    }}>
                      <button type="submit" className="text-red-600 hover:text-red-900" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No courses found. Create one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
