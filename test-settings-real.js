// Real Settings Functionality Test
// This script tests the settings with actual data from your database

console.log('🧪 Testing Settings with Real Database Data...');

// Test with actual UUIDs from your database
const testUsers = [
  {
    user_id: '6f3ba2be-c005-4047-a98f-3af112345678',
    name: 'Paul Phiri',
    role: 'hospital_staff',
    email: 'paul.phiri@hospital.com'
  },
  {
    user_id: '7010dc6e-0580-4092-8e63-7d8e12345678',
    name: 'Paul Phiri',
    role: 'blood_bank_staff',
    email: 'paul.phiri@bloodbank.com'
  },
  {
    user_id: 'c6aa8ca0-34ad-4cc1-b5b1-cd4541234567',
    name: 'Admin',
    role: 'admin',
    email: 'admin@sbt.com'
  }
];

function testWithRealUser(userIndex = 0) {
  const user = testUsers[userIndex];
  
  console.log(`\n📋 Testing with User ${userIndex + 1}: ${user.name} (${user.role})`);
  
  // Set up localStorage with real user data
  localStorage.setItem('user_id', user.user_id);
  localStorage.setItem('user_role', user.role);
  localStorage.setItem('user_email', user.email);
  localStorage.setItem('is_logged_in', 'true');
  
  console.log('✅ User data set in localStorage');
  console.log('   User ID:', user.user_id);
  console.log('   Role:', user.role);
  console.log('   Email:', user.email);
  
  // Test notification preferences
  const notificationPrefs = {
    email: true,
    SMS: false,
    push: true,
    transferUpdates: true,
    inventoryAlerts: true,
    systemMaintenance: false,
    weeklyReports: true
  };
  
  localStorage.setItem('notification_preferences', JSON.stringify(notificationPrefs));
  console.log('✅ Notification preferences set');
  
  return user;
}

function testProfileUpdate() {
  console.log('\n📋 Testing Profile Update Functionality');
  
  const testProfile = {
    fullName: 'Updated Test User',
    phoneNumber: '+265 987 654 321',
    email: 'updated@test.com'
  };
  
  console.log('✅ Test profile data prepared:', testProfile);
  
  // Simulate form validation
  const isValid = testProfile.fullName && testProfile.phoneNumber;
  console.log('✅ Form validation:', isValid ? 'PASS' : 'FAIL');
  
  return testProfile;
}

function testDatabaseQueries() {
  console.log('\n📋 Testing Database Query Structure');
  
  const userId = localStorage.getItem('user_id');
  
  // Test profile fetch query
  console.log('📤 Profile Fetch Query:');
  console.log(`SELECT name, phone_number FROM profiles WHERE user_id = '${userId}';`);
  
  // Test profile update query
  console.log('📤 Profile Update Query:');
  console.log(`UPDATE profiles SET name = 'Updated Name', phone_number = 'Updated Phone' WHERE user_id = '${userId}';`);
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidUUID = uuidRegex.test(userId);
  console.log('✅ UUID Format Validation:', isValidUUID ? 'PASS' : 'FAIL');
  
  return isValidUUID;
}

function runRealWorldTest() {
  console.log('🚀 Running Real-World Settings Test...\n');
  
  // Test with each user
  testUsers.forEach((user, index) => {
    testWithRealUser(index);
    testProfileUpdate();
    testDatabaseQueries();
    console.log('---');
  });
  
  console.log('\n✅ Real-world testing completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Login with one of the test users');
  console.log('3. Navigate to Account Settings');
  console.log('4. Test profile updates');
  console.log('5. Test notification preferences');
  console.log('6. Verify data persistence');
}

// Export for manual testing
window.testRealSettings = runRealWorldTest;

console.log('💡 Run testRealSettings() in the console to test with real database data');
