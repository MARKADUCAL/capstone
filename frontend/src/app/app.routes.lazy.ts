import { Routes } from '@angular/router';

// Lazy-loaded routes for better performance
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/landing-page/landing-page.component').then(
        (m) => m.LandingPageComponent,
      ),
  },
  {
    path: 'landing-page',
    loadComponent: () =>
      import('./components/landing-page/landing-page.component').then(
        (m) => m.LandingPageComponent,
      ),
  },
  {
    path: 'connection-test',
    loadComponent: () =>
      import('./components/connection-test/connection-test.component').then(
        (m) => m.ConnectionTestComponent,
      ),
  },

  // Authentication routes - lazy loaded
  {
    path: 'customer',
    loadComponent: () =>
      import('./features/authentication/login/customer-login/customer-login.component').then(
        (m) => m.CustomerLoginComponent,
      ),
  },
  {
    path: 'customer-login',
    loadComponent: () =>
      import('./features/authentication/login/customer-login/customer-login.component').then(
        (m) => m.CustomerLoginComponent,
      ),
  },
  {
    path: 'customer-register',
    loadComponent: () =>
      import('./features/authentication/register/customer-register/customer-register.component').then(
        (m) => m.CustomerRegisterComponent,
      ),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/authentication/login/admin-login/admin-login.component').then(
        (m) => m.AdminLoginComponent,
      ),
  },
  {
    path: 'admin-login',
    loadComponent: () =>
      import('./features/authentication/login/admin-login/admin-login.component').then(
        (m) => m.AdminLoginComponent,
      ),
  },
  {
    path: 'employee',
    loadComponent: () =>
      import('./features/authentication/login/employee-login/employee-login.component').then(
        (m) => m.EmployeeLoginComponent,
      ),
  },
  {
    path: 'employee-login',
    loadComponent: () =>
      import('./features/authentication/login/employee-login/employee-login.component').then(
        (m) => m.EmployeeLoginComponent,
      ),
  },

  // Forgot password routes - lazy loaded
  {
    path: 'customer-forgot-password',
    loadComponent: () =>
      import('./features/authentication/forgot-password/customer-forgot-password/customer-forgot-password.component').then(
        (m) => m.CustomerForgotPasswordComponent,
      ),
  },
  {
    path: 'admin-forgot-password',
    loadComponent: () =>
      import('./features/authentication/forgot-password/admin-forgot-password/admin-forgot-password.component').then(
        (m) => m.AdminForgotPasswordComponent,
      ),
  },
  {
    path: 'employee-forgot-password',
    loadComponent: () =>
      import('./features/authentication/forgot-password/employee-forgot-password/employee-forgot-password.component').then(
        (m) => m.EmployeeForgotPasswordComponent,
      ),
  },

  // Legal pages - lazy loaded
  {
    path: 'terms',
    loadComponent: () =>
      import('./components/legal/terms/terms.component').then(
        (m) => m.TermsComponent,
      ),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./components/legal/privacy/privacy.component').then(
        (m) => m.PrivacyComponent,
      ),
  },

  // Admin dashboard routes - lazy loaded with layout
  {
    path: 'admin-view',
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'washing-point',
        loadComponent: () =>
          import('./components/admin/washing-point/washing-point.component').then(
            (m) => m.WashingPointComponent,
          ),
      },
      {
        path: 'car-wash-booking',
        loadComponent: () =>
          import('./components/admin/car-wash-booking/car-wash-booking.component').then(
            (m) => m.CarWashBookingComponent,
          ),
      },
      {
        path: 'employee-management',
        loadComponent: () =>
          import('./components/admin/employee-management/employee-management.component').then(
            (m) => m.EmployeeManagementComponent,
          ),
      },
      {
        path: 'admin-management',
        loadComponent: () =>
          import('./components/admin/admin-management/admin-management.component').then(
            (m) => m.AdminManagementComponent,
          ),
      },
      {
        path: 'user-management',
        loadComponent: () =>
          import('./components/admin/user-management/user-management.component').then(
            (m) => m.UserManagementComponent,
          ),
      },
      {
        path: 'manage-enquiries',
        loadComponent: () =>
          import('./components/admin/manage-enquiries/manage-enquiries.component').then(
            (m) => m.ManageEnquiriesComponent,
          ),
      },
      {
        path: 'reporting',
        loadComponent: () =>
          import('./components/admin/reporting/reporting.component').then(
            (m) => m.ReportingComponent,
          ),
      },
      {
        path: 'landing-editor',
        loadComponent: () =>
          import('./components/admin/landing-editor/landing-editor.component').then(
            (m) => m.LandingEditorComponent,
          ),
      },
      {
        path: 'service-management',
        loadComponent: () =>
          import('./components/admin/service-management/service-management.component').then(
            (m) => m.ServiceManagementComponent,
          ),
      },
      {
        path: 'feedback-management',
        loadComponent: () =>
          import('./components/admin/feedback-management/feedback-management.component').then(
            (m) => m.FeedbackManagementComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/admin/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Employee dashboard routes - lazy loaded with layout
  {
    path: 'employee-view',
    loadComponent: () =>
      import('./layout/employee-layout/employee-layout.component').then(
        (m) => m.EmployeeLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/employee/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'car-wash-booking',
        loadComponent: () =>
          import('./components/employee/car-wash-booking/car-wash-booking.component').then(
            (m) => m.CarWashBookingComponent,
          ),
      },
      {
        path: 'customer-records',
        loadComponent: () =>
          import('./components/employee/customer-records/customer-records.component').then(
            (m) => m.CustomerRecordsComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/employee/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Customer dashboard routes - lazy loaded with layout
  {
    path: 'customer-view',
    loadComponent: () =>
      import('./layout/customer-layout/customer-layout.component').then(
        (m) => m.CustomerLayoutComponent,
      ),
    children: [
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/customer/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'appointment',
        loadComponent: () =>
          import('./components/customer/appointment/appointment.component').then(
            (m) => m.AppointmentComponent,
          ),
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./components/customer/customer-dashboard/customer-dashboard.component').then(
            (m) => m.ServicesPricingComponent,
          ),
      },
      {
        path: 'tranaction-hitory',
        loadComponent: () =>
          import('./components/customer/tranaction-hitory/tranaction-hitory.component').then(
            (m) => m.TranactionHitoryComponent,
          ),
      },
      { path: '', redirectTo: 'services', pathMatch: 'full' },
    ],
  },
];
