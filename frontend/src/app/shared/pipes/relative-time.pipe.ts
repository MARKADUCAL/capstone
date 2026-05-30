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

    // Convert UTC to Philippine Time (UTC+8)
    const phtDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    const now = new Date(new Date().getTime() + (8 * 60 * 60 * 1000));

    const diffMs = now.getTime() - phtDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[phtDate.getMonth()];
    const day = phtDate.getDate();
    const year = phtDate.getFullYear();

    return `${month} ${day}${year !== now.getFullYear() ? ', ' + year : ''}`;
  }
}
