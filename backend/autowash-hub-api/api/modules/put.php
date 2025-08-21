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

    public function update_booking_status($data) {
        try {
            $this->pdo->beginTransaction();
            
            // Get current status
            $sql = "SELECT status FROM bookings WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->booking_id]);
            $currentStatus = $stmt->fetchColumn();
            
            if (!$currentStatus) {
                throw new Exception("Booking not found");
            }
            
            // Update booking status
            $sql = "UPDATE bookings 
                    SET status = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->status, $data->booking_id]);
            
            // Add to booking history
            $sql = "INSERT INTO booking_history (booking_id, status_from, status_to, changed_by, notes) 
                    VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data->booking_id,
                $currentStatus,
                $data->status,
                $data->changed_by ?? 'system',
                $data->notes ?? null
            ]);
            
            $this->pdo->commit();
            return $this->sendPayload(null, "success", "Booking status updated successfully", 200);
        } catch (Exception $e) {
            $this->pdo->rollBack();
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    // New update methods for the updated database schema
    public function update_vehicle_type($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Vehicle type ID is required", 400);
            }
            
            $sql = "UPDATE vehicle_types 
                    SET name = ?, description = ?, base_price_multiplier = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $isActive = isset($data->is_active) ? ($data->is_active ? 1 : 0) : 1;
            
            $stmt->execute([
                $data->name,
                $data->description ?? '',
                $data->base_price_multiplier,
                $isActive,
                $data->id
            ]);
            
            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Vehicle type updated successfully", 200);
            } else {
                return $this->sendPayload(null, "failed", "Vehicle type not found or no changes made", 404);
            }
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function update_payment_method($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Payment method ID is required", 400);
            }
            
            $sql = "UPDATE payment_methods 
                    SET name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $isActive = isset($data->is_active) ? ($data->is_active ? 1 : 0) : 1;
            
            $stmt->execute([
                $data->name,
                $data->description ?? '',
                $isActive,
                $data->id
            ]);
            
            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Payment method updated successfully", 200);
            } else {
                return $this->sendPayload(null, "failed", "Payment method not found or no changes made", 404);
            }
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function update_time_slot($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Time slot ID is required", 400);
            }
            
            $sql = "UPDATE time_slots 
                    SET start_time = ?, end_time = ?, max_bookings = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $isActive = isset($data->is_active) ? ($data->is_active ? 1 : 0) : 1;
            
            $stmt->execute([
                $data->start_time,
                $data->end_time,
                $data->max_bookings,
                $isActive,
                $data->id
            ]);
            
            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Time slot updated successfully", 200);
            } else {
                return $this->sendPayload(null, "failed", "Time slot not found or no changes made", 404);
            }
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function update_promotion($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Promotion ID is required", 400);
            }
            
            $sql = "UPDATE promotions 
                    SET name = ?, description = ?, discount_percentage = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $isActive = isset($data->is_active) ? ($data->is_active ? 1 : 0) : 1;
            
            $stmt->execute([
                $data->name,
                $data->description ?? '',
                $data->discount_percentage,
                $data->start_date,
                $data->end_date,
                $isActive,
                $data->id
            ]);
            
            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Promotion updated successfully", 200);
            } else {
                return $this->sendPayload(null, "failed", "Promotion not found or no changes made", 404);
            }
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function update_service_category($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Service category ID is required", 400);
            }
            
            $sql = "UPDATE service_categories 
                    SET name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $isActive = isset($data->is_active) ? ($data->is_active ? 1 : 0) : 1;
            
            $stmt->execute([
                $data->name,
                $data->description ?? '',
                $isActive,
                $data->id
            ]);
            
            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Service category updated successfully", 200);
            } else {
                return $this->sendPayload(null, "failed", "Service category not found or no changes made", 404);
            }
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function update_employee_schedule($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Schedule ID is required", 400);
            }
            
            $sql = "UPDATE employee_schedules 
                    SET work_date = ?, start_time = ?, end_time = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $isAvailable = isset($data->is_available) ? ($data->is_available ? 1 : 0) : 1;
            
            $stmt->execute([
                $data->work_date,
                $data->start_time,
                $data->end_time,
                $isAvailable,
                $data->id
            ]);
            
            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Employee schedule updated successfully", 200);
            } else {
                return $this->sendPayload(null, "failed", "Employee schedule not found or no changes made", 404);
            }
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function update_notification_status($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Notification ID is required", 400);
            }
            
            $sql = "UPDATE notifications 
                    SET is_read = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $isRead = isset($data->is_read) ? ($data->is_read ? 1 : 0) : 0;
            
            $stmt->execute([
                $isRead,
                $data->id
            ]);
            
            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Notification status updated successfully", 200);
            } else {
                return $this->sendPayload(null, "failed", "Notification not found or no changes made", 404);
            }
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function update_system_setting($data) {
        try {
            if (!isset($data->setting_key) || empty($data->setting_key)) {
                return $this->sendPayload(null, "failed", "Setting key is required", 400);
            }
            
            $sql = "UPDATE system_settings 
                    SET setting_value = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE setting_key = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data->setting_value,
                $data->setting_key
            ]);
            
            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, "success", "System setting updated successfully", 200);
            } else {
                return $this->sendPayload(null, "failed", "System setting not found or no changes made", 404);
            }
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }
} 