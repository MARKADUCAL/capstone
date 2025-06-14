<?php

class Put {
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }

    private function sendPayload($payload, $remarks, $message, $code) {
        $status = array(
            "remarks" => $remarks,
            "message" => $message
        );

        http_response_code($code);

        return array(
            "status" => $status,
            "payload" => $payload,
            "timestamp" => date_create()
        );
    }

    public function update_student_profile($data) {
        try {
            $fields = ['fname', 'mname', 'lname', 'ename', 'birth_date', 'email', 'mobile_no', 'program'];
            $updates = [];
            $values = [];
            
            foreach ($fields as $field) {
                if (isset($data->$field)) {
                    $updates[] = "$field = ?";
                    $values[] = $data->$field;
                }
            }
            
            // Handle password update separately
            if (isset($data->password) && !empty($data->password)) {
                $updates[] = "password = ?";
                $values[] = password_hash($data->password, PASSWORD_DEFAULT);
            }
            
            // Add student ID for WHERE clause
            $values[] = $data->stud_id_no;
            
            $sql = "UPDATE students SET " . implode(", ", $updates) . " WHERE stud_id_no = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($values);
            
            return $this->sendPayload(null, "success", "Profile updated successfully", 200);
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function updatePartylistApplicationStatus($data) {
        try {
            $this->pdo->beginTransaction();
            
            $sql = "UPDATE partylist_applications 
                    SET status = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->status, $data->application_id]);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception("Application not found");
            }
            
            $this->pdo->commit();
            return $this->sendPayload(null, "success", "Application status updated successfully", 200);
        } catch (Exception $e) {
            $this->pdo->rollBack();
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }
    
    public function update_service($data) {
        // Validate required fields
        if (!isset($data->id) || empty($data->id)) {
            return $this->sendPayload(null, "failed", "Service ID is required", 400);
        }
        
        if (empty($data->name) || empty($data->price) || empty($data->duration_minutes) || empty($data->category)) {
            return $this->sendPayload(null, "failed", "Missing required fields", 400);
        }

        try {
            // Check if service exists
            $sql = "SELECT COUNT(*) FROM services WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->id]);
            $count = $stmt->fetchColumn();
            
            if ($count == 0) {
                return $this->sendPayload(null, "failed", "Service not found", 404);
            }
            
            // Update service
            $sql = "UPDATE services 
                   SET name = ?, 
                       description = ?, 
                       price = ?, 
                       duration_minutes = ?, 
                       category = ?, 
                       is_active = ?,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            
            // Set is_active to 1 if true, 0 if false
            $isActive = isset($data->is_active) ? ($data->is_active ? 1 : 0) : 1;
            
            $stmt->execute([
                $data->name,
                $data->description ?? '',
                $data->price,
                $data->duration_minutes,
                $data->category,
                $isActive,
                $data->id
            ]);
            
            if ($stmt->rowCount() > 0) {
                // Fetch the updated service
                $sql = "SELECT id, name, description, price, duration_minutes, category, is_active, created_at, updated_at 
                       FROM services WHERE id = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$data->id]);
                $service = $stmt->fetch(PDO::FETCH_ASSOC);
                
                return $this->sendPayload(
                    ['service' => $service], 
                    "success", 
                    "Service updated successfully", 
                    200
                );
            } else {
                return $this->sendPayload(null, "failed", "No changes made to the service", 200);
            }
        } catch (\PDOException $e) {
            error_log("Service update error: " . $e->getMessage());
            return $this->sendPayload(
                null, 
                "failed", 
                "Database error occurred: " . $e->getMessage(), 
                500
            );
        }
    }
} 