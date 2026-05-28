# 🤖 Leydi Boss — Notification System: AI Prompt Guide (Phase by Phase)

## Context
- Project: **Leydi Boss** — Car Wash Booking System
- Stack: **Angular** (frontend) + **Plain PHP** (backend) + **MySQL**
- Status: Booking system is fully done. Only notifications are missing.
- Goal: Implement notification system phase by phase using AI assistance.

---

## 📌 How to Use This Guide
1. Copy the **prompt block** of the current phase
2. Paste it to your AI (Claude, ChatGPT, etc.)
3. Attach or paste the relevant existing files when asked
4. Finish and test each phase before moving to the next

---

---

## Phase 1 — Create the Notifications Table (MySQL)

**Goal:** Add the `notifications` table to your existing MySQL database.

**Files you need to attach:** your current DB schema or migration file (if any)

```
I am building a notification system for my car wash booking system called Leydi Boss.
Stack: Plain PHP + MySQL + Angular.

Here is my current users table structure:
[PASTE YOUR USERS TABLE STRUCTURE HERE]

Here is my current bookings table structure:
[PASTE YOUR BOOKINGS TABLE STRUCTURE HERE]

Please generate the SQL CREATE TABLE statement for a `notifications` table with these requirements:
- id (auto increment PK)
- user_id (FK to users table — the one being notified)
- type (string — e.g. 'new_booking', 'booking_approved', 'booking_rejected', 'booking_assigned')
- message (text — human readable message)
- data (JSON — extra info like booking_id, service name, date)
- is_read (tinyint default 0 — 0 unread, 1 read)
- created_at (datetime, auto set on insert)

Make sure the FK constraint references my actual users table correctly.
Also give me an INSERT example for each notification type so I can test it manually.
```

---

## Phase 2 — Notification Helper Function (PHP)

**Goal:** Create a reusable `sendNotification()` PHP function so I don't repeat INSERT code everywhere.

**Files you need to attach:** your existing DB connection file (e.g. `config/db.php` or `connection.php`)

```
I am adding a notification system to my Leydi Boss project (Plain PHP + MySQL).

Here is my existing database connection file:
[PASTE YOUR DB CONNECTION FILE HERE]

Please create a helper file called `notification_helper.php` with a single function:

function sendNotification($pdo, $userId, $type, $message, $data = [])

Requirements:
- Uses PDO prepared statements (match my existing db connection style)
- Inserts a row into the `notifications` table
- The `data` parameter is a PHP array that gets json_encode()'d before saving
- Should handle errors gracefully with try/catch
- Keep it simple, no classes needed — just a plain function I can require_once anywhere

Also show me where to place this file in a typical plain PHP project folder structure.
```

---

## Phase 3 — Notification API Endpoints (PHP)

**Goal:** Create the REST API endpoints that Angular will call to fetch and manage notifications.

**Files you need to attach:** one of your existing working API endpoint files (so AI can match your style/structure)

```
I am building notification API endpoints for Leydi Boss (Plain PHP + MySQL + Angular frontend).

Here is an example of one of my existing working API endpoint files so you can match my coding style:
[PASTE AN EXISTING ENDPOINT FILE HERE — e.g. your bookings/index.php]

Here is my notification_helper.php:
[PASTE notification_helper.php]

I need 4 endpoints. Please create each one as a separate PHP file:

1. GET /api/notifications
   - Returns all UNREAD notifications of the currently logged-in user
   - Decode the `data` JSON column before returning
   - Return: { notifications: [...], unread_count: N }

2. GET /api/notifications/count
   - Returns only the unread count of the logged-in user
   - Return: { unread_count: N }
   - This will be called every 15 seconds by Angular for polling

3. POST /api/notifications/read
   - Accepts { id: notifId } in request body
   - Marks that single notification as is_read = 1
   - Only marks it if it belongs to the logged-in user (security check)

4. POST /api/notifications/read-all
   - Marks ALL unread notifications of the logged-in user as is_read = 1

Match my existing code style exactly. Use the same auth/session pattern I use in my other endpoints.
```

---

## Phase 4 — Trigger Notifications in Existing Booking Endpoints (PHP)

**Goal:** Wire up `sendNotification()` into my existing booking PHP files so notifs are sent automatically on booking events.

**Files you need to attach:** your 3 existing booking endpoint files

```
I have a working notification system (notifications table + sendNotification() helper + API endpoints).

Now I need to trigger notifications inside my existing booking PHP endpoints.
Here is my notification_helper.php:
[PASTE notification_helper.php]

Please modify each of these 3 files to add the notification trigger. 
Do NOT change any existing logic — only ADD the sendNotification() call in the right place.

--- FILE 1: Booking Store (when customer submits a new booking) ---
[PASTE YOUR BOOKING STORE/CREATE ENDPOINT HERE]
→ After successfully inserting the booking, notify the Admin user.
→ Message: "New booking from [customer name] — [service] on [date]"
→ Type: 'new_booking'
→ Get the admin's user_id from the users table using role = 'admin'

--- FILE 2: Booking Status Update (when admin approves or rejects) ---
[PASTE YOUR BOOKING STATUS UPDATE ENDPOINT HERE]
→ After successfully updating the status, notify the Customer.
→ If approved: "Your booking on [date] has been approved! See you at Leydi Boss."
→ If rejected: "Your booking on [date] was not approved. Please rebook or contact us."
→ Type: 'booking_approved' or 'booking_rejected'
→ Get the customer's user_id from the booking record

--- FILE 3: Employee Assign (when admin assigns an employee to a booking) ---
[PASTE YOUR EMPLOYEE ASSIGN ENDPOINT HERE]
→ After successfully saving the employee_id, notify that Employee.
→ Message: "You have a new assignment: [customer name] — [service] on [date]"
→ Type: 'booking_assigned'
→ Use the employee_id being assigned as the user_id for the notification

Show me only the modified sections with clear comments where you added code.
```

