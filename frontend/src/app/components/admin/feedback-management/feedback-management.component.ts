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

    this.subscription.add(
      this.feedbackService.getAllFeedback(100).subscribe({
        next: (feedback) => {
          console.log('✅ Feedback loaded successfully:', feedback);
          this.feedbackList = feedback;
          this.applyFilters();
          this.calculatePagination();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading feedback:', error);
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
        (feedback) => feedback.rating === this.ratingFilter
      );
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (feedback) =>
          feedback.comment?.toLowerCase().includes(searchLower) ||
          feedback.customer_name?.toLowerCase().includes(searchLower) ||
          feedback.service_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (this.currentFilter !== 'all') {
      switch (this.currentFilter) {
        case 'positive':
          filtered = filtered.filter((feedback) => feedback.rating >= 4);
          break;
        case 'neutral':
          filtered = filtered.filter((feedback) => feedback.rating === 3);
          break;
        case 'negative':
          filtered = filtered.filter((feedback) => feedback.rating <= 2);
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
        return this.feedbackList.filter((f) => f.rating >= 4).length;
      case 'neutral':
        return this.feedbackList.filter((f) => f.rating === 3).length;
      case 'negative':
        return this.feedbackList.filter((f) => f.rating <= 2).length;
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

  openViewModal(feedback: CustomerFeedback): void {
    this.selectedFeedback = feedback;
    this.isViewModalOpen = true;
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedFeedback = null;
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
}
