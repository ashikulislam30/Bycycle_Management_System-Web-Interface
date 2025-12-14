# Bicycle Management System (Web Version) — v1.1

A simple, browser-based Bicycle Management System built with **HTML, CSS, and JavaScript**.  
This project is a web adaptation of the original **C console-based Bicycle Management System** and includes the same core modules: **Admin management, Student authentication, Bicycle inventory, Bicycle rental workflow, Payment simulation, and Rental history tracking**.

---

## Features

### Student Module
- Student **Sign Up** and **Log In**
- View available bicycles (inventory list)
- Rent a bicycle by:
  - Selecting a bicycle by ID
  - Entering rental duration (minutes)
  - Completing payment simulation (Bkash/Nagad)
- View personal rental history

### Admin Module
- Admin **Log In**
- Bicycle inventory management:
  - Add bicycle
  - Update bicycle
  - Remove bicycle
  - View bicycle inventory
- View system rental history
- View registered users
- Change admin password
- Basic admin user management (Add/Remove admins)

### System
- Maintenance mode (ON/OFF) to simulate service downtime
- Client-side data persistence using **localStorage**

---

## Tech Stack
- **HTML5**
- **CSS3**
- **JavaScript (Vanilla JS)**
- Storage: **Browser localStorage** (no backend)

---

## Project Structure

```txt
bicycle-web/
  index.html
  student.html
  admin.html
  rules.html
  about.html
  styles.css
  app.js
