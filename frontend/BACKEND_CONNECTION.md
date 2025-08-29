# Backend Connection Configuration

## Overview

This document describes the configuration to connect the frontend to the localhost backend at `http://localhost/autowash-hub-api/api/`.

## Current Configuration

### 1. Environment Configuration

- **Development Environment** (`src/environments/environment.ts`): `apiUrl` is set to `http://localhost/autowash-hub-api/api`
- **Production Environment** (`src/environments/environment.prod.ts`): `apiUrl` is set to `http://localhost/autowash-hub-api/api`

### 2. Component Updates

The following components have been updated to use environment variables instead of hardcoded localhost URLs:

#### Profile Components

- `src/app/components/employee/profile/profile.component.ts`
- `src/app/components/admin/profile/profile.component.ts`
- `src/app/components/customer/profile/profile.component.ts`

#### Service Components

- `src/app/components/admin/service-management/service-management.component.ts`
- `src/app/components/employee/dashboard/dashboard.component.ts`

#### Authentication Components

- `src/app/features/authentication/register/employee-register/employee-register.component.ts`
- `src/app/features/authentication/register/customer-register/customer-register.component.ts`
- `src/app/features/authentication/register/admin-register/admin-register.component.ts`
- `src/app/features/authentication/login/employee-login/employee-login.component.ts`
- `src/app/features/authentication/login/customer-login/customer-login.component.ts`
- `src/app/features/authentication/login/admin-login/admin-login.component.ts`

## Testing the Connection

### 1. Development Mode

```bash
cd frontend
npm start
```

The application will now connect to `http://localhost/autowash-hub-api/api` instead of the remote server.

### 2. Production Build

```bash
cd frontend
npm run build
```

The production build will use the production environment configuration.

### 3. Verify Connection

- Open the application in your browser
- Check the browser's developer console for any connection errors
- Try to register or login to verify the API endpoints are working
- Look for successful API calls in the Network tab

## API Endpoints

The following endpoints are now accessible at `http://localhost/autowash-hub-api/api`:

### Authentication

- `POST /login_customer` - Customer login
- `POST /login_employee` - Employee login
- `POST /login_admin` - Admin login
- `POST /register_customer` - Customer registration
- `POST /register_employee` - Employee registration
- `POST /register_admin` - Admin registration

### Services

- `GET /services` - Get all services
- `POST /services` - Create new service
- `PUT /services/:id` - Update service
- `DELETE /services/:id` - Delete service

### Bookings

- `GET /bookings` - Get all bookings
- `POST /create_booking` - Create new booking
- `PUT /update_booking_status` - Update booking status
- `PUT /assign_employee_to_booking` - Assign employee to booking

### User Management

- `GET /get_all_employees` - Get all employees
- `GET /get_all_customers` - Get all customers

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend allows requests from your frontend domain
2. **SSL Certificate Issues**: The backend uses HTTP, ensure it's accessible from your network
3. **Network Timeouts**: Check if the backend is accessible from your network

### Debug Steps

1. Check browser console for error messages
2. Verify the API URL in environment files
3. Test API endpoints directly (e.g., using Postman)
4. Check network tab for failed requests

## Notes

- All hardcoded remote server URLs have been replaced with localhost environment variables
- The application will automatically use the correct API URL based on the environment
- Make sure your local backend server is running and accessible at `http://localhost/autowash-hub-api/api`
- No additional configuration is required for the connection to work

## Reverted Configuration

This configuration has been reverted from `http://localhost:8000/api` back to the original `http://localhost/autowash-hub-api/api` to restore the original deployed setup.
