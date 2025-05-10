import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
})
export class UserManagementComponent implements OnInit {
  users: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'Johndoe@gmail.com',
      phone: '123-456-7890',
      registrationDate: '2025-03-20',
    },
  ];

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // Load users data
  }

  addUser(): void {
    // Implement add user functionality
  }

  viewUser(user: User): void {
    // Implement view user details functionality
  }

  editUser(user: User): void {
    // Implement edit functionality
  }

  deleteUser(user: User): void {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index > -1) {
      this.users.splice(index, 1);
      this.showNotification('User deleted successfully');
    }
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
