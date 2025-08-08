# StudyBuddy - Student Study App 📚

A comprehensive, user-friendly study app designed for students aged 8-18 with camera note capture, exam uploads, flashcards, mock exams, and **user authentication with progress saving**.

## 🆕 New Features - Authentication System

### User Accounts & Progress Saving
- **Sign Up**: Create a new StudyBuddy account with username, email, and password
- **Sign In**: Access your account from any device
- **Progress Sync**: All your notes, flashcards, exams, and scores are automatically saved
- **Cross-Device Access**: Sign in from different devices to access your data
- **Automatic Backup**: Your progress is saved every 30 seconds when logged in

### Authentication Features
- **Secure Password**: Minimum 6 characters required
- **User Profiles**: Personalized welcome message with avatar
- **Sync Status**: Visual indicators showing when your data is syncing
- **Guest Mode**: Use the app without signing up (data stored locally only)
- **Easy Logout**: Securely log out while preserving your progress

## 🎯 Core Features

### 📸 Camera Note Capture
- Take photos of notes, textbooks, or whiteboards
- Automatic image storage and gallery view
- Perfect for capturing handwritten notes or diagrams

### 📄 Exam Upload (PDF & Word Only)
- Drag-and-drop or browse to upload exam files
- Strict filtering for PDF and Microsoft Word documents only
- File management with upload date and size information

### 🃏 Flashcard System
- Create custom flashcards with questions and answers
- Interactive study mode with card flipping
- Navigate through flashcards with keyboard shortcuts
- Pre-loaded sample flashcards for immediate use

### 📝 Mock Exam Generator
- Create multiple-choice exams with custom questions
- Automatic scoring and percentage calculation
- Detailed results with correct/incorrect answers
- Celebratory animations for high scores (80%+)
- Sample exam included for testing

### 🎮 Gamification & Engagement
- **Points System**: Earn points for every study activity
- **Activity Tracking**: View recent study activities
- **Motivational Messages**: Random encouraging notifications every 5 minutes
- **Celebrations**: Confetti animations for achievements
- **Progress Tracking**: Visual progress indicators

### ⌨️ Keyboard Shortcuts
- `Ctrl+1` to `Ctrl+5`: Quick navigation between sections
- `Space`: Flip flashcards in study mode
- `Arrow Keys`: Navigate through flashcards
- `Escape`: Close modals and return to previous view

## 🚀 Getting Started

### Option 1: With Authentication Server (Recommended)
1. **Install Node.js** (if not already installed)
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start the Server**:
   ```bash
   npm start
   ```
4. **Open your browser** and go to `http://localhost:3000`
5. **Sign up** for a new account or **sign in** to an existing one

### Option 2: Client-Side Only
1. **Start a local server** in the project directory:
   ```bash
   # Using Python 3
   python -m http.server 8080
   
   # Using Python 2
   python -m SimpleHTTPServer 8080
   ```
2. **Open your browser** and go to `http://localhost:8080`
3. **Use guest mode** or create an account (data stored in browser localStorage)

## 👤 User Account Management

### Creating an Account
1. Click the **"Sign Up"** button in the top-right corner
2. Fill in your **username**, **email**, and **password** (minimum 6 characters)
3. Click **"Sign Up"** to create your account
4. You'll be automatically signed in and can start using all features

### Signing In
1. Click the **"Sign In"** button
2. Enter your **username/email** and **password**
3. Click **"Sign In"** to access your account
4. All your previous data will be loaded automatically

### Data Synchronization
- **Automatic Saving**: Your progress is saved every 30 seconds when signed in
- **Manual Sync**: Data is also saved whenever you perform actions (create flashcards, take exams, etc.)
- **Sync Status**: Look for the sync indicator next to your name:
  - 🔄 **Syncing**: Data is being saved
  - ✅ **Synced**: All data is up to date
  - ⚠️ **Error**: There was a sync issue
  - 📶 **Offline**: Using guest mode (no account)

## 📱 User Interface

