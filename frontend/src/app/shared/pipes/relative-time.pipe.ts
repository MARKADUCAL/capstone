import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | null): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';

    // Get current time in UTC
    const nowUtc = new Date();

    // Calculate difference in milliseconds (both are in UTC, so we can compare directly)
    const diffMs = nowUtc.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    // For older dates, show the date in PHT
    const phtDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    const nowPht = new Date(nowUtc.getTime() + (8 * 60 * 60 * 1000));

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[phtDate.getMonth()];
    const day = phtDate.getDate();
    const year = phtDate.getFullYear();

    return `${month} ${day}${year !== nowPht.getFullYear() ? ', ' + year : ''}`;
  }
}
