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
    const timestamp = new Date().getTime();
    return this.http.get<ApiResponse<LandingPageContent> | null>(
      `${this.apiUrl}/landing_page_content?t=${timestamp}`,
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
    // Backend handles landing page updates under PUT (with multiple aliases)
    const url = `${this.apiUrl}/save_landing_page_content`;
    const headers = this.getHeaders();

    console.log('=== HTTP PUT REQUEST ===');
    console.log('URL:', url);
    console.log('Headers:', headers);
    console.log('Body:', content);
    console.log('Body type:', typeof content);
    console.log('Body stringified:', JSON.stringify(content));

    return this.http.put<ApiResponse<any> | null>(url, content, { headers });
  }

  // Update specific section
  updateSection(
    sectionName: string,
    content: any
  ): Observable<ApiResponse<any>> {
    // Backend expects PUT for landing page section updates
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/save_landing_page_section/${sectionName}`,
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
    const stripDataUrl = (val: string | undefined | null): string => {
      if (!val) return '';
      return String(val).startsWith('data:') ? '' : String(val);
    };
    return {
      hero: {
        title: frontendContent.heroTitle || '',
        description: frontendContent.heroDescription || '',
        background_url: stripDataUrl(frontendContent.heroBackgroundUrl) || '',
      },
      services: (frontendContent.services || []).map((service: any) => ({
        name: service.name || '',
        image_url:
          stripDataUrl(service.imageUrl || service.image_url || '') || '',
      })),
      gallery: (frontendContent.galleryImages || []).map((g: any) => ({
        url: stripDataUrl(g.url),
        alt: g.alt,
      })),
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
    const normalizeFileUrl = (url: string | undefined | null): string => {
      if (!url) return '';
      const val = String(url);
      // If backend returned legacy API routes, prefer direct uploads path
      const apiFileMatch = val.match(/\/api\/file\/([^\/?#]+)/);
      if (apiFileMatch && apiFileMatch[1]) {
        // Convert https://host/api/file/name.jpg -> https://host/uploads/name.jpg
        return val
          .replace(/\/api\/file\/[^\/?#]+$/, `/uploads/${apiFileMatch[1]}`)
          .replace(/\/api\//, '/');
      }
      const queryMatch = val.match(/index\.php\?request=file\/([^&#]+)/);
      if (queryMatch && queryMatch[1]) {
        const base = val.split('/index.php?request=file/')[0].replace(/\/$/, '');
        return `${base.replace(/\/api$/, '')}/uploads/${queryMatch[1]}`;
      }
      return val;
    };
    return {
      heroTitle: backendContent.hero?.title || '',
      heroDescription: backendContent.hero?.description || '',
      heroBackgroundUrl:
        normalizeFileUrl(backendContent.hero?.background_url) || '',
      services: (backendContent.services || []).map((service: any) => ({
        name: service.name || '',
        imageUrl: normalizeFileUrl(service.image_url || service.imageUrl || ''),
      })),
      galleryImages: (backendContent.gallery || []).map((g: any) => ({
        url: normalizeFileUrl(g.url),
        alt: g.alt,
      })),
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
