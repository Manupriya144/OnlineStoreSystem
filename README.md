<div align="center">

# ⚡ Tazz Electronics

### Premium Electronics E-Commerce & Repair Service Platform

A modern full-stack electronics e-commerce website built with **React, Vite, Supabase, PostgreSQL, Supabase Auth, and Supabase Storage**.

<br/>

![React](https://img.shields.io/badge/React-Frontend-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-purple?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql)
![CSS3](https://img.shields.io/badge/CSS3-Styling-orange?logo=css3)
![License](https://img.shields.io/badge/License-Educational-lightgrey)

<br/>

[Live Demo](#) • [Features](#-features) • [Installation](#-installation) • [Author](#-author)

</div>

---

## 📌 Overview

**Tazz Electronics** is a modern electronics shopping platform designed for customers who want a smooth, fast, and premium online shopping experience.

The system allows customers to browse products, view product details, add items to cart, place orders, manage checkout, and request repair services.

It also includes an **Admin Dashboard** where admins can manage products, categories, brands, images, specifications, and orders.

---

## 🛠 Tech Stack

### Frontend

- React.js
- Vite
- React Router DOM
- CSS3
- Context API

### Backend / Database

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage

### Tools

- VS Code
- Git & GitHub
- npm
- Supabase Dashboard

---

## 🏗 System Architecture

```txt
User Browser
    |
    v
React + Vite Frontend
    |
    v
Supabase Client SDK
    |
    |---- Supabase Auth
    |---- PostgreSQL Database
    |---- Supabase Storage
```

---

## 📂 Project Structure

```txt
src/
│
├── assets/
│
├── components/
│   ├── Navbar/
│   ├── Footer/
│   ├── ProductCard/
│   └── Loader/
│
├── context/
│   ├── AuthContext.jsx
│   └── CartContext.jsx
│
├── lib/
│   └── supabaseClient.js
│
├── pages/
│   ├── Home/
│   ├── Shop/
│   ├── ProductDetails/
│   ├── Cart/
│   ├── Checkout/
│   ├── Orders/
│   ├── Repair/
│   ├── Admin/
│   └── Auth/
│
├── services/
│   ├── productService.js
│   ├── orderService.js
│   └── cartService.js
│
├── utils/
│   └── format.js
│
├── App.jsx
└── main.jsx
```

---

## 🗄 Database Tables

The project uses the following Supabase PostgreSQL tables:

- profiles
- categories
- brands
- products
- product_images
- product_specs
- addresses
- cart_items
- orders
- order_items
- payments

---

## 🔐 Authentication

Authentication is handled using **Supabase Auth**.

Supported features:

- User registration
- User login
- User logout
- Email confirmation
- Persistent session
- Role-based access control
- Admin protected routes

---

## 🖼 Storage

Product images are stored in a Supabase Storage bucket.

```txt
Bucket Name: product
```

Images are linked with the `product_images` table and displayed dynamically in the frontend.

---

## 🔑 Environment Variables

Create a `.env` file in the root folder.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Mohamed-Irfan-git/tazz-electronics.git
```

### 2. Navigate to Project Folder

```bash
cd tazz-electronics
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

---

## 🚀 Production Build

```bash
npm run build
```

To preview production build:

```bash
npm run preview
```



---
## 👨‍💻 Author

**Mohamed Irfan**

BICT Undergraduate  
Junior Full Stack Developer

GitHub: [Mohamed-Irfan-git](https://github.com/Mohamed-Irfan-git)  
Email: [irfanmt29@gmail.com](mailto:irfanmt29@gmail.com)

--

</div>
