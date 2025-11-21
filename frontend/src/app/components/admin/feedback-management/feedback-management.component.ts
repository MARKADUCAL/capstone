import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FeedbackService,
  CustomerFeedback,
} from '../../../services/feedback.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-feedback-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback-management.component.html',
  styleUrl: './feedback-management.component.css',
})
export class FeedbackManagementComponent implements OnInit, OnDestroy {
  feedbackList: CustomerFeedback[] = [];
  filteredFeedback: CustomerFeedback[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Filter and search properties
  currentFilter: string = 'all';
  searchTerm: string = '';
  ratingFilter: number = 0;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // View modal
  selectedFeedback: CustomerFeedback | null = null;
  isViewModalOpen = false;
  adminCommentDraft: string = '';
  isSavingAdminComment = false;

  private subscription: Subscription = new Subscription();

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.loadFeedback();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadFeedback(): void {
    this.isLoading = true;
    this.errorMessage = null;

    console.log('🔄 Loading feedback...');

    this.subscription.add(
      this.feedbackService.getAllFeedback(100).subscribe({
        next: (feedback) => {
          console.log('✅ Feedback loaded successfully:', feedback);
          console.log('📊 Feedback count:', feedback.length);
          if (feedback.length > 0) {
            console.log('🔍 First feedback item:', feedback[0]);
          }
          this.feedbackList = feedback;
          this.applyFilters();
          this.calculatePagination();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading feedback:', error);
          console.error('🚨 Error details:', error);
          this.errorMessage = error.message || 'Failed to load feedback.';
          this.isLoading = false;
        },
      })
    );
  }

  applyFilters(): void {
    let filtered = [...this.feedbackList];

    // Apply rating filter
    if (this.ratingFilter > 0) {
      filtered = filtered.filter(
        (feedback) => this.getServiceRatingValue(feedback) === this.ratingFilter
      );
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (feedback) =>
          feedback.comment?.toLowerCase().includes(searchLower) ||
          feedback.service_comment?.toLowerCase().includes(searchLower) ||
          feedback.employee_comment?.toLowerCase().includes(searchLower) ||
          feedback.customer_name?.toLowerCase().includes(searchLower) ||
          feedback.service_name?.toLowerCase().includes(searchLower) ||
          feedback.employee_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (this.currentFilter !== 'all') {
      switch (this.currentFilter) {
        case 'positive':
          filtered = filtered.filter(
            (feedback) => this.getServiceRatingValue(feedback) >= 4
          );
          break;
        case 'neutral':
          filtered = filtered.filter(
            (feedback) => this.getServiceRatingValue(feedback) === 3
          );
          break;
        case 'negative':
          filtered = filtered.filter(
            (feedback) => this.getServiceRatingValue(feedback) <= 2
          );
          break;
        case 'public':
          filtered = filtered.filter((feedback) => feedback.is_public);
          break;
      }
    }

    this.filteredFeedback = filtered;
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(
      this.filteredFeedback.length / this.itemsPerPage
    );
  }

  getPaginatedFeedback(): CustomerFeedback[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredFeedback.slice(startIndex, endIndex);
  }

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.applyFilters();
  }

  setRatingFilter(rating: number): void {
    this.ratingFilter = rating;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.ratingFilter = 0;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getFilterCount(filter: string): number {
    if (filter === 'all') {
      return this.feedbackList.length;
    }

    switch (filter) {
      case 'positive':
        return this.feedbackList.filter(
          (f) => this.getServiceRatingValue(f) >= 4
        ).length;
      case 'neutral':
        return this.feedbackList.filter(
          (f) => this.getServiceRatingValue(f) === 3
        ).length;
      case 'negative':
        return this.feedbackList.filter(
          (f) => this.getServiceRatingValue(f) <= 2
        ).length;
      case 'public':
        return this.feedbackList.filter((f) => f.is_public).length;
      default:
        return 0;
    }
  }

  getRatingText(rating: number): string {
    const ratingTexts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return ratingTexts[rating] || '';
  }

  getRatingColor(rating: number): string {
    if (rating >= 4) return 'positive';
    if (rating === 3) return 'neutral';
    return 'negative';
  }

  getRatingIcon(rating: number): string {
    if (rating >= 4) return '⭐';
    if (rating === 3) return '⭐';
    return '⭐';
  }

  getServiceRatingValue(feedback: CustomerFeedback): number {
    return feedback.service_rating ?? feedback.rating ?? 0;
  }

  getEmployeeRatingValue(feedback: CustomerFeedback): number {
    return feedback.employee_rating ?? 0;
  }

  hasEmployeeFeedback(feedback: CustomerFeedback): boolean {
    return (
      typeof feedback.employee_rating === 'number' &&
      feedback.employee_rating > 0
    );
  }

  getServiceComment(feedback: CustomerFeedback): string | null {
    return feedback.service_comment || feedback.comment || null;
  }

  getEmployeeComment(feedback: CustomerFeedback): string | null {
    return feedback.employee_comment || null;
  }

  getEmployeeDisplayName(feedback: CustomerFeedback): string {
    if (feedback.employee_name && feedback.employee_name.trim().length > 0) {
      return feedback.employee_name;
    }
    if (feedback.employee_id) {
      return `Employee #${feedback.employee_id}`;
    }
    return 'Assigned Staff';
  }

  getEmployeeRole(feedback: CustomerFeedback): string | null {
    return feedback.employee_position || null;
  }

  getServiceRatingDescription(feedback: CustomerFeedback): string {
    const rating = this.getServiceRatingValue(feedback);
    if (rating >= 4) {
      return 'Customers loved this service experience';
    }
    if (rating === 3) {
      return 'Good service with room for improvement';
    }
    if (rating === 2) {
      return 'Service needs attention to improve satisfaction';
    }
    if (rating === 1) {
      return 'Customers reported significant issues';
    }
    return 'No service rating provided';
  }

  getEmployeeRatingDescription(feedback: CustomerFeedback): string {
    const rating = this.getEmployeeRatingValue(feedback);
    if (rating >= 4) {
      return 'Customer highlighted excellent staff performance';
    }
    if (rating === 3) {
      return 'Customer felt the staff experience was acceptable';
    }
    if (rating === 2) {
      return 'Customer saw opportunities for staff improvement';
    }
    if (rating === 1) {
      return 'Customer reported issues with staff experience';
    }
    return 'No employee feedback recorded';
  }

  openViewModal(feedback: CustomerFeedback): void {
    this.selectedFeedback = feedback;
    this.adminCommentDraft = feedback.admin_comment || '';
    this.isViewModalOpen = true;
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedFeedback = null;
    this.adminCommentDraft = '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  refreshData(): void {
    this.loadFeedback();
  }

  clearMessages(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }

  trackByFeedback(index: number, feedback: CustomerFeedback): number {
    return feedback.id || index;
  }

  saveAdminComment(): void {
    if (!this.selectedFeedback || !this.selectedFeedback.id) return;
    this.isSavingAdminComment = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.feedbackService
      .updateAdminComment(
        this.selectedFeedback.id,
        this.adminCommentDraft || ''
      )
      .subscribe({
        next: (res) => {
          this.isSavingAdminComment = false;
          this.successMessage = res.message || 'Admin comment saved';
          // Update local item
          if (res.data) {
            const idx = this.feedbackList.findIndex(
              (f) => f.id === this.selectedFeedback!.id
            );
            if (idx > -1) {
              this.feedbackList[idx] = {
                ...this.feedbackList[idx],
                admin_comment: res.data.admin_comment,
                admin_commented_at: res.data.admin_commented_at,
              } as CustomerFeedback;
              this.applyFilters();
            }
            // Reflect in modal
            if (this.selectedFeedback) {
              this.selectedFeedback.admin_comment = res.data.admin_comment;
              this.selectedFeedback.admin_commented_at =
                res.data.admin_commented_at;
            }
          }
        },
        error: (err) => {
          this.isSavingAdminComment = false;
          this.errorMessage = err?.message || 'Failed to save admin comment';
        },
      });
  }
}
