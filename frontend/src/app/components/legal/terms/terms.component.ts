import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.css'],
})
export class TermsComponent implements OnInit {
  backButtonText: string = 'Back to Home';
  backButtonRoute: string = '/';

  constructor(
    private navigationService: NavigationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if user came from a register page
    if (this.navigationService.isFromRegisterPage()) {
      this.backButtonText = 'Back to Register';
      this.backButtonRoute = this.navigationService.getRegisterRoute();
    }
  }

  onBackClick(): void {
    if (this.navigationService.isFromRegisterPage()) {
      this.navigationService.navigateBackToRegister();
    } else {
      this.navigationService.navigateBackToRegister(); // This will go to home if not from register
    }
  }
}
