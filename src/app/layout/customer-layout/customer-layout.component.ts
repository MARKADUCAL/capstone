import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
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
  sidebarActive = false;

  constructor(private router: Router) {}

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  toggleSidebar() {
    this.sidebarActive = !this.sidebarActive;

    // Prevent scrolling of the body when sidebar is open on mobile
    if (window.innerWidth < 768) {
      document.body.style.overflow = this.sidebarActive ? 'hidden' : 'auto';
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
    if (window.innerWidth > 768) {
      // Close sidebar if it was opened on mobile
      if (this.sidebarActive) {
        this.sidebarActive = false;
        document.body.style.overflow = 'auto';
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdown when clicking outside
    const userInfoEl = document.querySelector('.user-info');
    if (
      userInfoEl &&
      !userInfoEl.contains(event.target as Node) &&
      this.showDropdown
    ) {
      this.showDropdown = false;
    }
  }

  logout() {
    // Clear the local storage or cookies
    localStorage.removeItem('customer_token');

    // Close dropdown
    this.showDropdown = false;

    // Redirect to login page
    this.router.navigate(['/customer']);
  }
}