### Age-Appropriate Design
- **Colorful and Fun**: Bright, engaging colors suitable for children
- **Large Buttons**: Easy-to-click interface elements
- **Clear Navigation**: Simple section-based layout
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Accessibility Features
- **High Contrast**: Easy-to-read text and buttons
- **Keyboard Navigation**: Full keyboard support for all features
- **Clear Feedback**: Visual and text feedback for all actions
- **Error Handling**: Friendly error messages and guidance

## 🛠️ Technical Details

### Frontend Technologies
- **HTML5**: Semantic markup with modern features
- **CSS3**: Advanced styling with animations and responsive design
- **Vanilla JavaScript**: No external frameworks, pure JavaScript implementation
- **Font Awesome**: Icons for enhanced user experience
- **Local Storage**: Browser-based data persistence for guest users

### Backend Technologies (Optional)
- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **File-based Storage**: JSON files for user data (easily upgradeable to database)
- **CORS Support**: Cross-origin resource sharing for API access

### Data Storage
- **Guest Mode**: Browser localStorage (device-specific)
- **Authenticated Mode**: Server-side storage with automatic sync
- **Backup Strategy**: Regular auto-saves prevent data loss

## 🔒 Security & Privacy

### Password Security
- **Client-side Hashing**: Passwords are hashed before storage
- **Minimum Length**: 6-character minimum requirement
- **No Plain Text**: Passwords are never stored in plain text

### Data Privacy
- **Local First**: Guest data never leaves your device
- **Secure Transmission**: HTTPS recommended for production use
- **User Control**: Easy account deletion and data export options

### Child Safety
- **No Personal Information**: Only username and email required
- **Safe Environment**: No external links or inappropriate content
- **Parental Guidance**: Designed for supervised or independent use

## 📊 Features Overview

| Feature | Guest Mode | Authenticated Mode |
|---------|------------|-------------------|
| Camera Notes | ✅ Local Only | ✅ Synced |
| File Uploads | ✅ Local Only | ✅ Synced |
| Flashcards | ✅ Local Only | ✅ Synced |
| Mock Exams | ✅ Local Only | ✅ Synced |
| Progress Tracking | ✅ Local Only | ✅ Synced |
| Cross-Device Access | ❌ | ✅ |
| Data Backup | ❌ | ✅ |
| Account Recovery | ❌ | ✅ |

## 🎯 Future Enhancements

### Planned Features
- **OCR Integration**: Convert camera-captured notes to editable text
- **Study Groups**: Collaborate with classmates on shared flashcards
- **Progress Analytics**: Detailed learning analytics and insights
- **Mobile App**: Native iOS and Android applications
- **Teacher Dashboard**: Tools for educators to track student progress
- **Advanced Gamification**: Achievements, badges, and leaderboards

### Technical Improvements
- **Database Integration**: PostgreSQL or MongoDB for scalable data storage
- **Real-time Sync**: WebSocket-based live data synchronization
- **Offline Support**: Progressive Web App (PWA) capabilities
- **Advanced Security**: OAuth integration and two-factor authentication
- **Performance Optimization**: Lazy loading and caching strategies

## 🐛 Troubleshooting

### Common Issues

**"Cannot access camera"**
- Ensure your browser has camera permissions enabled
- Try refreshing the page and allowing camera access
- Check if another application is using the camera

**"File upload failed"**
- Ensure the file is in PDF or Word format (.pdf, .doc, .docx)
- Check that the file size is reasonable (under 10MB recommended)
- Try refreshing the page and uploading again

**"Login not working"**
- Double-check your username/email and password
- Ensure Caps Lock is not accidentally enabled
- Try the "Sign Up" option if you haven't created an account yet

**"Data not syncing"**
- Check your internet connection
- Look for the sync status indicator next to your name
- Try logging out and back in to refresh the connection

### Getting Help
- Check the browser console (F12) for error messages
- Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- Clear browser cache and cookies if experiencing persistent issues

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

We welcome contributions from educators, developers, and students! Please feel free to:
- Report bugs and suggest features
- Submit pull requests for improvements
- Share feedback on user experience
- Help with testing and documentation

---

**StudyBuddy** - Making learning fun and accessible for students everywhere! 🌟
