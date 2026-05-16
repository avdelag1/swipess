
import { supabase } from '../src/integrations/supabase/client';

async function testRoleAccess() {
  // This script is for manual verification of what we can see
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .limit(5);
  
  console.log('User Roles:', data);
  if (error) console.error('Error fetching user roles:', error);
}

// Note: This won't run directly here as it needs a valid session/environment
// But it's a good scratchpad.
