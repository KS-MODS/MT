import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Connecting to:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  try {
    const { data, error } = await supabase
      .from('featured_banner')
      .select('*')
      .limit(1);

    if (error) {
      console.log('Error code:', error.code);
      console.log('Error fetching from featured_banner table:', error.message);
    } else {
      console.log('Table featured_banner exists! Data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTable();
