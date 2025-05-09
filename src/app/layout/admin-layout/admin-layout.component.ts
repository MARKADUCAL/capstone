import { Component } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
  standalone: true,
})
export class AdminLayoutComponent {
  showDropdown = false;

  constructor(private router: Router) {}

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    // Clear the local storage or cookies
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');

    // Redirect to login page
    this.router.navigate(['/admin']);

    // Close dropdown
    this.showDropdown = false;
  }
}
