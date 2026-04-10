
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(path.dirname(new URL(import.meta.url).pathname), '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
  
  if (error) {
    console.error('Connection failed:', error.message)
    process.exit(1)
  }
  
  console.log('Connection successful! Profiles count:', data)
  
  // Also check a more complex table like listings
  const { data: listings, error: listingsError } = await supabase.from('listings').select('id').limit(1)
  if (listingsError) {
    console.warn('Could not query listings (might be RLS):', listingsError.message)
  } else {
    console.log('Successfully queried listings table.')
  }
}

testConnection()
