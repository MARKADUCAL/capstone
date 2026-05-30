import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timezone',
  standalone: true,
})
export class TimezonePipe implements PipeTransform {
  transform(value: string | Date | null, format: string = 'MMM d, y h:mm a'): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';

    // Convert UTC to Philippine Time (UTC+8)
    const phtDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));

    return this.formatDate(phtDate, format);
  }

  private formatDate(date: Date, format: string): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();
    const dayName = days[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const hours12 = String(date.getHours() % 12 || 12).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

    return format
      .replace('MMM', month)
      .replace('d', String(day))
      .replace('y', String(year))
      .replace('h:mm a', `${hours12}:${minutes} ${ampm}`)
      .replace('HH:mm:ss', `${hours}:${minutes}:${seconds}`);
  }
}
