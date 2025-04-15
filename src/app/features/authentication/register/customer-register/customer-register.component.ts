import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-register.component.html',
  styleUrl: './customer-register.component.css',
})
export class CustomerRegisterComponent {
  customer = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  };

  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit(): void {
    // Basic validation
    if (this.customer.password !== this.customer.confirm_password) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
  }
}
