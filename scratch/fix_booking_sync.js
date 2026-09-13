const fs = require('fs');
let code = fs.readFileSync('lib/supabase.ts', 'utf8');

const oldSaveBooking = `async saveBooking(booking: Booking): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('bookings').insert([booking]);
    }
    const bks = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []);`;

const newSaveBooking = `async saveBooking(booking: Booking): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const dbBooking = {
        id: booking.id,
        child_id: booking.child_id,
        booking_date: booking.booking_date,
        time_slot: booking.time_slot,
        status: booking.status,
        created_at: booking.created_at || new Date().toISOString()
      };
      supabase.from('bookings').upsert([dbBooking]).catch(e => console.log('saveBooking Error', e));
    }
    const bks = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []);`;

code = code.replace(oldSaveBooking, newSaveBooking);

const oldGetBookings = `const { data } = await q;
      if (data) sb = data;
    }
    const lb = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []);`;

const newGetBookings = `const { data } = await q;
      if (data) {
        const children = await this.getChildren();
        const childrenMap = new Map(children.map(c => [c.id, c]));
        sb = data.map(b => {
          const c = childrenMap.get(b.child_id);
          return {
            ...b,
            child_nickname: c?.nickname,
            child_full_name: c?.full_name,
            course_name: c?.course_name || 'Orca Cubs',
            booked_by_role: 'parent'
          };
        });
      }
    }
    const lb = getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []);`;

code = code.replace(oldGetBookings, newGetBookings);

fs.writeFileSync('lib/supabase.ts', code, 'utf8');
console.log('Fixed lib/supabase.ts booking sync');
