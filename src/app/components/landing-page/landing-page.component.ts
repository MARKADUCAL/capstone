import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-page',
  imports: [RouterModule, CommonModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent {
  mobileMenuOpen = false;
  showModal = false;

  constructor(private router: Router) {}

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  onBookNowClick() {
    this.showModal = true;
  }

  confirmBooking() {
    this.showModal = false;
    this.router.navigate(['/customer']);
  }

  cancelBooking() {
    this.showModal = false;
  }
}
