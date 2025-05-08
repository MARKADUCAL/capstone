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

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'customer-login', component: CustomerLoginComponent },
  { path: 'customer-register', component: CustomerRegisterComponent },
  { path: 'admin-login', component: AdminLoginComponent },
  { path: 'admin-register', component: AdminRegisterComponent },
  { path: 'employee-login', component: EmployeeLoginComponent },
  { path: 'employee-register', component: EmployeeRegisterComponent },

  // Admin dashboard routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: LandingPageComponent },
      { path: 'washing-point', component: LandingPageComponent },
      { path: 'car-wash-booking', component: LandingPageComponent },
      { path: 'inventory-management', component: LandingPageComponent },
      { path: 'employee-management', component: LandingPageComponent },
      { path: 'user-management', component: LandingPageComponent },
      { path: 'manage-enquiries', component: LandingPageComponent },
      { path: 'reporting', component: LandingPageComponent },
      { path: 'pages', component: LandingPageComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Employee dashboard routes
  {
    path: 'employee',
    component: EmployeeLayoutComponent,
    children: [
      { path: 'dashboard', component: LandingPageComponent },
      { path: 'appointments', component: LandingPageComponent },
      { path: 'wash-services', component: LandingPageComponent },
      { path: 'customer-records', component: LandingPageComponent },
      { path: 'inventory', component: LandingPageComponent },
      { path: 'time-tracking', component: LandingPageComponent },
      { path: 'profile', component: LandingPageComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Customer dashboard routes
  {
    path: 'customer',
    component: CustomerLayoutComponent,
    children: [
      {
        path: 'services-pricing',
        loadComponent: () =>
          import(
            './components/customer/services-pricing/services-pricing.component'
          ).then((m) => m.ServicesPricingComponent),
      },
      {
        path: 'appointment',
        loadComponent: () =>
          import(
            './components/customer/appointment/appointment.component'
          ).then((m) => m.AppointmentComponent),
      },
      {
        path: 'tranaction-hitory',
        loadComponent: () =>
          import(
            './components/customer/tranaction-hitory/tranaction-hitory.component'
          ).then((m) => m.TranactionHitoryComponent),
      },
      { path: '', redirectTo: 'services-pricing', pathMatch: 'full' },
    ],
  },
];
