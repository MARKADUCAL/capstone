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


    public function register_student($data)
    {
        // Check if student ID number already exists
        $sql = "SELECT COUNT(*) FROM students WHERE stud_id_no = ?";
        $statement = $this->pdo->prepare($sql);
        $statement->execute([$data->stud_id_no]);
        $count = $statement->fetchColumn();

        if ($count > 0) {
            return $this->sendPayload(null, "failed", "Student ID number already taken.", 400);
        }

        // Proceed with registration if student ID is not taken
        $sql = "INSERT INTO students (stud_id_no, fname, mname, lname, ename, birth_date, email, mobile_no, program, year_level, password, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')";
        try {
            $statement = $this->pdo->prepare($sql);
            $hashedPassword = password_hash($data->password, PASSWORD_BCRYPT);

            $statement->execute([
                $data->stud_id_no,
                $data->fname,
                $data->mname,
                $data->lname,
                $data->ename,
                $data->birth_date,
                $data->email,
                $data->mobile_no,
                $data->program,
                $data->year_level,
                $hashedPassword
            ]);

            return $this->sendPayload(null, "success", "Successfully registered.", 200);
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            error_log("Registration error: " . $errmsg);
            return $this->sendPayload(null, "failed", $errmsg, 400);
        }
    }

    public function login_student($data)
    {
        try {
            $sql = "SELECT * FROM students WHERE stud_id_no = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->stud_id_no]);
            $user = $statement->fetch();

            if ($user && password_verify($data->password, $user['password'])) {
                // Generate JWT token
                $payload = [
                    'iss' => 'ccs-voting-system',
                    'aud' => 'students',
                    'iat' => time(),
                    'exp' => time() + (60 * 60 * 24), // 24 hour expiration
                    'data' => [
                        'stud_id_no' => $user['stud_id_no'],
                        'role' => 'student'
                    ]
                ];

                $jwt = JWT::encode($payload, getenv('JWT_SECRET'), 'HS256');

                return $this->sendPayload([
                    'token' => $jwt,
                    'user' => [
                        'stud_id_no' => $user['stud_id_no'],
                        'fname' => $user['fname'],
                        'lname' => $user['lname'],
                        'email' => $user['email'],
                        'role' => 'student'
                    ]
                ], "success", "Login successful", 200);
            } else {
                return $this->sendPayload(null, "failed", "Invalid credentials", 401);
            }
        } catch (\PDOException $e) {
            error_log("Login error: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Server error occurred", 500);
        }
    }

    public function uploadProfilePicture($id, $file, $isFaculty = false)
    {
        try {
            if ($file['error'] !== UPLOAD_ERR_OK) {
                return $this->sendPayload(null, "failed", "File upload error: " . $file['error'], 400);
            }

            // Create uploads directory if it doesn't exist
            $uploadDir = '../uploads/profile_pictures/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Generate unique filename
            $fileName = $id . '_' . time() . '_' . basename($file['name']);
            $targetPath = $uploadDir . $fileName;
            $dbPath = 'uploads/profile_pictures/' . $fileName;

            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                // Update database with new profile picture path
                $table = $isFaculty ? 'faculty' : 'students';
                $idField = $isFaculty ? 'faculty_id_no' : 'stud_id_no';

                $sql = "UPDATE {$table} SET profile_picture = ? WHERE {$idField} = ?";
                $statement = $this->pdo->prepare($sql);
                $statement->execute([$dbPath, $id]);

                return $this->sendPayload(
                    ['path' => $dbPath],
                    "success",
                    "Profile picture uploaded successfully",
                    200
                );
            }

            return $this->sendPayload(null, "failed", "Failed to upload file", 500);
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function login_faculty($data)
    {
        try {
            $sql = "SELECT * FROM faculty WHERE faculty_id_no = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->faculty_id_no]);
            $faculty = $statement->fetch();

            if ($faculty && password_verify($data->password, $faculty['password'])) {
                // Generate JWT token
                $payload = [
                    'iss' => 'ccs-voting-system',
                    'aud' => 'faculty',
                    'iat' => time(),
                    'exp' => time() + (60 * 60 * 24), // 24 hour expiration
                    'data' => [
                        'faculty_id_no' => $faculty['faculty_id_no'],
                        'role' => 'faculty'
                    ]
                ];

                $jwt = JWT::encode($payload, getenv('JWT_SECRET'), 'HS256');

                return $this->sendPayload([
                    'token' => $jwt,
                    'user' => [
                        'faculty_id_no' => $faculty['faculty_id_no'],
                        'fname' => $faculty['fname'],
                        'lname' => $faculty['lname'],
                        'email' => $faculty['email'],
                        'role' => 'faculty'
                    ]
                ], "success", "Login successful", 200);
            } else {
                return $this->sendPayload(null, "failed", "Invalid credentials", 401);
            }
        } catch (\PDOException $e) {
            error_log("Login error: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Server error occurred", 500);
        }
    }

    public function logout()
    {
        session_start();
        session_destroy();
        header('Content-Type: application/json');
        return $this->sendPayload(null, "success", "Successfully logged out.", 200);
    }

    public function updateVoterProfile($data)
    {
        $sql = "UPDATE students SET fname = ?, mname = ?, lname = ?, ename = ?, birth_date = ?, address = ?, email = ?, mobile_no = ?, program = ? WHERE VIN = ?";
        $statement = $this->pdo->prepare($sql);

        try {
            $statement->execute([
                $data->fname,
                $data->mname,
                $data->lname,
                $data->ename,
                $data->birth_date,
                $data->address,
                $data->email,
                $data->mobile_no,
                $data->program,
                $data->stud_id_no
            ]);
            return $this->sendPayload(null, "success", "Profile updated successfully.", 200);
        } catch (\PDOException $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 403);
        }
    }

    public function updateDashboardStatus($data)
    {
        try {
            $sql = "UPDATE dashboard_status 
                    SET next_election = ?, 
                        voting_hours = ?
                    WHERE id = ?";

            $statement = $this->pdo->prepare($sql);
            $statement->execute([
                $data->next_election,
                $data->voting_hours,
                $data->id
            ]);

            if ($statement->rowCount() > 0) {
                $response = [
                    'status' => [
                        'remarks' => 'success',
                        'message' => 'Dashboard status updated successfully'
                    ]
                ];
            } else {
                $response = [];
            }

            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (\PDOException $e) {
            error_log("Error updating dashboard status: " . $e->getMessage());

            $response = [
                'status' => [
                    'remarks' => 'failed',
                    'message' => 'Failed to update dashboard status: ' . $e->getMessage()
                ]
            ];

            header('Content-Type: application/json');
            echo json_encode($response);
        }
    }

    public function addAnnouncement($data)
    {
        try {
            $sql = "INSERT INTO announcements (date, title, content) VALUES (?, ?, ?)";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([
                $data->date,
                $data->title,
                $data->content
            ]);

            return $this->sendPayload(null, "success", "Announcement added successfully.", 200);
        } catch (\PDOException $e) {
            error_log("Error adding announcement: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to add announcement.", 500);
        }
    }

    public function editAnnouncement($data)
    {
        try {
            $sql = "UPDATE announcements 
                    SET date = ?, title = ?, content = ? 
                    WHERE id = ?";

            $statement = $this->pdo->prepare($sql);
            $statement->execute([
                $data->date,
                $data->title,
                $data->content,
                $data->id
            ]);

            if ($statement->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Announcement updated successfully.", 200);
            } else {
                return $this->sendPayload(null, "failed", "Announcement not found.", 404);
            }
        } catch (\PDOException $e) {
            error_log("Error updating announcement: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to update announcement.", 500);
        }
    }

    public function deleteAnnouncement($id)
    {
        try {
            $sql = "DELETE FROM announcements WHERE id = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$id]);

            if ($statement->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Announcement deleted successfully.", 200);
            } else {
                return $this->sendPayload(null, "failed", "Announcement not found.", 404);
            }
        } catch (\PDOException $e) {
            error_log("Error deleting announcement: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to delete announcement.", 500);
        }
    }

    public function addNews($data)
    {
        try {
            $sql = "INSERT INTO news (title, excerpt, author, date, category, imageUrl, status) 
                    VALUES (?, ?, ?, ?, ?, ?, 'active')";

            $statement = $this->pdo->prepare($sql);
            $statement->execute([
                $data->title,
                $data->excerpt,
                $data->author,
                $data->date,
                $data->category,
                $data->imageUrl
            ]);

            return $this->sendPayload(null, "success", "News added successfully.", 200);
        } catch (\PDOException $e) {
            error_log("Error adding news: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to add news.", 500);
        }
    }

    public function editNews($data)
    {
        try {
            $sql = "UPDATE news 
                    SET title = ?, 
                        excerpt = ?, 
                        author = ?, 
                        date = ?, 
                        category = ?, 
                        imageUrl = ? 
                    WHERE id = ? AND status = 'active'";

            $statement = $this->pdo->prepare($sql);
            $statement->execute([
                $data->title,
                $data->excerpt,
                $data->author,
                $data->date,
                $data->category,
                $data->imageUrl,
                $data->id
            ]);

            if ($statement->rowCount() > 0) {
                return $this->sendPayload(null, "success", "News updated successfully.", 200);
            } else {
                return $this->sendPayload(null, "failed", "News not found or already deleted.", 404);
            }
        } catch (\PDOException $e) {
            error_log("Error updating news: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to update news.", 500);
        }
    }

    public function deleteNews($data)
    {
        try {
            $sql = "UPDATE news SET status = 'deleted' WHERE id = ? AND status = 'active'";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->id]);

            if ($statement->rowCount() > 0) {
                return $this->sendPayload(null, "success", "News deleted successfully.", 200);
            } else {
                return $this->sendPayload(null, "failed", "News not found or already deleted.", 404);
            }
        } catch (\PDOException $e) {
            error_log("Error deleting news: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to delete news.", 500);
        }
    }

    public function editUser($data)
    {
        try {
            // Only allow editing of specific fields
            $sql = "UPDATE students 
                    SET fname = ?, 
                        mname = ?, 
                        lname = ?, 
                        ename = ?,
                        status = ? 
                    WHERE stud_id_no = ?";

            $statement = $this->pdo->prepare($sql);
            $statement->execute([
                $data->fname,
                $data->mname,
                $data->lname,
                $data->ename,
                $data->status,
                $data->stud_id_no
            ]);

            if ($statement->rowCount() > 0) {
                return $this->sendPayload($data, "success", "User updated successfully.", 200);
            } else {
                return $this->sendPayload(null, "failed", "User not found or already suspended.", 404);
            }
        } catch (\PDOException $e) {
            error_log("Error updating user: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to update user.", 500);
        }
    }

    public function deleteUser($data)
    {
        try {
            $sql = "UPDATE students SET status = 'suspended' WHERE stud_id_no = ? AND status != 'suspended'";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->stud_id_no]);

            if ($statement->rowCount() > 0) {
                return $this->sendPayload(null, "success", "User suspended successfully.", 200);
            } else {
                return $this->sendPayload(null, "failed", "User not found or already suspended.", 404);
            }
        } catch (\PDOException $e) {
            error_log("Error suspending user: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to suspend user.", 500);
        }
    }

    public function upload_profile_picture($data)
    {
        try {
            if (!isset($_FILES['profile_picture'])) {
                return $this->sendPayload(null, "failed", "No file uploaded", 400);
            }

            $file = $_FILES['profile_picture'];
            $stud_id_no = $data->stud_id_no;

            // Create uploads directory if it doesn't exist
            $uploadDir = '../uploads/profile_pictures/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Generate unique filename
            $fileName = $stud_id_no . '_' . time() . '_' . basename($file['name']);
            $targetPath = $uploadDir . $fileName;
            $dbPath = 'uploads/profile_pictures/' . $fileName;  // Path to store in DB

            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                // Update database with new profile picture path
                $sql = "UPDATE students SET profile_picture = ? WHERE stud_id_no = ?";
                $statement = $this->pdo->prepare($sql);
                $statement->execute([$dbPath, $stud_id_no]);

                return $this->sendPayload(
                    ['path' => $dbPath],
                    "success",
                    "Profile picture uploaded successfully",
                    200
                );
            }

            return $this->sendPayload(null, "failed", "Failed to upload file", 500);
        } catch (Exception $e) {
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function updateStudentProfile($data)
    {
        try {
            $allowedFields = [
                'fname',
                'mname',
                'lname',
                'ename',
                'birth_date',
                'email',
                'mobile_no',
                'program',
                'year_level',
                'password'
            ];
            $updates = [];
            $values = [];

            foreach ($allowedFields as $field) {
                if (isset($data->$field) && $field !== 'password') {
                    $updates[] = "$field = ?";
                    $values[] = $data->$field;
                }
            }

            // Handle password separately
            if (isset($data->password) && !empty($data->password)) {
                $updates[] = "password = ?";
                $values[] = password_hash($data->password, PASSWORD_DEFAULT);
            }

            // Add student ID for WHERE clause
            $values[] = $data->stud_id_no;

            $sql = "UPDATE students SET " . implode(", ", $updates) .
                " WHERE stud_id_no = ?";

            $statement = $this->pdo->prepare($sql);
            $statement->execute($values);

            if ($statement->rowCount() > 0) {
                return $this->sendPayload(null, "success", "Profile updated successfully", 200);
            } else {
                return $this->sendPayload(null, "failed", "No changes made to profile", 404);
            }
        } catch (\PDOException $e) {
            error_log("Error updating student profile: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to update profile", 500);
        }
    }

    public function register_faculty($data)
    {
        // Check if faculty ID number already exists
        $sql = "SELECT COUNT(*) FROM faculty WHERE faculty_id_no = ?";
        $statement = $this->pdo->prepare($sql);
        $statement->execute([$data->faculty_id_no]);
        $count = $statement->fetchColumn();

        if ($count > 0) {
            return $this->sendPayload(null, "failed", "Faculty ID number already taken.", 400);
        }

        // Proceed with registration if faculty ID is not taken
        $sql = "INSERT INTO faculty (faculty_id_no, fname, mname, lname, ename, email, mobile_no, password) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try {
            $statement = $this->pdo->prepare($sql);
            $hashedPassword = password_hash($data->password, PASSWORD_BCRYPT);

            $statement->execute([
                $data->faculty_id_no,
                $data->fname,
                $data->mname,
                $data->lname,
                $data->ename,
                $data->email,
                $data->mobile_no,
                $hashedPassword
            ]);

            return $this->sendPayload(null, "success", "Successfully registered.", 200);
        } catch (\PDOException $e) {
            $errmsg = $e->getMessage();
            error_log("Faculty Registration error: " . $errmsg);
            return $this->sendPayload(null, "failed", "Failed to register faculty.", 500);
        }
    }

    public function faculty_login($data)
    {
        try {
            $sql = "SELECT * FROM faculty WHERE faculty_id_no = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->faculty_id_no]);
            $faculty = $statement->fetch();

            if ($faculty && password_verify($data->password, $faculty['password'])) {
                // Generate JWT token
                $token = bin2hex(random_bytes(32)); // Simple token generation

                // Prepare user data for response
                $userData = [
                    'faculty_id_no' => $faculty['faculty_id_no'],
                    'fname' => $faculty['fname'],
                    'lname' => $faculty['lname'],
                    'email' => $faculty['email'],
                    'role' => 'faculty'
                ];

                return $this->sendPayload([
                    'token' => $token,
                    'user' => $userData
                ], "success", "Login successful", 200);
            } else {
                return $this->sendPayload(null, "failed", "Invalid credentials", 401);
            }
        } catch (\PDOException $e) {
            error_log("Login error: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Login failed", 500);
        }
    }

    public function saveElectionSettings($data)
    {
        try {
            // First, clear existing settings
            $clearSql = "DELETE FROM election_setup WHERE id = 1";
            $this->pdo->exec($clearSql);

            // Insert new settings
            $sql = "INSERT INTO election_setup (id, date, start_time, end_time, reg_deadline, positions, voter_eligibility) 
                    VALUES (1, ?, ?, ?, ?, ?, ?)";

            $statement = $this->pdo->prepare($sql);
            $statement->execute([
                $data->electionDate,
                $data->startTime,
                $data->endTime,
                $data->registrationDeadline,
                json_encode($data->positions),
                json_encode($data->allowedYearLevels)
            ]);

            return $this->sendPayload(null, "success", "Election settings saved successfully", 200);
        } catch (\PDOException $e) {
            error_log("Error saving election settings: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to save election settings", 500);
        }
    }

    public function submitCandidateApplication($postData, $files)
    {
        try {
            $this->pdo->beginTransaction();

            // Validate file sizes
            $maxFileSize = 2 * 1024 * 1024; // 2MB in bytes
            foreach ($files as $key => $file) {
                if (strpos($key, 'certificateFile') === 0) {
                    if ($file['size'] > $maxFileSize) {
                        throw new \Exception("File size exceeds 2MB limit: " . $file['name']);
                    }

                    // Also validate file type
                    $allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                    if (!in_array($file['type'], $allowedTypes)) {
                        throw new \Exception("Invalid file type. Only PDF and DOC files are allowed.");
                    }
                }
            }

            // Validate required fields
            $requiredFields = [
                'name' => 'Name',
                'position' => 'Position',
                'partylist_name' => 'Partylist name',
                'accomplishments' => 'Accomplishments',
                'stud_id_no' => 'Student ID'
            ];

            foreach ($requiredFields as $field => $label) {
                if (!isset($postData[$field]) || empty($postData[$field])) {
                    throw new \Exception("$label is required");
                }
            }

            // Check number of files
            $certificateCount = 0;
            foreach ($files as $key => $file) {
                if (strpos($key, 'certificateFile') === 0) {
                    $certificateCount++;
                }
            }

            if ($certificateCount > 3) {
                throw new \Exception("Maximum of 3 files allowed");
            }

            // Handle certificate file uploads
            $certificateUrls = [];
            foreach ($files as $key => $file) {
                if (strpos($key, 'certificateFile') === 0 && $file['error'] === UPLOAD_ERR_OK) {
                    $uploadDir = '../uploads/certificates/';
                    if (!file_exists($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }

                    $fileName = uniqid() . '_' . basename($file['name']);
                    $targetPath = $uploadDir . $fileName;

                    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                        // Get the index number from the key (certificateFile0 -> 0)
                        $index = substr($key, -1);
                        $certificateUrls[$index] = 'uploads/certificates/' . $fileName;
                    } else {
                        throw new \Exception("Failed to upload certificate file");
                    }
                }
            }

            // Insert into candidate table first
            $sql = "INSERT INTO candidate (name, position, partylist_name, certificate_url0, certificate_url1, certificate_url2, platform, accomplishments, stud_id_no, status, imageURL) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $postData['name'],
                $postData['position'],
                $postData['partylist_name'],
                $certificateUrls[0] ?? null,
                $certificateUrls[1] ?? null,
                $certificateUrls[2] ?? null,
                $postData['platform'],
                $postData['accomplishments'],
                $postData['stud_id_no'],
                $postData['imageFile'] // Add the imageURL from postData
            ]);

            if (!$stmt->rowCount() > 0) {
                throw new \Exception("Failed to insert candidate record");
            }

            $candidateId = $this->pdo->lastInsertId();

            // If position is President, create new partylist with president_id
            if ($postData['position'] === 'President') {
                $partylistSql = "INSERT INTO partylists (name, president_id, created_at) 
                                VALUES (?, ?, CURRENT_TIMESTAMP)";
                $partylistStmt = $this->pdo->prepare($partylistSql);
                $partylistResult = $partylistStmt->execute([
                    $postData['partylist_name'],
                    $candidateId
                ]);

                if (!$partylistResult) {
                    throw new \Exception("Failed to create partylist");
                }
            }

            $this->pdo->commit();
            return $this->sendPayload(null, "success", "Application submitted successfully", 200);
        } catch (\Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("Error in submitCandidateApplication: " . $e->getMessage());
            return $this->sendPayload(null, "failed", $e->getMessage(), 500);
        }
    }

    public function updateCandidateStatus($data)
    {
        try {
            $sql = "UPDATE candidate SET status = ? WHERE id = ?";
            $statement = $this->pdo->prepare($sql);
            $statement->execute([$data->status, $data->id]);

            return $this->sendPayload(null, "success", "Candidate status updated successfully.", 200);
        } catch (\PDOException $e) {
            error_log("Error updating candidate status: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to update candidate status.", 500);
        }
    }

    public function saveBallot($data)
    {
        try {
            $this->pdo->beginTransaction();

            // Clear existing ballot entries
            $clearSql = "DELETE FROM ballot_preparation";
            $this->pdo->exec($clearSql);

            // Insert new ballot entries
            $sql = "INSERT INTO ballot_preparation (position, can_id) VALUES (:position, :can_id)";
            $stmt = $this->pdo->prepare($sql);

            foreach ($data->ballot as $entry) {
                foreach ($entry->can_ids as $candidateId) {
                    $stmt->execute([
                        ':position' => $entry->position,
                        ':can_id' => $candidateId
                    ]);
                }
            }

            $this->pdo->commit();
            return $this->sendPayload(null, "success", "Ballot saved successfully", 200);
        } catch (\PDOException $e) {
            $this->pdo->rollBack();
            error_log("Error saving ballot: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to save ballot: " . $e->getMessage(), 500);
        }
    }

    public function submitVote($data)
    {
        try {
            $this->pdo->beginTransaction();

            // Check if student has already voted
            $checkSql = "SELECT COUNT(*) FROM result WHERE user_id = ?";
            $checkStmt = $this->pdo->prepare($checkSql);
            $checkStmt->execute([$data->votes[0]->user_id]);
            if ($checkStmt->fetchColumn() > 0) {
                throw new Exception("Student has already voted");
            }

            // Insert votes
            $sql = "INSERT INTO result (user_id, position_name, can_id, vote_date) 
                    VALUES (?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);

            foreach ($data->votes as $vote) {
                $stmt->execute([
                    $vote->user_id,
                    $vote->position,
                    $vote->can_id,
                    $vote->date
                ]);
            }

            $this->pdo->commit();
            return $this->sendPayload(null, "success", "Vote submitted successfully", 200);
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            return $this->sendPayload(null, "failed", $e->getMessage(), 400);
        }
    }

    public function updateFacultyProfile($data)
    {
        try {
            $sql = "UPDATE faculty SET 
                    fname = :fname,
                    mname = :mname,
                    lname = :lname,
                    ename = :ename,
                    email = :email,
                    mobile_no = :mobile_no
                    WHERE faculty_id_no = :faculty_id_no";

            $statement = $this->pdo->prepare($sql);

            $params = [
                ':fname' => $data->fname,
                ':mname' => $data->mname,
                ':lname' => $data->lname,
                ':ename' => $data->ename,
                ':email' => $data->email,
                ':mobile_no' => $data->mobile_no,
                ':faculty_id_no' => $data->faculty_id_no
            ];

            if ($statement->execute($params)) {
                return $this->sendPayload(null, "success", "Profile updated successfully.", 200);
            } else {
                return $this->sendPayload(null, "failed", "Failed to update profile.", 400);
            }
        } catch (\PDOException $e) {
            error_log("Error updating faculty profile: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to update profile: " . $e->getMessage(), 500);
        }
    }

    public function updatePartylistApplication($data)
    {
        try {
            $this->pdo->beginTransaction();

            $sql = "UPDATE candidate 
                    SET status = ?, 
                        updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?";

            $stmt = $this->pdo->prepare($sql);
            if (!$stmt->execute([$data->status, $data->candidate_id])) {
                throw new \Exception("Failed to update application status");
            }

            $this->pdo->commit();
            return $this->sendPayload(null, "success", "Application status updated successfully", 200);
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            error_log("Error updating application status: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to update application status", 500);
        }
    }

    public function updatePartylistCandidateStatus($data)
    {
        try {
            $this->pdo->beginTransaction();

            // First check if position is already taken for approved status
            if ($data->status === 'approved') {
                $checkSql = "SELECT COUNT(*) FROM candidate 
                            WHERE partylist_name = ? 
                            AND position = (SELECT position FROM candidate WHERE id = ?)
                            AND status = 'approved'
                            AND id != ?";
                $checkStmt = $this->pdo->prepare($checkSql);
                $checkStmt->execute([$data->partylist_name, $data->candidate_id, $data->candidate_id]);
                $count = $checkStmt->fetchColumn();

                if ($count > 0) {
                    $this->pdo->rollBack();
                    return $this->sendPayload(null, "failed", "Position already taken", 400);
                }
            }

            // Update candidate status without updated_at field
            $sql = "UPDATE candidate 
                    SET status = ?
                    WHERE id = ? 
                    AND partylist_name = ?";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->status, $data->candidate_id, $data->partylist_name]);

            if ($stmt->rowCount() === 0) {
                throw new \Exception("No candidate found or no changes made");
            }

            $this->pdo->commit();
            return $this->sendPayload(null, "success", "Candidate status updated successfully", 200);
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            error_log("Error updating candidate status: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to update candidate status: " . $e->getMessage(), 500);
        }
    }

    public function deletePartylistCandidate($data)
    {
        try {
            $this->pdo->beginTransaction();

            $sql = "DELETE FROM candidate 
                    WHERE id = ? 
                    AND partylist_name = ?";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->candidate_id, $data->partylist_name]);

            if ($stmt->rowCount() === 0) {
                throw new \Exception("No candidate found or already deleted");
            }

            $this->pdo->commit();
            return $this->sendPayload(null, "success", "Candidate deleted successfully", 200);
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            error_log("Error deleting candidate: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to delete candidate: " . $e->getMessage(), 500);
        }
    }

    public function submitPartylistApplication($data)
    {
        try {
            $this->pdo->beginTransaction();
            error_log("Submitting partylist application: " . print_r($data, true));

            // Check if required data is present
            if (!isset($data->partylist_name) || !isset($data->student_id)) {
                error_log("Missing required fields");
                return $this->sendPayload(null, "failed", "Missing required fields", 400);
            }

            // First check if application already exists
            $checkSql = "SELECT * FROM partylist_applications 
                        WHERE partylist_name = ? AND student_id = ?";
            $checkStmt = $this->pdo->prepare($checkSql);
            $checkStmt->execute([$data->partylist_name, $data->student_id]);

            error_log("Check query executed. Row count: " . $checkStmt->rowCount());

            if ($checkStmt->rowCount() > 0) {
                $this->pdo->rollBack();
                error_log("Application already exists");
                return $this->sendPayload(null, "failed", "Application already exists", 400);
            }

            // Insert new application
            $sql = "INSERT INTO partylist_applications (partylist_name, student_id, status, submitted_at) 
                    VALUES (?, ?, 'pending', NOW())";
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute([$data->partylist_name, $data->student_id]);

            error_log("Insert result: " . ($result ? "success" : "failed"));

            if ($result) {
                $this->pdo->commit();
                return $this->sendPayload(null, "success", "Application submitted successfully", 200);
            } else {
                $this->pdo->rollBack();
                error_log("PDO error info: " . print_r($stmt->errorInfo(), true));
                return $this->sendPayload(null, "failed", "Failed to submit application", 500);
            }
        } catch (PDOException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("Database error: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Database error: " . $e->getMessage(), 500);
        }
    }

    private function validateToken($token)
    {
        try {
            error_log("Validating token: " . $token);

            if (empty($token)) {
                error_log("Token is empty");
                return false;
            }

            // Check in tokens table
            $sql = "SELECT * FROM tokens WHERE token = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$token]);
            $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);

            error_log("Token data: " . print_r($tokenData, true));

            if (!$tokenData) {
                error_log("Token not found in database");
                return false;
            }

            // Check if token has expired
            if (strtotime($tokenData['expires_at']) < time()) {
                error_log("Token has expired");
                return false;
            }

            error_log("Token is valid");
            return true;
        } catch (\Exception $e) {
            error_log("Token validation error: " . $e->getMessage());
            return false;
        }
    }

    public function updatePartylistApplicationStatus($applicationId, $status)
    {
        try {
            $this->pdo->beginTransaction();

            $sql = "UPDATE partylist_applications SET status = ? WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$status, $applicationId]);

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

    public function deletePartylist($partylistName)
    {
        try {
            $this->pdo->beginTransaction();

            // First check if partylist exists
            $checkSql = "SELECT * FROM partylists WHERE name = ?";
            $checkStmt = $this->pdo->prepare($checkSql);
            $checkStmt->execute([$partylistName]);
            $partylist = $checkStmt->fetch();

            if (!$partylist) {
                throw new Exception("Partylist not found");
            }

            // First delete from result table where can_id references candidates from this partylist
            $sql = "DELETE r FROM result r 
                    INNER JOIN candidate c ON r.can_id = c.id 
                    WHERE c.partylist_name = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$partylistName]);

            // Update partylists table to set president_id to NULL
            $sql = "UPDATE partylists SET president_id = NULL WHERE name = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$partylistName]);

            // Now delete from candidate table
            $sql = "DELETE FROM candidate WHERE partylist_name = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$partylistName]);

            // Delete from partylist_applications
            $sql = "DELETE FROM partylist_applications WHERE partylist_name = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$partylistName]);

            // Finally delete from partylists table
            $sql = "DELETE FROM partylists WHERE name = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$partylistName]);

            $this->pdo->commit();
            return $this->sendPayload(null, "success", "Partylist deleted successfully", 200);
        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log("Error deleting partylist: " . $e->getMessage());
            return $this->sendPayload(null, "failed", "Failed to delete partylist: " . $e->getMessage(), 500);
        }
    }
}
