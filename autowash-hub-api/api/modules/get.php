<?php


require_once "global.php";

class Get extends GlobalMethods {
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function executeQuery($sql) {
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
    
    public function get_customer_count() {
        try {
            $sql = "SELECT COUNT(*) as total_customers FROM customers";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $this->sendPayload(
                ['total_customers' => $result['total_customers']],
                "success",
                "Customer count retrieved successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->sendPayload(
                null,
                "failed",
                "Failed to retrieve customer count: " . $e->getMessage(),
                500
            );
        }
    }

    public function get_employee_count() {
        try {
            $sql = "SELECT COUNT(*) as total_employees FROM employees";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $this->sendPayload(
                ['total_employees' => $result['total_employees']],
                "success",
                "Employee count retrieved successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->sendPayload(
                null,
                "failed",
                "Failed to retrieve employee count: " . $e->getMessage(),
                500
            );
        }
    }

    public function get_all_customers() {
        try {
            $sql = "SELECT id, first_name, last_name, email, phone, created_at FROM customers ORDER BY id DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->sendPayload(
                ['customers' => $customers],
                "success",
                "Customers retrieved successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->sendPayload(
                null,
                "failed",
                "Failed to retrieve customers: " . $e->getMessage(),
                500
            );
        }
    }

    public function get_all_employees() {
        try {
            $sql = "SELECT id, employee_id, first_name, last_name, email, phone, position, created_at FROM employees ORDER BY id DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->sendPayload(
                ['employees' => $employees],
                "success",
                "Employees retrieved successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->sendPayload(
                null,
                "failed",
                "Failed to retrieve employees: " . $e->getMessage(),
                500
            );
        }
    }
    
    public function get_all_services() {
        try {
            $sql = "SELECT id, name, description, price, duration_minutes, category, is_active, created_at, updated_at 
                   FROM services 
                   ORDER BY id DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->sendPayload(
                ['services' => $services],
                "success",
                "Services retrieved successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->sendPayload(
                null,
                "failed",
                "Failed to retrieve services: " . $e->getMessage(),
                500
            );
        }
    }
}
?>