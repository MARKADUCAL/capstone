# Forgot Password Implementation

This document describes the implementation of the forgot password functionality for the AutoWash Hub application.

## Overview

The forgot password feature allows users (customers, admins, and employees) to reset their passwords when they forget them. The implementation includes:

1. **Backend API endpoints** for password reset requests and password updates
2. **Frontend components** for each user type with a clean, responsive UI
3. **Service layer** to handle API communication
4. **Routing** to connect all the components

## Backend Implementation

### Database Table

A new table `password_reset_tokens` is required:

```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    user_type ENUM('customer', 'admin', 'employee') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);
```

### API Endpoints

#### 1. Request Password Reset

**Customer:**

- **URL:** `POST /request_password_reset_customer`
- **Body:** `{ "email": "user@example.com" }`
- **Response:** Returns success message and reset token (for testing)

**Admin:**

- **URL:** `POST /request_password_reset_admin`
- **Body:** `{ "email": "admin@example.com" }`
- **Response:** Returns success message and reset token (for testing)

**Employee:**

- **URL:** `POST /request_password_reset_employee`
- **Body:** `{ "email": "employee@example.com" }`
- **Response:** Returns success message and reset token (for testing)

#### 2. Reset Password

- **URL:** `POST /reset_password`
- **Body:** `{ "token": "reset_token", "new_password": "newpassword123" }`
- **Response:** Success message if password is reset successfully

### Security Features

1. **Token Expiration:** Reset tokens expire after 1 hour
2. **One-time Use:** Tokens are deleted after successful password reset
3. **Email Privacy:** The API doesn't reveal whether an email exists in the system
4. **Password Validation:** Minimum 6 characters required

## Frontend Implementation

### Components

#### 1. Customer Forgot Password

- **Path:** `/customer-forgot-password`
- **Component:** `CustomerForgotPasswordComponent`
- **Features:**
  - Email input form
  - Password reset form (shown after token is received)
  - Responsive design matching the login page style

#### 2. Admin Forgot Password

- **Path:** `/admin-forgot-password`
- **Component:** `AdminForgotPasswordComponent`
- **Features:**
  - Same functionality as customer but with admin-specific styling

#### 3. Employee Forgot Password

- **Path:** `/employee-forgot-password`
- **Component:** `EmployeeForgotPasswordComponent`
- **Features:**
  - Same functionality as customer but with employee-specific styling

### Service

**ForgotPasswordService** provides methods for:

- `requestPasswordResetCustomer(email)`
- `requestPasswordResetAdmin(email)`
- `requestPasswordResetEmployee(email)`
- `resetPassword(token, newPassword)`

### User Flow

1. **User clicks "Forgot Password?" on login page**
2. **User enters email address**
3. **System sends reset request to backend**
4. **Backend generates token and returns it (for testing)**
5. **User is shown password reset form**
6. **User enters new password and confirmation**
7. **System sends reset request with token**
8. **Backend validates token and updates password**
9. **User is redirected to login page**

## Testing

### Manual Testing Steps

1. **Navigate to any login page** (customer, admin, or employee)
2. **Click "Forgot Password?" link**
3. **Enter a valid email address**
4. **Submit the form**
5. **Copy the reset token from the response** (for testing)
6. **Enter new password and confirmation**
7. **Submit the reset form**
8. **Verify you can login with the new password**

### API Testing

You can test the API endpoints directly using tools like Postman:

```bash
# Request password reset
POST /api/request_password_reset_customer
Content-Type: application/json

{
  "email": "test@example.com"
}

# Reset password
POST /api/reset_password
Content-Type: application/json

{
  "token": "your_reset_token_here",
  "new_password": "newpassword123"
}
```

## Production Considerations

### Email Integration

Currently, the system returns the reset token in the API response for testing purposes. In production, you should:

1. **Remove the token from the API response**
2. **Implement email sending functionality**
3. **Send the reset link via email instead of returning the token**

### Security Enhancements

1. **Rate limiting** on password reset requests
2. **Email verification** before allowing password reset
3. **Audit logging** for password reset attempts
4. **Stronger token generation** (consider using JWT)

### Database Cleanup

Implement a cleanup job to remove expired tokens:

```sql
DELETE FROM password_reset_tokens WHERE expires_at < NOW();
```

## File Structure

```
backend/autowash-hub-api/
├── api/
│   ├── modules/post.php (updated with forgot password methods)
│   └── routes.php (updated with new routes)
└── create_password_reset_table.sql

frontend/src/app/
├── services/
│   └── forgot-password.service.ts
├── features/authentication/forgot-password/
│   ├── customer-forgot-password/
│   ├── admin-forgot-password/
│   └── employee-forgot-password/
└── app.routes.ts (updated with new routes)
```

## Dependencies

- **Backend:** PHP 7.4+, PDO, Firebase JWT
- **Frontend:** Angular 17+, Angular Router, Angular Forms

## Future Enhancements

1. **Email templates** for password reset emails
2. **SMS integration** for two-factor authentication
3. **Password strength requirements**
4. **Account lockout** after multiple failed attempts
5. **Password history** to prevent reuse of recent passwords
