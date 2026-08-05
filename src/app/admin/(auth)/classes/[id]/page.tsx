import { getClass } from '@/app/actions/admin-classes';
import CourseEditor from '@/components/CourseEditor';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function AdminClassEditPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isNew = params.id === 'new';
  
  let course = null;
  if (!isNew) {
    const res = await getClass(params.id);
    if (res.error) redirect('/admin/login');
    course = res.class;
    if (!course) redirect('/admin/classes');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#183363] mb-6">
        {isNew ? 'Create New Course' : `Edit Course: ${course?.title || course?.name}`}
      </h1>
      
      <CourseEditor initialData={course} />
    </div>
  );
}
