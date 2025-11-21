<?php

class Put {
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }

    private function hasColumn(string $table, string $column): bool {
        try {
            $stmt = $this->pdo->query("SHOW COLUMNS FROM {$table} LIKE '{$column}'");
            return $stmt->rowCount() > 0;
        } catch (\PDOException $e) {
            return false;
        }
    }

    private function ensureFeedbackEnhancements() {
        try {
            $checkSql = "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_feedback' AND COLUMN_NAME = ?";
            $checkStmt = $this->pdo->prepare($checkSql);

            $columns = [
                'admin_comment' => "ALTER TABLE customer_feedback ADD COLUMN admin_comment TEXT NULL",
                'admin_commented_at' => "ALTER TABLE customer_feedback ADD COLUMN admin_commented_at TIMESTAMP NULL",
                'service_rating' => "ALTER TABLE customer_feedback ADD COLUMN service_rating INT NULL AFTER rating",
                'service_comment' => "ALTER TABLE customer_feedback ADD COLUMN service_comment TEXT NULL AFTER comment",
                'employee_rating' => "ALTER TABLE customer_feedback ADD COLUMN employee_rating INT NULL AFTER service_comment",
                'employee_comment' => "ALTER TABLE customer_feedback ADD COLUMN employee_comment TEXT NULL AFTER employee_rating"
            ];

            foreach ($columns as $column => $ddl) {
                $checkStmt->execute([$column]);
                $exists = (int)$checkStmt->fetchColumn() > 0;
                if (!$exists) {
                    $this->pdo->exec($ddl);
                }
            }

            $this->pdo->exec("UPDATE customer_feedback SET service_rating = rating WHERE service_rating IS NULL");
            $this->pdo->exec("UPDATE customer_feedback SET service_comment = comment WHERE service_comment IS NULL");
        } catch (\PDOException $e) {
            error_log("Feedback column sync failed (PUT): " . $e->getMessage());
        }
    }

    public function update_customer_profile($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Customer ID is required", 400);
            }

            // Build dynamic update set
            $fieldsMap = [
                'first_name' => 'first_name',
                'last_name' => 'last_name',
                'email' => 'email',
                'phone' => 'phone'
            ];

            $updates = [];
            $values = [];

            foreach ($fieldsMap as $inputKey => $column) {
                if (isset($data->$inputKey)) {
                    $updates[] = "$column = ?";
                    $values[] = $data->$inputKey;
                }
            }

            // Handle password change flow: require current_password and new_password, verify then update
            $hasNewPassword = isset($data->new_password) && !empty($data->new_password);
            $hasCurrentPassword = isset($data->current_password) && !empty($data->current_password);

            if ($hasNewPassword) {
                if (!$hasCurrentPassword) {
                    return $this->sendPayload(null, "failed", "Current password is required to change password", 400);
                }

                // Fetch existing password hash
                $sqlFetch = "SELECT password FROM customers WHERE id = ?";
                $stmtFetch = $this->pdo->prepare($sqlFetch);
                $stmtFetch->execute([$data->id]);
                $existing = $stmtFetch->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    return $this->sendPayload(null, "failed", "Customer not found", 404);
                }

                $currentHash = $existing['password'] ?? '';
                if (!password_verify($data->current_password, $currentHash)) {
                    return $this->sendPayload(null, "failed", "Current password is incorrect", 401);
                }

                // Queue password update
                $updates[] = "password = ?";
                $values[] = password_hash($data->new_password, PASSWORD_BCRYPT);
            }

            if (empty($updates)) {
                return $this->sendPayload(null, "failed", "No fields provided to update", 400);
            }

            $values[] = $data->id;

            $sql = "UPDATE customers SET " . implode(", ", $updates) . " WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($values);

            if ($stmt->rowCount() > 0) {
                // Return updated customer (without password)
                $stmtGet = $this->pdo->prepare("SELECT id, first_name, last_name, email, phone FROM customers WHERE id = ?");
                $stmtGet->execute([$data->id]);
                $customer = $stmtGet->fetch(PDO::FETCH_ASSOC);
                return $this->sendPayload(['customer' => $customer], "success", "Customer updated successfully", 200);
            }

            // Even if rowCount is 0, the record may exist but values were identical; treat as success and return current data
            $stmtGet = $this->pdo->prepare("SELECT id, first_name, last_name, email, phone FROM customers WHERE id = ?");
            $stmtGet->execute([$data->id]);
            $customer = $stmtGet->fetch(PDO::FETCH_ASSOC);
            if ($customer) {
                return $this->sendPayload(['customer' => $customer], "success", "No changes made", 200);
            }

            return $this->sendPayload(null, "failed", "Customer not found", 404);
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function update_employee($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Employee ID is required", 400);
            }

            $hasPositionColumn = $this->hasColumn('employees', 'position');

            $fieldsMap = [
                'first_name' => 'first_name',
                'last_name' => 'last_name',
                'email' => 'email',
                'phone' => 'phone',
            ];

            if ($hasPositionColumn) {
                $fieldsMap['position'] = 'position';
            }

            $updates = [];
            $values = [];

            foreach ($fieldsMap as $inputKey => $column) {
                if (isset($data->$inputKey)) {
                    $updates[] = "$column = ?";
                    $values[] = $data->$inputKey;
                }
            }

            $hasNewPassword = isset($data->new_password) && !empty($data->new_password);
            $hasCurrentPassword = isset($data->current_password) && !empty($data->current_password);

            if ($hasNewPassword) {
                if (!$hasCurrentPassword) {
                    return $this->sendPayload(null, "failed", "Current password is required to change password", 400);
                }

                $sqlFetch = "SELECT password FROM employees WHERE id = ?";
                $stmtFetch = $this->pdo->prepare($sqlFetch);
                $stmtFetch->execute([$data->id]);
                $existing = $stmtFetch->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    return $this->sendPayload(null, "failed", "Employee not found", 404);
                }

                $currentHash = $existing['password'] ?? '';
                if (!password_verify($data->current_password, $currentHash)) {
                    return $this->sendPayload(null, "failed", "Current password is incorrect", 401);
                }

                $updates[] = "password = ?";
                $values[] = password_hash($data->new_password, PASSWORD_DEFAULT);
            }

            if (empty($updates)) {
                return $this->sendPayload(null, "failed", "No fields provided to update", 400);
            }

            $values[] = $data->id;

            $sql = "UPDATE employees SET " . implode(", ", $updates) . " WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($values);

            if ($stmt->rowCount() === 0) {
                // Even if no rows were affected, the employee might still exist with the same values.
                $stmtCheck = $this->pdo->prepare("SELECT id FROM employees WHERE id = ?");
                $stmtCheck->execute([$data->id]);
                if (!$stmtCheck->fetch()) {
                    return $this->sendPayload(null, "failed", "Employee not found", 404);
                }
            }

            $selectColumns = [
                'id',
                'employee_id',
                'first_name',
                'last_name',
                'email',
                'phone'
            ];

            if ($hasPositionColumn) {
                $selectColumns[] = 'position';
            }

            $stmtGet = $this->pdo->prepare("SELECT " . implode(', ', $selectColumns) . " FROM employees WHERE id = ?");
            $stmtGet->execute([$data->id]);
            $employee = $stmtGet->fetch(PDO::FETCH_ASSOC);

            return $this->sendPayload(['employee' => $employee], "success", "Employee updated successfully", 200);
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function approve_employee($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Employee ID is required", 400);
            }

            // Check if is_approved column exists
            $hasIsApprovedColumn = false;
            try {
                $checkSql = "SHOW COLUMNS FROM employees LIKE 'is_approved'";
                $checkStmt = $this->pdo->query($checkSql);
                $hasIsApprovedColumn = $checkStmt->rowCount() > 0;
            } catch (Exception $e) {
                $hasIsApprovedColumn = false;
            }

            if ($hasIsApprovedColumn) {
                $sql = "UPDATE employees SET is_approved = 1 WHERE id = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$data->id]);

                if ($stmt->rowCount() > 0) {
                    return $this->sendPayload(null, "success", "Employee approved successfully", 200);
                }
            } else {
                return $this->sendPayload(null, "failed", "Approval feature is not available. Please add is_approved column to employees table.", 400);
            }

            return $this->sendPayload(null, "failed", "Employee not found", 404);
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function reject_employee($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Employee ID is required", 400);
            }

            // Check if is_approved column exists
            $hasIsApprovedColumn = false;
            try {
                $checkSql = "SHOW COLUMNS FROM employees LIKE 'is_approved'";
                $checkStmt = $this->pdo->query($checkSql);
                $hasIsApprovedColumn = $checkStmt->rowCount() > 0;
            } catch (Exception $e) {
                $hasIsApprovedColumn = false;
            }

            if ($hasIsApprovedColumn) {
                // Delete the employee registration if rejected
                $sql = "DELETE FROM employees WHERE id = ? AND is_approved = 0";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$data->id]);

                if ($stmt->rowCount() > 0) {
                    return $this->sendPayload(null, "success", "Employee registration rejected and removed", 200);
                }

                return $this->sendPayload(null, "failed", "Employee not found or already approved", 404);
            } else {
                return $this->sendPayload(null, "failed", "Rejection feature is not available. Please add is_approved column to employees table.", 400);
            }
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function approve_admin($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Admin ID is required", 400);
            }

            // Check if is_approved column exists on admins
            $hasIsApprovedColumn = false;
            try {
                $checkSql = "SHOW COLUMNS FROM admins LIKE 'is_approved'";
                $checkStmt = $this->pdo->query($checkSql);
                $hasIsApprovedColumn = $checkStmt->rowCount() > 0;
            } catch (Exception $e) {
                $hasIsApprovedColumn = false;
            }

            if ($hasIsApprovedColumn) {
                $sql = "UPDATE admins SET is_approved = 1 WHERE id = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$data->id]);

                if ($stmt->rowCount() > 0) {
                    return $this->sendPayload(null, "success", "Admin approved successfully", 200);
                }
            } else {
                return $this->sendPayload(null, "failed", "Approval feature is not available. Please add is_approved column to admins table.", 400);
            }

            return $this->sendPayload(null, "failed", "Admin not found", 404);
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function reject_admin($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Admin ID is required", 400);
            }

            // Check if is_approved column exists on admins
            $hasIsApprovedColumn = false;
            try {
                $checkSql = "SHOW COLUMNS FROM admins LIKE 'is_approved'";
                $checkStmt = $this->pdo->query($checkSql);
                $hasIsApprovedColumn = $checkStmt->rowCount() > 0;
            } catch (Exception $e) {
                $hasIsApprovedColumn = false;
            }

            if ($hasIsApprovedColumn) {
                // Only delete if still pending (is_approved = 0)
                $sql = "DELETE FROM admins WHERE id = ? AND (is_approved = 0 OR is_approved IS NULL)";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$data->id]);

                if ($stmt->rowCount() > 0) {
                    return $this->sendPayload(null, "success", "Admin registration rejected and removed", 200);
                }

                return $this->sendPayload(null, "failed", "Admin not found or already approved", 404);
            } else {
                return $this->sendPayload(null, "failed", "Rejection feature is not available. Please add is_approved column to admins table.", 400);
            }
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
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
            "timestamp" => date('Y-m-d H:i:s')
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
    


    public function update_booking_status($data) {
        try {
            // Debug logging
            error_log("update_booking_status called with data: " . json_encode($data));
            
            // Handle both 'id' and 'booking_id' field names for compatibility
            $bookingId = $data->id ?? $data->booking_id ?? null;
            if (!$bookingId) {
                throw new Exception("Booking ID is required");
            }
            
            error_log("Using booking ID: " . $bookingId);
            error_log("New status: " . $data->status);
            
            // Check if booking exists first
            $sql = "SELECT COUNT(*) FROM bookings WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$bookingId]);
            $bookingExists = $stmt->fetchColumn();
            
            if (!$bookingExists) {
                throw new Exception("Booking not found");
            }
            
            error_log("Booking exists, proceeding with update");
            
            // Normalize status to a canonical title-case used throughout the app
            $rawStatus = isset($data->status) ? (string)$data->status : '';
            if (trim($rawStatus) === '') {
                // Safety: if client sent no status, default to Cancelled for this endpoint usage
                $rawStatus = 'Cancelled';
            }
            $incomingStatus = strtolower(trim($rawStatus));
            $map = [
                'pending' => 'Pending',
                'approved' => 'Approved',
                'rejected' => 'Rejected',
                'done' => 'Done',
                'completed' => 'Completed',
                'cancelled' => 'Cancelled',
                'canceled' => 'Cancelled',
                'confirm' => 'Approved',
                'confirmed' => 'Approved'
            ];
            $normalizedStatus = $map[$incomingStatus] ?? 'Pending';
            error_log("Normalized status: " . $normalizedStatus);
            
            // If reason provided, append to notes politely; otherwise just update status
            $hasReason = isset($data->reason) && trim((string)$data->reason) !== '';
            if ($hasReason) {
                $reasonText = trim((string)$data->reason);
                // Use "Rejection reason:" for admin rejections, "Customer reason:" for customer cancellations
                $reasonNote = $normalizedStatus === 'Rejected' ? "Rejection reason: " . $reasonText : "Customer reason: " . $reasonText;
                $sql = "UPDATE bookings SET status = ?, notes = CONCAT(COALESCE(notes, ''), CASE WHEN COALESCE(notes, '') = '' THEN '' ELSE ' | ' END, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?";
                $stmt = $this->pdo->prepare($sql);
                $result = $stmt->execute([$normalizedStatus, $reasonNote, $bookingId]);
            } else {
                $sql = "UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
                $stmt = $this->pdo->prepare($sql);
                $result = $stmt->execute([$normalizedStatus, $bookingId]);
            }
            
            if (!$result) {
                throw new Exception("Failed to execute UPDATE query");
            }
            
            $affectedRows = $stmt->rowCount();
            error_log("UPDATE query affected {$affectedRows} rows");
            
            if ($affectedRows === 0) {
                throw new Exception("No rows were updated");
            }
            
            error_log("Booking status updated successfully");
            return $this->sendPayload(null, "success", "Booking status updated successfully", 200);
            
        } catch (Exception $e) {
            error_log("Error in update_booking_status: " . $e->getMessage());
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function assign_employee_to_booking($data) {
        try {
            // Debug logging
            error_log("assign_employee_to_booking called with data: " . json_encode($data));
            
            // Validate required fields
            if (!isset($data->booking_id) || !isset($data->employee_id)) {
                throw new Exception("Booking ID and Employee ID are required");
            }
            
            $bookingId = $data->booking_id;
            $employeeId = $data->employee_id;
            
            error_log("Assigning employee {$employeeId} to booking {$bookingId}");
            
            // Check if booking exists
            $sql = "SELECT COUNT(*) FROM bookings WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$bookingId]);
            $bookingExists = $stmt->fetchColumn();
            
            if (!$bookingExists) {
                throw new Exception("Booking not found");
            }
            
            // Check if employee exists
            $sql = "SELECT COUNT(*) FROM employees WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$employeeId]);
            $employeeExists = $stmt->fetchColumn();
            
            if (!$employeeExists) {
                throw new Exception("Employee not found");
            }
            
            // Update booking with employee assignment and status
            $sql = "UPDATE bookings SET assigned_employee_id = ?, status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute([$employeeId, $bookingId]);
            
            if (!$result) {
                throw new Exception("Failed to assign employee to booking");
            }
            
            $affectedRows = $stmt->rowCount();
            error_log("Employee assignment affected {$affectedRows} rows");
            
            if ($affectedRows === 0) {
                throw new Exception("No rows were updated");
            }
            
            error_log("Employee assigned to booking successfully");
            return $this->sendPayload(null, "success", "Employee assigned to booking successfully", 200);
            
        } catch (Exception $e) {
            error_log("Error in assign_employee_to_booking: " . $e->getMessage());
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    /**
     * Update admin comment on a customer feedback
     */
    public function update_feedback_admin_comment($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Feedback ID is required", 400);
            }

            $this->ensureFeedbackEnhancements();

            $sql = "UPDATE customer_feedback SET admin_comment = ?, admin_commented_at = CURRENT_TIMESTAMP WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->admin_comment ?? '', $data->id]);

            if ($stmt->rowCount() > 0) {
                // Return updated record
                $stmtGet = $this->pdo->prepare("SELECT id, booking_id, customer_id, rating, comment, service_rating, service_comment, employee_rating, employee_comment, admin_comment, admin_commented_at, is_public, created_at FROM customer_feedback WHERE id = ?");
                $stmtGet->execute([$data->id]);
                $feedback = $stmtGet->fetch(PDO::FETCH_ASSOC);
                return $this->sendPayload(['customer_feedback' => $feedback], "success", "Admin comment updated", 200);
            }

            // If no rows updated, still fetch to confirm existence
            $stmtGet = $this->pdo->prepare("SELECT id FROM customer_feedback WHERE id = ?");
            $stmtGet->execute([$data->id]);
            if ($stmtGet->fetch(PDO::FETCH_ASSOC)) {
                return $this->sendPayload(null, "success", "No changes made", 200);
            }

            return $this->sendPayload(null, "failed", "Feedback not found", 404);
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    /**
     * Update customer feedback (rating and comment)
     */
    public function update_customer_feedback($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Feedback ID is required", 400);
            }

            $this->ensureFeedbackEnhancements();

            // Verify the feedback exists and belongs to the customer
            $checkStmt = $this->pdo->prepare("SELECT id, customer_id, rating, comment, service_rating, service_comment, employee_rating, employee_comment FROM customer_feedback WHERE id = ?");
            $checkStmt->execute([$data->id]);
            $existingFeedback = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$existingFeedback) {
                return $this->sendPayload(null, "failed", "Feedback not found", 404);
            }

            // Verify customer ownership (optional security check)
            if (isset($data->customer_id) && $existingFeedback['customer_id'] != $data->customer_id) {
                return $this->sendPayload(null, "failed", "Unauthorized: Feedback does not belong to this customer", 403);
            }

            $serviceRating = null;
            if (isset($data->service_rating)) {
                $serviceRating = (int)$data->service_rating;
            } elseif (isset($data->rating)) {
                $serviceRating = (int)$data->rating;
            } elseif (isset($existingFeedback['service_rating'])) {
                $serviceRating = (int)$existingFeedback['service_rating'];
            } else {
                $serviceRating = (int)$existingFeedback['rating'];
            }

            if (empty($serviceRating) || $serviceRating < 1 || $serviceRating > 5) {
                return $this->sendPayload(null, "failed", "Rating must be between 1 and 5", 400);
            }

            $serviceComment = null;
            if (isset($data->service_comment)) {
                $serviceComment = trim((string)$data->service_comment);
            } elseif (isset($data->comment)) {
                $serviceComment = trim((string)$data->comment);
            } else {
                $serviceComment = $existingFeedback['service_comment'] ?? $existingFeedback['comment'] ?? '';
            }

            $employeeRating = $existingFeedback['employee_rating'] ?? null;
            if (property_exists($data, 'employee_rating')) {
                if ($data->employee_rating === null || $data->employee_rating === '') {
                    $employeeRating = null;
                } else {
                    $employeeRating = (int)$data->employee_rating;
                    if ($employeeRating < 1 || $employeeRating > 5) {
                        return $this->sendPayload(null, "failed", "Employee rating must be between 1 and 5", 400);
                    }
                }
            }

            $employeeComment = $existingFeedback['employee_comment'] ?? null;
            if (property_exists($data, 'employee_comment')) {
                $employeeComment = trim((string)$data->employee_comment);
                $employeeComment = $employeeComment === '' ? null : $employeeComment;
            }

            // Update rating and comments
            $sql = "UPDATE customer_feedback SET rating = ?, comment = ?, service_rating = ?, service_comment = ?, employee_rating = ?, employee_comment = ? WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $serviceRating,
                $serviceComment,
                $serviceRating,
                $serviceComment,
                $employeeRating,
                $employeeComment,
                $data->id
            ]);

            if ($stmt->rowCount() > 0) {
                // Return updated record
                $stmtGet = $this->pdo->prepare("SELECT id, booking_id, customer_id, rating, comment, service_rating, service_comment, employee_rating, employee_comment, admin_comment, admin_commented_at, is_public, created_at FROM customer_feedback WHERE id = ?");
                $stmtGet->execute([$data->id]);
                $feedback = $stmtGet->fetch(PDO::FETCH_ASSOC);
                return $this->sendPayload(['customer_feedback' => $feedback], "success", "Feedback updated successfully", 200);
            }

            return $this->sendPayload(null, "failed", "No changes made", 400);
        } catch (Exception $e) {
            error_log("Error updating customer feedback: " . $e->getMessage());
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

    public function update_inventory_item($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Inventory ID is required", 400);
            }

            $fields = [];
            $values = [];
            $map = [
                'name' => 'name',
                'image_url' => 'image_url',
                'stock' => 'stock',
                'price' => 'price',
                'category' => 'category'
            ];
            foreach ($map as $k => $col) {
                if (isset($data->$k)) {
                    $fields[] = "$col = ?";
                    $values[] = $data->$k;
                }
            }
            if (empty($fields)) {
                return $this->sendPayload(null, "failed", "No fields provided to update", 400);
            }
            $values[] = $data->id;
            $sql = "UPDATE inventory SET " . implode(", ", $fields) . " WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($values);
            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Inventory updated", 200);
            }
            return $this->sendPayload(null, "failed", "Item not found or no changes", 404);
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function update_inventory_request($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Request ID is required", 400);
            }

            $fields = [];
            $values = [];
            $map = [
                'status' => 'status',
                'notes' => 'notes'
            ];
            foreach ($map as $k => $col) {
                if (isset($data->$k)) {
                    $fields[] = "$col = ?";
                    $values[] = $data->$k;
                }
            }
            if (empty($fields)) {
                return $this->sendPayload(null, "failed", "No fields provided to update", 400);
            }
            $values[] = $data->id;
            $sql = "UPDATE inventory_requests SET " . implode(", ", $fields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($values);
            if ($stmt->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Inventory request updated", 200);
            }
            return $this->sendPayload(null, "failed", "Request not found or no changes", 404);
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    /**
     * Update pricing entry
     */
    public function update_pricing_entry($data) {
        try {
            error_log("update_pricing_entry called with data: " . json_encode($data));
            
            if (!isset($data->id) || empty($data->id)) {
                error_log("Pricing entry ID is missing or empty");
                return $this->sendPayload(null, "failed", "Pricing entry ID is required", 400);
            }

            $updates = [];
            $values = [];

            // Build dynamic update set
            $fieldsMap = [
                'vehicle_type' => 'vehicle_type',
                'service_package' => 'service_package',
                'price' => 'price',
                'is_active' => 'is_active'
            ];

            foreach ($fieldsMap as $inputKey => $column) {
                if (isset($data->$inputKey)) {
                    $updates[] = "$column = ?";
                    $values[] = $data->$inputKey;
                }
            }

            error_log("Updates to be made: " . json_encode($updates));
            error_log("Values: " . json_encode($values));

            if (empty($updates)) {
                error_log("No fields provided to update");
                return $this->sendPayload(null, "failed", "No fields provided to update", 400);
            }

            $values[] = $data->id;

            $sql = "UPDATE pricing SET " . implode(", ", $updates) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            error_log("SQL query: " . $sql);
            error_log("Final values: " . json_encode($values));
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($values);

            if ($stmt->rowCount() > 0) {
                // Return updated pricing entry
                $stmtGet = $this->pdo->prepare("SELECT * FROM pricing WHERE id = ?");
                $stmtGet->execute([$data->id]);
                $pricing = $stmtGet->fetch(PDO::FETCH_ASSOC);
                error_log("Update successful, returning: " . json_encode($pricing));
                return $this->sendPayload(['pricing' => $pricing], "success", "Pricing entry updated successfully", 200);
            }

            // Check if record exists
            $stmtGet = $this->pdo->prepare("SELECT * FROM pricing WHERE id = ?");
            $stmtGet->execute([$data->id]);
            $pricing = $stmtGet->fetch(PDO::FETCH_ASSOC);
            if ($pricing) {
                error_log("Record exists but no changes made");
                return $this->sendPayload(['pricing' => $pricing], "success", "No changes made", 200);
            }

            error_log("Pricing entry not found");
            return $this->sendPayload(null, "failed", "Pricing entry not found", 404);
        } catch (Exception $e) {
            error_log("Exception in update_pricing_entry: " . $e->getMessage());
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    /**
     * Toggle pricing entry status
     */
    public function toggle_pricing_status($data) {
        try {
            if (!isset($data->id) || empty($data->id)) {
                return $this->sendPayload(null, "failed", "Pricing entry ID is required", 400);
            }

            // Get current status
            $sqlGet = "SELECT is_active FROM pricing WHERE id = ?";
            $stmtGet = $this->pdo->prepare($sqlGet);
            $stmtGet->execute([$data->id]);
            $current = $stmtGet->fetch(PDO::FETCH_ASSOC);

            if (!$current) {
                return $this->sendPayload(null, "failed", "Pricing entry not found", 404);
            }

            // Toggle status
            $newStatus = $current['is_active'] ? 0 : 1;
            
            $sql = "UPDATE pricing SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$newStatus, $data->id]);

            if ($stmt->rowCount() > 0) {
                $statusText = $newStatus ? "activated" : "deactivated";
                return $this->sendPayload(
                    ['is_active' => $newStatus], 
                    "success", 
                    "Pricing entry $statusText successfully", 
                    200
                );
            }

            return $this->sendPayload(null, "failed", "Failed to update pricing entry status", 400);
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }
} 