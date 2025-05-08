import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './employee-layout.component.html',
  styleUrl: './employee-layout.component.css',
  standalone: true,
})
export class EmployeeLayoutComponent {}
