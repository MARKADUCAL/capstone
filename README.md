# AutoWashHub - Car Wash Management System

AutoWashHub is a comprehensive car wash management system built with Angular frontend and PHP backend, designed to streamline the booking and management of car wash services. The system provides both customer-facing booking interfaces and employee management tools.

## Features

### Customer Portal

- Easy appointment booking system
- Real-time slot availability checking
- Service selection and customization
- Booking management (view, cancel, pay)
- Status tracking for bookings

### Employee Dashboard

- Inventory management system
  - Stock tracking
  - Item management
  - Usage monitoring
- Appointment management
  - View and manage customer bookings
  - Status updates
  - Service tracking

## Prerequisites

Before running this application, make sure you have the following installed:

- PHP 8.0 or higher
- MySQL/MariaDB
- Apache/Nginx web server
- Angular CLI (v19.2.4)
- Composer (PHP package manager)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/autowashhub.git
cd autowashhub
```

2. Install Angular dependencies:

```bash
npm install
```

3. Install PHP dependencies:

```bash
cd backend
composer install
```

4. Configure your database:

- Create a new MySQL database
- Copy `.env.example` to `.env` and update database credentials
- Run database migrations:

```bash
php artisan migrate
```

## Development Server

To start the Angular development server:

```bash
ng serve
```

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload when you make changes to the source files.

For the PHP backend, ensure your web server is running and configured to serve the backend directory.

## Build

To build the Angular project for production:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Testing

### Frontend Tests

Run Angular unit tests via [Karma](https://karma-runner.github.io):

```bash
ng test
```

Execute end-to-end tests:

```bash
ng e2e
```

Note: You'll need to set up an e2e testing framework of your choice.

### Backend Tests

Run PHP unit tests:

```bash
cd backend
php phpunit
```

## Project Structure

```
project/
├── src/                    # Angular frontend
│   ├── app/
│   │   ├── components/
│   │   │   ├── customer/
│   │   │   │   └── appointment/
│   │   │   └── employee/
│   │   │       ├── inventory/
│   │   │       └── appointments/
│   │   ├── models/
│   │   └── services/
│   ├── assets/
│   └── environments/
│
└── backend/               # PHP backend
    ├── api/              # API endpoints
    ├── config/           # Configuration files
    ├── database/         # Database migrations and seeds
    └── models/           # PHP model classes
```

## Code Scaffolding

Generate new Angular components, directives, pipes, services, classes, guards, interfaces, enums, or modules:

```bash
ng generate component component-name
# or
ng generate directive|pipe|service|class|guard|interface|enum|module
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Additional Resources

- [Angular Documentation](https://angular.dev/)
- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Angular Material](https://material.angular.io/)
- [PHP Documentation](https://www.php.net/docs.php)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
