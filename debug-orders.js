// Debug script for Order Tracking issues
// Run this in your browser console when on the Order Tracking page

console.log('🔍 Debugging Order Tracking Issues...');

// 1. Check localStorage authentication
function checkAuth() {
  console.log('\n📋 Authentication State:');
  console.log('user_id:', localStorage.getItem('user_id'));
  console.log('user_role:', localStorage.getItem('user_role'));
  console.log('user_email:', localStorage.getItem('user_email'));
  console.log('is_logged_in:', localStorage.getItem('is_logged_in'));
}

// 2. Check Supabase auth
async function checkSupabaseAuth() {
  console.log('\n📋 Supabase Auth State:');
  try {
    const { data: { user }, error } = await window.supabase.auth.getUser();
    if (error) {
      console.error('❌ Supabase auth error:', error);
      return null;
    }
    console.log('✅ Supabase user:', user);
    return user;
  } catch (e) {
    console.error('❌ Failed to check Supabase auth:', e);
    return null;
  }
}

// 3. Check profile and hospital assignment
async function checkProfile() {
  console.log('\n📋 User Profile Check:');
  const userId = localStorage.getItem('user_id');
  
  if (!userId) {
    console.log('❌ No user ID in localStorage');
    return;
  }
  
  try {
    const { data, error } = await window.supabase
      .from('profiles')
      .select('user_id, name, role, hospital_id, phone_number')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Profile query error:', error);
      return;
    }
    
    console.log('✅ Profile data:', data);
    return data;
  } catch (e) {
    console.error('❌ Failed to fetch profile:', e);
  }
}

// 4. Test blood_request queries without filtering
async function testUnfilteredQuery() {
  console.log('\n📋 Testing Unfiltered blood_request Query:');
  
  try {
    const { data, error } = await window.supabase
      .from('blood_request')
      .select('request_id, hospital_id, blood_type, quantity, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Unfiltered query error:', error);
      return;
    }
    
    console.log('✅ Unfiltered results count:', data?.length || 0);
    console.log('✅ Sample data:', data?.slice(0, 3));
    return data;
  } catch (e) {
    console.error('❌ Failed unfiltered query:', e);
  }
}

// 5. Test filtered query (like the component does)
async function testFilteredQuery(hospitalId) {
  console.log('\n📋 Testing Filtered blood_request Query:');
  
  if (!hospitalId) {
    console.log('⚠️  No hospital_id provided, skipping filtered query');
    return;
  }
  
  try {
    const { data, error } = await window.supabase
      .from('blood_request')
      .select('request_id, hospital_id, blood_type, quantity, status, created_at')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Filtered query error:', error);
      return;
    }
    
    console.log(`✅ Filtered results for hospital ${hospitalId}:`, data?.length || 0);
    console.log('✅ Sample filtered data:', data?.slice(0, 3));
    return data;
  } catch (e) {
    console.error('❌ Failed filtered query:', e);
  }
}

// 6. Test with JOIN to hospitals table
async function testJoinQuery(hospitalId = null) {
  console.log('\n📋 Testing JOIN Query (like component):');
  
  try {
    let query = window.supabase
      .from('blood_request')
      .select(`request_id, hospital_id, blood_type, quantity, status, created_at, hospitals ( hospital_name )`)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ JOIN query error:', error);
      return;
    }
    
    console.log('✅ JOIN query results:', data?.length || 0);
    console.log('✅ Sample JOIN data:', data?.slice(0, 3));
    return data;
  } catch (e) {
    console.error('❌ Failed JOIN query:', e);
  }
}

// 7. Check if hospitals table exists and has data
async function checkHospitalsTable() {
  console.log('\n📋 Checking hospitals table:');
  
  try {
    const { data, error } = await window.supabase
      .from('hospitals')
      .select('id, hospital_name')
      .limit(5);
    
    if (error) {
      console.error('❌ Hospitals table error:', error);
      return;
    }
    
    console.log('✅ Hospitals table data:', data);
    return data;
  } catch (e) {
    console.error('❌ Failed to check hospitals table:', e);
  }
}

// 8. Run all diagnostic tests
async function runFullDiagnostic() {
  console.log('🚀 Running Full Order Tracking Diagnostic...');
  
  checkAuth();
  
  const supabaseUser = await checkSupabaseAuth();
  const profile = await checkProfile();
  const hospitals = await checkHospitalsTable();
  const unfilteredData = await testUnfilteredQuery();
  
  if (profile?.hospital_id) {
    await testFilteredQuery(profile.hospital_id);
    await testJoinQuery(profile.hospital_id);
  } else {
    await testJoinQuery();
  }
  
  console.log('\n📊 Diagnostic Summary:');
  console.log('- Supabase Auth:', supabaseUser ? '✅' : '❌');
  console.log('- Profile Found:', profile ? '✅' : '❌');
  console.log('- Hospital ID:', profile?.hospital_id || '❌ Not set');
  console.log('- Hospitals Table:', hospitals ? '✅' : '❌');
  console.log('- Blood Requests:', unfilteredData?.length > 0 ? '✅' : '❌');
  
  console.log('\n💡 Recommendations:');
  
  if (!profile) {
    console.log('1. ❌ User profile not found - check if user exists in profiles table');
  }
  
  if (!profile?.hospital_id) {
    console.log('2. ⚠️  No hospital_id in profile - user may not be assigned to a hospital');
  }
  
  if (!unfilteredData || unfilteredData.length === 0) {
    console.log('3. ❌ No blood_request records found - check if table has data');
  }
  
  if (!hospitals || hospitals.length === 0) {
    console.log('4. ❌ No hospitals found - check if hospitals table has data');
  }
}

// Make functions available globally
window.debugOrders = {
  checkAuth,
  checkSupabaseAuth,
  checkProfile,
  testUnfilteredQuery,
  testFilteredQuery,
  testJoinQuery,
  checkHospitalsTable,
  runFullDiagnostic
};

console.log('💡 Run debugOrders.runFullDiagnostic() to check all issues');
console.log('💡 Or run individual functions like debugOrders.checkProfile()');