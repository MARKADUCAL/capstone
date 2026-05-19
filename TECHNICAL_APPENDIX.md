# Appendix A: Core System Source Code

## 1. Main Application Entry Points

### Backend Server Setup

**File:** `backend/autowash-hub-api/api/routes.php`

```php
<?php
// CORS headers - Set immediately to avoid any issues
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Define allowed origins
$allowedOrigins = [
    'https://capstone-alpha-lac.vercel.app',
    'https://capstone-70tgpmfq9-markaducals-projects.vercel.app',
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'https://autowashhub.online',
    'https://www.leydiboss.online',
    'https://leydiboss.online'
];

// Check if origin is allowed (exact match or pattern matching)
$isAllowed = in_array($origin, $allowedOrigins)
    || preg_match('/^https:\/\/.*\.vercel\.app$/', $origin)
    || preg_match('/^https:\/\/.*\.hostingersite\.com$/', $origin)
    || preg_match('/^https:\/\/.*autowashhub\.online$/', $origin);

// Set CORS headers
if ($isAllowed) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:4200");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

// Handle preflight OPTIONS request immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "./config/env.php";
loadEnv(__DIR__ . '/.env');

// Include required modules
require_once "./autoload.php";
require_once "./modules/get.php";
require_once "./modules/post.php";
require_once "./modules/put.php";
require_once "./modules/upload.php";
require_once "./config/database.php";

// Manually include JWT library
require_once "./vendor/firebase/php-jwt/JWT.php";

use Firebase\JWT\JWT;

// Get the request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$request = $_SERVER['REQUEST_URI'];

// Create database connection
$connection = new Connection();
$pdo = $connection->connect();

// Initialize modules
$post = new Post($pdo);
$get = new Get($pdo);
$put = new Put($pdo);
$uploadHandler = new UploadHandler($pdo);

// Handle OPTIONS request (CORS preflight)
if ($method === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit();
}

// Handle GET requests
if ($method === 'GET') {
    $pathOnly = parse_url($request, PHP_URL_PATH);
    if ($pathOnly && strpos($pathOnly, 'file/') !== false) {
        $parts = explode('/', $pathOnly);
        $filename = end($parts);
        $uploadHandler->serveFile($filename);
        exit();
    }
}
?>
```

### Frontend Entry Point

**File:** `frontend/src/main.ts`

```typescript
import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

if (isBrowser) {
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err),
  );
}
```

### Root Angular Component

**File:** `frontend/src/app/app.component.ts`

```typescript
import { Component, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { inject } from "@vercel/analytics";

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  title = "autowash-hub";

  ngOnInit(): void {
    inject();
  }
}
```

---

## 2. Database Models / Schemas

### Database Connection Configuration

**File:** `backend/autowash-hub-api/api/config/database.php`

```php
<?php
date_default_timezone_set("Asia/Manila");

define("SERVER", "localhost");
define("DATABASE", "u835265537_database");
define("USER", "u835265537_autowash");
define("PASSWORD", "Remegio030304");
define("DRIVER", "mysql");

class Connection {
    private $connectionString = DRIVER . ":host=" . SERVER . ";dbname=" . DATABASE . ";charset=utf8mb4";
    private $options = [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        \PDO::ATTR_EMULATE_PREPARES => false
    ];

    public function connect() {
        try {
            return new \PDO($this->connectionString, USER, PASSWORD, $this->options);
        } catch (\PDOException $e) {
            throw new \PDOException("Connection failed: " . $e->getMessage());
        }
    }
}
?>
```

### Booking Model & Interfaces

**File:** `frontend/src/app/models/booking.model.ts`

```typescript
export interface BookingForm {
  vehicleType: string;
  services: string;
  servicePackage?: string;
  plateNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  firstName: string;
  lastName: string;
  phone: string;
  additionalPhone: string;
  washDate: string;
  washTime: string;
  paymentType: string;
  onlinePaymentOption?: string;
  notes: string;
}

export interface Booking extends BookingForm {
  id: string;
  status: BookingStatus;
  dateCreated: string;
  price?: number;
  assignedEmployeeId?: number;
  rejectionReason?: string;
}

export enum BookingStatus {
  PENDING = "pending",
  APPROVED = "approved",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REJECTED = "rejected",
}

export const VEHICLE_TYPES = [
  "S - Sedans",
  "M - SUVs",
  "L - Vans",
  "XL - Larger vehicles",
];

export const SERVICE_PACKAGES = [
  "p1 - Wash only",
  "p2 - Wash / Vacuum",
  "p3 - Wash / Vacuum / Hand Wax",
  "p4 - Wash / Vacuum / Buffing Wax",
];

export const PAYMENT_TYPES = ["Cash", "Online Payment"];
```

### Service Packages & Pricing Schema

**File:** `backend/autowash-hub-api/database/create_services_package_tables.sql`

