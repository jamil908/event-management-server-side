# **Event Management Platform Backend 🚀**

**Secure, Scalable, and Real-Time Backend for Event Management**

Welcome to the **Event Management Platform Backend**, designed to handle secure user authentication, event data storage, real-time attendee updates, and other backend functionalities. This backend is built with **Node.js**, **Express.js**, **Socket.IO**, and **JWT** for a robust and scalable solution.

### **API URL**  
Base URL for API requests: [https://event-management-server-side-wine.vercel.app/](https://event-management-server-side-wine.vercel.app/)

---

## **Features**

- **User Authentication:**
  - Secure login and registration using **Firebase Authentication**.
  - JWT-based private routes for secure access.

- **Event Management:**
  - Create, update, and delete events.
  - Store event details, including name, description, location, and attendee count.

- **Real-Time Updates:**
  - Use **Socket.IO** to send real-time updates to the frontend about attendee counts and event updates.

- **Database Integration:**
  - MongoDB used for storing events, users, and other necessary data.
  - Data is stored and queried efficiently using Mongoose.

- **Error Handling and Validation:**
  - Robust error handling and validation mechanisms for user input.

---

## **Technologies Used**

- **Backend:**
  - **Node.js**: JavaScript runtime for building scalable server-side applications.
  - **Express.js**: Web framework for building RESTful APIs.
  - **Socket.IO**: Real-time communication between server and client.
  - **JWT (JSON Web Tokens)**: Secure token-based authentication.
  - **MongoDB**: NoSQL database for storing user and event data.

- **Authentication:**
  - **Firebase Authentication**: For user login via email/password and Google Authentication.
  - **JWT**: For protecting routes and managing user sessions.


---

## **Key Endpoints**

1. **Authentication**
   - `POST /api/auth/register`: Register a new user.
   - `POST /api/auth/login`: Login an existing user.
   - `GET /api/auth/me`: Get logged-in user details (protected route).

2. **Event Management**
   - `POST /api/events`: Create a new event (protected route).
   - `GET /api/events`: Get all events.
   - `GET /api/events/:id`: Get a single event by ID.
   - `PUT /api/events/:id`: Update event details (protected route).
   - `DELETE /api/events/:id`: Delete an event (protected route).

3. **Real-Time Updates (Socket.IO)**
   - Real-time attendee count updates and notifications.

4. **Error Handling**
   - Proper error responses with status codes and messages for easy debugging.

---

## **Installation and Setup**

To get this backend up and running locally, follow these steps:

### 1. **Clone the Repository**
 - npm install for dependency

Start by cloning the repository to your local machine. Open your terminal and run the following command:

```bash
git clone <repository-url>
