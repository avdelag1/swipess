import { createClient } from '@supabase/supabase-js';

const url = 'https://vplgtcguxujxwrgguxqq.supabase.co';
const key = 'sb_publishable_FA0BseFSS6zM7Y8K3w8zLQ_d8BXqEuV'; // the publishable key
const supabase = createClient(url, key);

async function testListing() {
  const safeData = {
    user_id: '00000000-0000-0000-0000-000000000000',
    owner_id: '00000000-0000-0000-0000-000000000000',
    category: 'property',
    listing_type: 'rent',
    mode: 'rent',
    status: 'active',
    is_active: true,
    title: 'Test',
    price: 100,
    currency: 'USD',
    description: 'Test',
    country: 'Mexico',
    state: 'Quintana Roo',
    city: 'Unknown',
    location: 'Unknown',
    images: [],
    amenities: [],
    services_included: [],
    skills: [],
    certifications: [],
    tools_equipment: [],
    days_available: [],
    time_slots_available: [],
    work_type: [],
    schedule_type: [],
    location_type: [],
  };

  const { data, error } = await supabase.from('listings').insert(safeData).select().single();
  console.log('Result Data:', data);
  console.log('Result Error:', JSON.stringify(error, null, 2));
}

testListing();
