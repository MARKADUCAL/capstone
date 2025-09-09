# Landing Page Content Management - Setup Instructions

## ⚠️ IMPORTANT: Database Setup Required

The error you're seeing (`Cannot read properties of null (reading 'status')`) occurs because the database tables for landing page content haven't been created yet.

## Step 1: Create Database Tables

You need to run the SQL script to create the required database tables:

1. **Access your database** (via phpMyAdmin, MySQL Workbench, or command line)
2. **Run the SQL script**: Execute the contents of `create_landing_page_tables.sql`

### Quick Setup via phpMyAdmin:

1. Open phpMyAdmin
2. Select your database (`u835265537_database`)
3. Go to the "SQL" tab
4. Copy and paste the entire contents of `create_landing_page_tables.sql`
5. Click "Go" to execute

### The SQL script will:

- Create `landing_page_content` table
- Create `landing_page_media` table
- Insert default content that matches your current landing page

## Step 2: Verify Setup

After running the SQL script, you can test the API endpoints:

### Test GET endpoint:

```
GET https://brown-octopus-872555.hostingersite.com/api/landing_page_content
```

Expected response:

```json
{
  "status": {
    "remarks": "success",
    "message": "Landing page content retrieved successfully"
  },
  "payload": {
    "hero": {
      "title": "CARWASHING MADE EASY",
      "description": "AutoWash Hub is one of the most convenient...",
      "background_url": "assets/homebackground.png"
    },
    "services": [...],
    "gallery": [...],
    "contact_info": {...},
    "footer": {...}
  }
}
```

## Step 3: Test Admin Interface

1. Navigate to Admin Dashboard → Pages
2. The content should load from the database
3. Make a small change and click "Save Changes"
4. Check that you get a success message

## Troubleshooting

### If you still get errors:

1. **Check database connection**: Verify your database credentials in `config/database.php`
2. **Check table existence**: Run `SHOW TABLES LIKE 'landing_page%';` in your database
3. **Check API logs**: Look for any PHP errors in your hosting control panel
4. **Test API directly**: Use a tool like Postman to test the endpoints

### Common Issues:

- **Tables don't exist**: Run the SQL script
- **Permission errors**: Check database user permissions
- **API not found**: Verify the routes are properly configured
- **CORS errors**: Check that your frontend URL is in the allowed origins list

## Default Content

The system comes with default content that matches your current landing page design. Once the database is set up, you can:

- Edit hero section (title, description, background)
- Manage services (add/remove, upload images)
- Update gallery images
- Modify contact information
- Change footer content and social links

All changes are saved to the database and immediately reflected on the landing page.
