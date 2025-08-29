import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  imageUrl: string;
  category?: string;
  dateOfInput?: string;
}

export interface InventoryRequest {
  id?: number;
  item_id: number;
  item_name: string;
  quantity: number;
  employee_id: string;
  employee_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  request_date: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get all inventory items
  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<any>(`${this.apiUrl}/get_inventory`).pipe(
      map((response) => {
        if (response?.status?.remarks === 'success') {
          return (response.payload?.inventory || []).map((i: any) => ({
            id: i.id,
            name: i.name,
            imageUrl: i.image_url || 'assets/logo.jpg',
            stock: Number(i.stock) || 0,
            category: i.category || 'General',
          }));
        }
        return [];
      })
    );
  }

  // Get all inventory requests
  getInventoryRequests(): Observable<InventoryRequest[]> {
    console.log(
      'Service: Making request to:',
      `${this.apiUrl}/get_inventory_requests`
    );
    return this.http.get<any>(`${this.apiUrl}/get_inventory_requests`).pipe(
      map((response) => {
        console.log('Service: Raw response:', response);
        if (response?.status?.remarks === 'success') {
          const requests = response.payload?.inventory_requests || [];
          console.log('Service: Extracted requests:', requests);
          return requests;
        }
        console.log('Service: No success status, returning empty array');
        return [];
      })
    );
  }

  // Add new inventory item (admin only)
  addInventoryItem(item: Partial<InventoryItem>): Observable<any> {
    return this.http.post(`${this.apiUrl}/add_inventory_item`, item);
  }

  // Update inventory item (admin only)
  updateInventoryItem(item: Partial<InventoryItem>): Observable<any> {
    return this.http.put(`${this.apiUrl}/update_inventory_item`, item);
  }

  // Delete inventory item (admin only)
  deleteInventoryItem(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/inventory/${id}`);
  }

  // Submit inventory request (employee)
  submitInventoryRequest(request: InventoryRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/add_inventory_request`, request);
  }

  // Update inventory request status (admin)
  updateInventoryRequest(request: Partial<InventoryRequest>): Observable<any> {
    return this.http.put(`${this.apiUrl}/update_inventory_request`, request);
  }

  // Take item for employee (admin)
  takeItemForEmployee(
    itemId: number,
    quantity: number,
    employeeId: string,
    employeeName: string
  ): Observable<any> {
    const payload = {
      item_id: itemId,
      quantity: quantity,
      employee_id: employeeId,
      employee_name: employeeName,
    };
    return this.http.post(`${this.apiUrl}/take_inventory_item`, payload);
  }

  // Get stock status for display
  getStockStatus(stock: number): { status: string; color: string } {
    if (stock === 0) {
      return { status: 'Out of Stock', color: '#dc3545' };
    } else if (stock <= 5) {
      return { status: 'Low Stock', color: '#ffc107' };
    } else {
      return { status: 'In Stock', color: '#28a745' };
    }
  }
}
