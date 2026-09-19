const fs = require('fs');

let code = fs.readFileSync('app/home/page.tsx', 'utf8');
code = code.replace(
  'import { store } from \'@/lib/supabase\';',
  'import { store, setupRealtimeSubscriptions } from \'@/lib/supabase\';'
);

const oldLoad = \        // Fetch fresh user data and children in parallel to save time
        const [allUsers, data, allBookingsSys] = await Promise.all([
          store.getUsers(),
          store.getChildren(currentUser.id),
          store.getBookings()
        ]);
        const freshUser = allUsers.find(u => u.phone === currentUser?.phone) || allUsers.find(u => u.id === currentUser?.id || u.user_id === currentUser?.user_id);
        if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
          currentUser = freshUser;
          store.setCurrentUser(freshUser);
        }

        if (currentUser.role === 'admin') {
          window.location.href = '/admin/dashboard';
          return;
        }
        setChildren(data || []);

        if (data && data.length > 0) {
          // allBookingsSys already fetched in parallel
          const myKidIds = data.map(k => k.id);
          const allB = allBookingsSys.filter(b => myKidIds.includes(b.child_id));
          setBookings(allB.filter(b => b.status !== 'Cancelled'));
        } else {
          setBookings([]);
        }\;

const newLoad = \        if (currentUser.role === 'admin') {
          window.location.href = '/admin/dashboard';
          return;
        }

        // --- SWR Pattern: Instant Cache Load ---
        const kidsCache = store.getChildrenSync().filter(k => k.parent_id === currentUser.id);
        setChildren(kidsCache);
        if (kidsCache.length > 0) {
          const myKidIdsCache = kidsCache.map(k => k.id);
          const allBCache = store.getBookingsSync().filter(b => myKidIdsCache.includes(b.child_id));
          setBookings(allBCache.filter(b => b.status !== 'Cancelled'));
        }
        setLoading(false);

        // --- SWR Pattern: Background Fetch ---
        const [allUsers, data, allBookingsSys] = await Promise.all([
          store.getUsers(),
          store.getChildren(currentUser.id),
          store.getBookings()
        ]);
        const freshUser = allUsers.find(u => u.phone === currentUser?.phone) || allUsers.find(u => u.id === currentUser?.id || u.user_id === currentUser?.user_id);
        if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
          currentUser = freshUser;
          store.setCurrentUser(freshUser);
        }

        setChildren(data || []);
        if (data && data.length > 0) {
          const myKidIds = data.map(k => k.id);
          const allB = allBookingsSys.filter(b => myKidIds.includes(b.child_id));
          setBookings(allB.filter(b => b.status !== 'Cancelled'));
        } else {
          setBookings([]);
        }\;

code = code.replace(oldLoad, newLoad);

const oldEffect = \    // Auto refresh child status in real-time every 2s or when store changes
    // removed polling
    const handleStoreChange = (e: any) => {
      if (e && e.detail && e.detail.key === 'orca_current_user') return;
      loadData();
    };
    window.addEventListener('storage', handleStoreChange);
    window.addEventListener('orca_store_updated', handleStoreChange);

    return () => {
      window.removeEventListener('storage', handleStoreChange);
      window.removeEventListener('orca_store_updated', handleStoreChange);
    };\;

const newEffect = \    // Setup Realtime
    const cleanupRealtime = setupRealtimeSubscriptions(() => {
      loadData();
    });

    return () => {
      if (cleanupRealtime) cleanupRealtime();
    };\;

code = code.replace(oldEffect, newEffect);

fs.writeFileSync('app/home/page.tsx', code, 'utf8');
console.log('Patched home page');
