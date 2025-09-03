<?php
date_default_timezone_set("Asia/Manila");

set_time_limit(1000);

define("SERVER", "sql.brown-octopus-872555.hostingersite.com");
define("DATABASE", "u835265537_autowash");
define("USER", "u835265537_aducalremegioO");
define("PASSWORD", "f3>S-A>Mt");
define("DRIVER", "mysql");

class Connection {
    private $connectionString = DRIVER . ":host=" . SERVER . ";dbname=" . DATABASE . "; charset=utf8mb4";
    private $options = [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        \PDO::ATTR_EMULATE_PREPARES => false
    ];

    public function connect() {
        try {
            return new \PDO($this->connectionString, USER, PASSWORD, $this->options);
        } catch (\PDOException $e) {
            // Handle connection errors
            die("Connection failed: " . $e->getMessage());
        }
    }
}
?>