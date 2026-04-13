# AutoWash Hub - Comprehensive Testing Plan & Task Descriptions

**Document Version:** 1.0  
**Project:** AutoWash Hub - Car Wash Management System  
**Date Created:** March 31, 2026  
**Scope:** Complete feature testing across all user roles  

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Testing Phases](#testing-phases)
3. [Phase 1: Core Functionality (Priority: CRITICAL)](#phase-1-core-functionality)
4. [Phase 2: Advanced Features (Priority: HIGH)](#phase-2-advanced-features)
5. [Phase 3: System & Polish (Priority: MEDIUM)](#phase-3-system--polish)
6. [Test Matrix by Role](#test-matrix-by-role)
7. [Detailed Test Cases](#detailed-test-cases)

---

## EXECUTIVE SUMMARY

This document provides a comprehensive testing framework for the AutoWash Hub system with **108 total test cases** organized across **3 testing phases**:

- **Phase 1 (CRITICAL):** 32 essential core functionality tests
- **Phase 2 (HIGH):** 54 advanced feature tests
- **Phase 3 (MEDIUM):** 22 system and polish tests

---

## TESTING PHASES

### Phase Structure

| Phase | Focus | Duration | Risk Level | Go/No-Go |
|-------|-------|----------|-----------|---------|
| **Phase 1** | Core Authentication & Booking | Week 1-2 | CRITICAL | Must Pass 100% |
| **Phase 2** | Admin & Employee Features | Week 2-3 | HIGH | Must Pass 95% |
| **Phase 3** | System Integration & UX | Week 4 | MEDIUM | Must Pass 90% |

---

## PHASE 1: CORE FUNCTIONALITY (CRITICAL)

**Target:** 100% Pass Rate Required  
**Duration:** 2 weeks  
**Resources:** Full QA team

### Phase 1A: Authentication System (8 tests)

#### 1.1 Customer Registration
```
ID: AUTH-C001
Title: Register as a new customer account
Role: Customer
Severity: CRITICAL
Steps:
  1. Navigate to landing page
  2. Click "Register" / "Sign Up" button
  3. Enter first name, last name, email, phone
  4. Enter password (min 8 chars, include uppercase, number, special char)
  5. Confirm password
  6. Click "Register" button

Expected Result:
  ✓ Account created in system
  ✓ Verification email sent to provided email
  ✓ User redirected to email verification page
  ✓ Database confirms new customer record exists

Test Data:
  Email: test.customer.001@test.com
  Phone: 09123456789
  Name: John Test
  Password: SecurePass123!

Success Criteria:
  - Customer record exists in database
  - is_verified status = 0 (pending verification)
  - Email verification link is valid
  - Email contains account activation link
```

#### 1.2 Customer Login (Valid Credentials)
```
ID: AUTH-C002
Title: Login as a customer with valid credentials
Role: Customer
Severity: CRITICAL
Steps:
  1. Navigate to customer login page
  2. Enter verified customer email
  3. Enter correct password
  4. Click "Login" button

Expected Result:
  ✓ Authentication successful
  ✓ User redirected to customer dashboard
  ✓ Session token created and stored
  ✓ User identity verified in navbar/header

Test Data:
  Email: verified.customer@test.com
  Password: SecurePass123!

Success Criteria:
  - Session established
  - User can access protected routes
  - Dashboard loads with customer data
```

#### 1.3 Customer Login (Invalid Credentials)
```
ID: AUTH-C003
Title: Login as a customer with invalid credentials
Role: Customer
Severity: CRITICAL
Steps:
  1. Navigate to customer login page
  2. Enter customer email
  3. Enter incorrect password
  4. Click "Login" button

Expected Result:
  ✓ Login fails
  ✓ Error message displayed: "Invalid email or password"
  ✓ No session token created
  ✓ User remains on login page

Test Data:
  Email: verified.customer@test.com
  Password: WrongPassword123!

Success Criteria:
  - No unauthorized access granted
  - Error message is user-friendly
  - No sensitive data leaked
```

#### 1.4 Customer Password Reset
```
ID: AUTH-C004
Title: Reset/recover customer password via email verification
Role: Customer
Severity: CRITICAL
Steps:
  1. Navigate to login page
  2. Click "Forgot Password?"
  3. Enter registered email address
  4. Click "Send Reset Link"
  5. Check email for reset link
  6. Click reset link in email
  7. Enter new password
  8. Confirm new password
  9. Click "Reset Password"

Expected Result:
  ✓ Reset email sent within 5 seconds
  ✓ Reset link valid for 24 hours
  ✓ Old password no longer works
  ✓ New password works on next login
  ✓ Confirmation message displayed

Test Data:
  Email: verified.customer@test.com
  New Password: NewSecurePass456!

Success Criteria:
  - Password successfully changed in database
  - Reset link expires after 24 hours
  - Old password rejected
  - No duplicate reset tokens
```

#### 1.5 Admin Registration
```
ID: AUTH-A001
Title: Register as a new admin account
Role: Admin (only by existing admin)
Severity: CRITICAL
Steps:
  1. Login as existing admin
  2. Navigate to User Management
  3. Click "Create Admin Account"
  4. Enter email, first name, last name
  5. System generates temporary password
  6. Click "Create"

Expected Result:
  ✓ Admin account created
  ✓ Temporary password sent to email
  ✓ Account set to require password change on first login
  ✓ Confirmation message displayed

Test Data:
  Email: new.admin@test.com
  Name: Admin Test

Success Criteria:
  - Admin account exists in database
  - Temporary password is secure
  - First login forces password change
```

#### 1.6 Admin Login
```
ID: AUTH-A002
Title: Login as an admin with valid credentials
Role: Admin
Severity: CRITICAL
Steps:
  1. Navigate to admin login page
  2. Enter admin email
  3. Enter correct password
  4. Click "Login"

Expected Result:
  ✓ Login successful
  ✓ Redirected to admin dashboard
  ✓ Full admin panel access visible
  ✓ Session token created

Test Data:
  Email: admin@test.com
  Password: AdminPass123!

Success Criteria:
  - Admin dashboard loads
  - All admin menus visible
  - Access to all admin functions
```

#### 1.7 Employee Login
```
ID: AUTH-E001
Title: Login as an employee with valid credentials
Role: Employee
Severity: CRITICAL
Steps:
  1. Navigate to employee login page
  2. Enter employee email
  3. Enter correct password
  4. Click "Login"

Expected Result:
  ✓ Login successful
  ✓ Redirected to employee dashboard
  ✓ Employee-specific functions visible
  ✓ Session token created

Test Data:
  Email: employee@test.com
  Password: EmployeePass123!

Success Criteria:
  - Employee dashboard loads
  - Employee menus visible
  - Access restricted to employee functions only
```

#### 1.8 Email Verification
```
ID: AUTH-001
Title: Validate email verification for new account signup
Role: Customer/Employee/Admin
Severity: CRITICAL
Steps:
  1. Register new account (any role)
  2. Check email for verification link
  3. Click verification link
  4. Account marked as verified
  5. Attempt login with verified account

Expected Result:
  ✓ Verification email received within 5 seconds
  ✓ Link is valid and clickable
  ✓ Account immediately verified after link click
  ✓ Verified account can login

Test Data:
  Multiple role email verification

Success Criteria:
  - Email delivery reliable (>95%)
  - Verification instant after link click
  - is_verified status = 1 in database
```

---

### Phase 1B: Basic Booking Flow (12 tests)

#### 2.1 View Landing Page
```
ID: BOOK-001
Title: View landing page and service offerings
Role: Customer (Unauthenticated)
Severity: CRITICAL
Steps:
  1. Navigate to http://localhost:4200/
  2. Wait for page to load
  3. Scroll through content

Expected Result:
  ✓ Landing page displays hero section
  ✓ Service offerings are visible
  ✓ Call-to-action buttons visible
  ✓ No console errors
  ✓ Backend connection indicators show

Test Data:
  N/A - Unauthenticated access

Success Criteria:
  - Page load time < 3 seconds
  - All images loaded
  - Responsive on mobile/tablet/desktop
  - CTA buttons are clickable
```

#### 2.2 View Services & Pricing
```
ID: BOOK-002
Title: View available services and pricing
Role: Customer
Severity: CRITICAL
Steps:
  1. Login as customer
  2. Navigate to Services/Pricing page
  3. View all available service packages
  4. View pricing for different vehicle types

Expected Result:
  ✓ All service packages displayed
  ✓ Prices shown for each vehicle type
  ✓ Service descriptions visible
  ✓ Pricing data matches database

Test Data:
  Service Packages:
    - Basic Wash ($15-25)
    - Wash + Vacuum ($25-35)
    - Premium Wash + Wax ($35-50)
  Vehicle Types:
    - Sedan
    - SUV
    - Truck
    - Van

Success Criteria:
  - All packages visible
  - Pricing calculations correct
  - Vehicle types properly filtered
```

#### 2.3 Search Available Slots
```
ID: BOOK-003
Title: Search for available appointment slots
Role: Customer
Severity: CRITICAL
Steps:
  1. Login as customer
  2. Click "Book Appointment"
  3. Select preferred date
  4. Select preferred time
  5. View available slots
  6. Select a slot

Expected Result:
  ✓ Calendar displays available dates
  ✓ Time slots shown for selected date
  ✓ Booked slots disabled/grayed out
  ✓ Current date/time blocked from past selection

Test Data:
  Current Date: March 31, 2026
  Search Date: April 5, 2026
  Search Time: 09:00 AM - 12:00 PM slots

Success Criteria:
  - Only available slots shown
  - Cannot select past times
  - Slot availability updated in real-time
  - Booking capacity respected
```

#### 2.4 Filter by Date & Time
```
ID: BOOK-004
Title: Filter appointments by date and time
Role: Customer
Severity: CRITICAL
Steps:
  1. Login as customer
  2. Click "Browse Appointments"
  3. Use filter: Date range
  4. Use filter: Time of day
  5. View filtered results

Expected Result:
  ✓ Filters applied correctly
  ✓ Only matching slots displayed
  ✓ Result count updated
  ✓ Filters can be cleared

Test Data:
  Date Range: April 1-15, 2026
  Time Range: 9 AM - 5 PM

Success Criteria:
  - Filtering is instant
  - Results are accurate
  - Multiple filters work together
```

#### 2.5 Select Service Package
```
ID: BOOK-005
Title: Select service package for appointment
Role: Customer
Severity: CRITICAL
Steps:
  1. Login as customer
  2. Start booking process
  3. Select a date/time slot
  4. Choose service package
  5. View pricing for selected package

Expected Result:
  ✓ All packages available for selection
  ✓ Pricing updates based on selection
  ✓ Service details displayed
  ✓ Selection visually highlighted

Test Data:
  Package: "Wash + Vacuum"
  Vehicle Type: Sedan
  Expected Price: $28

Success Criteria:
  - Pricing calculations correct
  - All options accessible
  - Clear selection indication
```

#### 2.6 Select Vehicle
```
ID: BOOK-006
Title: Book an appointment for a vehicle
Role: Customer
Severity: CRITICAL
Steps:
  1. Login as customer
  2. Start booking process
  3. Select or add vehicle
  4. If new vehicle: Enter make, model, year, color, plate
  5. Confirm vehicle selection

Expected Result:
  ✓ Existing vehicles listed
  ✓ Can add new vehicle
  ✓ Vehicle details validated
  ✓ Vehicle saved to customer profile

Test Data:
  Vehicle: Toyota Camry 2022, White, Plate: ABC123

Success Criteria:
  - Existing vehicles easily accessible
  - New vehicle form functional
  - Vehicle details required fields validated
```

#### 2.7 Complete Booking
```
ID: BOOK-007
Title: Confirm and complete appointment booking
Role: Customer
Severity: CRITICAL
Steps:
  1. Follow booking process through step 6
  2. Review booking summary:
     - Date, time, vehicle, service, price
  3. Agree to terms & conditions
  4. Click "Confirm Booking"

Expected Result:
  ✓ Booking saved to database
  ✓ Booking confirmation displayed
  ✓ Booking ID generated and shown
  ✓ Booking added to customer dashboard

Test Data:
  Summary:
    Date: April 5, 2026
    Time: 10:00 AM
    Service: Wash + Vacuum
    Vehicle: Toyota Camry
    Price: $28
    Status: Pending Payment

Success Criteria:
  - Booking record created
  - All details correct in database
  - Booking appears in dashboard immediately
```

#### 2.8 Payment Processing
```
ID: BOOK-008
Title: Make payment for appointment
Role: Customer
Severity: CRITICAL
Steps:
  1. Complete booking flow
  2. System displays payment options
  3. Select payment method
  4. Enter payment details
  5. Click "Pay Now"

Expected Result:
  ✓ Payment processed successfully
  ✓ Transaction recorded in system
  ✓ Booking status changes to "Confirmed"
  ✓ Payment receipt generated

Test Data:
  Amount: $28.00
  Payment Method: Credit Card (Test)
  Card: 4111111111111111
  Status: Success

Success Criteria:
  - Payment transaction recorded
  - Amount correct
  - Transaction ID generated
  - Booking status updated
```

#### 2.9 Booking Confirmation Email
```
ID: BOOK-009
Title: Receive booking confirmation via email
Role: Customer
Severity: CRITICAL
Steps:
  1. Complete booking and payment
  2. Wait 5 seconds
  3. Check email for confirmation

Expected Result:
  ✓ Confirmation email received within 10 seconds
  ✓ Email contains booking details
  ✓ Email includes booking ID
  ✓ Email contains payment receipt
  ✓ Customer can reply/get support info

Test Data:
  Email: test.customer@test.com
  Email Content Required:
    - Booking ID
    - Date & Time
    - Vehicle info
    - Service selected
    - Total price
    - Cancellation policy

Success Criteria:
  - Email delivery reliable
  - All required info present
  - Email template professional
  - Links work correctly
```

#### 2.10 View My Bookings
```
ID: BOOK-010
Title: View list of all my bookings/appointments
Role: Customer
Severity: CRITICAL
Steps:
  1. Login as customer
  2. Navigate to "My Appointments" or "My Bookings"
  3. View list of all bookings

Expected Result:
  ✓ All customer bookings displayed
  ✓ Bookings sorted by date (upcoming first)
  ✓ Booking status is clear (Pending, Confirmed, Completed, Cancelled)
  ✓ Pagination if >10 bookings

Test Data:
  Customer has 5 existing bookings

Success Criteria:
  - All bookings visible
  - Sorting works correctly
  - Status is current and accurate
```

#### 2.11 Cancel Appointment
```
ID: BOOK-011
Title: Cancel a scheduled appointment
Role: Customer
Severity: CRITICAL
Steps:
  1. Login as customer
  2. View "My Appointments"
  3. Click "Cancel" on an upcoming appointment
  4. Confirm cancellation
  5. Optionally provide reason

Expected Result:
  ✓ Booking status changes to "Cancelled"
  ✓ Cancellation notice on dashboard
  ✓ Refund processed (if applicable)
  ✓ Cancellation email sent
  ✓ Slot becomes available for rebooking

Test Data:
  Booking to Cancel: Appointment on April 10, 2026

Success Criteria:
  - Booking status updated
  - Cannot cancel within 24 hours (based on policy)
  - Refund initiated
  - Slot released for others
```

#### 2.12 Reschedule Appointment
```
ID: BOOK-012
Title: Reschedule an existing appointment
Role: Customer
Severity: CRITICAL
Steps:
  1. Login as customer
  2. Click "Reschedule" on booking
  3. Select new date/time
  4. Confirm reschedule
  5. Accept any rescheduling fees (if applicable)

Expected Result:
  ✓ New appointment created with new time
  ✓ Old booking marked as "Rescheduled"
  ✓ Slot released from old time
  ✓ Confirmation email sent with new details

Test Data:
  Original: April 5, 2026 @ 10:00 AM
  Rescheduled: April 7, 2026 @ 2:00 PM

Success Criteria:
  - Both old and new bookings reflected correctly
  - Customer charged only once
  - Email confirms new details
```

---

### Phase 1C: Basic Dashboard Access (12 tests)

#### 3.1 Customer Dashboard Access
```
ID: DASH-C001
Title: Login and access customer dashboard
Role: Customer
Severity: CRITICAL
Steps:
  1. Login as customer
  2. System redirects to dashboard
  3. View dashboard content

Expected Result:
  ✓ Dashboard loads within 2 seconds
  ✓ Customer name displayed in navbar
  ✓ Navigation menu visible
  ✓ All widgets load properly
  ✓ No console errors

Test Data:
  Customer: John Doe (john@test.com)

Success Criteria:
  - Dashboard responsive
  - All data loads
  - Navigation functional
```

#### 3.2 Employee Dashboard Access
```
ID: DASH-E001
Title: Login and access employee dashboard
Role: Employee
Severity: CRITICAL
Steps:
  1. Login as employee
  2. System redirects to dashboard
  3. View employee-specific widgets

Expected Result:
  ✓ Employee dashboard loads
  ✓ Employee name in navbar
  ✓ Employee-specific menus visible
  ✓ Booking list visible

Test Data:
  Employee: Jane Smith (jane@test.com)

Success Criteria:
  - Dashboard loads quickly
  - Employee can see assigned bookings
```

#### 3.3 Admin Dashboard Access
```
ID: DASH-A001
Title: Login and access admin dashboard
Role: Admin
Severity: CRITICAL
Steps:
  1. Login as admin
  2. System redirects to admin panel
  3. View admin dashboard

Expected Result:
  ✓ Admin dashboard loads
  ✓ Admin name in navbar
  ✓ Full admin menu visible
  ✓ Statistics/KPIs displayed
  ✓ All admin features accessible

Test Data:
  Admin: Admin Test (admin@test.com)

Success Criteria:
  - Admin has full access
  - All menus functioning
  - Dashboard metrics display
```

#### 3.4 View Appointment Status
```
ID: BOOK-013
Title: View appointment status and progress
Role: Customer
Severity: HIGH
Steps:
  1. Login as customer
  2. View "My Appointments"
  3. Click on an appointment
  4. View detailed status

Expected Result:
  ✓ Current status displayed clearly
  ✓ Status history shown (timeline)
  ✓ Estimated completion time shown
  ✓ Employee assigned shown (if available)

Test Data:
  Booking Status: In Progress
  Expected Completion: 11:30 AM

Success Criteria:
  - Status updates in real-time
  - Timeline accurate
  - Employee info displayed
```

#### 3.5 View Transaction History
```
ID: DASH-C002
Title: View transaction/payment history
Role: Customer
Severity: HIGH
Steps:
  1. Login as customer
  2. Navigate to "Transaction History" or "Billing"
  3. View all past payments

Expected Result:
  ✓ All transactions listed
  ✓ Paginated if >10 items
  ✓ Sortable by date
  ✓ Filterable by status/amount
  ✓ Payment methods shown

Test Data:
  Customer has 8 transactions

Success Criteria:
  - All transactions visible
  - Sorting/filtering works
  - Amounts correct
```

#### 3.6 Download Invoice
```
ID: DASH-C003
Title: Download invoice/receipt for appointment
Role: Customer
Severity: HIGH
Steps:
  1. Login as customer
  2. View transaction history
  3. Click "Download Invoice" on a transaction
  4. PDF downloads

Expected Result:
  ✓ PDF file generated
  ✓ Invoice contains all details
  ✓ Professional formatting
  ✓ Download starts automatically

Test Data:
  Invoice for: April 1, 2026 booking ($28)

Success Criteria:
  - PDF creates without errors
  - Contains all required info
  - File is readable
```

#### 3.7 Logout
```
ID: AUTH-002
Title: Logout from any role
Role: All Roles
Severity: CRITICAL
Steps:
  1. Login to any account
  2. Click "Logout" or user menu → "Logout"
  3. Confirm logout if prompted

Expected Result:
  ✓ Session terminated
  ✓ Redirected to login or landing page
  ✓ Cannot access protected routes
  ✓ Session data cleared

Test Data:
  Any authenticated user

Success Criteria:
  - Session cleared properly
  - Cannot navigate to protected pages
  - Session storage cleared
```

---

## PHASE 2: ADVANCED FEATURES (HIGH PRIORITY)

**Target:** 95% Pass Rate  
**Duration:** 2 weeks  
**Resources:** Full QA team + specialists

### Phase 2A: Customer Profile Management (6 tests)

#### 4.1 Add New Vehicle
```
ID: PROF-C001
Title: Add a new vehicle to my profile
Role: Customer
Severity: HIGH
Steps:
  1. Login as customer
  2. Navigate to Profile
  3. Go to "My Vehicles"
  4. Click "Add New Vehicle"
  5. Enter: Make, Model, Year, Color, License Plate
  6. Click "Save Vehicle"

Expected Result:
  ✓ Vehicle added to profile
  ✓ Vehicle appears in vehicle list
  ✓ All fields validated
  ✓ Confirmation message shown

Test Data:
  Make: Honda
  Model: Civic
  Year: 2023
  Color: Blue
  Plate: XYZ789

Success Criteria:
  - Vehicle saved in database
  - Appears in booking vehicle selector
  - All fields properly stored
```

#### 4.2 Edit Vehicle
```
ID: PROF-C002
Title: Edit vehicle information
Role: Customer
Severity: HIGH
Steps:
  1. Login as customer
  2. Go to "My Vehicles"
  3. Click "Edit" on a vehicle
  4. Modify vehicle details
  5. Click "Save"

Expected Result:
  ✓ Changes saved
  ✓ Updated info displayed
  ✓ No data loss

Test Data:
  Update: Color from Blue to Red

Success Criteria:
  - Changes persisted in database
  - Old bookings keep original vehicle info
- New bookings use updated info
```

#### 4.3 Delete Vehicle
```
ID: PROF-C003
Title: Delete a vehicle from my profile
Role: Customer
Severity: MEDIUM
Steps:
  1. Login as customer
  2. Go to "My Vehicles"
  3. Click "Delete" on a vehicle
  4. Confirm deletion

Expected Result:
  ✓ Vehicle removed from list
  ✓ Cannot be selected for new bookings
  ✓ Existing bookings unaffected
  ✓ Soft delete or archive preferred

Test Data:
  Vehicle: 2020 Ford Mustang

Success Criteria:
  - Vehicle no longer appears
  - Old bookings still show vehicle info
  - Cannot cause data integrity issues
```

#### 4.4 View All Vehicles
```
ID: PROF-C004
Title: View all my registered vehicles
Role: Customer
Severity: HIGH
Steps:
  1. Login as customer
  2. Navigate to Profile
  3. Click "My Vehicles"

Expected Result:
  ✓ All customer vehicles listed
  ✓ Vehicle details displayed
  ✓ Edit/Delete buttons available
  ✓ Add Vehicle button prominent

Test Data:
  Customer has 3 vehicles

Success Criteria:
  - All vehicles visible
  - List properly formatted
  - Actions accessible
```

#### 4.5 Edit Profile Information
```
ID: PROF-C005
Title: View and edit profile information
Role: Customer
Severity: HIGH
Steps:
  1. Login as customer
  2. Navigate to Profile
  3. Click "Edit Profile"
  4. Modify any allowed fields (name, phone, email preferences)
  5. Click "Save"

Expected Result:
  ✓ Changes saved
  ✓ Confirmation message
  ✓ Changes reflected immediately
  ✓ Validation on email uniqueness

Test Data:
  Update: Phone from 09123456789 to 09987654321

Success Criteria:
  - Changes stored in database
  - Email conflicts prevented
  - Navbar updated if name changed
```

#### 4.6 Change Password
```
ID: PROF-C006
Title: Update password from profile
Role: Customer
Severity: HIGH
Steps:
  1. Login as customer
  2. Navigate to Profile
  3. Click "Change Password"
  4. Enter current password
  5. Enter new password (must meet complexity requirements)
  6. Confirm new password
  7. Click "Update"

Expected Result:
  ✓ Old password required for verification
  ✓ New password updated
  ✓ Old password no longer works
  ✓ Confirmation email sent
  ✓ All other sessions logged out

Test Data:
  Old Password: SecurePass123!
  New Password: NewSecurePass456!

Success Criteria:
  - Password changed in database
  - Hash updated
  - Old password fails on next login attempt
  - Confirmation email sent
```

---

### Phase 2B: Employee Booking Management (10 tests)

#### 5.1 View Employee Dashboard
```
ID: DASH-E002
Title: View employee dashboard with key metrics
Role: Employee
Severity: HIGH
Steps:
  1. Login as employee
  2. View main dashboard
  3. Observe widgets/cards

Expected Result:
  ✓ Dashboard displays:
    - Total appointments today
    - Pending appointments count
    - Completed appointments count
    - Next appointment details
  ✓ All metrics current

Test Data:
  Today: 5 appointments scheduled

Success Criteria:
  - Metrics accurate
  - Updates in real-time
  - Dashboard loads in <2 seconds
```

#### 5.2 View Assigned Bookings
```
ID: EMP-001
Title: View all assigned car wash bookings
Role: Employee
Severity: HIGH
Steps:
  1. Login as employee
  2. Navigate to "My Bookings" or "Today's Appointments"
  3. View list of assigned appointments

Expected Result:
  ✓ All assigned appointments displayed
  ✓ Shows vehicle info
  ✓ Shows customer name
  ✓ Shows service type
  ✓ Shows scheduled time
  ✓ Sort by time

Test Data:
  Employee assigned to 5 bookings today

Success Criteria:
  - All bookings visible
  - Sorted chronologically
  - Customer info accessible
```

#### 5.3 Update Booking Status
```
ID: EMP-002
Title: Update booking status (pending → in-progress → completed)
Role: Employee
Severity: CRITICAL
Steps:
  1. Login as employee
  2. View assigned bookings
  3. Click on a booking
  4. Click "Start Service" to change to "In Progress"
  5. Upon completion, click "Complete Service"

Expected Result:
  ✓ Status changes reflected immediately
  ✓ Timer/duration tracked
  ✓ Customer notified of status change
  ✓ Status history recorded

Test Data:
  Booking: April 5, 2026, 10:00 AM
  Status Flow: Pending → In Progress → Completed

Success Criteria:
  - Status updates in database
  - Timestamp recorded
  - Customer notified
  - Status changes visible to customer
```

#### 5.4 View Customer Details
```
ID: EMP-003
Title: View customer details for scheduled appointments
Role: Employee
Severity: HIGH
Steps:
  1. Login as employee
  2. Click on a booking
  3. View customer details panel

Expected Result:
  ✓ Customer name displayed
  ✓ Customer phone number shown
  ✓ Customer email shown
  ✓ Vehicle details displayed
  ✓ Previous booking history available

Test Data:
  Booking for: John Doe

Success Criteria:
  - All details accessible
  - Contact info displayed
  - Can call/email if needed
```

#### 5.5 Filter Bookings by Status
```
ID: EMP-004
Title: Filter bookings by date/time/status
Role: Employee
Severity: MEDIUM
Steps:
  1. Login as employee
  2. Go to bookings list
  3. Use filter for status (Pending, In Progress, Completed)
  4. View filtered results

Expected Result:
  ✓ Filters applied
  ✓ Only matching bookings shown
  ✓ Result count updates
  ✓ Multiple filters can combine

Test Data:
  Filter: Status = "Pending"
  Results: 3 bookings

Success Criteria:
  - Filtering accurate
  - Performance good even with many bookings
  - Filters can be cleared
```

#### 5.6 Mark Appointment as Completed
```
ID: EMP-005
Title: Mark appointment as completed
Role: Employee
Severity: CRITICAL
Steps:
  1. Login as employee
  2. View assigned bookings
  3. Click on "In Progress" booking
  4. Click "Mark as Completed"
  5. Optional: Add notes/comments

Expected Result:
  ✓ Status changes to "Completed"
  ✓ Completion time recorded
  ✓ Service duration calculated
  ✓ Customer notified
  ✓ Booking moved to history

Test Data:
  Booking: Completed at 10:45 AM (45 min duration)

Success Criteria:
  - Status persisted
  - Duration calculated correctly
  - Cannot be modified after marked complete
  - Customer sees completion notification
```

#### 5.7 View Customer Records
```
ID: EMP-006
Title: View all customer records/history
Role: Employee
Severity: HIGH
Steps:
  1. Login as employee
  2. Navigate to "Customer Records" or "Customers"
  3. View list of all customers

Expected Result:
  ✓ All customers listed
  ✓ Pagination if >20 customers
  ✓ Search functionality available
  ✓ Basic info displayed (name, phone, email)

Test Data:
  System has 150 customers

Success Criteria:
  - All records accessible
  - Search works
  - Performance acceptable
```

#### 5.8 Search Customer Records
```
ID: EMP-007
Title: Search for specific customer records
Role: Employee
Severity: HIGH
Steps:
  1. Login as employee
  2. Go to "Customer Records"
  3. Use search box
  4. Enter customer name or email
  5. View results

Expected Result:
  ✓ Search results displayed
  ✓ Results filtered correctly
  ✓ Can click to view details
  ✓ Search is case-insensitive

Test Data:
  Search: "John" → Results: 5 customers named John

Success Criteria:
  - Search accurate
  - Results relevant
  - Performance good
```

#### 5.9 View Customer Booking History
```
ID: EMP-008
Title: View customer booking history
Role: Employee
Severity: HIGH
Steps:
  1. Login as employee
  2. Go to "Customer Records"
  3. Find a customer
  4. Click "View History"
  5. See all past bookings for customer

Expected Result:
  ✓ All customer bookings listed
  ✓ Dates, services, amounts shown
  ✓ Status of each booking shown
  ✓ Sortable by date

Test Data:
  Customer: John Doe
  Bookings: 12 total

Success Criteria:
  - All bookings visible
  - Accurate data
  - Sorted correctly
```

#### 5.10 View Assigned Washing Points
```
ID: EMP-009
Title: View assigned washing points/stations
Role: Employee
Severity: MEDIUM
Steps:
  1. Login as employee
  2. Navigate to "Washing Stations" or "My Stations"
  3. View assigned stations

Expected Result:
  ✓ Assigned stations displayed
  ✓ Station details shown
  ✓ Current occupancy shown
  ✓ Features/equipment listed

Test Data:
  Employee assigned to: Station 1, Station 3

Success Criteria:
  - Stations clearly displayed
  - Current status visible
  - Can be used for flow coordination
```

---

### Phase 2C: Admin Management Features (20 tests)

#### 6.1 View Admin Dashboard
```
ID: DASH-A002
Title: Access admin dashboard main page
Role: Admin
Severity: HIGH
Steps:
  1. Login as admin
  2. Dashboard loads automatically
  3. View main dashboard

Expected Result:
  ✓ Dashboard displays comprehensive overview
  ✓ Multiple widgets load
  ✓ Analytics visible
  ✓ Quick action buttons present

Test Data:
  Admin: admin@test.com

Success Criteria:
  - Dashboard responsive
  - All data loads
  - Navigation clear
```

#### 6.2 View System Overview
```
ID: DASH-A003
Title: View system overview and statistics
Role: Admin
Severity: HIGH
Steps:
  1. Login as admin
  2. View dashboard overview section
  3. Observe key metrics

Expected Result:
  ✓ Total customers count
  ✓ Total bookings count
  ✓ Revenue today/this month
  ✓ Pending tasks count
  ✓ All metrics update regularly

Test Data:
  Customers: 247
  Bookings: 1,205
  Revenue This Month: $5,432

Success Criteria:
  - Numbers accurate
  - Update frequency acceptable
  - Data sources correct
```

#### 6.3 View Customer Count Analytics
```
ID: ANALYTICS-001
Title: View total customer count
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Navigate to Analytics/Reports
  3. View customer statistics

Expected Result:
  ✓ Total customer count displayed
  ✓ New customers this month shown
  ✓ Growth trend visible
  ✓ Can compare periods

Test Data:
  Total: 247 customers
  New This Month: 23

Success Criteria:
  - Count accurate
  - Trends displayable
  - Comparison features work
```

#### 6.4 View Booking Analytics
```
ID: ANALYTICS-002
Title: View total booking count
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Go to Analytics
  3. View booking statistics

Expected Result:
  ✓ Total bookings displayed
  ✓ Bookings by status shown
  ✓ Bookings by service type shown
  ✓ Charts/graphs visible

Test Data:
  Total: 1,205 bookings
  Completed: 1,100
  Pending: 105

Success Criteria:
  - Numbers accurate
  - Charts render properly
  - Data sliceable by multiple dimensions
```

#### 6.5 View Revenue Analytics
```
ID: ANALYTICS-003
Title: View revenue analytics
Role: Admin
Severity: HIGH
Steps:
  1. Login as admin
  2. Go to "Revenue" section
  3. View revenue metrics

Expected Result:
  ✓ Total revenue displayed
  ✓ Revenue by period shown
  ✓ Revenue by service type shown
  ✓ Top performing services highlighted

Test Data:
  Total Revenue: $18,540
  Top Service: Wash + Wax ($6,200)

Success Criteria:
  - Revenue calculations correct
  - Breakdowns accurate
  - Charts display properly
```

#### 6.6 Generate Reports
```
ID: REPORT-001
Title: Generate reports by date range
Role: Admin
Severity: HIGH
Steps:
  1. Login as admin
  2. Navigate to "Reports"
  3. Select report type (Bookings, Revenue, Customers, etc.)
  4. Select date range
  5. Click "Generate"

Expected Result:
  ✓ Report generated within 10 seconds
  ✓ Report displays all requested data
  ✓ Data is accurate
  ✓ Report format is professional

Test Data:
  Report: Booking Report
  Date Range: Jan 1 - Mar 31, 2026
  Records: 847 bookings

Success Criteria:
  - Report accuracy verified
  - Generation time acceptable
  - Format professional
```

#### 6.7 Export Report Data
```
ID: REPORT-002
Title: Export report data to CSV/PDF
Role: Admin
Severity: MEDIUM
Steps:
  1. Generate a report (see 6.6)
  2. Click "Export" button
  3. Choose format: CSV or PDF
  4. File downloads

Expected Result:
  ✓ Export file created
  ✓ Format chosen correctly
  ✓ Data complete
  ✓ File is readable in Excel/PDF viewer

Test Data:
  Export: Booking Report as CSV

Success Criteria:
  - File created successfully
  - Data complete
  - File opens in correct application
  - No data loss in conversion
```

#### 6.8 Create Service Package
```
ID: SERVICE-001
Title: Create a new car wash service package
Role: Admin
Severity: CRITICAL
Steps:
  1. Login as admin
  2. Navigate to "Service Management"
  3. Click "Create New Service"
  4. Enter:
     - Package name
     - Description
     - Duration (minutes)
     - Features included
  5. Click "Save"

Expected Result:
  ✓ Service created
  ✓ Service appears in list
  ✓ Service code auto-generated
  ✓ Confirmation message

Test Data:
  Name: Deluxe Wash + Wax + Interior Vacuum
  Duration: 90 minutes
  Features: Full wash, wax, interior vacuum, carpet shampoo

Success Criteria:
  - Service saved in database
  - Available for pricing
  - Can be selected for bookings
```

#### 6.9 Edit Service Package
```
ID: SERVICE-002
Title: Edit existing service package details
Role: Admin
Severity: HIGH
Steps:
  1. Login as admin
  2. Go to "Service Management"
  3. Click "Edit" on a service
  4. Modify details
  5. Click "Save"

Expected Result:
  ✓ Changes saved
  ✓ Update reflected immediately
  ✓ Existing bookings not affected
  ✓ New bookings use updated details

Test Data:
  Service: "Wash + Vacuum"
  Update: Duration 30 → 40 minutes

Success Criteria:
  - Changes persisted
  - Old bookings unchanged
  - New bookings use new duration
```

#### 6.10 Delete Service Package
```
ID: SERVICE-003
Title: Delete a service package
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Go to "Service Management"
  3. Click "Delete" on a service
  4. Confirm deletion

Expected Result:
  ✓ Service removed from list
  ✓ Cannot be selected for new bookings
  ✓ Option: Archive instead of delete
  ✓ Old bookings still show service

Test Data:
  Service to Delete: "Seasonal Special Wash"

Success Criteria:
  - Service no longer available
  - Old bookings unaffected
  - No data integrity issues
```

#### 6.11 Set Service Pricing
```
ID: SERVICE-004
Title: Set pricing for service by vehicle type
Role: Admin
Severity: CRITICAL
Steps:
  1. Login as admin
  2. Go to "Service Management"
  3. Select a service
  4. Go to "Pricing"
  5. Enter prices for each vehicle type:
     - Sedan
     - SUV
     - Truck
     - Van
  6. Click "Save Pricing"

Expected Result:
  ✓ Pricing saved for each vehicle type
  ✓ Pricing appears in booking system
  ✓ Confirmation message
  ✓ Can be edited later

Test Data:
  Service: "Wash + Wax"
  Sedan: $35
  SUV: $45
  Truck: $55
  Van: $50

Success Criteria:
  - All prices stored correctly
  - Applied during booking calculation
  - Can be changed later
```

#### 6.12 Update Service Pricing
```
ID: SERVICE-005
Title: Update service package pricing
Role: Admin
Severity: HIGH
Steps:
  1. Login as admin
  2. Go to "Service Management"
  3. Click "Edit Pricing" on service
  4. Modify prices
  5. Click "Update"

Expected Result:
  ✓ New prices applied
  ✓ Effective immediately for new bookings
  ✓ Old bookings keep original pricing
  ✓ Confirmation message

Test Data:
  Service: "Basic Wash"
  Old Sedan Price: $15 → New: $18

Success Criteria:
  - Prices updated in database
  - New bookings use new prices
  - Old bookings unaffected
```

#### 6.13 Activate/Deactivate Services
```
ID: SERVICE-006
Title: Activate/deactivate service packages
Role: Admin
Severity: HIGH
Steps:
  1. Login as admin
  2. Go to "Service Management"
  3. Find a service
  4. Toggle "Active" switch
  5. Confirm

Expected Result:
  ✓ Service status changes
  ✓ Inactive services don't appear in booking
  ✓ Can be reactivated anytime
  ✓ Existing bookings unaffected

Test Data:
  Service: "Winter Special" → Deactivate

Success Criteria:
  - Status changes immediately
  - Not available for new bookings
  - No impact on existing bookings
```

#### 6.14 View All Service Packages
```
ID: SERVICE-007
Title: View all service packages
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Go to "Service Management"
  3. View list of all services

Expected Result:
  ✓ All services listed (active and inactive)
  ✓ Service details visible
  ✓ Edit/Delete buttons present
  ✓ Pagination if >10 services

Test Data:
  Total Services: 8

Success Criteria:
  - All services visible
  - List comprehensive
  - Actionable items present
```

#### 6.15 Create Washing Point
```
ID: FACILITY-001
Title: Create a new washing point/station
Role: Admin
Severity: CRITICAL
Steps:
  1. Login as admin
  2. Go to "Washing Points" or "Facilities"
  3. Click "Create New Station"
  4. Enter:
     - Station name
     - Location
     - Capacity
     - Equipment type
     - Features
  5. Click "Save"

Expected Result:
  ✓ Station created
  ✓ Appears in station list
  ✓ Can assign employees
  ✓ Confirmation message

Test Data:
  Name: Station A-1
  Location: North Building, Bay 1
  Capacity: 2 vehicles
  Equipment: Standard wash bay

Success Criteria:
  - Station saved in database
  - Available for assignment
  - Employee can see during shift
```

#### 6.16 Edit/Delete Washing Points
```
ID: FACILITY-002
Title: Edit/Delete washing point details
Role: Admin
Severity: HIGH
Steps:
  1. Login as admin
  2. Go to "Washing Points"
  3. Click "Edit" or "Delete"
  4. Modify or confirm deletion

Expected Result:
  ✓ Changes saved or deletion confirmed
  ✓ Existing assignments reviewed
  ✓ No bookings disrupted

Test Data:
  Station: "Station B-2"
  Update: Capacity 2 → 3

Success Criteria:
  - Changes persisted
  - Employee schedules considered
  - No data loss
```

#### 6.17 Manage Employee Accounts
```
ID: USER-E001
Title: Create new employee account
Role: Admin
Severity: CRITICAL
Steps:
  1. Login as admin
  2. Go to "Employee Management"
  3. Click "Create Employee"
  4. Enter:
     - Email
     - First Name
     - Last Name
     - Phone (optional)
     - Assign to stations
  5. Click "Create"

Expected Result:
  ✓ Employee account created
  ✓ Temporary password sent to email
  ✓ Employee added to system
  ✓ Can assign to bookings
  ✓ Confirmation message

Test Data:
  Email: newemployee@test.com
  Name: Jane Smith
  Stations: Station A-1, Station A-2

Success Criteria:
  - Account created in database
  - Email sent with credentials
  - Employee can login
  - Can be assigned shifts
```

#### 6.18 Edit Employee Information
```
ID: USER-E002
Title: Edit employee information
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Go to "Employee Management"
  3. Click "Edit" on an employee
  4. Modify details
  5. Click "Save"

Expected Result:
  ✓ Changes saved
  ✓ Employee notified of changes (if email)
  ✓ Changes visible immediately

Test Data:
  Employee: Jane Smith
  Update: Phone number change

Success Criteria:
  - Information updated
  - Employee can see changes after login
```

#### 6.19 View All Customers
```
ID: USER-C001
Title: View all customer accounts
Role: Admin
Severity: HIGH
Steps:
  1. Login as admin
  2. Go to "User Management" or "Customers"
  3. View list of all customers

Expected Result:
  ✓ All customers listed
  ✓ Pagination if >20
  ✓ Search available
  ✓ Basic info shown (name, email, phone)
  ✓ Account status shown

Test Data:
  Total Customers: 247

Success Criteria:
  - All customers accessible
  - Search functional
  - Performance good
```

#### 6.20 Suspend/Activate Customer Account
```
ID: USER-C002
Title: Suspend/activate customer account
Role: Admin
Severity: HIGH
Steps:
  1. Login as admin
  2. Go to "Customers"
  3. Find a customer
  4. Click "Suspend" or "Activate"
  5. Add reason (for suspension)
  6. Confirm

Expected Result:
  ✓ Account status changes
  ✓ Cannot book if suspended
  ✓ Can be reactivated anytime
  ✓ Customer notified
  ✓ Existing bookings handled appropriately

Test Data:
  Customer: John Doe
  Action: Suspend (Reason: Multiple non-shows)

Success Criteria:
  - Status updated
  - Suspended customers cannot book
  - Can be unsuspended
```

---

### Phase 2D: Feedback & Content Management (8 tests)

#### 7.1 Submit Feedback
```
ID: FEEDBACK-001
Title: Submit feedback/review for completed service
Role: Customer
Severity: MEDIUM
Steps:
  1. Login as customer
  2. View completed appointment
  3. Click "Leave Feedback" or "Write Review"
  4. Enter rating (1-5 stars)
  5. Enter comment text
  6. Click "Submit"

Expected Result:
  ✓ Feedback submitted
  ✓ Confirmation shown
  ✓ Stored in database
  ✓ Visible to admin/employees

Test Data:
  Rating: 5 stars
  Comment: "Excellent service! Very thorough wash."

Success Criteria:
  - Feedback saved
  - Can be viewed by admins
  - Rating calculation includes this
```

#### 7.2 View Customer Feedback
```
ID: FEEDBACK-002
Title: View customer feedback/reviews
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Navigate to "Feedback Management"
  3. View all customer feedback

Expected Result:
  ✓ All feedback listed
  ✓ Rating shown clearly
  ✓ Customer name shown
  ✓ Date posted shown
  ✓ Comment text visible

Test Data:
  Total Feedback: 34

Success Criteria:
  - All feedback accessible
  - Sortable by rating, date, customer
  - Professional display
```

#### 7.3 Respond to Feedback
```
ID: FEEDBACK-003
Title: Respond to customer feedback
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Go to "Feedback Management"
  3. Click on feedback item
  4. Click "Reply" or "Respond"
  5. Enter response text
  6. Click "Send"

Expected Result:
  ✓ Response saved
  ✓ Customer notified
  ✓ Response visible alongside feedback
  ✓ Professional tone encouraged

Test Data:
  Response: "Thank you for your feedback! We appreciate your business."

Success Criteria:
  - Response stored
  - Customer sees it
  - Contributes to customer satisfaction
```

#### 7.4 Manage Inquiries
```
ID: INQUIRY-001
Title: View and manage customer inquiries/support requests
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Go to "Manage Inquiries" or "Support Tickets"
  3. View list of inquiries
  4. See unresolved count
  5. Filter by status

Expected Result:
  ✓ All inquiries listed
  ✓ Status clear (New, In Progress, Resolved)
  ✓ Customer name shown
  ✓ Date submitted shown
  ✓ Priority level shown

Test Data:
  Total: 12 inquiries (8 new, 3 in progress, 1 resolved)

Success Criteria:
  - All inquiries visible
  - Easy to prioritize
  - Actionable items clear
```

#### 7.5 Respond to Inquiries
```
ID: INQUIRY-002
Title: Respond to customer inquiries
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Go to "Manage Inquiries"
  3. Click on unresolved inquiry
  4. Click "Reply"
  5. Enter response message
  6. Click "Send"

Expected Result:
  ✓ Response sent to customer
  ✓ Email delivered
  ✓ Response tracked in inquiry
  ✓ Status updated if resolved

Test Data:
  Inquiry: "Can I cancel my April 5 appointment?"
  Response: "Yes, you can cancel up to 24 hours before."

Success Criteria:
  - Customer receives response
  - Response linked to inquiry
  - Professional communication maintained
```

#### 7.6 Mark Inquiry as Resolved
```
ID: INQUIRY-003
Title: Mark inquiries as resolved
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Go to "Manage Inquiries"
  3. Click on inquiry
  4. Click "Mark as Resolved"
  5. Close ticket

Expected Result:
  ✓ Status changes to "Resolved"
  ✓ Disappears from "New/In Progress" filters
  ✓ Moved to "Resolved" section
  ✓ Customer notified

Test Data:
  Inquiry: "Booking confirmation question"

Success Criteria:
  - Status updated
  - No longer appears in action list
  - Customer sees resolution
```

#### 7.7 Edit Landing Page Content
```
ID: CONTENT-001
Title: Edit landing page content
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Navigate to "Landing Page Editor" or "Content Management"
  3. Edit text sections (heading, descriptions, features)
  4. Click "Save Draft" or "Publish"

Expected Result:
  ✓ Changes can be drafted
  ✓ Changes can be previewed
  ✓ Can save as draft
  ✓ Can publish live
  ✓ Live visible to customers immediately

Test Data:
  Update: Main heading "Welcome to AutoWash Hub!"

Success Criteria:
  - Changes saved
  - Preview accurate
  - Live changes immediate
```

#### 7.8 Upload Images for Landing Page
```
ID: CONTENT-002
Title: Upload images for landing page
Role: Admin
Severity: MEDIUM
Steps:
  1. Login as admin
  2. Go to "Landing Page Editor"
  3. Click "Upload Image" for section
  4. Select image from computer
  5. Upload and confirm placement

Expected Result:
  ✓ Image uploaded to server
  ✓ Image appears in editor
  ✓ Can be positioned
  ✓ Can be replaced/deleted
  ✓ Optimized for web

Test Data:
  Image: car-wash-hero.jpg (2MB, 1920x1080px)

Success Criteria:
  - Image uploaded successfully
  - Displays properly
  - Optimized for load time
  - Responsive on mobile
```

---

## PHASE 3: SYSTEM & POLISH (MEDIUM PRIORITY)

**Target:** 90% Pass Rate  
**Duration:** 1 week  
**Resources:** QA team + Performance specialists

### Phase 3A: System Integration (10 tests)

#### 8.1 Backend Connection Test
```
ID: SYSTEM-001
Title: Test backend API connection
Role: QA/Technical
Severity: CRITICAL
Steps:
  1. Navigate to http://localhost:4200/connection-test (or similar)
  2. View connection status page
  3. Observe API endpoint status

Expected Result:
  ✓ Connection to http://localhost/autowash-hub-api/api/ established
  ✓ API responds to test request
  ✓ Response time shown (<500ms)
  ✓ Green indicator for "Connected"

Test Data:
  API Base URL: http://localhost/autowash-hub-api/api/

Success Criteria:
  - Connection stable
  - Response times acceptable
  - Can reach all endpoints
```

#### 8.2 Database Connectivity
```
ID: SYSTEM-002
Title: Verify database connectivity
Role: QA/Technical
Severity: CRITICAL
Steps:
  1. Check backend system logs
  2. Verify database connection string
  3. Test query execution
  4. Monitor connection pool

Expected Result:
  ✓ Database connection active
  ✓ Queries execute successfully
  ✓ No connection timeouts
  ✓ Connection pool healthy

Test Data:
  Database: AutoWash Hub Database
  Tables: customers, employees, bookings, services, pricing

Success Criteria:
  - Database accessible
  - All tables readable/writable
  - Query performance acceptable
```

#### 8.3 Email Verification Service
```
ID: SYSTEM-003
Title: Verify email verification service working
Role: QA/Technical
Severity: CRITICAL
Steps:
  1. Register a test account
  2. Check system logs for PHP Mailer
  3. Check test email inbox
  4. Verify email format
  5. Click verification link

Expected Result:
  ✓ Email sent within 10 seconds
  ✓ Email properly formatted
  ✓ Verification link works
  ✓ Account activated after click
  ✓ Database updated

Test Data:
  Test Email: qatestemail@test.com

Success Criteria:
  - Email delivery reliable
  - Links functional
  - Account activation works
  - No spam folder issues
```

#### 8.4 File Upload Functionality
```
ID: SYSTEM-004
Title: Test file upload functionality
Role: QA/Technical
Severity: HIGH
Steps:
  1. Navigate to upload feature (profile picture, document, etc.)
  2. Select file from computer
  3. Upload file
  4. Verify file stored on server
  5. Test file retrieval

Expected Result:
  ✓ File uploaded successfully
  ✓ File stored in correct directory
  ✓ File accessible for retrieval
  ✓ File size validated (max limits respected)
  ✓ File type validated
  ✓ Virus scan passed (if implemented)

Test Data:
  File: profile-picture.jpg (500KB, JPG)

Success Criteria:
  - File storage working
  - Retrieval working
  - Security validated
  - Size/type restrictions enforced
```

#### 8.5 Password Reset Email Delivery
```
ID: SYSTEM-005
Title: Verify password reset email delivery
Role: QA/Technical
Severity: CRITICAL
Steps:
  1. Initiate password reset from login page
  2. Enter email address
  3. Check email inbox
  4. Verify email format
  5. Click reset link

Expected Result:
  ✓ Email sent within 10 seconds
  ✓ Email contains reset link
  ✓ Link valid for 24 hours
  ✓ Link contains secure token
  ✓ Password can be reset via link

Test Data:
  Reset Email: test.reset@test.com

Success Criteria:
  - Email delivery reliable
  - Reset link works
  - Token security verified
  - Reset process successful
```

#### 8.6 Appointment Confirmation Email
```
ID: SYSTEM-006
Title: Test appointment confirmation email
Role: QA/Technical
Severity: HIGH
Steps:
  1. Complete booking process
  2. Check customer email
  3. Verify email received within 10 seconds
  4. Check email content

Expected Result:
  ✓ Confirmation email sent
  ✓ Email contains booking ID
  ✓ Email contains appointment details
  ✓ Email contains cancellation policy
  ✓ Email is professionally formatted
  ✓ Links are functional

Test Data:
  Booking Details:
    - Booking ID: #12345
    - Date: April 5, 2026
    - Time: 10:00 AM
    - Service: Wash + Vacuum
    - Total: $28.00

Success Criteria:
  - Email reliable delivery
  - All content correct
  - Professional formatting
  - Links work
```

#### 8.7 Real-time Status Updates
```
ID: SYSTEM-007
Title: Test real-time status updates (WebSocket/polling)
Role: QA/Technical
Severity: MEDIUM
Steps:
  1. Employee marks booking as "In Progress"
  2. Customer views booking in real-time
  3. Observe status change within 5 seconds
  4. Employee marks booking as "Completed"
  5. Observe final status update

Expected Result:
  ✓ Status updates within 5 seconds
  ✓ No page refresh required
  ✓ Customer sees live progress
  ✓ Employee can track progress
  ✓ Multiple users see same status

Test Data:
  Booking: April 5, 2026, 10:00 AM booking

Success Criteria:
  - Updates fast (<5 seconds)
  - Updates reliable
  - Multiple user sync working
```

#### 8.8 Offline Mode/Service Worker
```
ID: SYSTEM-008
Title: Test offline functionality (if implemented)
Role: QA/Technical
Severity: LOW
Steps:
  1. Load application online
  2. Disable internet connection
  3. Try to navigate/use app
  4. Observe offline page (offline.html)
  5. Re-enable internet

Expected Result:
  ✓ Offline page loads
  ✓ User sees appropriate message
  ✓ Service worker functions
  ✓ Application gracefully degrades

Test Data:
  Simulate: Network disconnection

Success Criteria:
  - Graceful offline handling
  - User doesn't see errors
  - Can reconnect seamlessly
```

#### 8.9 Database Backup/Recovery
```
ID: SYSTEM-009
Title: Verify database backup and recovery procedures
Role: QA/Technical
Severity: HIGH
Steps:
  1. Monitor database backup process
  2. Verify backup file created
  3. Test backup file integrity
  4. Test recovery procedure
  5. Verify data restored correctly

Expected Result:
  ✓ Backups created automatically
  ✓ Backup files verified
  ✓ Recovery procedure works
  ✓ Data integrity maintained
  ✓ No data loss

Test Data:
  Backup Schedule: Daily at 2 AM
  Backup Size: ~500MB (estimated)

Success Criteria:
  - Reliable backup process
  - Recovery tested and working
  - RPO (Recovery Point Objective) met
```

#### 8.10 Logging & Monitoring
```
ID: SYSTEM-010
Title: Verify system logs and monitoring
Role: QA/Technical
Severity: MEDIUM
Steps:
  1. Access system logs (admin panel or server)
  2. Verify key events logged:
     - User logins
     - Booking creations
     - Errors/exceptions
  3. Check log file sizes
  4. Verify log rotation working

Expected Result:
  ✓ All events logged with timestamps
  ✓ Error logs contain stack traces
  ✓ Logs rotated to prevent overgrowth
  ✓ Can search/filter logs
  ✓ Security sensitive data masked

Test Data:
  Sample Log Events

Success Criteria:
  - Comprehensive logging
  - Proper log management
  - Searchable logs
  - Performance not affected
```

---

### Phase 3B: Responsive Design & UX (12 tests)

#### 9.1 Mobile Responsiveness
```
ID: UX-001
Title: Verify responsive design on mobile devices
Role: QA/UX
Severity: HIGH
Steps:
  1. Navigate to application on mobile device (or use Chrome DevTools)
  2. Test on multiple screen sizes:
     - iPhone 12 (390x844)
     - iPhone SE (375x667)
     - Android phone (360x720)
  3. Test all major flows:
     - Login
     - Booking
     - Dashboard
  4. Verify touch interactions work

Expected Result:
  ✓ Layout responsive and readable
  ✓ Text readable (no horizontal scrolling)
  ✓ Buttons/links easily tappable (44px minimum)
  ✓ Forms functional on mobile
  ✓ No content hidden unintentionally
  ✓ Navigation works with touch

Test Devices:
  - iPhone 12 Pro
  - Samsung Galaxy A21
  - Chrome DevTools emulation

Success Criteria:
  - Mobile score >85 (both speed and usability)
  - Touch interactions work
  - No horizontal scroll
  - Text readable without zoom
```

#### 9.2 Tablet Responsiveness
```
ID: UX-002
Title: Verify responsive design on tablet devices
Role: QA/UX
Severity: MEDIUM
Steps:
  1. Test on tablet devices:
     - iPad (768x1024)
     - iPad Pro (1024x1366)
     - Android tablet (600x960)
  2. Test all major features
  3. Verify layout adapts appropriately
  4. Test both portrait and landscape

Expected Result:
  ✓ Layout optimized for tablet
  ✓ Good use of screen real estate
  ✓ Content properly spaced
  ✓ No awkward gaps or overflow
  ✓ Works in portrait and landscape

Test Devices:
  - iPad Air
  - Samsung Galaxy Tab S7

Success Criteria:
  - Tablet layout professional
  - All features accessible
  - Orientation changes smooth
```

#### 9.3 Desktop Responsiveness
```
ID: UX-003
Title: Verify responsive design on desktop
Role: QA/UX
Severity: MEDIUM
Steps:
  1. Test on desktop browsers:
     - Chrome 1920x1080
     - Firefox 1920x1080
     - Safari 1920x1080
     - Edge 1920x1080
  2. Test at non-standard resolutions
  3. Verify layout scalable to 1440p, 2560p

Expected Result:
  ✓ Desktop layout professional
  ✓ Content well-organized
  ✓ Whitespace appropriate
  ✓ Works at standard resolutions
  ✓ Sidebar navigation functional

Test Browsers:
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)

Success Criteria:
  - Desktop experience excellent
  - All features accessible
  - Performance good
```

#### Additional Tests: Performance, Accessibility, Browser Compatibility (9 more tests)

```
ID: PERF-001 - Performance Optimization
ID: SEC-001 - Security Testing
ID: ACC-001 - WCAG Accessibility Compliance
ID: BROWSER-001 - Browser Compatibility
ID: LOAD-001 - Load Testing
ID: STRESS-001 - Stress Testing
ID: INTEGRATION-001 - End-to-End Workflows
ID: DATA-001 - Data Integrity
ID: BACKUP-001 - Disaster Recovery
```

---

## TEST MATRIX BY ROLE

### Customer Testing (40 tests)
- AUTH-C001 to AUTH-C004 (Authentication - 4 tests)
- BOOK-001 to BOOK-013 (Booking - 13 tests)
- PROF-C001 to PROF-C006 (Profile - 6 tests)
- FEEDBACK-001 (Submit Feedback - 1 test)
- INQUIRY-001 (View & Submit Inquiry - 1 test)
- SYSTEM-003, SYSTEM-005, SYSTEM-006 (Email Services - 3 tests)
- UX-001, UX-002, UX-003 (Responsiveness - 3 tests)
- Additional email/notification tests - 8 tests

### Employee Testing (14 tests)
- AUTH-E001, AUTH-E002 (Authentication - 2 tests)
- EMP-001 to EMP-009 (Booking Management - 9 tests)
- PROF-E001 (Profile Edit - 1 test)
- SYSTEM tests (Connection, Email, Upload - 3 tests)

### Admin Testing (43 tests)
- AUTH-A001 to AUTH-A002 (Account Creation - 2 tests)
- DASH-A001 to DASH-A003 (Dashboard - 3 tests)
- ANALYTICS-001 to ANALYTICS-003 (Analytics - 3 tests)
- REPORT-001 to REPORT-002 (Reporting - 2 tests)
- SERVICE-001 to SERVICE-007 (Service Management - 7 tests)
- FACILITY-001 to FACILITY-002 (Facility Management - 2 tests)
- USER-E001 to USER-E002 (Employee Management - 2 tests)
- USER-C001 to USER-C002 (Customer Management - 2 tests)
- FEEDBACK-002 to FEEDBACK-003 (Feedback Management - 2 tests)
- INQUIRY-001 to INQUIRY-003 (Inquiry Management - 3 tests)
- CONTENT-001 to CONTENT-002 (Content Management - 2 tests)
- SYSTEM tests (Connection, Database, Logging - 4 tests)
- Additional admin-specific tests - 10 tests

### QA/Technical Testing (15 tests)
- SYSTEM-001 to SYSTEM-010 (System Integration - 10 tests)
- PERF-001, SEC-001, ACC-001, LOAD-001, BROWSER-001 (5 tests)

---

## SUCCESS CRITERIA SUMMARY

| Phase | Target Pass Rate | Total Tests | Must Pass |
|-------|-----------------|-------------|-----------|
| Phase 1 | 100% | 32 | 32 |
| Phase 2 | 95% | 54 | 51+ |
| Phase 3 | 90% | 22 | 20+ |
| **TOTAL** | **92%** | **108** | **103+** |

---

## Testing Format Template

For each test execution, use this format:

```
Test ID: [ID]
Test Title: [Title]
Tester Name: [Name]
Test Date: [Date]
Environment: [Dev/Staging/Prod]
Browser: [Browser/Version]
Device: [Device Type]

Result: [ ] PASS [ ] FAIL [ ] BLOCKED

Issues Found:
- [Issue 1]
- [Issue 2]

Evidence/Screenshots:
[Attach images]

Signature: ________________     Date: __________
```

---

## Sign-Off

This comprehensive testing plan covers 108 test cases organized across 3 phases with clear prioritization and detailed acceptance criteria.

**Document Approval:**

- QA Lead: ________________  Date: __________
- Project Manager: ________________  Date: __________
- Development Lead: ________________  Date: __________

---

**End of Document**
