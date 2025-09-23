# File Upload Functionality

This document describes the file upload functionality implemented in the AutoWash Hub API.

## Overview

The upload system allows users to upload images for various purposes:

- Inventory items
- Services
- Gallery images
- User profiles

## Directory Structure

```
backend/autowash-hub-api/
├── uploads/           # All uploaded images in one folder
│   └── .htaccess      # Security configuration
```

**Note**: All images are stored in a single `uploads/` folder. The category is tracked in the database and included in the filename prefix (e.g., `inventory_1234567890_1234567890.jpg`).

## API Endpoints

### 1. Single File Upload

- **Endpoint**: `POST /api/upload_file`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file` (required): The image file to upload
  - `category` (optional): Category folder (default: 'general')

**Example Request**:

```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("category", "inventory");

fetch("/api/upload_file", {
  method: "POST",
  body: formData,
});
```

**Response**:

```json
{
  "status": "success",
  "message": "File uploaded successfully",
  "data": {
    "filename": "inventory_1234567890_1234567890.jpg",
    "filepath": "uploads/inventory_1234567890_1234567890.jpg",
    "url": "https://yourdomain.com/uploads/inventory_1234567890_1234567890.jpg",
    "size": 123456,
    "type": "image/jpeg",
    "category": "inventory"
  }
}
```

### 2. Multiple Files Upload

- **Endpoint**: `POST /api/upload_multiple_files`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `files[]` (required): Array of image files
  - `category` (optional): Category folder (default: 'general')

**Example Request**:

```javascript
const formData = new FormData();
for (let i = 0; i < fileInput.files.length; i++) {
  formData.append("files[]", fileInput.files[i]);
}
formData.append("category", "gallery");

fetch("/api/upload_multiple_files", {
  method: "POST",
  body: formData,
});
```

### 3. Inventory Item with Image

- **Endpoint**: `POST /api/add_inventory_item_with_image`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `image` (required): Image file
  - `name` (required): Item name
  - `stock` (required): Stock quantity
  - `price` (required): Item price
  - `category` (optional): Item category

### 4. Delete File

- **Endpoint**: `POST /api/delete_file`
- **Content-Type**: `application/json`
- **Parameters**:
  - `filepath` (required): Path to file to delete

**Example Request**:

```javascript
fetch("/api/delete_file", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    filepath: "uploads/inventory/filename.jpg",
  }),
});
```

## File Validation

The upload system includes comprehensive validation:

### File Type Validation

- **Allowed MIME types**: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- **Allowed extensions**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

### File Size Validation

- **Maximum file size**: 5MB per file

### Security Features

- File type verification using both MIME type and file extension
- Unique filename generation to prevent conflicts
- Secure file storage with proper permissions
- `.htaccess` rules to prevent script execution in uploads folder

## Database Schema

The system creates an `uploaded_files` table to track uploaded files:

```sql
CREATE TABLE uploaded_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL,
    size INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_uploaded_at (uploaded_at)
);
```

## Security Configuration

The `.htaccess` file in the uploads folder provides:

- Prevention of PHP script execution
- Restriction to image files only
- Directory browsing prevention
- Proper MIME type headers
- Cache control for images
- Security headers

## Testing

Use the provided `upload_test.html` file to test the upload functionality:

1. Open `upload_test.html` in a web browser
2. Test single file uploads
3. Test multiple file uploads
4. Test inventory item creation with images
5. Test file deletion

## Error Handling

The system provides detailed error messages for:

- Invalid file types
- File size exceeded
- Upload failures
- Database errors
- Missing required fields

## Integration with Frontend

To integrate with your Angular frontend:

1. Create a service for file uploads
2. Use `FormData` for multipart requests
3. Handle progress events for large files
4. Display upload status to users
5. Show preview of uploaded images

## File URL Generation

Uploaded files are accessible via URLs in the format:

```
https://yourdomain.com/uploads/{filename}
```

Where the filename includes the category prefix (e.g., `inventory_1234567890_1234567890.jpg`).

The system automatically generates full URLs for uploaded files in API responses.

## Maintenance

- Regularly clean up unused files
- Monitor disk usage
- Backup uploaded files
- Update security rules as needed
- Test upload functionality after server changes
