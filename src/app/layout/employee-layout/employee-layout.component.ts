import { Component, HostListener } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  RouterModule,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-employee-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    RouterModule,
    ClickOutsideDirective,
  ],
  templateUrl: './employee-layout.component.html',
  styleUrl: './employee-layout.component.css',
  standalone: true,
})
export class EmployeeLayoutComponent {
  showDropdown = false;
  sidebarActive = false;

  constructor(private router: Router) {}

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  hideDropdown() {
    this.showDropdown = false;
  }

  toggleSidebar() {
    this.sidebarActive = !this.sidebarActive;

    // Prevent scrolling of the body when sidebar is open on mobile
    if (this.sidebarActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  closeSidebarOnMobile() {
    if (window.innerWidth < 768) {
      this.sidebarActive = false;
      document.body.style.overflow = 'auto';
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (window.innerWidth > 768 && this.sidebarActive) {
      this.sidebarActive = false;
      document.body.style.overflow = 'auto';
    }
  }

  logout() {
    // Clear any local storage items
    localStorage.removeItem('employee_token');

    // Close the dropdown
    this.hideDropdown();

    // Navigate to login page
    this.router.navigate(['/employee']);
  }
}