---

## Phase 5 — Notification Service (Angular)

**Goal:** Create the Angular service that polls the API and shares the unread count across the app.

**Files you need to attach:** your existing Angular `environment.ts` and one existing service file (to match your style)

```
I am adding a notification system to my Angular frontend (Leydi Boss project).
Backend is plain PHP REST API.

Here is my environment.ts so you know my API base URL:
[PASTE YOUR environment.ts HERE]

Here is an example of one of my existing Angular services so you can match my style:
[PASTE AN EXISTING SERVICE FILE — e.g. booking.service.ts]

Please create `notification.service.ts` with:

1. A BehaviorSubject for unreadCount (so any component can subscribe to it)
2. A startPolling() method that uses RxJS interval() to call GET /api/notifications/count every 15 seconds and updates the BehaviorSubject
3. A getNotifications() method that calls GET /api/notifications
4. A markAsRead(id) method that calls POST /api/notifications/read with { id }
5. A markAllAsRead() method that calls POST /api/notifications/read-all
6. A stopPolling() method (for when user logs out)

Match my existing service structure and HttpClient usage exactly.
```

---

## Phase 6 — Notification Bell Component (Angular)

**Goal:** Create a reusable bell icon + dropdown component to display notifications.

**Files you need to attach:** `notification.service.ts` from Phase 5, and one of your existing Angular components (to match style)

```
I am creating a NotificationBellComponent for my Angular project (Leydi Boss).
This will be used in the navbar of Admin, Customer, and Employee layouts.

Here is my notification.service.ts:
[PASTE notification.service.ts]

Here is an example of one of my existing Angular components so you can match my style:
[PASTE AN EXISTING COMPONENT — e.g. a navbar or card component]

My project's color theme is: white + pink (#C0186A), using Inter font.
I use Bootstrap Icons (bi bi-bell-fill) for icons.

Please create:

1. notification-bell.component.ts — with full component logic:
   - Subscribes to NotificationService.unreadCount on init
   - Calls startPolling() on init
   - toggleDropdown() — opens/closes the dropdown, loads notifs on open
   - onNotifClick(notif) — marks as read, updates local count
   - markAllAsRead() — marks all as read

2. notification-bell.component.html — the template:
   - Bell icon button with a pink badge showing unread count (hide if 0)
   - Dropdown panel with:
     - Header: "Notifications" title + "Mark all as read" button
     - List of notification items (unread items highlighted in light pink)
     - Shows message and formatted date
     - Empty state: "No new notifications"

3. notification-bell.component.css — styles:
   - Match the pink #C0186A theme
   - Dropdown should appear below the bell, floating above other content (z-index)
   - Unread items: light pink background (#fce4ef or similar)
   - Read items: white background
   - Smooth hover effects
   - Badge: pink circle on top-right of bell icon

Also show me what to add to app.module.ts to declare this component.
```

---

## Phase 7 — Wire Up to Navbars + Final Testing (Angular)

**Goal:** Add the bell component to all 3 navbars and verify the full flow end-to-end.

**Files you need to attach:** your 3 navbar HTML files (admin, customer, employee)

```
I am finishing the notification system for Leydi Boss (Angular + Plain PHP).

All phases are done:
- notifications table exists in MySQL
- sendNotification() helper is working
- API endpoints are live
- NotificationService is created
- NotificationBellComponent is created

Now I need to:

1. Add <app-notification-bell> to these 3 navbar files:
[PASTE ADMIN NAVBAR HTML]
[PASTE CUSTOMER NAVBAR HTML]  
[PASTE EMPLOYEE NAVBAR HTML]

   Place the bell icon in the top-right area of each navbar, before the logout button.
   Make sure it fits the existing layout without breaking responsiveness.

2. Make sure NotificationService.startPolling() is called when each user logs in.
   Here is my login component / auth flow:
   [PASTE YOUR LOGIN COMPONENT OR AUTH SERVICE]

3. Make sure startPolling() is STOPPED when the user logs out.
   Here is my logout logic:
   [PASTE YOUR LOGOUT LOGIC]

4. Give me a manual testing checklist so I can verify all 3 notification flows are working:
   - Customer books → Admin gets notif
   - Admin approves/rejects → Customer gets notif
   - Admin assigns employee → Employee gets notif
```

---

## 🧪 Final Testing Checklist

After all phases are done, test these manually:

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Customer submits a booking | Admin's bell shows +1 badge |
| 2 | Admin opens bell dropdown | "New booking from [Name]" appears |
| 3 | Admin clicks notification | Notif is marked as read, badge decreases |
| 4 | Admin approves booking | Customer's bell shows +1 badge |
| 5 | Customer opens bell dropdown | "Your booking has been approved!" appears |
| 6 | Admin rejects booking | Customer sees rejection message |
| 7 | Admin assigns employee | Employee's bell shows +1 badge |
| 8 | Employee opens bell dropdown | "You have a new assignment" message appears |
| 9 | Click "Mark all as read" | All notifs marked, badge disappears |
| 10 | No notifs present | "No new notifications" shown in dropdown |

---

*Prompt Guide for Leydi Boss — Notification System Implementation*  
*Stack: Angular + Plain PHP + MySQL*
