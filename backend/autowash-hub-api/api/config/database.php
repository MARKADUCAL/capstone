<?php
date_default_timezone_set("Asia/Manila");

set_time_limit(1000);

define("SERVER", "localhost"); // Keep as localhost for Hostinger shared hosting
define("DATABASE", "u835265537_database");   // matches Hostinger
define("USER", "u835265537_autowash"); // matches Hostinger user (with zero)
define("PASSWORD", "Remegio030304");  // use the password you set in Hostinger
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

