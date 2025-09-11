import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LandingPageContent {
  hero: {
    title: string;
    description: string;
    background_url: string;
  };
  services: Array<{
    name: string;
    image_url: string;
  }>;
  gallery: Array<{
    url: string;
    alt: string;
  }>;
  contact_info: {
    address: string;
    opening_hours: string;
    phone: string;
    email: string;
  };
  footer: {
    address: string;
    phone: string;
    email: string;
    copyright: string;
    facebook: string;
    instagram: string;
    twitter: string;
    tiktok: string;
  };
}

export interface ApiResponse<T> {
  status: {
    remarks: string;
    message: string;
  };
  payload: T;
}

@Injectable({
  providedIn: 'root',
})
export class LandingPageService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  // Get all landing page content
  getLandingPageContent(): Observable<ApiResponse<LandingPageContent> | null> {
    return this.http.get<ApiResponse<LandingPageContent> | null>(
      `${this.apiUrl}/landing_page_content`,
      { headers: this.getHeaders() }
    );
  }

  // Get specific section content
  getSectionContent(sectionName: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/landing_page_section/${sectionName}`,
      { headers: this.getHeaders() }
    );
  }

  // Update landing page content
  updateLandingPageContent(
    content: LandingPageContent
  ): Observable<ApiResponse<any> | null> {
    const url = `${this.apiUrl}/update_landing_page_content`;
    const headers = this.getHeaders();

    console.log('=== HTTP POST REQUEST ===');
    console.log('URL:', url);
    console.log('Headers:', headers);
    console.log('Body:', content);
    console.log('Body type:', typeof content);
    console.log('Body stringified:', JSON.stringify(content));

    return this.http.post<ApiResponse<any> | null>(url, content, { headers });
  }

  // Update specific section
  updateSection(
    sectionName: string,
    content: any
  ): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/update_landing_page_section/${sectionName}`,
      content,
      { headers: this.getHeaders() }
    );
  }

  // Test routing endpoint
  testRouting(): Observable<ApiResponse<any>> {
    console.log(
      'Testing routing with URL:',
      `${this.apiUrl}/test_landing_page_routing`
    );
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/test_landing_page_routing`,
      { headers: this.getHeaders() }
    );
  }

  // Test POST endpoint
  testPostRouting(): Observable<ApiResponse<any>> {
    const testData = { test: 'data', timestamp: new Date().toISOString() };
    console.log(
      'Testing POST routing with URL:',
      `${this.apiUrl}/test_landing_page_post`
    );
    console.log('Test data:', testData);

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/test_landing_page_post`,
      testData,
      { headers: this.getHeaders() }
    );
  }

  // Helper method to convert frontend format to backend format
  convertToBackendFormat(frontendContent: any): LandingPageContent {
    return {
      hero: {
        title: frontendContent.heroTitle || '',
        description: frontendContent.heroDescription || '',
        background_url: frontendContent.heroBackgroundUrl || '',
      },
      services: (frontendContent.services || []).map((service: any) => ({
        name: service.name || '',
        image_url: service.imageUrl || service.image_url || '',
      })),
      gallery: frontendContent.galleryImages || [],
      contact_info: {
        address: frontendContent.contactInfo?.address || '',
        opening_hours: frontendContent.contactInfo?.openingHours || '',
        phone: frontendContent.contactInfo?.phone || '',
        email: frontendContent.contactInfo?.email || '',
      },
      footer: {
        address: frontendContent.footer?.address || '',
        phone: frontendContent.footer?.phone || '',
        email: frontendContent.footer?.email || '',
        copyright: frontendContent.footer?.copyright || '',
        facebook: frontendContent.footer?.facebook || '',
        instagram: frontendContent.footer?.instagram || '',
        twitter: frontendContent.footer?.twitter || '',
        tiktok: frontendContent.footer?.tiktok || '',
      },
    };
  }

  // Helper method to convert backend format to frontend format
  convertToFrontendFormat(backendContent: LandingPageContent): any {
    return {
      heroTitle: backendContent.hero?.title || '',
      heroDescription: backendContent.hero?.description || '',
      heroBackgroundUrl: backendContent.hero?.background_url || '',
      services: (backendContent.services || []).map((service: any) => ({
        name: service.name || '',
        imageUrl: service.image_url || service.imageUrl || '',
      })),
      galleryImages: backendContent.gallery || [],
      contactInfo: {
        address: backendContent.contact_info?.address || '',
        openingHours: backendContent.contact_info?.opening_hours || '',
        phone: backendContent.contact_info?.phone || '',
        email: backendContent.contact_info?.email || '',
      },
      footer: {
        address: backendContent.footer?.address || '',
        phone: backendContent.footer?.phone || '',
        email: backendContent.footer?.email || '',
        copyright: backendContent.footer?.copyright || '',
        facebook: backendContent.footer?.facebook || '',
        instagram: backendContent.footer?.instagram || '',
        twitter: backendContent.footer?.twitter || '',
        tiktok: backendContent.footer?.tiktok || '',
      },
    };
  }
}
