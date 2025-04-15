<?php
class Database {
    // Database credentials
    private $host = "localhost";
    private $db_name = "db_autowashhub";
    private $username = "root";
    private $password = "";
    public $conn;

    // Get database connection
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
            return $this->conn;
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
            return null;
        }
    }

    // Add a new method to test connection
    public function testConnection() {
        $conn = $this->getConnection();
        return [
            'connected' => $conn !== null,
            'message' => $conn !== null ? 'Connection successful' : 'Connection failed'
        ];
    }
}
?>