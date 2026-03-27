# Landing Page Content Management Setup

This document explains how to set up the landing page content management system.

## Database Setup

1. **Create the database tables:**
   Run the SQL script `create_landing_page_tables.sql` in your MySQL database to create the necessary tables and insert default content.

   ```sql
   -- You can run this directly in your MySQL client or phpMyAdmin
   source create_landing_page_tables.sql;
   ```

2. **Verify the tables were created:**
   ```sql
   SHOW TABLES LIKE 'landing_page%';
   SELECT * FROM landing_page_content;
   ```

## API Endpoints

The following API endpoints are now available:

### GET Endpoints

- `GET /api/landing_page_content` - Get all landing page content
- `GET /api/landing_page_section/{section_name}` - Get specific section content

### POST Endpoints

- `POST /api/update_landing_page_content` - Update all landing page content
- `POST /api/update_landing_page_section/{section_name}` - Update specific section

## Frontend Integration

The landing page now fetches content from the database instead of localStorage. The admin pages component allows administrators to:

1. **Edit Hero Section:**

   - Change hero title and description
   - Upload new background image
   - Preview changes

2. **Manage Services:**

   - Add/remove services
   - Upload service images
   - Edit service names

3. **Manage Gallery:**

   - Add/remove gallery images
   - Upload new images
   - Edit alt text

4. **Update Contact Information:**

   - Change address, phone, email
   - Update opening hours

5. **Manage Footer:**
   - Update footer contact info
   - Change social media links
   - Edit copyright text

## Usage

1. **For Administrators:**

   - Navigate to Admin Dashboard → Pages
   - Edit any section using the tabbed interface
   - Click "Save Changes" to update the database
   - Changes are immediately reflected on the landing page

2. **For Users:**
   - The landing page automatically loads content from the database
   - No changes needed - the page will display the latest content

## Troubleshooting

1. **If content doesn't load:**

   - Check database connection
   - Verify tables exist
   - Check API endpoints are accessible

2. **If changes don't save:**

   - Check admin authentication
   - Verify API permissions
   - Check database write permissions

3. **If images don't display:**
   - Verify image paths are correct
   - Check file upload permissions
   - Ensure images are accessible via web server

## Default Content

The system comes with default content that matches the original landing page design. This content is automatically inserted when you run the SQL script.
