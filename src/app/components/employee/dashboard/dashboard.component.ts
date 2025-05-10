import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { Chart } from 'chart.js/auto';

interface Task {
  id: number;
  customerName: string;
  service: string;
  status: string;
  time: string;
}

interface DailyStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  customerRating: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatMenuModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  dailyStats: DailyStats = {
    totalTasks: 12,
    completedTasks: 8,
    pendingTasks: 4,
    customerRating: 4.5,
  };

  upcomingTasks: Task[] = [
    {
      id: 1,
      customerName: 'John Doe',
      service: 'Basic Wash',
      status: 'Pending',
      time: '10:00 AM',
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      service: 'Full Service',
      status: 'In Progress',
      time: '10:30 AM',
    },
    {
      id: 3,
      customerName: 'Mike Johnson',
      service: 'Interior Clean',
      status: 'Pending',
      time: '11:00 AM',
    },
    {
      id: 4,
      customerName: 'Sarah Wilson',
      service: 'Premium Wash',
      status: 'Pending',
      time: '11:30 AM',
    },
  ];

  displayedColumns: string[] = [
    'customerName',
    'service',
    'time',
    'status',
    'actions',
  ];

  private taskChart: Chart | undefined;
  private ratingChart: Chart | undefined;

  ngOnInit(): void {
    this.initializeCharts();
  }

  private initializeCharts(): void {
    // Task Distribution Chart
    const taskCtx = document.getElementById(
      'taskDistributionChart'
    ) as HTMLCanvasElement;
    if (taskCtx) {
      this.taskChart = new Chart(taskCtx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Pending'],
          datasets: [
            {
              data: [
                this.dailyStats.completedTasks,
                this.dailyStats.pendingTasks,
              ],
              backgroundColor: [
                'rgba(76, 175, 80, 0.8)',
                'rgba(255, 152, 0, 0.8)',
              ],
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
          },
        },
      });
    }

    // Performance Chart
    const perfCtx = document.getElementById(
      'performanceChart'
    ) as HTMLCanvasElement;
    if (perfCtx) {
      this.ratingChart = new Chart(perfCtx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          datasets: [
            {
              label: 'Customer Ratings',
              data: [4.3, 4.5, 4.2, 4.8, 4.5],
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 5,
              ticks: {
                stepSize: 1,
              },
            },
          },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
            },
          },
        },
      });
    }
  }

  updateTaskStatus(taskId: number, newStatus: string): void {
    const task = this.upcomingTasks.find((t) => t.id === taskId);
    if (task) {
      task.status = newStatus;
      // TODO: Update backend
    }
  }
}
