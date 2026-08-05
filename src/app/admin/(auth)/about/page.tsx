import { getAboutUs } from '@/app/actions/admin';
import AdminAboutEditor from '@/components/AdminAboutEditor';

export const runtime = 'edge';

export default async function AdminAboutPage() {
  const aboutUsData = await getAboutUs();

  return (
    <div className="p-4 md:p-8">
      <AdminAboutEditor initialData={aboutUsData} />
    </div>
  );
}
