import { createClient } from '@supabase/supabase-js';

const url = 'https://vplgtcguxujxwrgguxqq.supabase.co';
const key = 'sb_publishable_FA0BseFSS6zM7Y8K3w8zLQ_d8BXqEuV'; // the publishable key
const supabase = createClient(url, key);

async function testProfile() {
  const safeData = {
    user_id: '00000000-0000-0000-0000-000000000000',
    name: 'test',
    age: 28,
    gender: 'male',
    bio: 'test',
    interests: [],
    preferred_activities: [],
    profile_images: [],
    video_url: null,
    nationality: 'mx',
    languages: [],
    relationship_status: 'single',
    has_children: false,
    smoking_habit: 'no',
    drinking_habit: 'no',
    cleanliness_level: 'high',
    noise_tolerance: 'low',
    work_schedule: 'day',
    country: 'Mexico',
    city: 'Cancun',
    neighborhood: 'Centro',
    latitude: 21,
    longitude: -86,
    intentions: [],
    occupation: 'dev',
    years_in_city: 1,
  };

  const { data, error } = await supabase.from('client_profiles').insert(safeData).select().single();
  console.log('Result Data:', data);
  console.log('Result Error:', JSON.stringify(error, null, 2));
}

testProfile();
