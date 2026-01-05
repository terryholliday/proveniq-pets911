import { createClientForAPI } from '@/lib/supabase/client';

// Test script to verify Supabase connection
async function testSupabaseConnection() {
  try {
    const supabase = createClientForAPI();
    
    // Test basic connection
    console.log('Testing Supabase connection...');
    
    // Try to query the sighting table
    const { data, error } = await supabase
      .from('sighting')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log('Sightings count:', data?.length || 0);
    return true;
  } catch (err) {
    console.error('❌ Error:', err);
    return false;
  }
}

// Run the test
testSupabaseConnection();