```sql
CREATE TABLE IF NOT EXISTS service_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(10) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vehicle_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_type VARCHAR(10) NOT NULL,
    service_package VARCHAR(10) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    UNIQUE KEY unique_package_vehicle (vehicle_type, service_package),
    FOREIGN KEY (vehicle_type) REFERENCES vehicle_types(code) ON DELETE CASCADE,
    FOREIGN KEY (service_package) REFERENCES service_packages(name) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO vehicle_types (code, description) VALUES
    ('S', 'SEDANS'), ('M', 'SUVs'), ('L', 'VANs'), ('XL', 'Larger vehicles');

INSERT INTO service_packages (name, description) VALUES
    ('p1', 'Wash only'), ('p2', 'Wash / Vacuum'),
    ('p3', 'Wash / Vacuum / Hand Wax'), ('p4', 'Wash / Vacuum / Buffing Wax');

INSERT INTO pricing (vehicle_type, service_package, price) VALUES
    ('S', 'p1', 140), ('S', 'p2', 180), ('S', 'p3', 220), ('S', 'p4', 260),
    ('M', 'p1', 160), ('M', 'p2', 200), ('M', 'p3', 240), ('M', 'p4', 280),
    ('L', 'p1', 180), ('L', 'p2', 220), ('L', 'p3', 260), ('L', 'p4', 300),
    ('XL', 'p1', 200), ('XL', 'p2', 240), ('XL', 'p3', 280), ('XL', 'p4', 320);
```

### Customer Vehicles Schema

**File:** `backend/autowash-hub-api/database/create_customer_vehicles_table.sql`

```sql
CREATE TABLE IF NOT EXISTS customer_vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    nickname VARCHAR(100),
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    vehicle_color VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Password Reset Tokens Schema

**File:** `backend/autowash-hub-api/database/create_password_reset_table.sql`

```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    user_type ENUM('customer', 'admin', 'employee') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 3. Routes & Controllers

### Application Routes

**File:** `frontend/src/app/app.routes.ts`

```typescript
export const routes: Routes = [
  { path: "", component: LandingPageComponent },
  { path: "login", component: CustomerLoginComponent },
  { path: "register", component: CustomerRegisterComponent },

  // Admin Routes
  {
    path: "admin-view",
    component: AdminLayoutComponent,
    children: [
      { path: "dashboard", component: DashboardComponent },
      { path: "employee-management", component: EmployeeManagementComponent },
      { path: "car-wash-booking", component: CarWashBookingComponent },
    ],
  },

  // Employee Routes
  {
    path: "employee-view",
    component: EmployeeLayoutComponent,
    children: [
      { path: "dashboard", component: EmployeeDashboardComponent },
      { path: "car-wash-booking", component: EmployeeCarWashBookingComponent },
    ],
  },

  // Customer Routes
  {
    path: "customer-view",
    component: CustomerLayoutComponent,
    children: [
      { path: "services", component: ServicesPricingComponent },
      { path: "appointment", component: AppointmentComponent },
    ],
  },
];
```

### Backend Global Methods

**File:** `backend/autowash-hub-api/api/modules/global.php`

```php
<?php
class GlobalMethods {
    public function sendPayload($data, $remarks, $message, $code) {
        $status = array("remarks" => $remarks, "message" => $message);
        http_response_code($code);
        return array(
            "status" => $status,
            "payload" => $data,
            "prepared_by" => "Mark",
            "timestamp" => date('c')
        );
    }
}
?>
```

### Frontend Authentication Service

**File:** `frontend/src/app/core/services/auth.servide.ts`

```typescript
@Injectable({ providedIn: "root" })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = "auth_token";
  private userKey = "current_user";

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.tokenKey);
      const userStr = localStorage.getItem(this.userKey);
      if (token && userStr) {
        this.currentUserSubject.next(JSON.parse(userStr));
      }
    }
  }

  login(credentials: LoginRequest): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(`${this.apiUrl}/login_customer`, credentials)
      .pipe(
        tap((response) => {
          if (response.status.remarks === "success" && response.payload) {
            this.storeAuth(response.payload.token, response.payload.user);
            this.currentUserSubject.next(response.payload.user);
          }
        }),
        catchError((error) => throwError(() => new Error("Login failed"))),
      );
  }

  logout(): void {
    this.clearStoredAuth();
    this.currentUserSubject.next(null);
    this.router.navigate(["/login"]);
  }

  isAuthenticated(): boolean {
    return !!(this.getToken() && this.getCurrentUser());
  }

  private storeAuth(token: string, user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  private clearStoredAuth(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId)
      ? localStorage.getItem(this.tokenKey)
      : null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
```

---

## 4. System Architecture

### Technology Stack

- **Backend:** PHP 7.4+, MySQL/MariaDB
- **Frontend:** Angular 17+, TypeScript
- **Authentication:** JWT (Firebase/PHP-JWT)
- **Deployment:** Vercel (frontend), Hostinger (backend)
- **API Pattern:** RESTful with CORS support

### Core Components

- **Database Connection:** PDO with prepared statements
- **Authentication:** Token-based JWT with localStorage persistence
- **API Response:** Standardized payload format with remarks, message, and data
- **User Roles:** Admin, Employee, Customer with role-based routing

### Database Relationships

- `customers` → `customer_vehicles` (1:N)
- `customers` → `bookings` (1:N)
- `employees` → `bookings` (1:N)
- `vehicle_types` ↔ `pricing` (N:M)
- `service_packages` ↔ `pricing` (N:M)

---

**End of Technical Appendix**
