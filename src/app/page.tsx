import LandingPageClient from '@/components/LandingPageClient';
import { getUser } from '@/app/actions/user';

export const runtime = 'edge';

export default async function RootPage() {
  const user = await getUser();
  return <LandingPageClient loggedInUser={user} />;
}
