import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { CustomerLoginComponent } from './features/authentication/login/customer-login/customer-login.component';
import { CustomerRegisterComponent } from './features/authentication/register/customer-register/customer-register.component';
import { AdminLoginComponent } from './features/authentication/login/admin-login/admin-login.component';
import { AdminRegisterComponent } from './features/authentication/register/admin-register/admin-register.component';
import { EmployeeLoginComponent } from './features/authentication/login/employee-login/employee-login.component';
import { EmployeeRegisterComponent } from './features/authentication/register/employee-register/employee-register.component';
import { CustomerLayoutComponent } from './layout/customer-layout/customer-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { EmployeeLayoutComponent } from './layout/employee-layout/employee-layout.component';

// Admin components
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { WashingPointComponent } from './components/admin/washing-point/washing-point.component';
import { CarWashBookingComponent } from './components/admin/car-wash-booking/car-wash-booking.component';
import { InventoryManagementComponent } from './components/admin/inventory-management/inventory-management.component';
import { EmployeeManagementComponent } from './components/admin/employee-management/employee-management.component';
import { UserManagementComponent } from './components/admin/user-management/user-management.component';
import { ManageEnquiriesComponent } from './components/admin/manage-enquiries/manage-enquiries.component';
import { ReportingComponent } from './components/admin/reporting/reporting.component';
import { PagesComponent } from './components/admin/pages/pages.component';
import { ProfileComponent as AdminProfileComponent } from './components/admin/profile/profile.component';
import { ServiceManagementComponent } from './components/admin/service-management/service-management.component';
import { FeedbackManagementComponent } from './components/admin/feedback-management/feedback-management.component';

// Customer components
import { CustomerDashboardComponent } from './components/customer/services-pricing/customer-dashboard.component';
import { AppointmentComponent } from './components/customer/appointment/appointment.component';
import { TranactionHitoryComponent } from './components/customer/tranaction-hitory/tranaction-hitory.component';
import { ProfileComponent as CustomerProfileComponent } from './components/customer/profile/profile.component';

// Employee components
import { DashboardComponent as EmployeeDashboardComponent } from './components/employee/dashboard/dashboard.component';
import { CarWashBookingComponent as EmployeeCarWashBookingComponent } from './components/employee/car-wash-booking/car-wash-booking.component';
import { CustomerRecordsComponent } from './components/employee/customer-records/customer-records.component';
import { InventoryComponent } from './components/employee/inventory/inventory.component';
import { ProfileComponent as EmployeeProfileComponent } from './components/employee/profile/profile.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'customer', component: CustomerLoginComponent },
  { path: 'customer-register', component: CustomerRegisterComponent },
  { path: 'admin', component: AdminLoginComponent },
  { path: 'admin-register', component: AdminRegisterComponent },
  { path: 'employee', component: EmployeeLoginComponent },
  { path: 'employee-register', component: EmployeeRegisterComponent },

  // Admin dashboard routes
  {
    path: 'admin-view',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'washing-point', component: WashingPointComponent },
      { path: 'car-wash-booking', component: CarWashBookingComponent },
      { path: 'inventory-management', component: InventoryManagementComponent },
      { path: 'employee-management', component: EmployeeManagementComponent },
      { path: 'user-management', component: UserManagementComponent },
      { path: 'manage-enquiries', component: ManageEnquiriesComponent },
      { path: 'reporting', component: ReportingComponent },
      { path: 'pages', component: PagesComponent },
      { path: 'service-management', component: ServiceManagementComponent },
      { path: 'feedback-management', component: FeedbackManagementComponent },
      { path: 'profile', component: AdminProfileComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Employee dashboard routes
  {
    path: 'employee-view',
    component: EmployeeLayoutComponent,
    children: [
      { path: 'dashboard', component: EmployeeDashboardComponent },
      { path: 'car-wash-booking', component: EmployeeCarWashBookingComponent },
      { path: 'customer-records', component: CustomerRecordsComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'profile', component: EmployeeProfileComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Customer dashboard routes
  {
    path: 'customer-view',
    component: CustomerLayoutComponent,
    children: [
      {
        path: 'profile',
        component: CustomerProfileComponent,
      },
      {
        path: 'appointment',
        component: AppointmentComponent,
      },
      {
        path: 'services',
        component: CustomerDashboardComponent,
      },
      { path: 'tranaction-hitory', component: TranactionHitoryComponent },
      { path: '', redirectTo: 'services', pathMatch: 'full' },
    ],
  },
];
