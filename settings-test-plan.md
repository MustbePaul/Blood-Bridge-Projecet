# Settings Functionality Test Plan

## Test Environment
- **URL**: http://localhost:3000
- **Database**: Supabase (SBT Project)
- **Test Users**: Available in profiles table

## Test Cases

### 1. **Profile Information Management**

#### Test Case 1.1: View Profile Information
- **Steps**:
  1. Navigate to Account Settings
  2. Verify profile information is displayed
- **Expected Results**:
  - Full name field populated
  - Phone number field populated
  - Email field populated (read-only)
  - Role field populated (read-only)

#### Test Case 1.2: Update Profile Information
- **Steps**:
  1. Navigate to Account Settings
  2. Modify full name field
  3. Modify phone number field
  4. Click "Save Profile"
- **Expected Results**:
  - Success message displayed
  - Changes saved to database
  - Form fields updated with new values

#### Test Case 1.3: Profile Update Error Handling
- **Steps**:
  1. Navigate to Account Settings
  2. Clear required fields
  3. Click "Save Profile"
- **Expected Results**:
  - Error message displayed
  - Form validation prevents submission

### 2. **Notification Preferences**

#### Test Case 2.1: View Notification Settings
- **Steps**:
  1. Navigate to Account Settings
  2. Scroll to "Notification Preferences" section
- **Expected Results**:
  - Email notifications toggle visible
  - SMS notifications toggle visible
  - Push notifications toggle visible
  - Current preferences loaded from localStorage

#### Test Case 2.2: Update Notification Preferences
- **Steps**:
  1. Navigate to Account Settings
  2. Toggle email notifications off
  3. Toggle SMS notifications on
  4. Toggle push notifications off
  5. Click "Save Notification Preferences"
- **Expected Results**:
  - Success message displayed
  - Preferences saved to localStorage
  - Toggle states updated

#### Test Case 2.3: Notification Preferences Persistence
- **Steps**:
  1. Update notification preferences
  2. Navigate away from page
  3. Return to Account Settings
- **Expected Results**:
  - Previous settings are restored
  - Toggle states match saved preferences

### 3. **App Preferences**

#### Test Case 3.1: Language Selection
- **Steps**:
  1. Navigate to Account Settings
  2. Scroll to "App Preferences" section
  3. Change language dropdown
- **Expected Results**:
  - Language dropdown functional
  - Selection updates state

#### Test Case 3.2: Theme Selection
- **Steps**:
  1. Navigate to Account Settings
  2. Scroll to "App Preferences" section
  3. Change theme dropdown
- **Expected Results**:
  - Theme dropdown functional
  - Selection updates state

### 4. **Security Actions**

#### Test Case 4.1: Change Password
- **Steps**:
  1. Navigate to Account Settings
  2. Scroll to "Security" section
  3. Click "Change Password" button
- **Expected Results**:
  - Alert dialog displayed
  - Placeholder functionality shown

#### Test Case 4.2: Delete Account
- **Steps**:
  1. Navigate to Account Settings
  2. Scroll to "Security" section
  3. Click "Delete Account" button
- **Expected Results**:
  - Confirmation alert displayed
  - Placeholder functionality shown

### 5. **Error Handling**

#### Test Case 5.1: Database Connection Error
- **Steps**:
  1. Disconnect from internet
  2. Navigate to Account Settings
- **Expected Results**:
  - Error message displayed
  - Fallback values shown
  - Graceful degradation

#### Test Case 5.2: Invalid User ID
- **Steps**:
  1. Clear localStorage user_id
  2. Navigate to Account Settings
- **Expected Results**:
  - Error message displayed
  - Fallback values shown
  - User prompted to log in again

## Test Data

### Sample Profile Data
```json
{
  "fullName": "Test User",
  "phoneNumber": "+265 123 456 789",
  "email": "test@example.com",
  "role": "hospital_staff"
}
```

### Sample Notification Preferences
```json
{
  "email": true,
  "SMS": false,
  "push": true
}
```

## Expected Database Queries

### Profile Update Query
```sql
UPDATE profiles 
SET name = 'New Name', phone_number = 'New Phone'
WHERE user_id = 'user-uuid-here';
```

### Profile Fetch Query
```sql
SELECT name, phone_number 
FROM profiles 
WHERE user_id = 'user-uuid-here';
```

## Success Criteria

1. ✅ All form fields are functional
2. ✅ Data persists to database
3. ✅ Error handling works correctly
4. ✅ UI updates reflect changes
5. ✅ localStorage integration works
6. ✅ User feedback is clear and helpful

## Test Execution

Run these tests systematically to verify the complete settings functionality works as expected.
