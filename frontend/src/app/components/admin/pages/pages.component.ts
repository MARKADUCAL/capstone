import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

interface Service {
  name: string;
  imageUrl: string;
}

interface Location {
  name: string;
  address: string;
  phone: string;
}

interface ContactInfo {
  address: string;
  openingHours: string;
  phone: string;
  email: string;
}

interface GalleryImage {
  url: string;
  alt: string;
}

interface LandingPageContent {
  heroTitle: string;
  heroDescription: string;
  services: Service[];
  locations: Location[];
  galleryImages: GalleryImage[];
  contactInfo: ContactInfo;
}

@Component({
  selector: 'app-pages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './pages.component.html',
  styleUrl: './pages.component.css',
})
export class PagesComponent implements OnInit {
  content: LandingPageContent = {
    heroTitle: 'CARWASHING MADE EASY',
    heroDescription:
      'AutoWash Hub is one of the most convenient indoor, in-bay, and outdoor carwash specialists offering quality services including body wash, interior vacuum, and more.',
    services: [
      { name: 'BASIC CAR WASH', imageUrl: 'assets/basiccarwash.png' },
      { name: 'TIRE BLACK', imageUrl: 'assets/tireblack.png' },
      { name: 'BODY WAX', imageUrl: 'assets/bodywax.png' },
      { name: 'VACUUM', imageUrl: 'assets/vacuum.png' },
    ],
    locations: [
      {
        name: 'Elite Auto Spa',
        address: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
        phone: '9876543210',
      },
      {
        name: 'Sparkle Car Wash',
        address: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
        phone: '9876543210',
      },
      {
        name: 'AquaShine Auto Spa',
        address: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
        phone: '9876543210',
      },
      {
        name: 'Glide & Shine Car Wash',
        address: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
        phone: '9876543210',
      },
    ],
    galleryImages: [
      { url: 'assets/car1.png', alt: 'Car 1' },
      { url: 'assets/car2.png', alt: 'Car 2' },
      { url: 'assets/car3.png', alt: 'Car 3' },
      { url: 'assets/car4.png', alt: 'Car 4' },
      { url: 'assets/car5.png', alt: 'Car 5' },
      { url: 'assets/car6.png', alt: 'Car 6' },
    ],
    contactInfo: {
      address: '1234 Sunset Avenue, Downtown, Los Angeles, CA 90012',
      openingHours: 'MON - FRI, 8:00am - 9:00pm',
      phone: '09123456789',
      email: 'Example123email.com',
    },
  };

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // Load content from backend service (to be implemented)
  }

  addService(): void {
    this.content.services.push({ name: '', imageUrl: '' });
  }

  removeService(index: number): void {
    this.content.services.splice(index, 1);
  }

  addLocation(): void {
    this.content.locations.push({ name: '', address: '', phone: '' });
  }

  removeLocation(index: number): void {
    this.content.locations.splice(index, 1);
  }

  addGalleryImage(): void {
    this.content.galleryImages.push({ url: '', alt: '' });
  }

  removeGalleryImage(index: number): void {
    this.content.galleryImages.splice(index, 1);
  }

  saveChanges(): void {
    // TODO: Implement save to backend service
    this.snackBar.open('Changes saved successfully!', 'Close', {
      duration: 3000,
    });
  }
}
