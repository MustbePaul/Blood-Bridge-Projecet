# 🩸 Smart Blood Tracker - Blood Bank Management System

A comprehensive React-based blood bank management system with role-based access control, real-time inventory tracking, and donor management.

## ✨ **Features Implemented**

### ✅ **Core System**
- **Authentication & Authorization** - Secure login/registration with Supabase
- **Role-Based Access Control** - Admin, Hospital Staff, Blood Bank Staff
- **Collapsible Navigation** - Modern, mobile-responsive sidebar
- **Protected Routes** - Secure access to authenticated pages

### ✅ **User Management**
- **User Registration** - Role-based account creation
- **Profile Management** - User profile viewing and editing
- **Session Management** - Secure login/logout with localStorage

### ✅ **Navigation & UI**
- **Responsive Design** - Works on desktop and mobile
- **Modern UI Components** - Clean, professional interface
- **Smooth Animations** - CSS transitions and hover effects
- **Mobile-First Approach** - Touch-friendly interface

### ✅ **Pages & Functionality**
- **Splash Screen** - Welcome and role-based routing
- **Login/Register** - User authentication
- **Role-Based Dashboards** - Admin, Hospital, Blood Bank
- **Profile Page** - User information management with notification preferences
- **Analytics Dashboard** - Real-time statistics and insights
- **Donor Management** - Search, filter, and view donor information
- **Inventory Management** - Blood stock tracking with advanced search/filter
- **Transfer Requests** - Enhanced form with blood type, units, reason, facility
- **Settings & Notifications** - Comprehensive notification preferences
- **Offline Support** - Cached data for poor connectivity areas

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd react-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Update `src/utils/supabaseClient.ts` with your credentials

4. **Set up the database**
   - Run the SQL commands from `database-setup.sql` in your Supabase SQL Editor
   - This creates all necessary tables, policies, and sample data

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Register a new account or use existing credentials

## 🗄️ **Database Schema**

### **Core Tables**
- **`profiles`** - User profiles and roles
- **`inventory`** - Blood inventory with expiry tracking
- **`donors`** - Donor information and eligibility
- **`requests`** - Blood requests from hospitals
- **`transfers`** - Inter-facility blood transfers
- **`donations`** - Blood donation records
- **`notifications`** - System notifications
- **`facilities`** - Hospital and blood bank information

### **Security Features**
- **Row Level Security (RLS)** - Data access control
- **Role-based Policies** - Users can only access appropriate data
- **Authentication Required** - All operations require valid login

## 👥 **User Roles & Permissions**

### **Admin**
- Full system access
- User management
- Facility management
- System configuration

### **Hospital Staff**
- View inventory
- Submit blood requests
- Manage donor information
- View transfer status

### **Blood Bank Staff**
- Manage inventory
- Process donations
- Approve/reject requests
- Manage transfers

## 🎯 **Current Status**

### **✅ Completed**
- [x] User authentication system
- [x] Role-based navigation and access control
- [x] Complete page structure and routing
- [x] Database schema with RLS policies
- [x] Collapsible navigation with role-based menus
- [x] Analytics dashboard with real-time data
- [x] Donor management with search/filter
- [x] Inventory tracking with advanced search (blood type, patient name/ID, date)
- [x] Enhanced transfer request form (blood type, units, reason, facility)
- [x] Notification preferences in user profile
- [x] Offline caching for poor connectivity areas
- [x] Non-functional requirements documentation

### **🔄 In Progress**
- [ ] Blood request approval workflow
- [ ] Transfer status management
- [ ] Donation processing forms
- [ ] Real-time notification system

### **📋 Next Steps**
- [ ] Complete blood request approval workflow
- [ ] Implement transfer status updates
- [ ] Add donation processing forms
- [ ] Real-time push notifications
- [ ] Advanced reporting and analytics
- [ ] Audit logging and compliance
- [ ] Data export functionality
- [ ] Performance monitoring dashboard

## 🛠️ **Technical Stack**

- **Frontend**: React 18, TypeScript
- **Styling**: CSS3 with custom components
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Routing**: React Router DOM
- **State Management**: React Hooks
- **Database**: PostgreSQL with RLS
- **Authentication**: Supabase Auth
- **Offline Support**: Custom cache service with localStorage

## ⚡ **Non-Functional Requirements**

### **Performance Targets**
- **Response Time**: All operations complete within 3 seconds under normal load
- **Concurrent Users**: Supports multiple facilities accessing simultaneously
- **Bundle Size**: Optimized for fast loading in low-bandwidth areas
- **Caching**: 24-hour cache for critical data (inventory, donors, transfers)

### **Scalability**
- **Database**: PostgreSQL with Supabase scales to support all major hospitals in Malawi
- **Architecture**: Modular design allows easy addition of new facilities
- **Caching**: Intelligent cache management prevents memory overflow

### **Security & Compliance**
- **Data Encryption**: All data encrypted in transit (HTTPS) and at rest
- **Authentication**: Secure password hashing and role-based access control
- **GDPR Compliance**: User data protection and privacy controls
- **Access Control**: Row-level security policies in database

### **Availability & Reliability**
- **Uptime Target**: 99% system availability
- **Offline Support**: Cached data available when connectivity is poor
- **Error Handling**: Graceful degradation with user-friendly error messages
- **Data Integrity**: Transaction-based operations prevent data corruption

### **Usability**
- **User Experience**: Simple, intuitive interface for healthcare workers
- **Mobile Support**: Responsive design works on tablets and phones
- **Accessibility**: Clear navigation and readable fonts
- **Training**: Minimal training required due to intuitive design

### **Maintainability**
- **Code Quality**: Modular TypeScript components with clear documentation
- **Updates**: Easy deployment mechanism for both frontend and backend
- **Monitoring**: Built-in error logging and performance tracking
- **Documentation**: Comprehensive README and inline code comments

## 📱 **Responsive Design**

The application is fully responsive and works on:
- **Desktop** - Full sidebar navigation
- **Tablet** - Adaptive layout
- **Mobile** - Collapsible navigation with overlay

## 🔒 **Security Features**

- **Authentication Required** - All routes protected
- **Role-Based Access** - Users see only relevant data
- **Data Validation** - Input sanitization and validation
- **Secure Storage** - No sensitive data in localStorage
- **RLS Policies** - Database-level security

## 🧪 **Testing**

### **Manual Testing Checklist**
- [ ] User registration and login
- [ ] Role-based navigation
- [ ] Page navigation and routing
- [ ] Mobile responsiveness
- [ ] Data loading and error handling
- [ ] Search and filter functionality

### **Test Accounts**
Create test accounts with different roles to verify:
- Admin dashboard access
- Hospital staff permissions
- Blood bank staff capabilities

## 🚨 **Known Issues**

1. **Database Tables** - Need to run `database-setup.sql` first
2. **Sample Data** - Some pages may show empty states initially
3. **RLS Policies** - May need adjustment based on your specific requirements

## 📞 **Support & Contributing**

### **Getting Help**
- Check the database setup first
- Verify Supabase credentials
- Review browser console for errors

### **Contributing**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 **Acknowledgments**

- Built with React and Supabase
- Icons from emoji and Unicode
- Design inspired by modern web applications
- Security best practices from OWASP

---

**Happy coding! 🩸💻**
#   B l o o d - B r i d g e - P r o j e c e t  
 