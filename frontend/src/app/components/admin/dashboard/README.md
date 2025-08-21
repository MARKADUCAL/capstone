# Admin Dashboard

A comprehensive dashboard for AutoWash Hub administrators to monitor business performance, manage bookings, and track key metrics.

## Features

### 📊 Real-time Statistics

- **Total Customers**: Number of registered customers
- **Total Bookings**: All-time booking count
- **Total Employees**: Active staff members
- **Total Revenue**: Cumulative earnings from completed bookings
- **Completed Bookings**: Number of finished services
- **Customer Satisfaction**: Average rating (mock data)

### 📈 Analytics Charts

- **Revenue Trend**: Monthly revenue visualization with interactive line chart
- **Services Distribution**: Donut chart showing service popularity and percentages

### 📋 Recent Bookings Table

- Real-time booking data from the database
- Customer information and service details
- Booking status management (Pending, In Progress, Completed, Cancelled)
- Action menu for each booking with status updates

### 🔄 Auto-refresh & Manual Refresh

- Automatic data refresh every 5 minutes
- Manual refresh button for immediate updates
- Loading states and progress indicators

## Technical Features

### Backend Integration

- **Dashboard Summary API**: Single endpoint for all statistics
- **Revenue Analytics API**: Monthly revenue data
- **Service Distribution API**: Service popularity metrics
- **Booking Management API**: Real-time booking data and status updates

### Error Handling

- Graceful fallback to mock data if API fails
- User-friendly error messages via snackbar notifications
- Loading states for better user experience

### Performance Optimizations

- Parallel data loading for faster dashboard initialization
- Efficient API calls with single summary endpoint
- Chart.js integration for smooth animations
- Responsive design for all screen sizes

## API Endpoints

### Dashboard Summary

```
GET /api/get_dashboard_summary
```

Returns all dashboard statistics in a single call.

### Revenue Analytics

```
GET /api/get_revenue_analytics
```

Returns monthly revenue data for the last 6 months.

### Service Distribution

```
GET /api/get_service_distribution
```

Returns service popularity and booking counts.

### Booking Management

```
GET /api/get_all_bookings
PUT /api/update_booking_status
```

## Usage

### Viewing Dashboard

1. Navigate to the admin dashboard
2. Dashboard loads automatically with real-time data
3. Charts and statistics update automatically every 5 minutes

### Managing Bookings

1. View recent bookings in the table
2. Click the three-dot menu for each booking
3. Select appropriate action:
   - **View Details**: See booking information (coming soon)
   - **Mark as Completed**: Update status to completed
   - **Start Service**: Change status to "In Progress"
   - **Cancel Booking**: Cancel the booking

### Refreshing Data

- Click the "Refresh" button in the top-right corner
- Dashboard will reload all data and charts
- Loading indicators show progress

## Responsive Design

The dashboard is fully responsive and works on:

- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile devices (up to 767px)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Dependencies

### Frontend

- Angular 17+
- Angular Material
- Chart.js
- RxJS

### Backend

- PHP 8.0+
- MySQL/MariaDB
- PDO

## Development

### Running Locally

1. Start the backend server (PHP)
2. Start the Angular development server
3. Navigate to the admin dashboard
4. Ensure database connection is working

### Customization

- Modify chart colors in the CSS file
- Add new statistics by extending the BusinessStats interface
- Create new API endpoints for additional metrics
- Customize refresh intervals in the component

## Troubleshooting

### Common Issues

1. **Charts not loading**: Check if Chart.js is properly imported
2. **API errors**: Verify backend server is running and database is connected
3. **Slow loading**: Check network connection and API response times
4. **Data not updating**: Ensure auto-refresh is enabled and working

### Debug Mode

Enable browser developer tools to see:

- API request/response logs
- Chart.js initialization messages
- Error messages and stack traces

## Future Enhancements

- [ ] Real-time notifications for new bookings
- [ ] Export dashboard data to PDF/Excel
- [ ] Custom date range filters
- [ ] Advanced analytics and forecasting
- [ ] Integration with payment gateways
- [ ] Customer feedback and ratings system
- [ ] Employee performance metrics
- [ ] Inventory tracking integration
