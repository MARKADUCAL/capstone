import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-customer-layout',
  imports: [RouterModule, CommonModule],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.css',
  standalone: true,
})
export class CustomerLayoutComponent {
  showDropdown = false;

  constructor(private router: Router) {}

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    // Clear the local storage or cookies
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');

    // Redirect to login page
    this.router.navigate(['/customer-login']);

    // Close dropdown
    this.showDropdown = false;
  }
}
