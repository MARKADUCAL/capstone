-- Create service_packages table
CREATE TABLE IF NOT EXISTS service_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(10) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vehicle_types table
CREATE TABLE IF NOT EXISTS vehicle_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create pricing table
CREATE TABLE IF NOT EXISTS pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_type VARCHAR(10) NOT NULL,
    service_package VARCHAR(10) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_package_vehicle (vehicle_type, service_package),
    FOREIGN KEY (vehicle_type) REFERENCES vehicle_types(code) ON DELETE CASCADE,
    FOREIGN KEY (service_package) REFERENCES service_packages(name) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default vehicle types
INSERT INTO vehicle_types (code, description, is_active) VALUES
    ('S', 'SEDANS (all sedan types)', 1),
    ('M', 'SUVs (all SUV types)', 1),
    ('L', 'VANs (any type of van)', 1),
    ('XL', 'Larger than vans (big SUVs/pickups, oversized vehicles)', 1);

-- Insert default service packages
INSERT INTO service_packages (name, description, is_active) VALUES
    ('p1', 'Wash only', 1),
    ('p2', 'Wash / Vacuum', 1),
    ('p3', 'Wash / Vacuum / Hand Wax', 1),
    ('p4', 'Wash / Vacuum / Buffing Wax', 1);

-- Insert default pricing matrix (16 entries - all combinations)
INSERT INTO pricing (vehicle_type, service_package, price, is_active) VALUES
    -- Sedans pricing
    ('S', 'p1', 140, 1),
    ('S', 'p2', 180, 1),
    ('S', 'p3', 220, 1),
    ('S', 'p4', 260, 1),
    -- SUVs pricing
    ('M', 'p1', 160, 1),
    ('M', 'p2', 200, 1),
    ('M', 'p3', 240, 1),
    ('M', 'p4', 280, 1),
    -- VANs pricing
    ('L', 'p1', 180, 1),
    ('L', 'p2', 220, 1),
    ('L', 'p3', 260, 1),
    ('L', 'p4', 300, 1),
    -- Larger vehicles pricing
    ('XL', 'p1', 200, 1),
    ('XL', 'p2', 240, 1),
    ('XL', 'p3', 280, 1),
    ('XL', 'p4', 320, 1);
