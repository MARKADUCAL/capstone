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
}
