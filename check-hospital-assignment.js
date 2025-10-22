// Run this in your browser console to check your hospital assignment
// and optionally create test blood requests for your hospital

console.log('🏥 Checking Hospital Assignment...');

async function checkUserHospitalAssignment() {
  const userId = localStorage.getItem('user_id');
  console.log('User ID:', userId);
  
  if (!userId) {
    console.log('❌ No user ID found');
    return;
  }
  
  try {
    // Check user profile and hospital assignment
    // Try to get supabase from the global scope or module
    const supabase = window.supabase || window.supabaseClient || (() => {
      console.log('⚠️  Could not find supabase client. Make sure you\'re on a page that has loaded supabase.');
      return null;
    })();
    
    if (!supabase) return;
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, name, role, hospital_id')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return;
    }
    
    console.log('✅ User Profile:', profile);
    
    if (!profile.hospital_id) {
      console.log('⚠️  No hospital_id assigned to user');
      return { profile, hospital: null, requests: [] };
    }
    
    // Check hospital details
    const { data: hospital, error: hospitalError } = await window.supabase
      .from('hospitals')
      .select('id, hospital_name')
      .eq('id', profile.hospital_id)
      .single();
    
    if (hospitalError) {
      console.error('❌ Hospital error:', hospitalError);
    } else {
      console.log('✅ Assigned Hospital:', hospital);
    }
    
    // Check existing blood requests for this hospital
    const { data: requests, error: requestsError } = await window.supabase
      .from('blood_request')
      .select('request_id, hospital_id, blood_type, quantity, status, created_at')
      .eq('hospital_id', profile.hospital_id);
    
    if (requestsError) {
      console.error('❌ Requests error:', requestsError);
    } else {
      console.log('✅ Existing requests for your hospital:', requests?.length || 0);
      if (requests && requests.length > 0) {
        console.log('Sample requests:', requests.slice(0, 3));
      }
    }
    
    return { profile, hospital, requests: requests || [] };
    
  } catch (e) {
    console.error('❌ Error:', e);
  }
}

async function createTestBloodRequests(hospitalId, hospitalName = 'Test Hospital') {
  if (!hospitalId) {
    console.log('❌ No hospital ID provided');
    return;
  }
  
  console.log(`🧪 Creating test blood requests for hospital: ${hospitalName}`);
  
  const testRequests = [
    { blood_type: 'A+', quantity: 2, status: 'Pending' },
    { blood_type: 'O-', quantity: 1, status: 'Approved' },
    { blood_type: 'B+', quantity: 3, status: 'Processing' },
    { blood_type: 'AB-', quantity: 1, status: 'Completed' },
    { blood_type: 'O+', quantity: 4, status: 'Pending' }
  ];
  
  try {
    const requestsToInsert = testRequests.map(req => ({
      hospital_id: hospitalId,
      blood_type: req.blood_type,
      quantity: req.quantity,
      status: req.status,
      created_at: new Date().toISOString(),
      request_id: crypto.randomUUID ? crypto.randomUUID() : 'test-' + Math.random().toString(36).substr(2, 9)
    }));
    
    const { data, error } = await window.supabase
      .from('blood_request')
      .insert(requestsToInsert)
      .select();
    
    if (error) {
      console.error('❌ Error creating test requests:', error);
      return false;
    }
    
    console.log('✅ Created test requests:', data?.length || 0);
    console.log('Test data:', data);
    return true;
    
  } catch (e) {
    console.error('❌ Error:', e);
    return false;
  }
}

async function runHospitalCheck() {
  console.log('🚀 Running Hospital Assignment Check...');
  
  const result = await checkUserHospitalAssignment();
  
  if (!result) {
    return;
  }
  
  const { profile, hospital, requests } = result;
  
  console.log('\n📊 Summary:');
  console.log('- User Role:', profile?.role);
  console.log('- Hospital Assigned:', hospital?.hospital_name || 'None');
  console.log('- Existing Requests:', requests?.length || 0);
  
  if (profile?.hospital_id && requests?.length === 0) {
    console.log('\n💡 Recommendation: Create test blood requests for your hospital');
    console.log('Run: createTestData() to create sample blood requests');
  }
}

// Make functions available globally
window.hospitalCheck = {
  checkUserHospitalAssignment,
  createTestBloodRequests,
  runHospitalCheck,
  createTestData: async () => {
    const result = await checkUserHospitalAssignment();
    if (result?.profile?.hospital_id) {
      return await createTestBloodRequests(
        result.profile.hospital_id, 
        result.hospital?.hospital_name || 'Your Hospital'
      );
    } else {
      console.log('❌ No hospital_id found for user');
      return false;
    }
  }
};

console.log('💡 Run hospitalCheck.runHospitalCheck() to diagnose the issue');
console.log('💡 Run hospitalCheck.createTestData() to create test blood requests');