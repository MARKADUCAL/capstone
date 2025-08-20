<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once "global.php";

use Firebase\JWT\JWT;

class Post extends GlobalMethods
{
    private $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function executeQuery($sql)
    {
        $data = array();
        $errmsg = "";
        $code = 0;

        try {
            if ($result = $this->pdo->query($sql)->fetchAll()) {
                foreach ($result as $record) {
                    array_push($data, $record);
                }
                $code = 200;
                $result = null;
                return array("code" => $code, "data" => $data);
            } else {
                // if no record found, assign corresponding values to error messages/status
                $errmsg = "No records found";
                $code = 404;
            }
        } catch (\PDOException $e) {
            // PDO errors, mysql errors
            $errmsg = $e->getMessage();
            $code = 403;
        }
        return array("code" => $code, "errmsg" => $errmsg);
    }


    public function register_customer($data)
    {
        // Validate required fields
        if (empty($data->first_name) || empty($data->email) || empty($data->password)) {
            return $this->sendPayload(null, "failed", "Missing required fields", 400);
        }

        // Validate email format
        if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
            return $this->sendPayload(null, "failed", "Invalid email format", 400);
        }

        try {
            // Check if email already exists
            $sql = "SELECT COUNT(*) FROM customers WHERE email = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->email]);
        $count = $statement->fetchColumn();

        if ($count > 0) {
                return $this->sendPayload(null, "failed", "Email already registered", 400);
            }
        
            // Proceed with registration
            $sql = "INSERT INTO customers (first_name, last_name, email, phone, password) 
                    VALUES (?, ?, ?, ?, ?)";
            
            $statement = $this->pdo->prepare($sql);
            $hashedPassword = password_hash($data->password, PASSWORD_BCRYPT);

            $statement->execute([
                $data->first_name,
                $data->last_name ?? '',
                $data->email,
                $data->phone ?? '',
                $hashedPassword
            ]);

            if ($statement->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Successfully registered", 200);
            } else {
                return $this->sendPayload(null, "failed", "Registration failed", 400);
            }

        } catch (\PDOException $e) {
            error_log("Registration error: " . $e->getMessage());
            return $this->sendPayload(
                null, 
                "failed", 
                "Database error occurred. Please try again.", 
                500
            );
        }
    }
    
    public function login_customer($data) {
        // Validate required fields
        if (empty($data->email) || empty($data->password)) {
            return $this->sendPayload(null, "failed", "Email and password are required", 400);
        }

        try {
            // Get customer by email
            $sql = "SELECT * FROM customers WHERE email = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->email]);
            $customer = $statement->fetch(PDO::FETCH_ASSOC);

            // Check if customer exists and verify password
            if ($customer && password_verify($data->password, $customer['password'])) {
                // Generate JWT token
                $key = getenv('JWT_SECRET') ?: 'default_secret_key';
                $payload = [
                    'iss' => 'autowash_hub',
                    'aud' => 'customer',
                    'iat' => time(),
                    'exp' => time() + (60 * 60 * 24), // 24 hours
                    'data' => [
                        'id' => $customer['id'],
                        'email' => $customer['email'],
                        'first_name' => $customer['first_name'],
                        'last_name' => $customer['last_name']
                    ]
                ];
                
                $jwt = JWT::encode($payload, $key, 'HS256');
                
                // Remove password from customer data
                unset($customer['password']);
                
                return $this->sendPayload(
                    [
                        'token' => $jwt,
                        'customer' => $customer
                    ],
                    "success",
                    "Login successful",
                    200
                );
            } else {
                return $this->sendPayload(null, "failed", "Invalid email or password", 401);
            }
        } catch (\PDOException $e) {
            error_log("Login error: " . $e->getMessage());
            return $this->sendPayload(
                null,
                "failed",
                "Database error occurred. Please try again.",
                500
            );
        }
    }
    
    public function register_admin($data) {
        // Validate required fields
        if (empty($data->first_name) || empty($data->email) || empty($data->password) || empty($data->admin_id)) {
            return $this->sendPayload(null, "failed", "Missing required fields", 400);
        }

        // Validate email format
        if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
            return $this->sendPayload(null, "failed", "Invalid email format", 400);
        }
        
        // Admin key check temporarily removed

        try {
            // Check if email already exists
            $sql = "SELECT COUNT(*) FROM admins WHERE email = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->email]);
            $count = $statement->fetchColumn();

            if ($count > 0) {
                return $this->sendPayload(null, "failed", "Email already registered", 400);
            }
            
            // Check if admin_id already exists
            $sql = "SELECT COUNT(*) FROM admins WHERE admin_id = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->admin_id]);
            $count = $statement->fetchColumn();

            if ($count > 0) {
                return $this->sendPayload(null, "failed", "Admin ID already exists", 400);
            }
        
            // Proceed with registration
            $sql = "INSERT INTO admins (admin_id, first_name, last_name, email, phone, password) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            
            $statement = $this->pdo->prepare($sql);
            $hashedPassword = password_hash($data->password, PASSWORD_BCRYPT);

            $statement->execute([
                $data->admin_id,
                $data->first_name,
                $data->last_name ?? '',
                $data->email,
                $data->phone ?? '',
                $hashedPassword
            ]);

            if ($statement->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Admin successfully registered", 200);
            } else {
                return $this->sendPayload(null, "failed", "Registration failed", 400);
            }

        } catch (\PDOException $e) {
            error_log("Admin registration error: " . $e->getMessage());
            return $this->sendPayload(
                null, 
                "failed", 
                "Database error occurred. Please try again.", 
                500
            );
        }
    }
    
    public function login_admin($data) {
        // Validate required fields
        if (empty($data->email) || empty($data->password)) {
            return $this->sendPayload(null, "failed", "Email and password are required", 400);
        }

        try {
            // Get admin by email
            $sql = "SELECT * FROM admins WHERE email = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->email]);
            $admin = $statement->fetch(PDO::FETCH_ASSOC);

            // Check if admin exists and verify password
            if ($admin && password_verify($data->password, $admin['password'])) {
                // Generate JWT token
                $key = getenv('JWT_SECRET') ?: 'default_secret_key';
                $payload = [
                    'iss' => 'autowash_hub',
                    'aud' => 'admin',
                    'iat' => time(),
                    'exp' => time() + (60 * 60 * 24), // 24 hours
                    'data' => [
                        'id' => $admin['id'],
                        'email' => $admin['email'],
                        'first_name' => $admin['first_name'],
                        'last_name' => $admin['last_name']
                    ]
                ];
                
                $jwt = JWT::encode($payload, $key, 'HS256');
                
                // Remove password from admin data
                unset($admin['password']);
                
                return $this->sendPayload(
                    [
                        'token' => $jwt,
                        'admin' => $admin
                    ],
                    "success",
                    "Login successful",
                    200
                );
            } else {
                return $this->sendPayload(null, "failed", "Invalid email or password", 401);
            }
        } catch (\PDOException $e) {
            error_log("Admin login error: " . $e->getMessage());
            return $this->sendPayload(
                null,
                "failed",
                "Database error occurred. Please try again.",
                500
            );
        }
    }

    public function register_employee($data) {
        // Validate required fields
        if (empty($data->first_name) || empty($data->email) || empty($data->password) || empty($data->employee_id) || empty($data->position)) {
            return $this->sendPayload(null, "failed", "Missing required fields", 400);
        }

        // Validate email format
        if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
            return $this->sendPayload(null, "failed", "Invalid email format", 400);
        }

        try {
            // Check if email already exists
            $sql = "SELECT COUNT(*) FROM employees WHERE email = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->email]);
            $count = $statement->fetchColumn();

            if ($count > 0) {
                return $this->sendPayload(null, "failed", "Email already registered", 400);
            }
            
            // Check if employee_id already exists
            $sql = "SELECT COUNT(*) FROM employees WHERE employee_id = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->employee_id]);
            $count = $statement->fetchColumn();

            if ($count > 0) {
                return $this->sendPayload(null, "failed", "Employee ID already exists", 400);
            }
        
            // Proceed with registration
            $sql = "INSERT INTO employees (employee_id, first_name, last_name, email, phone, password, position) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $statement = $this->pdo->prepare($sql);
            $hashedPassword = password_hash($data->password, PASSWORD_BCRYPT);

            $statement->execute([
                $data->employee_id,
                $data->first_name,
                $data->last_name ?? '',
                $data->email,
                $data->phone ?? '',
                $hashedPassword,
                $data->position
            ]);

            if ($statement->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Employee successfully registered", 200);
            } else {
                return $this->sendPayload(null, "failed", "Registration failed", 400);
            }

        } catch (\PDOException $e) {
            error_log("Employee registration error: " . $e->getMessage());
            return $this->sendPayload(
                null, 
                "failed", 
                "Database error occurred. Please try again.", 
                500
            );
        }
    }

    public function login_employee($data) {
        // Validate required fields
        if (empty($data->email) || empty($data->password)) {
            return $this->sendPayload(null, "failed", "Email and password are required", 400);
        }

        try {
            // Get employee by email
            $sql = "SELECT * FROM employees WHERE email = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->email]);
            $employee = $statement->fetch(PDO::FETCH_ASSOC);

            // Check if employee exists and verify password
            if ($employee && password_verify($data->password, $employee['password'])) {
                // Generate JWT token
                $key = getenv('JWT_SECRET') ?: 'default_secret_key';
                $payload = [
                    'iss' => 'autowash_hub',
                    'aud' => 'employee',
                    'iat' => time(),
                    'exp' => time() + (60 * 60 * 8), // 8 hours
                    'data' => [
                        'id' => $employee['id'],
                        'employee_id' => $employee['employee_id'],
                        'email' => $employee['email'],
                        'first_name' => $employee['first_name'],
                        'last_name' => $employee['last_name'],
                        'position' => $employee['position']
                    ]
                ];
                
                $jwt = JWT::encode($payload, $key, 'HS256');
                
                // Remove password from employee data
                unset($employee['password']);
                
                return $this->sendPayload(
                    [
                        'token' => $jwt,
                        'employee' => $employee
                    ],
                    "success",
                    "Login successful",
                    200
                );
            } else {
                return $this->sendPayload(null, "failed", "Invalid email or password", 401);
            }
        } catch (\PDOException $e) {
            error_log("Employee login error: " . $e->getMessage());
            return $this->sendPayload(
                null,
                "failed",
                "Database error occurred. Please try again.",
                500
            );
        }
    }

    public function create_booking($data) {
        // Basic validation
        if (
            empty($data->customer_id) || 
            empty($data->service_id) || 
            empty($data->vehicle_type) || 
            empty($data->nickname) || 
            empty($data->phone) || 
            empty($data->wash_date) || 
            empty($data->wash_time) || 
            empty($data->payment_type) ||
            !isset($data->price)
        ) {
            return $this->sendPayload(null, "failed", "Missing required booking fields", 400);
        }

        try {
            $sql = "INSERT INTO bookings (customer_id, service_id, vehicle_type, nickname, phone, wash_date, wash_time, payment_type, price, notes) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $statement = $this->pdo->prepare($sql);

            $statement->execute([
                $data->customer_id,
                $data->service_id,
                $data->vehicle_type,
                $data->nickname,
                $data->phone,
                $data->wash_date,
                $data->wash_time,
                $data->payment_type,
                $data->price,
                $data->notes ?? null
            ]);

            if ($statement->rowCount() > 0) {
                $booking_id = $this->pdo->lastInsertId();
                return $this->sendPayload(["booking_id" => $booking_id], "success", "Booking created successfully", 201);
            } else {
                return $this->sendPayload(null, "failed", "Failed to create booking", 400);
            }

        } catch (\PDOException $e) {
            error_log("Booking creation error: " . $e->getMessage());
            return $this->sendPayload(
                null, 
                "failed", 
                "A database error occurred.", 
                500
            );
        }
    }

    public function add_service($data) {
        // Validate required fields
        if (empty($data->name) || empty($data->price) || empty($data->duration_minutes) || empty($data->category)) {
            return $this->sendPayload(null, "failed", "Missing required fields", 400);
        }

        try {
            // Prepare the SQL query to insert a new service
            $sql = "INSERT INTO services (name, description, price, duration_minutes, category, is_active) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            
            $statement = $this->pdo->prepare($sql);
            
            // Set is_active to 1 if true, 0 if false
            $isActive = isset($data->is_active) ? ($data->is_active ? 1 : 0) : 1;

            $statement->execute([
                $data->name,
                $data->description ?? '',
                $data->price,
                $data->duration_minutes,
                $data->category,
                $isActive
            ]);

            if ($statement->rowCount() > 0) {
                // Get the newly created service ID
                $serviceId = $this->pdo->lastInsertId();
                
                // Fetch the created service
                $sql = "SELECT id, name, description, price, duration_minutes, category, is_active, created_at, updated_at 
                       FROM services WHERE id = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$serviceId]);
                $service = $stmt->fetch(PDO::FETCH_ASSOC);
                
                return $this->sendPayload(
                    ['service' => $service], 
                    "success", 
                    "Service added successfully", 
                    200
                );
            } else {
                return $this->sendPayload(null, "failed", "Failed to add service", 400);
            }

        } catch (\PDOException $e) {
            error_log("Service creation error: " . $e->getMessage());
            return $this->sendPayload(
                null, 
                "failed", 
                "Database error occurred: " . $e->getMessage(), 
                500
            );
        }
    }
    
    public function delete_service($id) {
        // Validate service ID
        if (!is_numeric($id) || $id <= 0) {
            return $this->sendPayload(null, "failed", "Invalid service ID", 400);
        }

        try {
            // Check if the service exists
            $sql = "SELECT COUNT(*) FROM services WHERE id = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$id]);
            $count = $statement->fetchColumn();

            if ($count == 0) {
                return $this->sendPayload(null, "failed", "Service not found", 404);
            }
            
            // Delete the service
            $sql = "DELETE FROM services WHERE id = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$id]);

            if ($statement->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Service deleted successfully", 200);
            } else {
                return $this->sendPayload(null, "failed", "Failed to delete service", 400);
            }

        } catch (\PDOException $e) {
            error_log("Service deletion error: " . $e->getMessage());
            return $this->sendPayload(
                null, 
                "failed", 
                "Database error occurred: " . $e->getMessage(), 
                500
            );
        }
	}
}
