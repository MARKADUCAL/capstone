import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { CustomerLoginComponent } from './features/authentication/login/customer-login/customer-login.component';
import { CustomerRegisterComponent } from './features/authentication/register/customer-register/customer-register.component';
import { AdminLoginComponent } from './features/authentication/login/admin-login/admin-login.component';
import { EmployeeLoginComponent } from './features/authentication/login/employee-login/employee-login.component';
import { CustomerLayoutComponent } from './layout/customer-layout/customer-layout.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'customer-login', component: CustomerLoginComponent },
  { path: 'customer-register', component: CustomerRegisterComponent },
  { path: 'admin', component: AdminLoginComponent },
  { path: 'employee', component: EmployeeLoginComponent },
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
