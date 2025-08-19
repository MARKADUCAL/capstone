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

    public function get_all_bookings() {
        try {
            $sql = "SELECT 
                        b.id,
                        b.wash_date as washDate,
                        b.wash_time as washTime,
                        b.status,
                        b.price,
                        b.vehicle_type as vehicleType,
                        b.payment_type as paymentType,
                        b.nickname,
                        TRIM(CONCAT(COALESCE(c.first_name,''), ' ', COALESCE(c.last_name,''))) as customerName,
                        s.name as serviceName,
                        s.description as serviceDescription,
                        s.duration_minutes as serviceDuration
                    FROM 
                        bookings b
                    LEFT JOIN 
                        services s ON b.service_id = s.id
                    LEFT JOIN 
                        customers c ON b.customer_id = c.id
                    ORDER BY 
                        b.wash_date DESC, b.wash_time DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->sendPayload(
                ['bookings' => $bookings],
                "success",
                "Bookings retrieved successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->sendPayload(
                null,
                "failed",
                "Failed to retrieve bookings: " . $e->getMessage(),
                500
            );
        }
    }

    public function get_bookings_by_customer($customerId) {
        try {
            $sql = "SELECT 
                        b.id,
                        b.wash_date as washDate,
                        b.wash_time as washTime,
                        b.status,
                        b.price,
                        b.vehicle_type as vehicleType,
                        b.payment_type as paymentType,
                        b.notes,
                        s.name as serviceName,
                        s.description as serviceDescription,
                        s.duration_minutes as serviceDuration
                    FROM 
                        bookings b
                    JOIN 
                        services s ON b.service_id = s.id
                    WHERE 
                        b.customer_id = ?
                    ORDER BY 
                        b.wash_date DESC, b.wash_time DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$customerId]);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->sendPayload(
                ['bookings' => $bookings],
                "success",
                "Bookings retrieved successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->sendPayload(
                null,
                "failed",
                "Failed to retrieve bookings: " . $e->getMessage(),
                500
            );
        }
    }

    public function get_booking_count() {
        try {
            $sql = "SELECT COUNT(*) as total_bookings FROM bookings";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return $this->sendPayload(
                ['total_bookings' => $result['total_bookings']],
                "success",
                "Booking count retrieved successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->sendPayload(
                null,
                "failed",
                "Failed to retrieve booking count: " . $e->getMessage(),
                500
            );
        }
    }

    public function get_completed_booking_count() {
        try {
            $sql = "SELECT COUNT(*) as completed_bookings FROM bookings WHERE status = 'Completed'";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $this->sendPayload(
                ['completed_bookings' => $result['completed_bookings']],
                "success",
                "Completed booking count retrieved successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->sendPayload(
                null,
                "failed",
                "Failed to retrieve completed booking count: " . $e->getMessage(),
                500
            );
        }
    }

    public function get_pending_booking_count() {
        try {
            $sql = "SELECT COUNT(*) as pending_bookings FROM bookings WHERE status = 'Pending'";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $this->sendPayload(
                ['pending_bookings' => $result['pending_bookings']],
                "success",
                "Pending booking count retrieved successfully",
                200
            );
        } catch (\PDOException $e) {
            return $this->sendPayload(
                null,
                "failed",
                "Failed to retrieve pending booking count: " . $e->getMessage(),
                500
            );
        }
    }
}
?>