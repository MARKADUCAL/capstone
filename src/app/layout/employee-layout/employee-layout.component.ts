import { Component } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './employee-layout.component.html',
  styleUrl: './employee-layout.component.css',
  standalone: true,
})
export class EmployeeLayoutComponent {
  showDropdown = false;

  constructor(private router: Router) {}

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    // Clear the local storage or cookies
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeData');

    // Redirect to login page
    this.router.navigate(['/employee-login']);

    // Close dropdown
    this.showDropdown = false;
  }
}
