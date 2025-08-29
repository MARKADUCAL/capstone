# Setting Up Real Car Wash Services

## Current Issue

Your system currently displays placeholder services with names like "123" and "basic" that both cost ₱123.00. This guide will help you set up realistic car wash services with proper pricing.

## Option 1: Add Services Through Admin Interface (Recommended)

### Step 1: Login as Admin

1. Navigate to your admin login page
2. Use your admin credentials to log in

### Step 2: Access Service Management

1. Go to the admin dashboard
2. Navigate to "Service Management" section

### Step 3: Add Real Services

Add these realistic car wash services one by one:

#### Basic Car Wash

- **Name**: Basic Car Wash
- **Description**: Exterior wash, tire cleaning, and basic interior vacuum
- **Price**: 150.00
- **Duration**: 30 minutes
- **Category**: Basic Wash
- **Active**: Yes

#### Premium Car Wash

- **Name**: Premium Car Wash
- **Description**: Basic wash plus wax, tire shine, and interior cleaning
- **Price**: 250.00
- **Duration**: 45 minutes
- **Category**: Premium Wash
- **Active**: Yes

#### Full Detail Service

- **Name**: Full Detail Service
- **Description**: Complete interior and exterior detailing with premium products
- **Price**: 800.00
- **Duration**: 120 minutes
- **Category**: Full Detail
- **Active**: Yes

#### Express Wash

- **Name**: Express Wash
- **Description**: Quick exterior wash and tire cleaning (15 minutes)
- **Price**: 100.00
- **Duration**: 15 minutes
- **Category**: Express Wash
- **Active**: Yes

#### SUV/Truck Wash

- **Name**: SUV/Truck Wash
- **Description**: Specialized wash for larger vehicles with extended service time
- **Price**: 200.00
- **Duration**: 40 minutes
- **Category**: Large Vehicle
- **Active**: Yes

#### Interior Deep Clean

- **Name**: Interior Deep Clean
- **Description**: Comprehensive interior cleaning and sanitization
- **Price**: 300.00
- **Duration**: 60 minutes
- **Category**: Interior Service
- **Active**: Yes

#### Exterior Wax & Polish

- **Name**: Exterior Wax & Polish
- **Description**: Professional waxing and paint polishing service
- **Price**: 400.00
- **Duration**: 90 minutes
- **Category**: Exterior Care
- **Active**: Yes

#### Engine Bay Cleaning

- **Name**: Engine Bay Cleaning
- **Description**: Safe engine bay cleaning and degreasing
- **Price**: 180.00
- **Duration**: 45 minutes
- **Category**: Engine Service
- **Active**: Yes

## Option 2: Use SQL Script

If you prefer to run a SQL script directly:

1. Open your database management tool (phpMyAdmin, MySQL Workbench, etc.)
2. Connect to your `db_autowashhub` database
3. Run the SQL commands from `add_real_services.sql`

## Option 3: Manual Database Update

You can also manually update the existing services:

```sql
-- Update existing placeholder services
UPDATE services SET
    name = 'Basic Car Wash',
    description = 'Exterior wash, tire cleaning, and basic interior vacuum',
    price = 150.00,
    duration_minutes = 30,
    category = 'Basic Wash'
WHERE name = '123';

UPDATE services SET
    name = 'Premium Car Wash',
    description = 'Basic wash plus wax, tire shine, and interior cleaning',
    price = 250.00,
    duration_minutes = 45,
    category = 'Premium Wash'
WHERE name = 'basic';
```

## After Adding Services

1. **Refresh the customer dashboard** - The new services should appear automatically
2. **Verify pricing** - Check that all prices display correctly
3. **Test booking** - Try booking a service to ensure the flow works

## Pricing Strategy Notes

The suggested prices are based on:

- **Market research** for car wash services in the Philippines
- **Service complexity** and time required
- **Competitive positioning** in the market
- **Profit margins** for sustainable business

You can adjust these prices based on:

- Your local market conditions
- Operating costs
- Target customer segment
- Competitive analysis

## Troubleshooting

### Services Not Appearing

- Check that `is_active` is set to 1
- Verify the API endpoint is working
- Check browser console for errors

### Prices Not Displaying

- Ensure price field is numeric and greater than 0
- Check the `formatPrice` method in the component
- Verify database field types

### Admin Interface Issues

- Ensure you're logged in as admin
- Check that the service management component is accessible
- Verify API permissions and authentication

## Next Steps

1. **Add the services** using one of the methods above
2. **Test the customer interface** to ensure prices display correctly
3. **Consider adding more services** based on customer demand
4. **Implement dynamic pricing** if needed (seasonal, vehicle type, etc.)
5. **Add service images** to make the interface more attractive
