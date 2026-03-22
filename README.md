# 🎓 Coaching Institute Management System (MVP)

A comprehensive, automated management solution for coaching institutes. This platform streamlines administrative tasks like attendance tracking, fee collection, and test performance analysis—all with integrated **WhatsApp automation**.

---

## 🚀 Key Features

### 📊 Powerful Dashboard & Analytics
- **Live KPI Tracking**: Real-time stats on total students, revenue, and daily attendance.
- **Visual Trends**: Integration with `recharts` for 30-day revenue trends and batch-wise attendance.
- **Fee Breakdowns**: Intuitive donut charts showing collected vs pending dues.
- **Academic Performance**: Bar charts tracking average test scores across different batches.

### 💡 Management Insights Engine
- **Revenue Risk Detection**: Automatically identifies the highest defaulting students for immediate follow-up.
- **Attendance Momentum**: Smart calculation of engagement trends (detects drops in attendance vs previous weeks).
- **Academic Volatility**: Highlights batches with significant score drops to ensure educational quality.

### 💬 Dashboard Assistant
- **Data Retrieval Helper**: A built-in chat assistant connected directly to your database.
- **Instant Queries**: Ask questions like "Which batch is performing best?" or "Who is currently a fee defaulter?" and get instant data-driven answers.

### 🤖 WhatsApp & n8n Automation
- **Automated Notifications**: Deep integration with `n8n` to send WhatsApp alerts for payment confirmations, fee reminders, and attendance notifications.
- **Event-Driven Hooks**: Reliable webhook system for triggering external automation workflows.

### 🔧 Operational Excellence
- **Student & Teacher Portals**: Dedicated roles with tailored views for administrators, teachers, and students.
- **Test & Results Management**: Easily upload test markers, calculate averages, and notify parents.
- **Attendance Registry**: Simple daily marking system with historical calendar views.

---

## 🛠️ Technology Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (using Mongoose)
- **Auth**: [Clerk](https://clerk.com/) for secure user management
- **AI/LLM**: [Groq](https://groq.com/) for lightning-fast chatbot analytics
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Automation**: n8n Webhook Integration

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Instance (Atlas or Local)
- Clerk API Keys
- Groq API Key (for Assistant)

### 2. Installation
```bash
# Clone the repository
git clone <your-repository-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

### 3. Environment Variables
Configure your `.env.local` with the following:
- `MONGODB_URI`: Your MongoDB connection string.
- `GROQ_API_KEY`: Your Groq API key for the dashboard assistant.
- `CLERK_PUBLISHABLE_KEY`: Clerk authentication.
- `CLERK_SECRET_KEY`: Clerk authentication secret.
- `N8N_WEBHOOK_URL`: Your custom n8n webhook for WhatsApp automation.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see your dashboard.

---

## 📄 License
This project is for internal institutional management. Custom licensing terms apply.
