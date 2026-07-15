# 📸 ICHGramm

A full-stack social media web application inspired by Instagram, developed as a diploma project.

ICHGramm allows users to create personal accounts, publish posts, communicate in real time, follow other users, receive notifications, and manage their personal profiles.

The project was built using modern web technologies with a focus on responsive design, real-time communication, authentication, and a clean user experience.

---

# ✨ Features

## Authentication

- User registration
- User login
- JWT authentication
- Protected routes
- Forgot password
- Password reset via email

---

## Profile

- View own profile
- View other users' profiles
- Edit profile information
- Upload avatar
- Follow users
- Unfollow users
- Followers & Following lists
- User statistics

---

## Posts

- Create posts
- Edit post captions
- Delete posts
- Like / Unlike posts
- Comment on posts
- Save posts
- Explore page
- Infinite scrolling feed

---

## Stories

- Create stories
- Automatic story expiration after 24 hours

---

## Messages

Real-time messaging powered by Socket.io.

Features include:

- Private conversations
- Online users
- Seen status
- Share posts in chat
- Edit messages
- Delete messages
- Delete conversations
- Emoji support

---

## Notifications

- Like notifications
- Comment notifications
- Follow notifications
- Real-time notification updates

---

## User Interface

- Responsive design
- Dark mode
- Mobile-friendly navigation
- Emoji picker
- Modern Instagram-inspired interface

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- React Router
- Axios
- Context API
- Socket.io Client
- Lucide React
- Emoji Picker React
- CSS

---

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Multer
- Socket.io
- Nodemailer
- bcrypt

---

## Database

- MongoDB

---

# 📂 Project Structure

```text
ICHGramm
│
├── client
│   ├── public
│   ├── src
│   └── package.json
│
├── server
│   ├── src
│   ├── uploads
│   └── package.json
│
└── README.md
```

---

# ⚙ Installation

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ICHGramm.git
```

Go to the project directory

```bash
cd ICHGramm
```

---

## Install Frontend

```bash
cd client
npm install
```

Run the frontend

```bash
npm run dev
```

---

## Install Backend

```bash
cd server
npm install
```

Run the backend

```bash
npm run dev
```

---

# 🔑 Environment Variables

### Backend (.env)

```env
PORT=5000

MONGO_URI=

JWT_SECRET=

RESET_PASSWORD_SECRET=

CLIENT_URL=

EMAIL_HOST=

EMAIL_PORT=

EMAIL_USER=

EMAIL_PASS=
```

### Frontend (.env)

```env
VITE_API_URL=

VITE_SOCKET_URL=
```

---

# 📡 Main API Endpoints

## Authentication

```http
POST /api/auth/register

POST /api/auth/login

POST /api/auth/reset-password

POST /api/auth/new-password
```

---

## Posts

```http
GET /api/posts

POST /api/posts

PUT /api/posts/:id

DELETE /api/posts/:id
```

---

## Comments

```http
GET /api/comments/:postId

POST /api/comments
```

---

## Messages

```http
GET /api/messages

GET /api/messages/:userId

POST /api/messages

PUT /api/messages/:userId/seen

PUT /api/messages/message/:messageId

DELETE /api/messages/message/:messageId
```

---

## Notifications

```http
GET /api/notifications

PUT /api/notifications/:id/read
```

---

# 📱 Responsive Design

The application is fully responsive and optimized for:

- Desktop
- Laptop
- Tablet
- Mobile devices

---

# 🔒 Security

Authentication is implemented using:

- JWT (JSON Web Token)
- Protected Routes
- Password hashing with bcrypt

---

# 📧 Email Support

Password recovery functionality is implemented using Nodemailer.

---

# 🚀 Future Improvements

Possible future enhancements:

- Video posts
- Story reactions
- Group chats
- Voice messages
- Push notifications
- Advanced search
- User blocking
- Chat attachments

---

# 👩‍💻 Author

**Larysa Sperling**

Full Stack Developer

GitHub:
https://github.com/LarysaSperling
