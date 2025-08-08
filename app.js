// StudyBuddy - Interactive Learning App
class StudyBuddy {
    constructor() {
        this.currentSection = 'dashboard';
        
        // Initialize empty data arrays - will be populated after authentication check
        this.notes = [];
        this.exams = [];
        this.flashcards = [];
        this.mockExams = [];
        this.totalScore = 0;
        this.activities = [];
        
        // Authentication variables
        this.currentUser = JSON.parse(localStorage.getItem('studyBuddyUser')) || null;
        this.isSignupMode = false;
        this.syncStatus = 'offline'; // offline, syncing, synced, error
        
        // AI variables
        this.ocrWorker = null;
        this.extractedTexts = new Map(); // Store OCR results for each note
        this.generatedFlashcards = [];
        this.isProcessingAI = false;
        
        // Camera variables
        this.stream = null;
        this.isFlashcardFlipped = false;
        this.currentFlashcardIndex = 0;
        this.studyMode = false;
        
        // Exam variables
        this.currentExam = null;
        this.examStartTime = null;
        this.examAnswers = {};
        this.examTimer = null;
        
        this.todoList = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        
        // Initialize authentication and load appropriate data
        if (this.currentUser) {
            this.loadUserData();
            this.updateUserInterface();
            this.setSyncStatus('synced');
        } else {
            this.loadSampleData();
            this.setSyncStatus('offline');
        }
        
        this.updateDashboard();
        this.updateScore();
        this.startMotivationalMessages();
        
        // Auto-save user data every 30 seconds if logged in
        setInterval(() => {
            if (this.currentUser) {
                this.saveUserData();
            }
        }, 30000);
        
        // Show dashboard by default
        this.switchSection('dashboard');
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });
        
        // Camera controls
        document.getElementById('startCamera').addEventListener('click', () => this.startCamera());
        document.getElementById('capturePhoto').addEventListener('click', () => this.capturePhoto());
        document.getElementById('stopCamera').addEventListener('click', () => this.stopCamera());
        
        // File upload for exams
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // File upload for notes
        const notesUploadArea = document.getElementById('notesUploadArea');
        const notesFileInput = document.getElementById('notesFileInput');
        
        if (notesUploadArea && notesFileInput) {
            notesUploadArea.addEventListener('click', () => notesFileInput.click());
            notesUploadArea.addEventListener('dragover', (e) => this.handleNotesDragOver(e));
            notesUploadArea.addEventListener('drop', (e) => this.handleNotesFileDrop(e));
            notesUploadArea.addEventListener('dragleave', (e) => this.handleNotesDragLeave(e));
            notesFileInput.addEventListener('change', (e) => this.handleNotesFileSelect(e));
        }
        
        // Flashcard controls
        document.getElementById('createFlashcard').addEventListener('click', () => this.showFlashcardCreator());
        document.getElementById('generateAIFlashcards').addEventListener('click', () => this.showAIFlashcardGenerator());
        document.getElementById('studyMode').addEventListener('click', () => this.startStudyMode());
        document.getElementById('saveFlashcard').addEventListener('click', () => this.saveFlashcard());
        document.getElementById('cancelFlashcard').addEventListener('click', () => this.hideFlashcardCreator());
        document.getElementById('generateAIFlashcardSet').addEventListener('click', () => this.generateAIFlashcards());
        document.getElementById('cancelAIFlashcard').addEventListener('click', () => this.hideAIFlashcardGenerator());
        document.getElementById('flipCard').addEventListener('click', () => this.flipFlashcard());
        document.getElementById('nextCard').addEventListener('click', () => this.nextFlashcard());
        document.getElementById('exitStudy').addEventListener('click', () => this.exitStudyMode());
        
        // Mock exam controls
        document.getElementById('createMockExam').addEventListener('click', () => this.showExamCreator());
        document.getElementById('generateAIExam').addEventListener('click', () => this.showAIExamGenerator());
        document.getElementById('takeRandomExam').addEventListener('click', () => this.takeRandomExam());
        document.getElementById('addQuestion').addEventListener('click', () => this.addExamQuestion());
        document.getElementById('saveExam').addEventListener('click', () => this.saveMockExam());
        document.getElementById('cancelExam').addEventListener('click', () => this.hideExamCreator());
        document.getElementById('generateAIQuestions').addEventListener('click', () => this.generateAIQuestions());
        document.getElementById('cancelAIExam').addEventListener('click', () => this.hideAIExamGenerator());
        document.getElementById('submitExam').addEventListener('click', () => this.submitExam());
        document.getElementById('exitExam').addEventListener('click', () => this.exitExam());
        document.getElementById('reviewAnswers').addEventListener('click', () => this.reviewAnswers());
        document.getElementById('retakeExam').addEventListener('click', () => this.retakeCurrentExam());
        document.getElementById('backToExams').addEventListener('click', () => this.backToExams());
        
        // Authentication controls
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('signupBtn').addEventListener('click', () => this.showSignupModal());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Quick action buttons (dashboard shortcuts)
        document.getElementById('quickCaptureNote').addEventListener('click', () => {
            this.switchSection('notes');
            // Auto-start camera if not already started
            setTimeout(() => {
                const startCameraBtn = document.getElementById('startCamera');
                if (startCameraBtn && startCameraBtn.style.display !== 'none') {
                    this.startCamera();
                }
            }, 100);
        });
        document.getElementById('quickUploadExam').addEventListener('click', () => {
            this.switchSection('upload');
        });
        document.getElementById('quickCreateFlashcard').addEventListener('click', () => {
            this.switchSection('flashcards');
            setTimeout(() => this.showFlashcardCreator(), 100);
        });
        
        // Authentication controls
        document.getElementById('loginBtn').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('signupBtn').addEventListener('click', () => this.showAuthModal('signup'));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('closeAuthModal').addEventListener('click', () => this.hideAuthModal());
        document.getElementById('switchAuthMode').addEventListener('click', () => this.switchAuthMode());
        document.getElementById('authForm').addEventListener('submit', (e) => this.handleAuth(e));
        
        // AI controls
        document.getElementById('generateFlashcardsBtn').addEventListener('click', () => this.generateFlashcardsFromNotes());
        document.getElementById('addGeneratedCards').addEventListener('click', () => this.addGeneratedFlashcards());
        document.getElementById('clearGenerated').addEventListener('click', () => this.clearGeneratedFlashcards());
        
        // AI Study Assistant event listeners
        document.getElementById('getStudyAdviceBtn').addEventListener('click', () => {
            this.generateStudyTips();
        });
        
        document.getElementById('analyzeProgressBtn').addEventListener('click', () => {
            this.analyzeProgress();
        });
        
        // AI To-Do List event listeners
        document.getElementById('generateTodoBtn').addEventListener('click', () => {
            this.generateTodoList();
        });
        
        document.getElementById('clearTodoBtn').addEventListener('click', () => {
            this.clearTodoList();
        });
        
        // AI Exam Feedback controls
        document.getElementById('generateFeedbackBtn').addEventListener('click', () => this.generateIntelligentExamFeedback());
        document.getElementById('createStudyPlanBtn').addEventListener('click', () => this.createPersonalizedStudyPlan());
    }
    
    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Update sections
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        this.currentSection = section;
        
        // Load section-specific content
        if (section === 'dashboard') {
            this.updateDashboard();
        } else if (section === 'notes') {
            this.loadNotesGallery();
        } else if (section === 'upload') {
            this.loadExamsList();
        } else if (section === 'flashcards') {
            this.loadFlashcardsList();
        } else if (section === 'mock-exams') {
            this.loadMockExamsList();
        }
    }
    
    // Dashboard Methods
    updateDashboard() {
        document.getElementById('notesCount').textContent = this.notes.length;
        document.getElementById('examsCount').textContent = this.exams.length;
        document.getElementById('flashcardsCount').textContent = this.flashcards.length;
        document.getElementById('mockExamsCount').textContent = this.mockExams.length;
        document.getElementById('totalScore').textContent = this.totalScore;
        
        this.loadRecentActivity();
    }
    
    loadRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (this.activities.length === 0) {
            activityList.innerHTML = '<p class="no-activity">Start studying to see your activity here! 📚</p>';
            return;
        }
        
        activityList.innerHTML = this.activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <i class="fas fa-${activity.icon}"></i>
                <span>${activity.text}</span>
                <small>${activity.time}</small>
            </div>
        `).join('');
    }
    
    addActivity(text, icon = 'check') {
        const activity = {
            text,
            icon,
            time: new Date().toLocaleString()
        };
        this.activities.unshift(activity);
        this.activities = this.activities.slice(0, 20);
        this.saveData();
    }
    
    // Camera Methods
    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            const video = document.getElementById('cameraFeed');
            video.srcObject = this.stream;
            
            document.getElementById('startCamera').style.display = 'none';
            document.getElementById('capturePhoto').style.display = 'inline-flex';
            document.getElementById('stopCamera').style.display = 'inline-flex';
            
            this.showNotification('Camera started! 📸', 'success');
        } catch (error) {
            this.showNotification('Camera access denied or not available', 'error');
        }
    }
    
    capturePhoto() {
        const video = document.getElementById('cameraFeed');
        const canvas = document.getElementById('photoCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const note = {
            id: Date.now(),
            imageData: imageData,
            timestamp: new Date().toLocaleString(),
            title: `Note ${this.notes.length + 1}`
        };
        
        this.notes.push(note);
        this.saveUserData();
        this.loadNotesGallery();
        
        // Point abuse prevention: Daily limit and rate limiting
        const today = new Date().toDateString();
        const todayNotes = this.notes.filter(n => 
            new Date(n.timestamp).toDateString() === today
        );
        
        // Check rate limiting (max 1 photo per 30 seconds)
        const lastNoteTime = this.notes.length > 1 ? 
            new Date(this.notes[this.notes.length - 2].timestamp).getTime() : 0;
        const currentTime = Date.now();
        const timeSinceLastNote = currentTime - lastNoteTime;
        
        if (timeSinceLastNote < 30000 && this.notes.length > 1) {
            // Rate limited - no points awarded
            this.addActivity('Captured a note', 'camera');
            this.showNotification('Note captured! (Please wait 30 seconds between captures for points)', 'info');
            return;
        }
        
        // Daily limit: Max 10 points per day from note captures (first 1 note gets full points)
        if (todayNotes.length <= 1) {
            this.addScore(10);
            this.addActivity('Captured a note', 'camera');
            this.showNotification('Note captured successfully! +10 points 📸', 'success');
        } else if (todayNotes.length <= 5) {
            // Reduced points for additional notes (2-5)
            this.addScore(2);
            this.addActivity('Captured a note', 'camera');
            this.showNotification('Note captured! +2 points (reduced for additional notes)', 'success');
        } else {
            // No points after 5 notes per day
            this.addActivity('Captured a note', 'camera');
            this.showNotification('Note captured! (Daily point limit reached)', 'info');
        }
    }
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        document.getElementById('startCamera').style.display = 'inline-flex';
        document.getElementById('capturePhoto').style.display = 'none';
        document.getElementById('stopCamera').style.display = 'none';
        
        const video = document.getElementById('cameraFeed');
        video.srcObject = null;
    }
    
    loadNotesGallery() {
        const notesGrid = document.getElementById('notesGrid');
        if (this.notes.length === 0) {
            notesGrid.innerHTML = '<p class="empty-state">No notes captured yet. Start by taking a photo! 📸</p>';
            return;
        }
        
        notesGrid.innerHTML = this.notes.map(note => {
            if (note.isFile) {
                // File note display
                const fileIcon = note.fileType.includes('pdf') ? 'fa-file-pdf' : 'fa-file-word';
                const fileSize = note.fileSize ? `${(note.fileSize / 1024 / 1024).toFixed(2)} MB` : '';
                
                return `
                    <div class="note-item file-note">
                        <div class="file-preview" onclick="studyBuddy.viewFileNote(${note.id})">
                            <i class="fas ${fileIcon}"></i>
                            <span class="file-type">${note.fileType.includes('pdf') ? 'PDF' : 'Word'}</span>
                        </div>
                        <div class="note-info">
                            <h4>${note.title}</h4>
                            <p>${note.timestamp}</p>
                            <small>${fileSize}</small>
                            <div class="note-actions">
                                <button class="btn btn-info btn-sm" onclick="studyBuddy.downloadFile(${note.id})" title="Download file">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="btn btn-primary btn-sm" onclick="studyBuddy.editNoteTitle(${note.id})" title="Edit title">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="studyBuddy.deleteNote(${note.id})" title="Delete note">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Image note display
                return `
                    <div class="note-item image-note">
                        <img src="${note.imageData}" alt="${note.title}" onclick="studyBuddy.viewNoteFullscreen(${note.id})">
                        <div class="note-info">
                            <h4>${note.title}</h4>
                            <p>${note.timestamp}</p>
                            <div class="note-actions">
                                <button class="btn btn-primary btn-sm" onclick="studyBuddy.editNoteTitle(${note.id})" title="Edit title">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="studyBuddy.deleteNote(${note.id})" title="Delete note">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');
        
        // Enable AI flashcard generation if notes exist
        const generateBtn = document.getElementById('generateFlashcardsBtn');
        if (generateBtn) {
            generateBtn.disabled = false;
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.remove('dragover');
    }
    
    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }
    
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }
    
    // Notes file upload handlers
    handleNotesDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('notesUploadArea').classList.add('dragover');
    }
    
    handleNotesDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('notesUploadArea').classList.remove('dragover');
    }
    
    handleNotesFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('notesUploadArea').classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processNotesFiles(files);
    }
    
    handleNotesFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processNotesFiles(files);
    }
    
    processNotesFiles(files) {
        const validFiles = files.filter(file => {
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            return validTypes.includes(file.type);
        });
        
        if (validFiles.length === 0) {
            this.showNotification('Please upload only PDF or Word documents', 'error');
            return;
        }
        
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const note = {
                    id: Date.now() + Math.random(),
                    title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
                    type: 'file',
                    fileType: file.type,
                    fileName: file.name,
                    fileData: e.target.result,
                    fileSize: file.size,
                    timestamp: new Date().toLocaleString(),
                    isFile: true
                };
                
                this.notes.push(note);
                this.addActivity(`Uploaded note file: ${file.name}`, 'upload');
                
                // Point system for file uploads (similar to camera captures)
                const today = new Date().toDateString();
                const todayUploads = this.notes.filter(n => 
                    n.isFile && new Date(n.timestamp).toDateString() === today
                );
                
                if (todayUploads.length <= 3) {
                    this.addScore(8);
                    this.showNotification(`Note uploaded successfully! +8 points 📄`, 'success');
                } else {
                    this.showNotification('Note uploaded! (Daily point limit reached)', 'info');
                }
            };
            
            reader.readAsDataURL(file);
        });
        
        // Save data and update UI after processing all files
        setTimeout(() => {
            if (this.currentUser) {
                this.saveUserData();
            } else {
                this.saveData();
            }
            this.loadNotesGallery();
            this.updateDashboard();
        }, 100);
    }
    
    processFiles(files) {
        const validFiles = files.filter(file => {
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            return validTypes.includes(file.type);
        });
        
        if (validFiles.length === 0) {
            this.showNotification('Please upload only PDF or Word documents', 'error');
            return;
        }
        
        validFiles.forEach(file => {
            const exam = {
                id: Date.now() + Math.random(),
                name: file.name,
                type: file.type,
                size: file.size,
                uploadDate: new Date().toLocaleString()
            };
            
            this.exams.push(exam);
            this.addActivity(`Uploaded exam: ${file.name}`, 'upload');
            this.addScore(15);
        });
        
        this.saveData();
        this.loadExamsList();
        this.updateDashboard();
        this.showNotification(`${validFiles.length} exam(s) uploaded successfully! +${validFiles.length * 15} points`, 'success');
    }
    
    loadExamsList() {
        const examsList = document.getElementById('examsList');
        if (this.exams.length === 0) {
            examsList.innerHTML = '<p class="empty-state">No exams uploaded yet. Upload your first exam! 📄</p>';
            return;
        }
        
        examsList.innerHTML = this.exams.map(exam => `
            <div class="exam-item">
                <div class="exam-info">
                    <i class="fas fa-file-${exam.type.includes('pdf') ? 'pdf' : 'word'}"></i>
                    <div>
                        <h4>${exam.name}</h4>
                        <p>Uploaded: ${exam.uploadDate}</p>
                        <small>${(exam.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="studyBuddy.deleteExam(${exam.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
    
    deleteNote(noteId) {
        // Find the note first to check if it exists
        const noteIndex = this.notes.findIndex(note => note.id == noteId);
        if (noteIndex === -1) {
            this.showNotification('Note not found', 'error');
            return;
        }
        
        // Show confirmation dialog
        if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            const noteTitle = this.notes[noteIndex].title;
            this.notes.splice(noteIndex, 1);
            
            // Use proper data persistence method
            if (this.currentUser) {
                this.saveUserData();
            } else {
                this.saveData();
            }
            
            // Update UI displays
            this.loadNotesGallery();
            this.updateDashboard();
            
            // Add activity log entry
            this.addActivity(`Deleted note: ${noteTitle}`, 'trash');
            
            // Show success notification
            this.showNotification('Note deleted successfully', 'success');
        }
    }
    
    editNoteTitle(noteId) {
        const noteIndex = this.notes.findIndex(note => note.id == noteId);
        if (noteIndex === -1) {
            this.showNotification('Note not found', 'error');
            return;
        }
        
        const currentTitle = this.notes[noteIndex].title;
        const newTitle = prompt('Enter new title for this note:', currentTitle);
        
        if (newTitle && newTitle.trim() !== '' && newTitle !== currentTitle) {
            this.notes[noteIndex].title = newTitle.trim();
            
            // Use proper data persistence method
            if (this.currentUser) {
                this.saveUserData();
            } else {
                this.saveData();
            }
            
            // Update UI displays
            this.loadNotesGallery();
            
            // Add activity log entry
            this.addActivity(`Renamed note to: ${newTitle}`, 'edit');
            
            // Show success notification
            this.showNotification('Note title updated successfully', 'success');
        }
    }
    
    viewNoteFullscreen(noteId) {
        const note = this.notes.find(n => n.id == noteId);
        if (!note) {
            this.showNotification('Note not found', 'error');
            return;
        }
        
        // Create fullscreen modal
        const modal = document.createElement('div');
        modal.className = 'fullscreen-modal';
        modal.innerHTML = `
            <div class="fullscreen-content">
                <div class="fullscreen-header">
                    <h3>${note.title}</h3>
                    <button class="close-fullscreen" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="fullscreen-image">
                    <img src="${note.imageData}" alt="${note.title}">
                </div>
                <div class="fullscreen-info">
                    <p><i class="fas fa-calendar"></i> ${note.timestamp}</p>
                </div>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.getElementById('fullscreen-styles')) {
            const styles = document.createElement('style');
            styles.id = 'fullscreen-styles';
            styles.textContent = `
                .fullscreen-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .fullscreen-content {
                    max-width: 90%;
                    max-height: 90%;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .fullscreen-header {
                    padding: 1rem;
                    background: #4facfe;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .close-fullscreen {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                .fullscreen-image img {
                    max-width: 100%;
                    max-height: 70vh;
                    display: block;
                }
                .fullscreen-info {
                    padding: 1rem;
                    background: #f8f9fa;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    viewFileNote(noteId) {
        const note = this.notes.find(n => n.id == noteId);
        if (!note || !note.isFile) {
            this.showNotification('File note not found', 'error');
            return;
        }
        
        // For now, show file info and allow download
        const fileIcon = note.fileType.includes('pdf') ? 'fa-file-pdf' : 'fa-file-word';
        const fileSize = note.fileSize ? `${(note.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size';
        
        const modal = document.createElement('div');
        modal.className = 'fullscreen-modal';
        modal.innerHTML = `
            <div class="fullscreen-content file-content">
                <div class="fullscreen-header">
                    <h3>${note.title}</h3>
                    <button class="close-fullscreen" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="file-display">
                    <div class="file-icon">
                        <i class="fas ${fileIcon}"></i>
                    </div>
                    <div class="file-details">
                        <h4>${note.fileName}</h4>
                        <p><strong>Type:</strong> ${note.fileType.includes('pdf') ? 'PDF Document' : 'Word Document'}</p>
                        <p><strong>Size:</strong> ${fileSize}</p>
                        <p><strong>Uploaded:</strong> ${note.timestamp}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-primary" onclick="studyBuddy.downloadFile(${note.id})">
                        <i class="fas fa-download"></i> Download File
                    </button>
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
        
        // Add file-specific styles
        if (!document.getElementById('file-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'file-modal-styles';
            styles.textContent = `
                .file-content {
                    width: 400px;
                    max-width: 90%;
                }
                .file-display {
                    padding: 2rem;
                    text-align: center;
                }
                .file-icon {
                    font-size: 4rem;
                    color: #4facfe;
                    margin-bottom: 1rem;
                }
                .file-details h4 {
                    margin-bottom: 1rem;
                    color: #333;
                }
                .file-details p {
                    margin: 0.5rem 0;
                    color: #666;
                }
                .file-actions {
                    padding: 1rem;
                    background: #f8f9fa;
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    downloadFile(noteId) {
        const note = this.notes.find(n => n.id == noteId);
        if (!note || !note.isFile) {
            this.showNotification('File not found', 'error');
            return;
        }
        
        // Create download link
        const link = document.createElement('a');
        link.href = note.fileData;
        link.download = note.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification(`Downloaded: ${note.fileName}`, 'success');
        this.addActivity(`Downloaded file: ${note.fileName}`, 'download');
    }
    
    deleteExam(examId) {
        // Find the exam first to check if it exists
        const examIndex = this.exams.findIndex(exam => exam.id == examId);
        if (examIndex === -1) {
            this.showNotification('Exam not found', 'error');
            return;
        }
        
        // Show confirmation dialog
        if (confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
            const examName = this.exams[examIndex].name;
            this.exams.splice(examIndex, 1);
            
            // Use proper data persistence method
            if (this.currentUser) {
                this.saveUserData();
            } else {
                this.saveData();
            }
            
            // Update UI displays
            this.loadExamsList();
            this.updateDashboard();
            
            // Add activity log entry
            this.addActivity(`Deleted exam: ${examName}`, 'trash');
            
            // Show success notification
            this.showNotification('Exam deleted successfully', 'success');
        }
    }
    
    // Flashcard Methods
    showFlashcardCreator() {
        document.getElementById('flashcardCreator').style.display = 'block';
        document.getElementById('flashcardFront').focus();
    }
    
    hideFlashcardCreator() {
        document.getElementById('flashcardCreator').style.display = 'none';
        this.clearFlashcardForm();
    }
    
    clearFlashcardForm() {
        document.getElementById('flashcardFront').value = '';
        document.getElementById('flashcardBack').value = '';
        document.getElementById('flashcardSubject').value = '';
    }
    
    saveFlashcard() {
        const front = document.getElementById('flashcardFront').value.trim();
        const back = document.getElementById('flashcardBack').value.trim();
        const subject = document.getElementById('flashcardSubject').value.trim();
        
        if (!front || !back) {
            this.showNotification('Please fill in both question and answer', 'error');
            return;
        }
        
        const flashcard = {
            id: Date.now(),
            front,
            back,
            subject: subject || 'General',
            created: new Date().toLocaleString()
        };
        
        this.flashcards.push(flashcard);
        this.saveData();
        this.hideFlashcardCreator();
        this.loadFlashcardsList();
        this.updateDashboard();
        this.addActivity(`Created flashcard: ${front.substring(0, 30)}...`, 'plus');
        this.addScore(5);
        this.showNotification('Flashcard created successfully! +5 points', 'success');
    }
    
    loadFlashcardsList() {
        const flashcardsList = document.getElementById('flashcardsList');
        if (this.flashcards.length === 0) {
            flashcardsList.innerHTML = '<p class="empty-state">No flashcards created yet. Create your first flashcard! 🃏</p>';
            return;
        }
        
        flashcardsList.innerHTML = this.flashcards.map(flashcard => `
            <div class="flashcard-item">
                <h4>${flashcard.front}</h4>
                <p>${flashcard.back}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                    <span class="subject-tag">${flashcard.subject}</span>
                    <button class="btn btn-danger btn-sm" onclick="studyBuddy.deleteFlashcard(${flashcard.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    deleteFlashcard(flashcardId) {
        this.flashcards = this.flashcards.filter(flashcard => flashcard.id !== flashcardId);
        this.saveData();
        this.loadFlashcardsList();
        this.updateDashboard();
        this.showNotification('Flashcard deleted', 'info');
    }
    
    startStudyMode() {
        if (this.flashcards.length === 0) {
            this.showNotification('Create some flashcards first!', 'error');
            return;
        }
        
        this.studyMode = true;
        this.currentFlashcardIndex = 0;
        this.isFlashcardFlipped = false;
        
        document.getElementById('studyModeContainer').style.display = 'block';
        this.displayCurrentFlashcard();
        this.addActivity('Started study mode', 'play');
    }
    
    displayCurrentFlashcard() {
        if (this.flashcards.length === 0) return;
        
        const flashcard = this.flashcards[this.currentFlashcardIndex];
        const text = this.isFlashcardFlipped ? flashcard.back : flashcard.front;
        
        document.getElementById('flashcardText').textContent = text;
        document.getElementById('cardProgress').textContent = `Card ${this.currentFlashcardIndex + 1} of ${this.flashcards.length}`;
    }
    
    flipFlashcard() {
        this.isFlashcardFlipped = !this.isFlashcardFlipped;
        this.displayCurrentFlashcard();
    }
    
    nextFlashcard() {
        this.currentFlashcardIndex = (this.currentFlashcardIndex + 1) % this.flashcards.length;
        this.isFlashcardFlipped = false;
        this.displayCurrentFlashcard();
        this.addScore(2);
    }
    
    exitStudyMode() {
        this.studyMode = false;
        document.getElementById('studyModeContainer').style.display = 'none';
        this.addActivity('Completed study session', 'check');
        this.showNotification('Great study session! 🎉', 'success');
    }
    
    // Mock Exam Methods
    showExamCreator() {
        document.getElementById('examCreator').style.display = 'block';
        document.getElementById('examTitle').focus();
    }
    
    hideExamCreator() {
        document.getElementById('examCreator').style.display = 'none';
        this.clearExamForm();
    }
    
    clearExamForm() {
        document.getElementById('examTitle').value = '';
        document.getElementById('examSubject').value = '';
        
        const questionsContainer = document.getElementById('questionsContainer');
        questionsContainer.innerHTML = `
            <div class="question-item">
                <h4>Question 1</h4>
                <input type="text" class="question-text" placeholder="Enter your question...">
                <div class="options-container">
                    <input type="text" class="option" placeholder="Option A">
                    <input type="text" class="option" placeholder="Option B">
                    <input type="text" class="option" placeholder="Option C">
                    <input type="text" class="option" placeholder="Option D">
                </div>
                <select class="correct-answer">
                    <option value="">Select correct answer</option>
                    <option value="0">Option A</option>
                    <option value="1">Option B</option>
                    <option value="2">Option C</option>
                    <option value="3">Option D</option>
                </select>
            </div>
        `;
    }
    
    addExamQuestion() {
        const questionsContainer = document.getElementById('questionsContainer');
        const questionCount = questionsContainer.children.length + 1;
        
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <h4>Question ${questionCount}</h4>
            <input type="text" class="question-text" placeholder="Enter your question...">
            <div class="options-container">
                <input type="text" class="option" placeholder="Option A">
                <input type="text" class="option" placeholder="Option B">
                <input type="text" class="option" placeholder="Option C">
                <input type="text" class="option" placeholder="Option D">
            </div>
            <select class="correct-answer">
                <option value="">Select correct answer</option>
                <option value="0">Option A</option>
                <option value="1">Option B</option>
                <option value="2">Option C</option>
                <option value="3">Option D</option>
            </select>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">
                <i class="fas fa-trash"></i> Remove Question
            </button>
        `;
        
        questionsContainer.appendChild(questionDiv);
    }
    
    saveMockExam() {
        const title = document.getElementById('examTitle').value.trim();
        const subject = document.getElementById('examSubject').value.trim();
        
        if (!title) {
            this.showNotification('Please enter an exam title', 'error');
            return;
        }
        
        const questions = [];
        const questionItems = document.querySelectorAll('.question-item');
        
        for (let i = 0; i < questionItems.length; i++) {
            const item = questionItems[i];
            const questionText = item.querySelector('.question-text').value.trim();
            const options = Array.from(item.querySelectorAll('.option')).map(opt => opt.value.trim());
            const correctAnswer = parseInt(item.querySelector('.correct-answer').value);
            
            if (!questionText || options.some(opt => !opt) || isNaN(correctAnswer)) {
                this.showNotification(`Please complete Question ${i + 1}`, 'error');
                return;
            }
            
            questions.push({
                question: questionText,
                options,
                correct: correctAnswer
            });
        }
        
        const exam = {
            id: Date.now(),
            title,
            subject: subject || 'General',
            questions,
            created: new Date().toLocaleString()
        };
        
        this.mockExams.push(exam);
        this.saveData();
        this.hideExamCreator();
        this.loadMockExamsList();
        this.updateDashboard();
        this.addActivity(`Created mock exam: ${title}`, 'plus');
        this.addScore(25);
        this.showNotification('Mock exam created successfully! +25 points', 'success');
    }
    
    loadMockExamsList() {
        const mockExamsList = document.getElementById('mockExamsList');
        if (this.mockExams.length === 0) {
            mockExamsList.innerHTML = '<p class="empty-state">No mock exams created yet. Create your first exam! 📝</p>';
            return;
        }
        
        mockExamsList.innerHTML = this.mockExams.map((exam, index) => `
            <div class="mock-exam-item">
                <div class="mock-exam-info">
                    <h4>${exam.title}</h4>
                    <p>Subject: ${exam.subject}</p>
                    <p>Questions: ${exam.questions.length}</p>
                    <small>Created: ${exam.created}</small>
                    ${exam.isAIGenerated ? '<span class="ai-badge"><i class="fas fa-robot"></i> AI Generated</span>' : ''}
                </div>
                <div class="mock-exam-actions">
                    <button class="btn btn-primary btn-sm" onclick="studyBuddy.takeExam('${exam.id}')">
                        <i class="fas fa-play"></i> Take Exam
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="studyBuddy.deleteMockExam('${exam.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    takeRandomExam() {
        if (this.mockExams.length === 0) {
            this.showNotification('Create some mock exams first!', 'error');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * this.mockExams.length);
        const randomExam = this.mockExams[randomIndex];
        this.takeExam(randomExam.id);
    }
    
    takeExam(examId) {
        const exam = this.mockExams.find(e => e.id == examId);
        if (!exam) {
            this.showNotification('Exam not found', 'error');
            return;
        }
        
        // Set up exam state
        this.currentExam = exam;
        this.examStartTime = new Date();
        this.examAnswers = {};
        
        // Use the proper startExam method for consistent UI management
        this.startExam();
        
        // Log activity
        this.addActivity(`Started exam: ${exam.title}`, 'play');
    }
    
    displayExamQuestions() {
        const questionsContainer = document.getElementById('examQuestions');
        questionsContainer.innerHTML = this.currentExam.questions.map((q, index) => `
            <div class="exam-question">
                <h4>Question ${index + 1}: ${q.question}</h4>
                <div class="exam-options">
                    ${q.options.map((option, optIndex) => `
                        <label class="exam-option">
                            <input type="radio" name="question_${index}" value="${optIndex}" 
                                   onchange="studyBuddy.selectAnswer(${index}, ${optIndex})">
                            <span>${String.fromCharCode(65 + optIndex)}. ${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    
    selectAnswer(questionIndex, answerIndex) {
        this.examAnswers[questionIndex] = answerIndex;
        
        const progress = (Object.keys(this.examAnswers).length / this.currentExam.questions.length) * 100;
        document.getElementById('examProgressFill').style.width = `${progress}%`;
        
        const options = document.querySelectorAll(`input[name="question_${questionIndex}"]`);
        options.forEach(option => {
            option.parentElement.classList.remove('selected');
        });
        options[answerIndex].parentElement.classList.add('selected');
    }
    
    startExamTimer() {
        this.examTimer = setInterval(() => {
            const elapsed = Date.now() - this.examStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('examTimer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    celebrateHighScore(score) {
        const confetti = document.createElement('div');
        confetti.innerHTML = '🎉🎊✨🌟💫';
        confetti.style.position = 'fixed';
        confetti.style.top = '50%';
        confetti.style.left = '50%';
        confetti.style.transform = 'translate(-50%, -50%)';
        confetti.style.fontSize = '3rem';
        confetti.style.zIndex = '9999';
        confetti.style.animation = 'bounce 2s ease-in-out';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            document.body.removeChild(confetti);
        }, 2000);
    }
    
    exitExam() {
        if (confirm('Are you sure you want to exit the exam? Your progress will be lost.')) {
            clearInterval(this.examTimer);
            document.getElementById('examTaking').style.display = 'none';
            this.currentExam = null;
        }
    }
    
    reviewAnswers() {
        this.showNotification('Answer review feature coming soon!', 'info');
    }
    
    retakeCurrentExam() {
        document.getElementById('examResults').style.display = 'none';
        this.takeExam(this.currentExam.id);
    }
    
    backToExams() {
        document.getElementById('examResults').style.display = 'none';
        this.currentExam = null;
    }
    
    deleteMockExam(examId) {
        // Find the exam first to check if it exists
        const examIndex = this.mockExams.findIndex(exam => exam.id == examId);
        if (examIndex === -1) {
            this.showNotification('Mock exam not found', 'error');
            return;
        }
        
        // Confirm deletion with user
        if (confirm('Are you sure you want to delete this mock exam? This action cannot be undone.')) {
            const examTitle = this.mockExams[examIndex].title;
            
            // Remove the exam from the array
            this.mockExams.splice(examIndex, 1);
            
            // Save the updated data
            if (this.currentUser) {
                this.saveUserData();
            } else {
                this.saveData();
            }
            
            // Update the UI
            this.loadMockExamsList();
            this.updateDashboard();
            
            // Log the activity and show notification
            this.addActivity(`Deleted mock exam: ${examTitle}`, 'trash');
            this.showNotification('Mock exam deleted successfully', 'success');
        }
    }
    
    // User Interface and Authentication Methods
    updateUserInterface() {
        if (this.currentUser) {
            // Update user display name
            const userDisplayName = document.getElementById('userDisplayName');
            const welcomeText = document.getElementById('welcomeText');
            const userEmail = document.getElementById('userEmail');
            const userGrade = document.getElementById('userGrade');
            
            if (userDisplayName) {
                userDisplayName.textContent = this.currentUser.name || this.currentUser.username || 'User';
            }
            
            if (welcomeText) {
                welcomeText.textContent = `Welcome, ${this.currentUser.name || this.currentUser.username || 'User'}!`;
            }
            
            if (userEmail) {
                userEmail.textContent = this.currentUser.email || 'Email not provided';
            }
            
            if (userGrade) {
                userGrade.textContent = this.currentUser.grade ? `Grade: ${this.currentUser.grade}` : 'Grade: Not selected';
            }
            
            // Update sync status for logged in user
            this.setSyncStatus('synced');
            
            // Show/hide authentication buttons
            const loginBtn = document.getElementById('loginBtn');
            const signupBtn = document.getElementById('signupBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            
            if (loginBtn) loginBtn.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            
        } else {
            // Reset to guest user display
            const userDisplayName = document.getElementById('userDisplayName');
            const welcomeText = document.getElementById('welcomeText');
            const userEmail = document.getElementById('userEmail');
            const userGrade = document.getElementById('userGrade');
            
            if (userDisplayName) {
                userDisplayName.textContent = 'Guest User';
            }
            
            if (welcomeText) {
                welcomeText.textContent = 'Welcome, Student!';
            }
            
            if (userEmail) {
                userEmail.textContent = 'Not logged in';
            }
            
            if (userGrade) {
                userGrade.textContent = 'Grade: Not selected';
            }
            
            // Update sync status for guest user
            this.setSyncStatus('offline');
            
            // Show/hide authentication buttons
            const loginBtn = document.getElementById('loginBtn');
            const signupBtn = document.getElementById('signupBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (signupBtn) signupBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }
    
    setSyncStatus(status) {
        const syncStatusElement = document.getElementById('syncStatus');
        if (!syncStatusElement) return;
        
        const indicator = syncStatusElement.querySelector('.sync-indicator');
        const text = syncStatusElement.querySelector('span:last-child');
        
        if (!indicator || !text) return;
        
        // Remove all status classes
        indicator.classList.remove('online', 'offline', 'syncing', 'error');
        
        switch (status) {
            case 'synced':
            case 'online':
                indicator.classList.add('online');
                text.textContent = 'Synced';
                break;
            case 'syncing':
                indicator.classList.add('syncing');
                text.textContent = 'Syncing...';
                break;
            case 'offline':
                indicator.classList.add('offline');
                text.textContent = 'Offline Mode';
                break;
            case 'error':
                indicator.classList.add('error');
                text.textContent = 'Sync Error';
                break;
            default:
                indicator.classList.add('offline');
                text.textContent = 'Offline Mode';
        }
    }
    

    
    // Authentication Modal Methods - Bulletproof Version
    showAuthModal(mode = 'login') {
        console.log('=== AUTHENTICATION MODAL DEBUG START ===');
        console.log('showAuthModal called with mode:', mode);
        
        // Use setTimeout to ensure DOM is fully loaded
        setTimeout(() => {
            try {
                // Get all elements with detailed logging
                console.log('Looking for authModal element...');
                const authModal = document.getElementById('authModal');
                console.log('authModal found:', !!authModal, authModal);
                
                console.log('Looking for authForm element...');
                const authForm = document.getElementById('authForm');
                console.log('authForm found:', !!authForm, authForm);
                
                console.log('Looking for authTitle element...');
                const authTitle = document.getElementById('authTitle');
                console.log('authTitle found:', !!authTitle, authTitle);
                
                console.log('Looking for authSubmitBtn element...');
                const authSubmitBtn = document.getElementById('authSubmitBtn');
                console.log('authSubmitBtn found:', !!authSubmitBtn, authSubmitBtn);
                
                console.log('Looking for switchAuthMode element...');
                const switchAuthMode = document.getElementById('switchAuthMode');
                console.log('switchAuthMode found:', !!switchAuthMode, switchAuthMode);
                
                console.log('Looking for confirmPasswordGroup element...');
                const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
                console.log('confirmPasswordGroup found:', !!confirmPasswordGroup, confirmPasswordGroup);
                
                // If any critical element is missing, use fallback
                if (!authModal || !authTitle || !authSubmitBtn || !switchAuthMode || !confirmPasswordGroup) {
                    console.error('CRITICAL: One or more modal elements missing, using fallback');
                    this.authModalFallback();
                    return;
                }
                
                console.log('All elements found, proceeding with modal setup...');
                this.currentAuthMode = mode;
                
                // Safely set text content
                if (authTitle) authTitle.textContent = mode === 'login' ? 'Sign In to StudyBuddy' : 'Create StudyBuddy Account';
                if (authSubmitBtn) authSubmitBtn.textContent = mode === 'login' ? 'Sign In' : 'Sign Up';
                if (switchAuthMode) switchAuthMode.textContent = mode === 'login' ? 'Need an account? Sign Up' : 'Already have an account? Sign In';
                
                // Safely set display styles
                if (confirmPasswordGroup) {
                    confirmPasswordGroup.style.display = mode === 'login' ? 'none' : 'block';
                }
                
                if (authModal) {
                    authModal.style.display = 'flex';
                }
                
                if (authForm) {
                    authForm.reset();
                }
                
                console.log('Authentication modal displayed successfully!');
                console.log('=== AUTHENTICATION MODAL DEBUG END ===');
                
            } catch (error) {
                console.error('CRITICAL ERROR in showAuthModal:', error);
                console.error('Error stack:', error.stack);
                this.authModalFallback();
            }
        }, 100); // Small delay to ensure DOM is ready
    }
    
    // Fallback method when modal fails
    authModalFallback() {
        console.log('Using authentication fallback...');
        const name = prompt('Enter your name for StudyBuddy:');
        if (name && name.trim()) {
            const userData = {
                id: Date.now().toString(),
                name: name.trim(),
                email: name.trim().toLowerCase().replace(/\s+/g, '') + '@studybuddy.local',
                grade: '9',
                loginAt: new Date().toISOString()
            };
            this.login(userData);
            this.showNotification(`Welcome, ${name}!`, 'success');
        }
    }
    
    hideAuthModal() {
        try {
            const authModal = document.getElementById('authModal');
            if (authModal) {
                authModal.style.display = 'none';
            } else {
                console.error('authModal element not found in hideAuthModal');
            }
        } catch (error) {
            console.error('Error in hideAuthModal:', error);
        }
    }
    
    switchAuthMode() {
        try {
            const newMode = this.currentAuthMode === 'login' ? 'signup' : 'login';
            this.showAuthModal(newMode);
        } catch (error) {
            console.error('Error in switchAuthMode:', error);
        }
    }
    
    handleAuth(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const grade = formData.get('grade');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (this.currentAuthMode === 'signup') {
            // Validate signup
            if (!name || !email || !grade || !password) {
                this.showNotification('Please fill in all fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                this.showNotification('Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                this.showNotification('Password must be at least 6 characters', 'error');
                return;
            }
            
            // Create new user
            const userData = {
                id: Date.now().toString(),
                name: name,
                email: email,
                grade: grade,
                password: password, // In real app, this would be hashed
                createdAt: new Date().toISOString()
            };
            
            this.login(userData);
            this.showNotification(`Welcome to StudyBuddy, ${name}!`, 'success');
            
        } else {
            // Handle login
            if (!email || !password) {
                this.showNotification('Please enter email and password', 'error');
                return;
            }
            
            // For demo purposes, accept any valid email/password combination
            const userData = {
                id: email.replace('@', '_').replace('.', '_'),
                name: name || email.split('@')[0],
                email: email,
                grade: grade || '9',
                password: password,
                loginAt: new Date().toISOString()
            };
            
            this.login(userData);
            this.showNotification(`Welcome back, ${userData.name}!`, 'success');
        }
        
        this.hideAuthModal();
    }
    
    // Authentication methods
    login(userData) {
        this.currentUser = userData;
        localStorage.setItem('studyBuddyUser', JSON.stringify(userData));
        this.loadUserData();
        this.updateUserInterface();
        this.setSyncStatus('synced');
        this.updateDashboard();
        this.showNotification('Successfully logged in!', 'success');
        this.addActivity('User logged in', 'sign-in-alt');
    }
    
    logout() {
        if (confirm('Are you sure you want to logout? Your data will be saved.')) {
            // Save current data before logout
            if (this.currentUser) {
                this.saveUserData();
            }
            
            this.currentUser = null;
            localStorage.removeItem('studyBuddyUser');
            this.setSyncStatus('offline');
            this.updateUserInterface();
            this.loadSampleData();
            this.updateDashboard();
            this.showNotification('Successfully logged out', 'info');
        }
    }
    
    saveUserData() {
        if (this.currentUser) {
            const userData = {
                ...this.currentUser,
                notes: this.notes,
                exams: this.exams,
                flashcards: this.flashcards,
                mockExams: this.mockExams,
                totalScore: this.totalScore,
                activities: this.activities,
                todoList: this.todoList,
                lastSaved: new Date().toISOString()
            };
            
            // In a real app, this would sync to a server
            // For now, we'll save to localStorage with user prefix
            localStorage.setItem(`studyBuddyUserData_${this.currentUser.id || this.currentUser.email}`, JSON.stringify(userData));
            localStorage.setItem('studyBuddyUser', JSON.stringify(this.currentUser));
            
            this.setSyncStatus('synced');
        }
    }
    
    loadUserData() {
        if (this.currentUser) {
            const userDataKey = `studyBuddyUserData_${this.currentUser.id || this.currentUser.email}`;
            const userData = JSON.parse(localStorage.getItem(userDataKey));
            
            if (userData) {
                this.notes = userData.notes || [];
                this.exams = userData.exams || [];
                this.flashcards = userData.flashcards || [];
                this.mockExams = userData.mockExams || [];
                this.totalScore = userData.totalScore || 0;
                this.activities = userData.activities || [];
                this.todoList = userData.todoList || [];
                
                this.setSyncStatus('synced');
            } else {
                // First time user, initialize with sample data
                this.loadSampleData();
                this.saveUserData();
            }
        }
    }
    
    // Points and Scoring System
    updateScore(points = 0, reason = '') {
        if (points > 0) {
            this.totalScore += points;
            
            // Save the updated score
            if (this.currentUser) {
                this.saveUserData();
            } else {
                this.saveData();
            }
            
            // Update the display
            this.displayScore();
            
            // Show notification for points earned
            if (reason) {
                this.showNotification(`+${points} points: ${reason}`, 'success');
            }
            
            // Check for achievements/milestones
            this.checkAchievements();
        } else {
            // Just update the display
            this.displayScore();
        }
    }
    
    displayScore() {
        const scoreElement = document.getElementById('totalScore');
        if (scoreElement) {
            scoreElement.textContent = this.totalScore;
        }
    }
    
    // Task completion points system
    awardTaskPoints(taskType, taskDetails = '') {
        let points = 0;
        let reason = '';
        
        switch (taskType) {
            case 'note_capture':
                points = 10;
                reason = 'Captured a note';
                break;
            case 'note_upload':
                points = 15;
                reason = 'Uploaded a study file';
                break;
            case 'flashcard_created':
                points = 12;
                reason = 'Created a flashcard';
                break;
            case 'flashcard_studied':
                points = 8;
                reason = 'Studied flashcards';
                break;
            case 'exam_uploaded':
                points = 20;
                reason = 'Uploaded an exam';
                break;
            case 'mock_exam_created':
                points = 25;
                reason = 'Created a mock exam';
                break;
            case 'ai_exam_generated':
                points = 20;
                reason = 'Generated AI mock exam';
                break;
            case 'ai_flashcards_generated':
                points = 15;
                reason = 'Generated AI flashcards';
                break;
            case 'daily_login':
                points = 5;
                reason = 'Daily login bonus';
                break;
            case 'first_time_feature':
                points = 30;
                reason = 'First time using ' + taskDetails;
                break;
            case 'streak_bonus':
                points = parseInt(taskDetails) || 10;
                reason = 'Study streak bonus';
                break;
            default:
                points = 5;
                reason = 'Task completed';
        }
        
        this.updateScore(points, reason);
        this.addActivity(`Earned ${points} points: ${reason}`, 'star');
    }
    
    // Mock exam performance points system
    awardExamPoints(examResults) {
        const { score, totalQuestions, examTitle, timeTaken, difficulty } = examResults;
        const percentage = Math.round((score / totalQuestions) * 100);
        
        let basePoints = 0;
        let bonusPoints = 0;
        let reason = '';
        
        // Base points based on percentage
        if (percentage >= 90) {
            basePoints = 50;
            reason = 'Excellent performance (90%+)';
        } else if (percentage >= 80) {
            basePoints = 40;
            reason = 'Great performance (80-89%)';
        } else if (percentage >= 70) {
            basePoints = 30;
            reason = 'Good performance (70-79%)';
        } else if (percentage >= 60) {
            basePoints = 20;
            reason = 'Fair performance (60-69%)';
        } else if (percentage >= 50) {
            basePoints = 10;
            reason = 'Passing performance (50-59%)';
        } else {
            basePoints = 5;
            reason = 'Participation points';
        }
        
        // Difficulty bonus
        if (difficulty === 'hard') {
            bonusPoints += 10;
        } else if (difficulty === 'medium') {
            bonusPoints += 5;
        }
        
        // Perfect score bonus
        if (percentage === 100) {
            bonusPoints += 25;
            reason += ' + Perfect Score Bonus';
        }
        
        // Speed bonus (if completed quickly)
        if (timeTaken && timeTaken < (totalQuestions * 30)) { // Less than 30 seconds per question
            bonusPoints += 15;
            reason += ' + Speed Bonus';
        }
        
        // Question count bonus (more questions = more points)
        if (totalQuestions >= 20) {
            bonusPoints += 10;
        } else if (totalQuestions >= 15) {
            bonusPoints += 5;
        }
        
        const totalPoints = basePoints + bonusPoints;
        
        // Award the points
        this.updateScore(totalPoints, `${examTitle}: ${reason}`);
        
        // Log detailed activity
        this.addActivity(`Mock Exam: ${examTitle} - ${score}/${totalQuestions} (${percentage}%) - ${totalPoints} points`, 'trophy');
        
        // Special notifications for achievements
        if (percentage === 100) {
            this.showNotification('🎉 Perfect Score! Amazing work!', 'success');
        } else if (percentage >= 90) {
            this.showNotification('🌟 Outstanding performance!', 'success');
        } else if (percentage >= 80) {
            this.showNotification('👏 Great job!', 'success');
        }
        
        return {
            totalPoints,
            basePoints,
            bonusPoints,
            percentage,
            reason
        };
    }
    
    // Achievement system
    checkAchievements() {
        const achievements = this.getAchievements();
        
        // Check for new achievements
        achievements.forEach(achievement => {
            if (!achievement.unlocked && this.meetsAchievementCriteria(achievement)) {
                this.unlockAchievement(achievement);
            }
        });
    }
    
    getAchievements() {
        return [
            {
                id: 'first_100',
                title: 'Getting Started',
                description: 'Earn your first 100 points',
                points: 100,
                bonus: 25,
                unlocked: this.totalScore >= 100
            },
            {
                id: 'note_master',
                title: 'Note Master',
                description: 'Capture 10 notes',
                points: 0,
                bonus: 50,
                unlocked: this.notes.length >= 10
            },
            {
                id: 'exam_ace',
                title: 'Exam Ace',
                description: 'Score 100% on any mock exam',
                points: 0,
                bonus: 100,
                unlocked: false // Will be checked during exam completion
            },
            {
                id: 'study_streak',
                title: 'Study Streak',
                description: 'Study for 7 consecutive days',
                points: 0,
                bonus: 75,
                unlocked: false // Would need daily tracking
            },
            {
                id: 'flashcard_hero',
                title: 'Flashcard Hero',
                description: 'Create 25 flashcards',
                points: 0,
                bonus: 60,
                unlocked: this.flashcards.length >= 25
            },
            {
                id: 'ai_explorer',
                title: 'AI Explorer',
                description: 'Generate 5 AI mock exams',
                points: 0,
                bonus: 80,
                unlocked: this.mockExams.filter(exam => exam.isAIGenerated).length >= 5
            }
        ];
    }
    
    meetsAchievementCriteria(achievement) {
        switch (achievement.id) {
            case 'first_100':
                return this.totalScore >= 100;
            case 'note_master':
                return this.notes.length >= 10;
            case 'flashcard_hero':
                return this.flashcards.length >= 25;
            case 'ai_explorer':
                return this.mockExams.filter(exam => exam.isAIGenerated).length >= 5;
            default:
                return false;
        }
    }
    
    unlockAchievement(achievement) {
        achievement.unlocked = true;
        
        // Award bonus points
        this.updateScore(achievement.bonus, `Achievement: ${achievement.title}`);
        
        // Show special notification
        this.showNotification(`🏆 Achievement Unlocked: ${achievement.title}! +${achievement.bonus} bonus points`, 'success');
        
        // Log achievement
        this.addActivity(`Unlocked achievement: ${achievement.title}`, 'trophy');
        
        // Save achievement data
        if (!this.achievements) {
            this.achievements = [];
        }
        this.achievements.push({
            ...achievement,
            unlockedDate: new Date().toISOString()
        });
        
        if (this.currentUser) {
            this.saveUserData();
        } else {
            this.saveData();
        }
    }
    
    // Daily bonus system
    checkDailyBonus() {
        const today = new Date().toDateString();
        const lastLogin = localStorage.getItem('studyBuddyLastLogin');
        
        if (lastLogin !== today) {
            this.awardTaskPoints('daily_login');
            localStorage.setItem('studyBuddyLastLogin', today);
        }
    }
    
    // Authentication Modal Methods
    showLoginModal() {
        // For demo purposes, create a simple login simulation
        const name = prompt('Enter your name:');
        const email = prompt('Enter your email:');
        const grade = prompt('Enter your grade (3-12):');
        
        if (name && email) {
            const userData = {
                id: Date.now(),
                name: name.trim(),
                email: email.trim(),
                grade: grade ? parseInt(grade.trim()) : null,
                joinDate: new Date().toISOString()
            };
            
            this.login(userData);
        }
    }
    
    showSignupModal() {
        // For demo purposes, create a simple signup simulation
        const name = prompt('Create your name:');
        const email = prompt('Create your email:');
        const grade = prompt('Select your grade (3-12):');
        
        if (name && email) {
            const userData = {
                id: Date.now(),
                name: name.trim(),
                email: email.trim(),
                grade: grade ? parseInt(grade.trim()) : null,
                joinDate: new Date().toISOString()
            };
            
            this.login(userData);
            this.showNotification('Account created successfully!', 'success');
        }
    }
    
    // AI Flashcard Generation Methods
    showAIFlashcardGenerator() {
        document.getElementById('aiFlashcardGenerator').style.display = 'block';
        document.getElementById('flashcardCreator').style.display = 'none';
        
        // Auto-fill grade if user has one set
        const userGrade = this.currentUser?.grade;
        if (userGrade) {
            document.getElementById('aiFlashcardGrade').value = userGrade;
        }
    }
    
    hideAIFlashcardGenerator() {
        document.getElementById('aiFlashcardGenerator').style.display = 'none';
        document.getElementById('aiFlashcardStatus').style.display = 'none';
        this.clearAIFlashcardForm();
    }
    
    clearAIFlashcardForm() {
        document.getElementById('aiFlashcardGrade').value = '';
        document.getElementById('aiFlashcardSubject').value = '';
        document.getElementById('aiFlashcardCount').value = '10';
        document.getElementById('aiFlashcardDifficulty').value = 'medium';
        document.getElementById('aiFlashcardTopic').value = '';
    }
    
    async generateAIFlashcards() {
        const grade = document.getElementById('aiFlashcardGrade').value;
        const subject = document.getElementById('aiFlashcardSubject').value;
        const flashcardCount = parseInt(document.getElementById('aiFlashcardCount').value);
        const difficulty = document.getElementById('aiFlashcardDifficulty').value;
        const topic = document.getElementById('aiFlashcardTopic').value.trim();
        
        // Validation
        if (!grade || !subject) {
            this.showNotification('Please select both grade level and subject', 'error');
            return;
        }
        
        // Show loading status
        document.getElementById('aiFlashcardStatus').style.display = 'block';
        document.getElementById('generateAIFlashcardSet').disabled = true;
        
        try {
            // Generate AI flashcards
            const flashcards = await this.createAIFlashcards(grade, subject, flashcardCount, difficulty, topic);
            
            if (flashcards && flashcards.length > 0) {
                // Add the flashcards to the collection
                flashcards.forEach(flashcard => {
                    const newFlashcard = {
                        id: Date.now() + Math.random(),
                        front: flashcard.front,
                        back: flashcard.back,
                        subject: subject,
                        created: new Date().toLocaleString(),
                        isAIGenerated: true,
                        grade: grade,
                        difficulty: difficulty,
                        topic: topic || 'General'
                    };
                    
                    this.flashcards.push(newFlashcard);
                });
                
                // Save the flashcards
                if (this.currentUser) {
                    this.saveUserData();
                } else {
                    this.saveData();
                }
                
                // Update UI
                this.loadFlashcardsList();
                this.updateDashboard();
                this.hideAIFlashcardGenerator();
                
                // Log activity and show success
                const topicText = topic ? ` - ${topic}` : '';
                this.addActivity(`Generated ${flashcardCount} AI flashcards: ${subject}${topicText} (Grade ${grade})`, 'robot');
                this.showNotification(`Successfully generated ${flashcardCount} flashcards for ${subject}!`, 'success');
                
                // Award points for using AI feature
                this.awardTaskPoints('ai_flashcards_generated', `${flashcardCount} flashcards`);
                
            } else {
                throw new Error('No flashcards generated');
            }
            
        } catch (error) {
            console.error('AI Flashcard Generation Error:', error);
            this.showNotification('Failed to generate AI flashcards. Please try again.', 'error');
        } finally {
            document.getElementById('aiFlashcardStatus').style.display = 'none';
            document.getElementById('generateAIFlashcardSet').disabled = false;
        }
    }
    
    async createAIFlashcards(grade, subject, flashcardCount, difficulty, topic) {
        // This is a comprehensive AI flashcard generation system
        // In a real implementation, this would call an actual AI service
        // For now, we'll create a sophisticated local generation system
        
        const flashcardBank = this.getFlashcardBank(grade, subject, difficulty, topic);
        const selectedFlashcards = [];
        
        // Shuffle and select flashcards
        const shuffled = flashcardBank.sort(() => 0.5 - Math.random());
        const flashcardsToUse = shuffled.slice(0, Math.min(flashcardCount, shuffled.length));
        
        // If we need more flashcards, generate additional ones
        if (flashcardsToUse.length < flashcardCount) {
            const additionalFlashcards = this.generateAdditionalFlashcards(
                grade, subject, difficulty, topic, flashcardCount - flashcardsToUse.length
            );
            flashcardsToUse.push(...additionalFlashcards);
        }
        
        return flashcardsToUse.map(f => ({
            front: f.front,
            back: f.back
        }));
    }
    
    getFlashcardBank(grade, subject, difficulty, topic) {
        const gradeNum = parseInt(grade);
        const flashcards = [];
        
        // Mathematics flashcards by grade
        if (subject === 'mathematics') {
            if (gradeNum >= 3 && gradeNum <= 5) {
                flashcards.push(
                    {
                        front: "What is 7 + 5?",
                        back: "12"
                    },
                    {
                        front: "What is 9 × 3?",
                        back: "27"
                    },
                    {
                        front: "How many sides does a square have?",
                        back: "4 sides"
                    },
                    {
                        front: "What is half of 16?",
                        back: "8"
                    },
                    {
                        front: "What comes after 99?",
                        back: "100"
                    },
                    {
                        front: "What is 15 - 8?",
                        back: "7"
                    },
                    {
                        front: "How many minutes are in an hour?",
                        back: "60 minutes"
                    },
                    {
                        front: "What is 4 × 5?",
                        back: "20"
                    }
                );
            } else if (gradeNum >= 6 && gradeNum <= 8) {
                flashcards.push(
                    {
                        front: "What is 12²?",
                        back: "144"
                    },
                    {
                        front: "What is 75% as a fraction?",
                        back: "3/4"
                    },
                    {
                        front: "What is the area formula for a rectangle?",
                        back: "Length × Width"
                    },
                    {
                        front: "What is 144 ÷ 12?",
                        back: "12"
                    },
                    {
                        front: "What is the perimeter of a square with side 5cm?",
                        back: "20cm"
                    },
                    {
                        front: "Solve: x + 7 = 15",
                        back: "x = 8"
                    },
                    {
                        front: "What is 0.5 as a percentage?",
                        back: "50%"
                    },
                    {
                        front: "What is the circumference formula for a circle?",
                        back: "2πr or πd"
                    }
                );
            } else if (gradeNum >= 9 && gradeNum <= 12) {
                flashcards.push(
                    {
                        front: "What is the quadratic formula?",
                        back: "x = (-b ± √(b²-4ac)) / 2a"
                    },
                    {
                        front: "What is the derivative of x³?",
                        back: "3x²"
                    },
                    {
                        front: "What is sin²θ + cos²θ equal to?",
                        back: "1"
                    },
                    {
                        front: "What is the slope-intercept form?",
                        back: "y = mx + b"
                    },
                    {
                        front: "What is log₁₀(100)?",
                        back: "2"
                    },
                    {
                        front: "What is the area of a triangle?",
                        back: "½ × base × height"
                    }
                );
            }
        }
        
        // Science flashcards by grade
        if (subject === 'science') {
            if (gradeNum >= 3 && gradeNum <= 5) {
                flashcards.push(
                    {
                        front: "What do plants need to grow?",
                        back: "Water, sunlight, air, and nutrients"
                    },
                    {
                        front: "What are the three states of matter?",
                        back: "Solid, liquid, and gas"
                    },
                    {
                        front: "Which planet is closest to the Sun?",
                        back: "Mercury"
                    },
                    {
                        front: "What do we call animals that eat only plants?",
                        back: "Herbivores"
                    },
                    {
                        front: "How many legs does an insect have?",
                        back: "6 legs"
                    },
                    {
                        front: "What is the center of our solar system?",
                        back: "The Sun"
                    }
                );
            } else if (gradeNum >= 6 && gradeNum <= 8) {
                flashcards.push(
                    {
                        front: "What is photosynthesis?",
                        back: "The process plants use to make food from sunlight"
                    },
                    {
                        front: "What is the chemical symbol for water?",
                        back: "H₂O"
                    },
                    {
                        front: "What organ pumps blood through the body?",
                        back: "The heart"
                    },
                    {
                        front: "What is the smallest unit of matter?",
                        back: "An atom"
                    },
                    {
                        front: "What gas do plants release during photosynthesis?",
                        back: "Oxygen"
                    },
                    {
                        front: "What is the speed of light?",
                        back: "300,000 km/s"
                    }
                );
            } else if (gradeNum >= 9 && gradeNum <= 12) {
                flashcards.push(
                    {
                        front: "What is the powerhouse of the cell?",
                        back: "Mitochondria"
                    },
                    {
                        front: "What is Newton's first law of motion?",
                        back: "An object at rest stays at rest unless acted upon by a force"
                    },
                    {
                        front: "What is the chemical formula for glucose?",
                        back: "C₆H₁₂O₆"
                    },
                    {
                        front: "What is DNA?",
                        back: "Deoxyribonucleic acid - carries genetic information"
                    },
                    {
                        front: "What is the pH of pure water?",
                        back: "7 (neutral)"
                    }
                );
            }
        }
        
        // English flashcards by grade
        if (subject === 'english') {
            if (gradeNum >= 3 && gradeNum <= 5) {
                flashcards.push(
                    {
                        front: "What is a noun?",
                        back: "A person, place, thing, or idea"
                    },
                    {
                        front: "What is a verb?",
                        back: "An action word"
                    },
                    {
                        front: "What is an adjective?",
                        back: "A word that describes a noun"
                    },
                    {
                        front: "What is the opposite of 'hot'?",
                        back: "Cold"
                    },
                    {
                        front: "What is a synonym for 'big'?",
                        back: "Large, huge, enormous"
                    }
                );
            } else if (gradeNum >= 6 && gradeNum <= 8) {
                flashcards.push(
                    {
                        front: "What is a metaphor?",
                        back: "A comparison without using 'like' or 'as'"
                    },
                    {
                        front: "What is alliteration?",
                        back: "Repetition of the same sound at the beginning of words"
                    },
                    {
                        front: "What is the past tense of 'run'?",
                        back: "Ran"
                    },
                    {
                        front: "What is personification?",
                        back: "Giving human qualities to non-human things"
                    }
                );
            } else if (gradeNum >= 9 && gradeNum <= 12) {
                flashcards.push(
                    {
                        front: "What is dramatic irony?",
                        back: "When the audience knows something the characters don't"
                    },
                    {
                        front: "What is a thesis statement?",
                        back: "The main argument or point of an essay"
                    },
                    {
                        front: "What is iambic pentameter?",
                        back: "A poetic meter with 10 syllables per line"
                    }
                );
            }
        }
        
        // Add more subjects as needed
        return flashcards;
    }
    
    generateAdditionalFlashcards(grade, subject, difficulty, topic, count) {
        // Generate template-based flashcards when we need more
        const additionalFlashcards = [];
        const gradeNum = parseInt(grade);
        
        for (let i = 0; i < count; i++) {
            if (subject === 'mathematics' && gradeNum >= 3 && gradeNum <= 8) {
                const num1 = Math.floor(Math.random() * 20) + 1;
                const num2 = Math.floor(Math.random() * 20) + 1;
                const operations = [
                    { op: '+', symbol: '+', calc: (a, b) => a + b },
                    { op: 'subtract', symbol: '-', calc: (a, b) => Math.max(a, b) - Math.min(a, b) },
                    { op: 'multiply', symbol: '×', calc: (a, b) => a * b }
                ];
                const operation = operations[Math.floor(Math.random() * operations.length)];
                
                const answer = operation.calc(num1, num2);
                
                additionalFlashcards.push({
                    front: `What is ${num1} ${operation.symbol} ${num2}?`,
                    back: answer.toString()
                });
            } else {
                // Generic flashcard for other subjects
                additionalFlashcards.push({
                    front: `Sample ${subject} question for Grade ${grade}`,
                    back: `Sample answer for Grade ${grade} ${subject}`
                });
            }
        }
        
        return additionalFlashcards;
    }
    
    // AI Mock Exam Generation Methods
    showAIExamGenerator() {
        document.getElementById('aiExamGenerator').style.display = 'block';
        document.getElementById('examCreator').style.display = 'none';
        
        // Auto-fill grade if user has one set
        const userGrade = this.currentUser?.grade;
        if (userGrade) {
            document.getElementById('aiExamGrade').value = userGrade;
        }
    }
    
    hideAIExamGenerator() {
        document.getElementById('aiExamGenerator').style.display = 'none';
        document.getElementById('aiGenerationStatus').style.display = 'none';
        this.clearAIExamForm();
    }
    
    clearAIExamForm() {
        document.getElementById('aiExamGrade').value = '';
        document.getElementById('aiExamSubject').value = '';
        document.getElementById('aiExamQuestionCount').value = '10';
        document.getElementById('aiExamDifficulty').value = 'medium';
        document.getElementById('aiExamTopic').value = '';
    }
    
    async generateAIQuestions() {
        const grade = document.getElementById('aiExamGrade').value;
        const subject = document.getElementById('aiExamSubject').value;
        const questionCount = parseInt(document.getElementById('aiExamQuestionCount').value);
        const difficulty = document.getElementById('aiExamDifficulty').value;
        const topic = document.getElementById('aiExamTopic').value.trim();
        
        // Validation
        if (!grade || !subject) {
            this.showNotification('Please select both grade level and subject', 'error');
            return;
        }
        
        // Show loading status
        document.getElementById('aiGenerationStatus').style.display = 'block';
        document.getElementById('generateAIQuestions').disabled = true;
        
        try {
            // Generate AI questions
            const questions = await this.createAIQuestions(grade, subject, questionCount, difficulty, topic);
            
            if (questions && questions.length > 0) {
                // Create the mock exam
                const examTitle = topic 
                    ? `${subject} - ${topic} (Grade ${grade})` 
                    : `${subject} Mock Exam (Grade ${grade})`;
                
                const newExam = {
                    id: Date.now(),
                    title: examTitle,
                    subject: subject,
                    questions: questions,
                    created: new Date().toLocaleString(),
                    isAIGenerated: true,
                    grade: grade,
                    difficulty: difficulty
                };
                
                // Save the exam
                this.mockExams.push(newExam);
                
                if (this.currentUser) {
                    this.saveUserData();
                } else {
                    this.saveData();
                }
                
                // Update UI
                this.loadMockExamsList();
                this.updateDashboard();
                this.hideAIExamGenerator();
                
                // Log activity and show success
                this.addActivity(`Generated AI mock exam: ${examTitle}`, 'robot');
                this.showNotification(`Successfully generated ${questionCount} questions for ${examTitle}!`, 'success');
                
                // Award points for using AI feature
                this.awardTaskPoints('ai_exam_generated');
                
            } else {
                throw new Error('No questions generated');
            }
            
        } catch (error) {
            console.error('AI Generation Error:', error);
            this.showNotification('Failed to generate AI questions. Please try again.', 'error');
        } finally {
            document.getElementById('aiGenerationStatus').style.display = 'none';
            document.getElementById('generateAIQuestions').disabled = false;
        }
    }
    
    async createAIQuestions(grade, subject, questionCount, difficulty, topic) {
        // This is a comprehensive AI question generation system
        // In a real implementation, this would call an actual AI service
        // For now, we'll create a sophisticated local generation system
        
        const questionBank = this.getQuestionBank(grade, subject, difficulty, topic);
        const selectedQuestions = [];
        
        // Shuffle and select questions
        const shuffled = questionBank.sort(() => 0.5 - Math.random());
        const questionsToUse = shuffled.slice(0, Math.min(questionCount, shuffled.length));
        
        // If we need more questions, generate additional ones
        if (questionsToUse.length < questionCount) {
            const additionalQuestions = this.generateAdditionalQuestions(
                grade, subject, difficulty, topic, questionCount - questionsToUse.length
            );
            questionsToUse.push(...additionalQuestions);
        }
        
        return questionsToUse.map(q => ({
            question: q.question,
            options: q.options,
            correct: q.correct
        }));
    }
    
    getQuestionBank(grade, subject, difficulty, topic) {
        const gradeNum = parseInt(grade);
        const questions = [];
        
        // Mathematics questions by grade
        if (subject === 'mathematics') {
            if (gradeNum >= 3 && gradeNum <= 5) {
                questions.push(
                    {
                        question: "What is 15 + 27?",
                        options: ["40", "42", "44", "46"],
                        correct: 1
                    },
                    {
                        question: "What is 8 × 6?",
                        options: ["46", "48", "50", "52"],
                        correct: 1
                    },
                    {
                        question: "What is half of 24?",
                        options: ["10", "11", "12", "13"],
                        correct: 2
                    },
                    {
                        question: "How many sides does a triangle have?",
                        options: ["2", "3", "4", "5"],
                        correct: 1
                    }
                );
            } else if (gradeNum >= 6 && gradeNum <= 8) {
                questions.push(
                    {
                        question: "What is 144 ÷ 12?",
                        options: ["10", "11", "12", "13"],
                        correct: 2
                    },
                    {
                        question: "What is 25% of 80?",
                        options: ["15", "20", "25", "30"],
                        correct: 1
                    },
                    {
                        question: "What is the area of a rectangle with length 8cm and width 5cm?",
                        options: ["35 cm²", "40 cm²", "45 cm²", "50 cm²"],
                        correct: 1
                    },
                    {
                        question: "Solve: 3x + 5 = 14",
                        options: ["x = 2", "x = 3", "x = 4", "x = 5"],
                        correct: 1
                    }
                );
            } else if (gradeNum >= 9 && gradeNum <= 12) {
                questions.push(
                    {
                        question: "What is the derivative of x²?",
                        options: ["x", "2x", "x²", "2x²"],
                        correct: 1
                    },
                    {
                        question: "Solve: x² - 5x + 6 = 0",
                        options: ["x = 1, 6", "x = 2, 3", "x = 3, 4", "x = 4, 5"],
                        correct: 1
                    },
                    {
                        question: "What is sin(30°)?",
                        options: ["1/2", "√3/2", "1", "0"],
                        correct: 0
                    }
                );
            }
        }
        
        // Science questions by grade
        if (subject === 'science') {
            if (gradeNum >= 3 && gradeNum <= 5) {
                questions.push(
                    {
                        question: "What do plants need to make food?",
                        options: ["Water only", "Sunlight only", "Water and sunlight", "Soil only"],
                        correct: 2
                    },
                    {
                        question: "Which planet is closest to the Sun?",
                        options: ["Venus", "Mercury", "Earth", "Mars"],
                        correct: 1
                    },
                    {
                        question: "What are the three states of matter?",
                        options: ["Hot, cold, warm", "Big, small, medium", "Solid, liquid, gas", "Red, blue, green"],
                        correct: 2
                    }
                );
            } else if (gradeNum >= 6 && gradeNum <= 8) {
                questions.push(
                    {
                        question: "What is photosynthesis?",
                        options: ["Plants eating soil", "Plants making food from sunlight", "Plants drinking water", "Plants growing taller"],
                        correct: 1
                    },
                    {
                        question: "What is the chemical formula for water?",
                        options: ["H2O", "CO2", "NaCl", "O2"],
                        correct: 0
                    },
                    {
                        question: "Which organ pumps blood through the body?",
                        options: ["Brain", "Lungs", "Heart", "Liver"],
                        correct: 2
                    }
                );
            } else if (gradeNum >= 9 && gradeNum <= 12) {
                questions.push(
                    {
                        question: "What is the powerhouse of the cell?",
                        options: ["Nucleus", "Mitochondria", "Ribosome", "Cytoplasm"],
                        correct: 1
                    },
                    {
                        question: "What is Newton's first law of motion?",
                        options: ["F = ma", "Objects at rest stay at rest", "Action-reaction", "Energy conservation"],
                        correct: 1
                    },
                    {
                        question: "What is the pH of pure water?",
                        options: ["6", "7", "8", "9"],
                        correct: 1
                    }
                );
            }
        }
        
        // English questions by grade
        if (subject === 'english') {
            if (gradeNum >= 3 && gradeNum <= 5) {
                questions.push(
                    {
                        question: "What is a noun?",
                        options: ["An action word", "A describing word", "A person, place, or thing", "A connecting word"],
                        correct: 2
                    },
                    {
                        question: "Which word rhymes with 'cat'?",
                        options: ["dog", "hat", "run", "big"],
                        correct: 1
                    }
                );
            } else if (gradeNum >= 6 && gradeNum <= 8) {
                questions.push(
                    {
                        question: "What is a metaphor?",
                        options: ["A direct comparison", "An indirect comparison", "A rhyming pattern", "A story ending"],
                        correct: 1
                    },
                    {
                        question: "What is the past tense of 'run'?",
                        options: ["runned", "ran", "running", "runs"],
                        correct: 1
                    }
                );
            }
        }
        
        // Add more subjects and questions as needed
        return questions;
    }
    
    generateAdditionalQuestions(grade, subject, difficulty, topic, count) {
        // Generate template-based questions when we need more
        const additionalQuestions = [];
        const gradeNum = parseInt(grade);
        
        for (let i = 0; i < count; i++) {
            if (subject === 'mathematics' && gradeNum >= 3 && gradeNum <= 8) {
                const num1 = Math.floor(Math.random() * 20) + 1;
                const num2 = Math.floor(Math.random() * 20) + 1;
                const operations = ['+', '-', '×'];
                const op = operations[Math.floor(Math.random() * operations.length)];
                
                let answer;
                switch(op) {
                    case '+': answer = num1 + num2; break;
                    case '-': answer = Math.max(num1, num2) - Math.min(num1, num2); break;
                    case '×': answer = num1 * num2; break;
                }
                
                const wrongAnswers = [
                    answer + Math.floor(Math.random() * 5) + 1,
                    answer - Math.floor(Math.random() * 5) - 1,
                    answer + Math.floor(Math.random() * 10) + 5
                ].filter(a => a !== answer && a > 0);
                
                const options = [answer, ...wrongAnswers.slice(0, 3)].sort(() => 0.5 - Math.random());
                const correctIndex = options.indexOf(answer);
                
                additionalQuestions.push({
                    question: `What is ${num1} ${op} ${num2}?`,
                    options: options.map(String),
                    correct: correctIndex
                });
            } else {
                // Generic question for other subjects
                additionalQuestions.push({
                    question: `Sample ${subject} question for Grade ${grade}`,
                    options: ["Option A", "Option B", "Option C", "Option D"],
                    correct: Math.floor(Math.random() * 4)
                });
            }
        }
        
        return additionalQuestions;
    }
    
    saveData() {
        localStorage.setItem('studyBuddyNotes', JSON.stringify(this.notes));
        localStorage.setItem('studyBuddyExams', JSON.stringify(this.exams));
        localStorage.setItem('studyBuddyFlashcards', JSON.stringify(this.flashcards));
        localStorage.setItem('studyBuddyMockExams', JSON.stringify(this.mockExams));
        localStorage.setItem('studyBuddyScore', this.totalScore.toString());
        localStorage.setItem('studyBuddyActivities', JSON.stringify(this.activities));
    }
    
    loadSampleData() {
        // Add sample data if it's the first time
        if (this.flashcards.length === 0 && this.mockExams.length === 0) {
            // Sample flashcards
            this.flashcards.push(
                {
                    id: 1,
                    front: "What is 2 + 2?",
                    back: "4",
                    subject: "Math",
                    created: new Date().toLocaleString()
                },
                {
                    id: 2,
                    front: "What is the capital of France?",
                    back: "Paris",
                    subject: "Geography",
                    created: new Date().toLocaleString()
                },
                {
                    id: 3,
                    front: "What is H2O?",
                    back: "Water",
                    subject: "Science",
                    created: new Date().toLocaleString()
                }
            );
            
            // Sample mock exam
            this.mockExams.push({
                id: 1,
                title: "Basic Math Quiz",
                subject: "Mathematics",
                questions: [
                    {
                        question: "What is 5 + 3?",
                        options: ["6", "7", "8", "9"],
                        correct: 2
                    },
                    {
                        question: "What is 10 - 4?",
                        options: ["5", "6", "7", "8"],
                        correct: 1
                    },
                    {
                        question: "What is 3 × 4?",
                        options: ["10", "11", "12", "13"],
                        correct: 2
                    },
                    {
                        question: "What is 15 ÷ 3?",
                        options: ["4", "5", "6", "7"],
                        correct: 1
                    }
                ],
                created: new Date().toLocaleString()
            });
            
            this.saveData();
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Authentication Methods
    showAuthModal(mode) {
        this.isSignupMode = mode === 'signup';
        const modal = document.getElementById('authModal');
        const title = document.getElementById('authTitle');
        const submitBtn = document.getElementById('authSubmitBtn');
        const switchBtn = document.getElementById('switchAuthMode');
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        const emailGroup = document.querySelector('#email').parentElement;
        const gradeGroup = document.getElementById('gradeGroup');
        
        // Clear any previous form state
        this.clearAuthForm();
        
        if (this.isSignupMode) {
            // Signup mode - show all fields
            title.textContent = 'Sign Up for StudyBuddy';
            submitBtn.textContent = 'Sign Up';
            switchBtn.textContent = 'Already have an account? Sign In';
            confirmPasswordGroup.style.display = 'block';
            emailGroup.style.display = 'block';
            gradeGroup.style.display = 'block';
            
            // Set required fields for signup
            document.getElementById('username').required = true;
            document.getElementById('email').required = true;
            document.getElementById('studentGrade').required = true;
            document.getElementById('password').required = true;
            document.getElementById('confirmPassword').required = true;
        } else {
            // Login mode - hide email and grade fields
            title.textContent = 'Sign In to StudyBuddy';
            submitBtn.textContent = 'Sign In';
            switchBtn.textContent = 'Need an account? Sign Up';
            confirmPasswordGroup.style.display = 'none';
            emailGroup.style.display = 'none';
            gradeGroup.style.display = 'none';
            
            // Set required fields for login (only username and password)
            document.getElementById('username').required = true;
            document.getElementById('email').required = false;
            document.getElementById('studentGrade').required = false;
            document.getElementById('password').required = true;
            document.getElementById('confirmPassword').required = false;
        }
        
        modal.style.display = 'flex';
        // Focus on the first visible input field
        setTimeout(() => {
            document.getElementById('username').focus();
        }, 100);
    }
    
    hideAuthModal() {
        document.getElementById('authModal').style.display = 'none';
        this.clearAuthForm();
    }
    
    switchAuthMode() {
        this.showAuthModal(this.isSignupMode ? 'login' : 'signup');
    }
    
    clearAuthForm() {
        // Reset form values
        document.getElementById('authForm').reset();
        
        // Reset field visibility to default (all visible)
        const emailGroup = document.querySelector('#email').parentElement;
        const gradeGroup = document.getElementById('gradeGroup');
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        
        emailGroup.style.display = 'block';
        gradeGroup.style.display = 'block';
        confirmPasswordGroup.style.display = 'none';
        
        // Reset all field requirements to default
        document.getElementById('username').required = true;
        document.getElementById('email').required = true;
        document.getElementById('studentGrade').required = true;
        document.getElementById('password').required = true;
        document.getElementById('confirmPassword').required = false;
        
        // Clear any error messages
        const errorElements = document.querySelectorAll('.auth-error');
        errorElements.forEach(error => error.remove());
    }
    
    async handleAuth(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const grade = document.getElementById('studentGrade').value;
        
        if (!username || !email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (this.isSignupMode && !grade) {
            this.showNotification('Please select your grade level', 'error');
            return;
        }
        
        if (this.isSignupMode) {
            if (password !== confirmPassword) {
                this.showNotification('Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                this.showNotification('Password must be at least 6 characters', 'error');
                return;
            }
            
            await this.signup(username, email, password, grade);
        } else {
            await this.login(username, email, password);
        }
    }
    
    async signup(username, email, password, grade) {
        try {
            // Simulate API call - in a real app, this would be a server request
            this.setSyncStatus('syncing');
            
            // Check if user already exists (simulate)
            const existingUsers = JSON.parse(localStorage.getItem('studyBuddyUsers')) || [];
            if (existingUsers.find(u => u.username === username || u.email === email)) {
                this.showNotification('Username or email already exists', 'error');
                this.setSyncStatus('error');
                return;
            }
            
            // Create new user
            const newUser = {
                id: Date.now(),
                username,
                email,
                password: this.hashPassword(password), // In real app, hash on server
                grade: parseInt(grade),
                createdAt: new Date().toISOString(),
                totalScore: 0,
                level: 1
            };
            
            existingUsers.push(newUser);
            localStorage.setItem('studyBuddyUsers', JSON.stringify(existingUsers));
            
            // Auto-login after signup
            this.currentUser = { ...newUser };
            delete this.currentUser.password;
            localStorage.setItem('studyBuddyUser', JSON.stringify(this.currentUser));
            
            this.hideAuthModal();
            this.updateUserInterface();
            this.setSyncStatus('synced');
            this.showNotification(`Welcome to StudyBuddy, ${username}! 🎉`, 'success');
            this.addActivity('Created StudyBuddy account', 'user-plus');
            
        } catch (error) {
            this.showNotification('Signup failed. Please try again.', 'error');
            this.setSyncStatus('error');
        }
    }
    
    async login(username, email, password) {
        try {
            this.setSyncStatus('syncing');
            
            // Simulate API call
            const existingUsers = JSON.parse(localStorage.getItem('studyBuddyUsers')) || [];
            const user = existingUsers.find(u => 
                (u.username === username || u.email === email) && 
                u.password === this.hashPassword(password)
            );
            
            if (!user) {
                this.showNotification('Invalid username/email or password', 'error');
                this.setSyncStatus('error');
                return;
            }
            
            // Login successful
            this.currentUser = { ...user };
            delete this.currentUser.password;
            localStorage.setItem('studyBuddyUser', JSON.stringify(this.currentUser));
            
            // Load user's data
            await this.loadUserData();
            
            this.hideAuthModal();
            this.updateUserInterface();
            this.setSyncStatus('synced');
            this.showNotification(`Welcome back, ${user.username}! 🎉`, 'success');
            this.addActivity('Signed in to StudyBuddy', 'sign-in-alt');
            
        } catch (error) {
            this.showNotification('Login failed. Please try again.', 'error');
            this.setSyncStatus('error');
        }
    }
    
    logout() {
        if (confirm('Are you sure you want to logout? Your progress will be saved.')) {
            // Save current data before logout
            this.saveUserData();
            
            this.currentUser = null;
            localStorage.removeItem('studyBuddyUser');
            
            // Clear local data
            this.notes = [];
            this.exams = [];
            this.flashcards = [];
            this.mockExams = [];
            this.totalScore = 0;
            this.activities = [];
            
            // Load sample data for guest user
            this.loadSampleData();
            
            this.updateUserInterface();
            this.updateDashboard();
            this.setSyncStatus('offline');
            this.showNotification('Logged out successfully', 'info');
        }
    }
    
    updateUserInterface() {
        const welcomeText = document.getElementById('welcomeText');
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (this.currentUser) {
            welcomeText.innerHTML = `
                <div class="user-profile">
                    <div class="user-avatar">${this.currentUser.username.charAt(0).toUpperCase()}</div>
                    <span>Welcome, ${this.currentUser.username}!</span>
                </div>
                <div class="sync-status ${this.syncStatus}">
                    <i class="fas fa-${this.getSyncIcon()}"></i>
                    <span>${this.getSyncText()}</span>
                </div>
            `;
            loginBtn.style.display = 'none';
            signupBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-flex';
        } else {
            welcomeText.textContent = 'Welcome, Student!';
            loginBtn.style.display = 'inline-flex';
            signupBtn.style.display = 'inline-flex';
            logoutBtn.style.display = 'none';
        }
    }
    
    getSyncIcon() {
        switch (this.syncStatus) {
            case 'syncing': return 'sync fa-spin';
            case 'synced': return 'check-circle';
            case 'error': return 'exclamation-triangle';
            default: return 'wifi-slash';
        }
    }
    
    getSyncText() {
        switch (this.syncStatus) {
            case 'syncing': return 'Syncing...';
            case 'synced': return 'Synced';
            case 'error': return 'Sync Error';
            default: return 'Offline';
        }
    }
    
    hashPassword(password) {
        // Simple hash for demo - use proper hashing in production
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            // In a real app, this would fetch from server
            const userDataKey = `studyBuddyData_${this.currentUser.id}`;
            const userData = JSON.parse(localStorage.getItem(userDataKey));
            
            if (userData) {
                this.notes = userData.notes || [];
                this.exams = userData.exams || [];
                this.flashcards = userData.flashcards || [];
                this.mockExams = userData.mockExams || [];
                this.totalScore = userData.totalScore || 0;
                this.activities = userData.activities || [];
            } else {
                // First time login, load sample data
                this.loadSampleData();
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
            this.loadSampleData();
        }
    }
    
    async saveUserData() {
        if (!this.currentUser) return;
        
        try {
            const userDataKey = `studyBuddyData_${this.currentUser.id}`;
            const userData = {
                notes: this.notes,
                exams: this.exams,
                flashcards: this.flashcards,
                mockExams: this.mockExams,
                totalScore: this.totalScore,
                activities: this.activities,
                lastSync: new Date().toISOString()
            };
            
            localStorage.setItem(userDataKey, JSON.stringify(userData));
            
            // Update user's total score in user record
            const existingUsers = JSON.parse(localStorage.getItem('studyBuddyUsers')) || [];
            const userIndex = existingUsers.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                existingUsers[userIndex].totalScore = this.totalScore;
                localStorage.setItem('studyBuddyUsers', JSON.stringify(existingUsers));
            }
            
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }
    
    // AI-Powered Smart Flashcard Generation Methods
    async initializeOCR() {
        if (!this.ocrWorker) {
            try {
                this.ocrWorker = await Tesseract.createWorker('eng');
                console.log('OCR worker initialized successfully');
            } catch (error) {
                console.error('Failed to initialize OCR:', error);
                this.showNotification('OCR initialization failed. Smart features may not work.', 'error');
            }
        }
    }
    
    async generateFlashcardsFromNotes() {
        if (this.notes.length === 0) {
            this.showNotification('No notes available. Capture some notes first!', 'warning');
            return;
        }
        
        if (this.isProcessingAI) {
            this.showNotification('AI is already processing. Please wait...', 'warning');
            return;
        }
        
        this.isProcessingAI = true;
        this.showAIStatus('Initializing AI processing...', 0);
        
        try {
            // Initialize OCR if not already done
            await this.initializeOCR();
            
            const allExtractedText = [];
            const totalNotes = this.notes.length;
            
            // Process each note with OCR
            for (let i = 0; i < this.notes.length; i++) {
                const note = this.notes[i];
                const progress = ((i + 1) / totalNotes) * 50; // First 50% for OCR
                
                this.showAIStatus(`Extracting text from note ${i + 1} of ${totalNotes}...`, progress);
                
                // Check if we already have OCR results for this note
                if (!this.extractedTexts.has(note.id)) {
                    const extractedText = await this.extractTextFromImage(note.imageData);
                    this.extractedTexts.set(note.id, extractedText);
                }
                
                const text = this.extractedTexts.get(note.id);
                if (text && text.trim()) {
                    allExtractedText.push(text);
                }
            }
            
            if (allExtractedText.length === 0) {
                this.showNotification('No readable text found in your notes. Try capturing clearer images.', 'warning');
                this.hideAIStatus();
                this.isProcessingAI = false;
                return;
            }
            
            // Generate flashcards from extracted text
            this.showAIStatus('Generating smart flashcards...', 75);
            const combinedText = allExtractedText.join('\n\n');
            this.generatedFlashcards = await this.generateFlashcardsFromText(combinedText);
            
            this.showAIStatus('Complete!', 100);
            this.displayGeneratedFlashcards();
            this.hideAIStatus();
            
            this.showNotification(`Successfully generated ${this.generatedFlashcards.length} flashcards! 🎉`, 'success');
            this.addActivity(`Generated ${this.generatedFlashcards.length} AI flashcards`, 'brain');
            
        } catch (error) {
            console.error('Error generating flashcards:', error);
            this.showNotification('Failed to generate flashcards. Please try again.', 'error');
            this.hideAIStatus();
        } finally {
            this.isProcessingAI = false;
        }
    }
    
    async extractTextFromImage(imageData) {
        try {
            const { data: { text } } = await this.ocrWorker.recognize(imageData);
            return text.trim();
        } catch (error) {
            console.error('OCR extraction failed:', error);
            return '';
        }
    }
    
    async generateFlashcardsFromText(text) {
        // AI-powered text processing to create meaningful flashcards
        const flashcards = [];
        
        // Split text into sentences and paragraphs
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
        
        // Generate different types of flashcards
        
        // 1. Definition-based flashcards (look for "is", "are", "means", etc.)
        for (const sentence of sentences) {
            const definitionMatch = sentence.match(/(.+?)\s+(is|are|means|refers to|defined as)\s+(.+)/i);
            if (definitionMatch) {
                const term = definitionMatch[1].trim();
                const definition = definitionMatch[3].trim();
                if (term.length > 2 && definition.length > 5) {
                    flashcards.push({
                        question: `What ${definitionMatch[2].toLowerCase()} ${term}?`,
                        answer: definition,
                        type: 'definition'
                    });
                }
            }
        }
        
        // 2. Key concept flashcards (extract important terms)
        const keyTerms = this.extractKeyTerms(text);
        for (const term of keyTerms.slice(0, 5)) { // Limit to 5 key terms
            const context = this.findContextForTerm(text, term);
            if (context) {
                flashcards.push({
                    question: `Explain: ${term}`,
                    answer: context,
                    type: 'concept'
                });
            }
        }
        
        // 3. Question-answer pairs (look for existing questions)
        const questionMatches = text.match(/([^.!?]*\?[^.!?]*[.!?])/g);
        if (questionMatches) {
            for (const match of questionMatches.slice(0, 3)) {
                const parts = match.split('?');
                if (parts.length >= 2) {
                    const question = parts[0].trim() + '?';
                    const answer = parts[1].replace(/[.!?]/g, '').trim();
                    if (answer.length > 3) {
                        flashcards.push({
                            question: question,
                            answer: answer,
                            type: 'qa'
                        });
                    }
                }
            }
        }
        
        // 4. Fill-in-the-blank flashcards
        for (const sentence of sentences.slice(0, 3)) {
            const words = sentence.trim().split(/\s+/);
            if (words.length >= 5 && words.length <= 15) {
                // Replace a key word with a blank
                const keyWordIndex = Math.floor(words.length / 2);
                const keyWord = words[keyWordIndex];
                if (keyWord.length > 3 && !/^(the|and|or|but|in|on|at|to|for|of|with|by)$/i.test(keyWord)) {
                    const questionSentence = [...words];
                    questionSentence[keyWordIndex] = '______';
                    flashcards.push({
                        question: `Fill in the blank: ${questionSentence.join(' ')}`,
                        answer: keyWord,
                        type: 'fill-blank'
                    });
                }
            }
        }
        
        // 5. Summary flashcards for longer paragraphs
        for (const paragraph of paragraphs.slice(0, 2)) {
            if (paragraph.length > 100) {
                const summary = this.generateSummary(paragraph);
                flashcards.push({
                    question: 'Summarize the following concept:',
                    answer: summary,
                    type: 'summary'
                });
            }
        }
        
        // Remove duplicates and limit total flashcards
        const uniqueFlashcards = flashcards.filter((card, index, self) => 
            index === self.findIndex(c => c.question === card.question)
        );
        
        return uniqueFlashcards.slice(0, 10); // Limit to 10 flashcards
    }
    
    extractKeyTerms(text) {
        // Simple key term extraction based on capitalization and frequency
        const words = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
        const wordCount = {};
        
        words.forEach(word => {
            const cleaned = word.trim();
            if (cleaned.length > 3 && !/^(The|And|Or|But|In|On|At|To|For|Of|With|By|This|That|These|Those)$/.test(cleaned)) {
                wordCount[cleaned] = (wordCount[cleaned] || 0) + 1;
            }
        });
        
        return Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .map(([word]) => word);
    }
    
    findContextForTerm(text, term) {
        const sentences = text.split(/[.!?]+/);
        for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(term.toLowerCase())) {
                return sentence.trim();
            }
        }
        return null;
    }
    
    generateSummary(text) {
        // Simple extractive summarization - take first and last sentences
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        if (sentences.length <= 2) {
            return text.trim();
        }
        return `${sentences[0].trim()}. ${sentences[sentences.length - 1].trim()}.`;
    }
    
    displayGeneratedFlashcards() {
        const container = document.getElementById('generatedFlashcards');
        const resultsDiv = document.getElementById('aiResults');
        
        container.innerHTML = '';
        
        this.generatedFlashcards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'generated-flashcard';
            cardElement.innerHTML = `
                <div class="question">Q: ${card.question}</div>
                <div class="answer">A: ${card.answer}</div>
                <div class="card-type" style="font-size: 0.8em; color: #888; margin-top: 0.5rem;">
                    Type: ${card.type} | Card ${index + 1}
                </div>
            `;
            container.appendChild(cardElement);
        });
        
        resultsDiv.style.display = 'block';
    }
    
    addGeneratedFlashcards() {
        if (this.generatedFlashcards.length === 0) {
            this.showNotification('No flashcards to add', 'warning');
            return;
        }
        
        let addedCount = 0;
        this.generatedFlashcards.forEach(card => {
            // Check for duplicates
            const isDuplicate = this.flashcards.some(existing => 
                existing.question.toLowerCase() === card.question.toLowerCase()
            );
            
            if (!isDuplicate) {
                this.flashcards.push({
                    id: Date.now() + Math.random(),
                    question: card.question,
                    answer: card.answer,
                    createdAt: new Date().toISOString(),
                    aiGenerated: true,
                    type: card.type
                });
                addedCount++;
            }
        });
        
        this.saveData();
        this.updateFlashcardsList();
        this.addScore(addedCount * 15); // 15 points per AI-generated flashcard
        this.addActivity(`Added ${addedCount} AI-generated flashcards`, 'plus');
        
        this.showNotification(`Added ${addedCount} new flashcards to your collection! 🎉`, 'success');
        this.clearGeneratedFlashcards();
    }
    
    clearGeneratedFlashcards() {
        this.generatedFlashcards = [];
        document.getElementById('aiResults').style.display = 'none';
        document.getElementById('generatedFlashcards').innerHTML = '';
    }
    
    showAIStatus(message, progress = 0) {
        const statusDiv = document.getElementById('aiStatus');
        const statusText = document.getElementById('aiStatusText');
        
        statusText.textContent = message;
        statusDiv.style.display = 'flex';
        
        // Update progress bar if it exists
        let progressBar = statusDiv.querySelector('.ai-progress-bar');
        if (!progressBar) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'ai-progress';
            progressBar = document.createElement('div');
            progressBar.className = 'ai-progress-bar';
            progressContainer.appendChild(progressBar);
            statusDiv.appendChild(progressContainer);
        }
        
        progressBar.style.width = `${progress}%`;
    }
    
    hideAIStatus() {
        setTimeout(() => {
            document.getElementById('aiStatus').style.display = 'none';
        }, 1000);
    }
    
    updateNotesDisplay() {
        const notesGrid = document.getElementById('notesGrid');
        const generateBtn = document.getElementById('generateFlashcardsBtn');
        
        if (this.notes.length === 0) {
            notesGrid.innerHTML = '<p class="empty-state">No notes captured yet. Start by taking a photo! 📸</p>';
            generateBtn.disabled = true;
        } else {
            generateBtn.disabled = false;
            notesGrid.innerHTML = '';
            
            this.notes.forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.className = 'note-item';
                noteElement.innerHTML = `
                    <img src="${note.imageData}" alt="Note ${note.id}" onclick="this.classList.toggle('expanded')">
                    <div class="note-info">
                        <small>${new Date(note.timestamp).toLocaleString()}</small>
                        <button class="btn btn-sm btn-danger" onclick="studyBuddy.deleteNote('${note.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                notesGrid.appendChild(noteElement);
            });
        }
    }
    
    // AI Study Assistant Methods
    async getPersonalizedStudyAdvice() {
        this.showAIStatus('Analyzing your study patterns...', 25);
        
        try {
            const studyData = this.analyzeUserStudyData();
            const advice = this.generatePersonalizedAdvice(studyData);
            
            this.showAIStatus('Generating personalized recommendations...', 75);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
            
            this.displayStudyAdvice(advice);
            this.showAIStatus('Complete!', 100);
            this.hideAIStatus();
            
            this.showNotification('AI Study Assistant has new recommendations for you! 🤖', 'success');
            this.addActivity('Received AI study advice', 'robot');
            
        } catch (error) {
            console.error('Error generating study advice:', error);
            this.showNotification('Failed to generate study advice. Please try again.', 'error');
            this.hideAIStatus();
        }
    }
    
    async analyzeStudyProgress() {
        this.showAIStatus('Analyzing your learning progress...', 30);
        
        try {
            const progressData = this.calculateProgressMetrics();
            const insights = this.generateProgressInsights(progressData);
            
            this.showAIStatus('Generating progress insights...', 70);
            await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate analysis
            
            this.displayProgressAnalysis(progressData, insights);
            this.showAIStatus('Analysis complete!', 100);
            this.hideAIStatus();
            
            this.showNotification('Your progress analysis is ready! 📊', 'success');
            this.addActivity('Analyzed study progress with AI', 'chart-line');
            
        } catch (error) {
            console.error('Error analyzing progress:', error);
            this.showNotification('Failed to analyze progress. Please try again.', 'error');
            this.hideAIStatus();
        }
    }
    
    analyzeUserStudyData() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Analyze recent activities
        const recentActivities = this.activities.filter(activity => 
            new Date(activity.timestamp) >= oneWeekAgo
        );
        
        // Calculate study patterns
        const studyFrequency = recentActivities.length;
        const flashcardSessions = recentActivities.filter(a => a.type.includes('flashcard')).length;
        const examsTaken = recentActivities.filter(a => a.type.includes('exam')).length;
        const notesCaptured = recentActivities.filter(a => a.type.includes('note')).length;
        
        // Analyze performance
        const examScores = this.mockExams.map(exam => exam.score || 0);
        const averageScore = examScores.length > 0 ? 
            examScores.reduce((sum, score) => sum + score, 0) / examScores.length : 0;
        
        // Time analysis
        const studyTimes = recentActivities.map(a => new Date(a.timestamp).getHours());
        const preferredStudyTime = this.getMostFrequentHour(studyTimes);
        
        // Streak calculation
        const studyStreak = this.calculateStudyStreak();
        
        return {
            studyFrequency,
            flashcardSessions,
            examsTaken,
            notesCaptured,
            averageScore,
            preferredStudyTime,
            studyStreak,
            totalScore: this.totalScore,
            totalFlashcards: this.flashcards.length,
            totalNotes: this.notes.length,
            totalExams: this.mockExams.length
        };
    }
    
    generatePersonalizedAdvice(studyData) {
        const advice = [];
        
        // Study frequency advice
        if (studyData.studyFrequency < 3) {
            advice.push({
                type: 'frequency',
                title: 'Increase Study Frequency',
                message: 'Try to study more regularly! Aim for at least 3-4 study sessions per week for better retention.',
                priority: 'high',
                icon: 'calendar-alt'
            });
        } else if (studyData.studyFrequency > 10) {
            advice.push({
                type: 'balance',
                title: 'Balance Your Studies',
                message: 'Great dedication! Remember to take breaks to avoid burnout and improve long-term retention.',
                priority: 'medium',
                icon: 'balance-scale'
            });
        }
        
        // Flashcard usage advice
        if (studyData.flashcardSessions < 2 && studyData.totalFlashcards > 0) {
            advice.push({
                type: 'flashcards',
                title: 'Use Your Flashcards More',
                message: `You have ${studyData.totalFlashcards} flashcards but haven't used them much. Regular flashcard review improves memory retention by 40%!`,
                priority: 'high',
                icon: 'layer-group'
            });
        }
        
        // Exam performance advice
        if (studyData.averageScore < 70 && studyData.examsTaken > 0) {
            advice.push({
                type: 'performance',
                title: 'Focus on Weak Areas',
                message: `Your average exam score is ${studyData.averageScore.toFixed(1)}%. Review incorrect answers and create more flashcards for challenging topics.`,
                priority: 'high',
                icon: 'bullseye'
            });
        } else if (studyData.averageScore > 85) {
            advice.push({
                type: 'excellence',
                title: 'Excellent Performance!',
                message: `Outstanding! Your average score is ${studyData.averageScore.toFixed(1)}%. Consider helping others or tackling more advanced topics.`,
                priority: 'low',
                icon: 'trophy'
            });
        }
        
        // Note-taking advice
        if (studyData.notesCaptured === 0) {
            advice.push({
                type: 'notes',
                title: 'Start Capturing Notes',
                message: 'Use the camera feature to capture important information from textbooks, whiteboards, or handwritten notes!',
                priority: 'medium',
                icon: 'camera'
            });
        }
        
        // Study time optimization
        if (studyData.preferredStudyTime) {
            const timeString = this.formatStudyTime(studyData.preferredStudyTime);
            advice.push({
                type: 'timing',
                title: 'Optimal Study Time',
                message: `You seem most active around ${timeString}. Try to schedule your most challenging study sessions during this time!`,
                priority: 'low',
                icon: 'clock'
            });
        }
        
        // Streak motivation
        if (studyData.studyStreak > 0) {
            advice.push({
                type: 'streak',
                title: 'Keep Your Streak!',
                message: `Amazing! You have a ${studyData.studyStreak}-day study streak. Don't break the chain!`,
                priority: 'low',
                icon: 'fire'
            });
        }
        
        // General motivation
        if (advice.length === 0) {
            advice.push({
                type: 'motivation',
                title: 'You\'re Doing Great!',
                message: 'Your study habits look good! Keep up the consistent effort and consider setting new learning goals.',
                priority: 'low',
                icon: 'heart'
            });
        }
        
        return advice.slice(0, 4); // Limit to 4 pieces of advice
    }
    
    calculateProgressMetrics() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Weekly metrics
        const weeklyActivities = this.activities.filter(a => new Date(a.timestamp) >= oneWeekAgo);
        const weeklyScore = weeklyActivities.reduce((sum, a) => sum + (a.points || 0), 0);
        
        // Monthly metrics
        const monthlyActivities = this.activities.filter(a => new Date(a.timestamp) >= oneMonthAgo);
        
        // Performance trends
        const recentExams = this.mockExams.filter(exam => 
            new Date(exam.completedAt) >= oneWeekAgo
        ).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
        
        const performanceTrend = this.calculatePerformanceTrend(recentExams);
        
        return {
            totalScore: this.totalScore,
            weeklyScore,
            weeklyActivities: weeklyActivities.length,
            monthlyActivities: monthlyActivities.length,
            totalFlashcards: this.flashcards.length,
            totalNotes: this.notes.length,
            totalExams: this.mockExams.length,
            averageExamScore: this.calculateAverageExamScore(),
            studyStreak: this.calculateStudyStreak(),
            performanceTrend,
            mostActiveDay: this.getMostActiveDay(),
            studyConsistency: this.calculateStudyConsistency()
        };
    }
    
    generateProgressInsights(data) {
        const insights = [];
        
        // Score insights
        if (data.weeklyScore > 100) {
            insights.push('🔥 You\'ve been very active this week with ' + data.weeklyScore + ' points!');
        }
        
        // Performance trend insights
        if (data.performanceTrend === 'improving') {
            insights.push('📈 Your exam scores are improving - keep up the great work!');
        } else if (data.performanceTrend === 'declining') {
            insights.push('📉 Your recent scores show room for improvement. Consider reviewing challenging topics.');
        }
        
        // Consistency insights
        if (data.studyConsistency > 0.7) {
            insights.push('⭐ Excellent study consistency! Regular practice leads to better retention.');
        } else if (data.studyConsistency < 0.3) {
            insights.push('📅 Try to study more regularly. Consistent daily practice is more effective than cramming.');
        }
        
        // Activity insights
        if (data.totalFlashcards > 20) {
            insights.push('🎯 You have a great collection of flashcards! Regular review will boost your memory.');
        }
        
        if (data.studyStreak > 5) {
            insights.push(`🏆 Impressive ${data.studyStreak}-day study streak! You\'re building excellent habits.`);
        }
        
        return insights;
    }
    
    displayStudyAdvice(advice) {
        const container = document.getElementById('recommendationsList');
        container.innerHTML = '';
        
        advice.forEach(item => {
            const adviceElement = document.createElement('div');
            adviceElement.className = 'recommendation-item';
            adviceElement.innerHTML = `
                <i class="fas fa-${item.icon}"></i>
                <div class="recommendation-content">
                    <div class="recommendation-title">${item.title}</div>
                    <div class="recommendation-text">${item.message}</div>
                    <span class="recommendation-priority priority-${item.priority}">${item.priority.toUpperCase()}</span>
                </div>
            `;
            container.appendChild(adviceElement);
        });
        
        // Update the main study tip
        const studyTip = document.getElementById('studyTip');
        if (advice.length > 0) {
            studyTip.textContent = advice[0].message;
        }
    }
    
    displayProgressAnalysis(data, insights) {
        const container = document.getElementById('aiRecommendations');
        
        // Create progress analysis section
        let analysisHTML = `
            <div class="progress-analysis">
                <h4><i class="fas fa-chart-bar"></i> Your Progress Analysis</h4>
                
                <div class="progress-metric">
                    <span class="metric-label">Total Score</span>
                    <span class="metric-value">${data.totalScore} points</span>
                </div>
                
                <div class="progress-metric">
                    <span class="metric-label">This Week's Activity</span>
                    <span class="metric-value">${data.weeklyActivities} actions</span>
                </div>
                
                <div class="progress-metric">
                    <span class="metric-label">Average Exam Score</span>
                    <span class="metric-value">${data.averageExamScore.toFixed(1)}%</span>
                </div>
                
                <div class="progress-metric">
                    <span class="metric-label">Study Materials</span>
                    <span class="metric-value">${data.totalFlashcards} cards, ${data.totalNotes} notes</span>
                </div>
        `;
        
        if (data.studyStreak > 0) {
            analysisHTML += `
                <div class="study-streak">
                    <i class="fas fa-fire"></i>
                    <span class="streak-text">${data.studyStreak} Day Study Streak!</span>
                </div>
            `;
        }
        
        analysisHTML += '</div>';
        
        // Add insights
        if (insights.length > 0) {
            analysisHTML += '<div style="margin-top: 1rem;"><h4><i class="fas fa-lightbulb"></i> Key Insights</h4>';
            insights.forEach(insight => {
                analysisHTML += `<div style="margin: 0.5rem 0; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 5px;">${insight}</div>`;
            });
            analysisHTML += '</div>';
        }
        
        container.innerHTML = analysisHTML;
    }
    
    // Helper methods for AI Study Assistant
    getMostFrequentHour(hours) {
        if (hours.length === 0) return null;
        
        const hourCount = {};
        hours.forEach(hour => {
            hourCount[hour] = (hourCount[hour] || 0) + 1;
        });
        
        return parseInt(Object.keys(hourCount).reduce((a, b) => 
            hourCount[a] > hourCount[b] ? a : b
        ));
    }
    
    formatStudyTime(hour) {
        if (hour < 12) return `${hour}:00 AM`;
        if (hour === 12) return '12:00 PM';
        return `${hour - 12}:00 PM`;
    }
    
    calculateStudyStreak() {
        if (this.activities.length === 0) return 0;
        
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        // Check each day going backwards
        for (let i = 0; i < 30; i++) { // Check up to 30 days
            const dayStart = new Date(currentDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(currentDate);
            dayEnd.setHours(23, 59, 59, 999);
            
            const hasActivity = this.activities.some(activity => {
                const activityDate = new Date(activity.timestamp);
                return activityDate >= dayStart && activityDate <= dayEnd;
            });
            
            if (hasActivity) {
                streak++;
            } else if (i > 0) { // Don't break on first day (today) if no activity yet
                break;
            }
            
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return streak;
    }
    
    calculateAverageExamScore() {
        if (this.mockExams.length === 0) return 0;
        const scores = this.mockExams.map(exam => exam.score || 0);
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    
    calculatePerformanceTrend(recentExams) {
        if (recentExams.length < 2) return 'stable';
        
        const firstHalf = recentExams.slice(0, Math.floor(recentExams.length / 2));
        const secondHalf = recentExams.slice(Math.floor(recentExams.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, exam) => sum + (exam.score || 0), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, exam) => sum + (exam.score || 0), 0) / secondHalf.length;
        
        if (secondAvg > firstAvg + 5) return 'improving';
        if (secondAvg < firstAvg - 5) return 'declining';
        return 'stable';
    }
    
    getMostActiveDay() {
        const dayCount = {};
        this.activities.forEach(activity => {
            const day = new Date(activity.timestamp).getDay();
            dayCount[day] = (dayCount[day] || 0) + 1;
        });
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const mostActiveDay = Object.keys(dayCount).reduce((a, b) => 
            dayCount[a] > dayCount[b] ? a : b
        );
        
        return days[mostActiveDay] || 'No data';
    }
    
    calculateStudyConsistency() {
        if (this.activities.length === 0) return 0;
        
        const last7Days = [];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const hasActivity = this.activities.some(activity => {
                const activityDate = new Date(activity.timestamp);
                activityDate.setHours(0, 0, 0, 0);
                return activityDate.getTime() === date.getTime();
            });
            
            last7Days.push(hasActivity ? 1 : 0);
        }
        
        return last7Days.reduce((sum, day) => sum + day, 0) / 7;
    }
    
    // AI Intelligent Mock Exam Feedback Methods
    async generateIntelligentExamFeedback() {
        const currentExam = this.currentExam;
        if (!currentExam || !currentExam.userAnswers) {
            this.showNotification('No exam data available for analysis', 'error');
            return;
        }
        
        this.showAIStatus('Analyzing your exam performance...', 20);
        
        try {
            // Analyze exam performance
            const examAnalysis = this.analyzeExamPerformance(currentExam);
            
            this.showAIStatus('Generating personalized feedback...', 50);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate improvement suggestions
            const suggestions = this.generateImprovementSuggestions(examAnalysis);
            
            this.showAIStatus('Creating detailed question analysis...', 80);
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Generate detailed question feedback
            const questionFeedback = this.generateQuestionFeedback(currentExam, examAnalysis);
            
            this.showAIStatus('Complete!', 100);
            
            // Display all feedback
            this.displayExamFeedback(examAnalysis, suggestions, questionFeedback);
            this.hideAIStatus();
            
            // Show study plan button
            document.getElementById('createStudyPlanBtn').style.display = 'inline-flex';
            
            this.showNotification('AI exam feedback generated! 🤖📊', 'success');
            this.addActivity('Generated AI exam feedback', 'brain');
            
        } catch (error) {
            console.error('Error generating exam feedback:', error);
            this.showNotification('Failed to generate exam feedback. Please try again.', 'error');
            this.hideAIStatus();
        }
    }
    
    analyzeExamPerformance(exam) {
        const questions = exam.questions;
        const userAnswers = exam.userAnswers;
        const score = exam.score || 0;
        
        let correctCount = 0;
        let incorrectQuestions = [];
        let topicPerformance = {};
        let difficultyPerformance = { easy: 0, medium: 0, hard: 0 };
        let totalByDifficulty = { easy: 0, medium: 0, hard: 0 };
        
        questions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correct;
            const difficulty = this.estimateQuestionDifficulty(question);
            const topic = this.extractQuestionTopic(question.question);
            
            if (isCorrect) {
                correctCount++;
                difficultyPerformance[difficulty]++;
            } else {
                incorrectQuestions.push({
                    index,
                    question: question.question,
                    userAnswer: question.options[userAnswer],
                    correctAnswer: question.options[question.correct],
                    difficulty,
                    topic
                });
            }
            
            totalByDifficulty[difficulty]++;
            
            // Track topic performance
            if (!topicPerformance[topic]) {
                topicPerformance[topic] = { correct: 0, total: 0 };
            }
            topicPerformance[topic].total++;
            if (isCorrect) {
                topicPerformance[topic].correct++;
            }
        });
        
        // Calculate difficulty percentages
        const difficultyScores = {
            easy: totalByDifficulty.easy > 0 ? (difficultyPerformance.easy / totalByDifficulty.easy) * 100 : 0,
            medium: totalByDifficulty.medium > 0 ? (difficultyPerformance.medium / totalByDifficulty.medium) * 100 : 0,
            hard: totalByDifficulty.hard > 0 ? (difficultyPerformance.hard / totalByDifficulty.hard) * 100 : 0
        };
        
        // Identify weakest topics
        const weakTopics = Object.entries(topicPerformance)
            .filter(([topic, perf]) => perf.total > 0)
            .map(([topic, perf]) => ({
                topic,
                percentage: (perf.correct / perf.total) * 100,
                correct: perf.correct,
                total: perf.total
            }))
            .sort((a, b) => a.percentage - b.percentage)
            .slice(0, 3);
        
        return {
            score,
            correctCount,
            totalQuestions: questions.length,
            incorrectQuestions,
            difficultyScores,
            topicPerformance,
            weakTopics,
            overallGrade: this.calculateGrade(score),
            timeSpent: exam.timeSpent || 0,
            completionDate: exam.completedAt
        };
    }
    
    generateImprovementSuggestions(analysis) {
        const suggestions = [];
        
        // Score-based suggestions
        if (analysis.score < 60) {
            suggestions.push({
                title: 'Foundation Review Needed',
                text: 'Your score indicates fundamental concepts need reinforcement. Focus on reviewing basic principles before attempting practice questions.',
                priority: 'high',
                icon: 'book-open'
            });
        } else if (analysis.score < 80) {
            suggestions.push({
                title: 'Good Progress, Room for Improvement',
                text: 'You\'re on the right track! Focus on your weak areas and practice more challenging questions to reach excellence.',
                priority: 'medium',
                icon: 'chart-line'
            });
        } else {
            suggestions.push({
                title: 'Excellent Performance!',
                text: 'Outstanding work! Consider helping others or tackling more advanced topics to continue your learning journey.',
                priority: 'low',
                icon: 'trophy'
            });
        }
        
        // Difficulty-based suggestions
        if (analysis.difficultyScores.easy < 80) {
            suggestions.push({
                title: 'Master the Basics First',
                text: 'Focus on fundamental concepts. Easy questions should be your strength before moving to harder topics.',
                priority: 'high',
                icon: 'layer-group'
            });
        }
        
        if (analysis.difficultyScores.hard > analysis.difficultyScores.medium) {
            suggestions.push({
                title: 'Strengthen Medium-Level Understanding',
                text: 'You handle complex problems well but struggle with medium-level questions. Review intermediate concepts.',
                priority: 'medium',
                icon: 'balance-scale'
            });
        }
        
        // Topic-based suggestions
        if (analysis.weakTopics.length > 0) {
            const weakestTopic = analysis.weakTopics[0];
            suggestions.push({
                title: `Focus on ${weakestTopic.topic}`,
                text: `You scored ${weakestTopic.percentage.toFixed(1)}% on ${weakestTopic.topic} questions. Create flashcards and practice more in this area.`,
                priority: 'high',
                icon: 'bullseye'
            });
        }
        
        // Study method suggestions
        if (analysis.incorrectQuestions.length > analysis.correctCount) {
            suggestions.push({
                title: 'Active Recall Practice',
                text: 'Try the flashcard feature more often. Active recall is proven to improve retention by 50% compared to passive reading.',
                priority: 'medium',
                icon: 'brain'
            });
        }
        
        return suggestions.slice(0, 4); // Limit to 4 suggestions
    }
    
    generateQuestionFeedback(exam, analysis) {
        const feedback = [];
        
        // Focus on incorrect questions for detailed feedback
        analysis.incorrectQuestions.slice(0, 5).forEach(incorrectQ => {
            const question = exam.questions[incorrectQ.index];
            const explanation = this.generateQuestionExplanation(question, incorrectQ);
            
            feedback.push({
                questionNumber: incorrectQ.index + 1,
                question: incorrectQ.question,
                userAnswer: incorrectQ.userAnswer,
                correctAnswer: incorrectQ.correctAnswer,
                isCorrect: false,
                explanation,
                difficulty: incorrectQ.difficulty,
                topic: incorrectQ.topic
            });
        });
        
        // Add a few correct answers for positive reinforcement
        exam.questions.forEach((question, index) => {
            if (exam.userAnswers[index] === question.correct && feedback.length < 8) {
                const topic = this.extractQuestionTopic(question.question);
                feedback.push({
                    questionNumber: index + 1,
                    question: question.question,
                    userAnswer: question.options[exam.userAnswers[index]],
                    correctAnswer: question.options[question.correct],
                    isCorrect: true,
                    explanation: this.generatePositiveReinforcement(question, topic),
                    difficulty: this.estimateQuestionDifficulty(question),
                    topic
                });
            }
        });
        
        return feedback.sort((a, b) => a.questionNumber - b.questionNumber);
    }
    
    generateQuestionExplanation(question, incorrectQ) {
        const explanations = {
            'math': [
                `The correct approach is to ${this.generateMathExplanation(question)}.`,
                `Remember to check your calculations step by step.`,
                `This type of problem requires understanding of ${incorrectQ.topic.toLowerCase()} principles.`
            ],
            'science': [
                `This question tests your understanding of ${incorrectQ.topic.toLowerCase()}.`,
                `The key concept here is that ${this.generateScienceExplanation(question)}.`,
                `Try to visualize the process or draw a diagram to better understand.`
            ],
            'general': [
                `The correct answer is ${incorrectQ.correctAnswer} because ${this.generateGeneralExplanation(question)}.`,
                `This question requires careful reading and understanding of ${incorrectQ.topic.toLowerCase()}.`,
                `Consider reviewing the fundamental concepts of ${incorrectQ.topic.toLowerCase()}.`
            ]
        };
        
        const category = this.categorizeQuestion(question);
        const categoryExplanations = explanations[category] || explanations.general;
        
        return categoryExplanations[Math.floor(Math.random() * categoryExplanations.length)];
    }
    
    generatePositiveReinforcement(question, topic) {
        const reinforcements = [
            `Excellent! You correctly identified the key concept in this ${topic.toLowerCase()} question.`,
            `Great job! Your understanding of ${topic.toLowerCase()} is solid.`,
            `Perfect! This shows you have a good grasp of the fundamentals.`,
            `Well done! You applied the correct reasoning to solve this problem.`,
            `Outstanding! Keep up this level of understanding.`
        ];
        
        return reinforcements[Math.floor(Math.random() * reinforcements.length)];
    }
    
    displayExamFeedback(analysis, suggestions, questionFeedback) {
        // Update overall performance summary
        const overallAnalysis = document.getElementById('overallAnalysis');
        overallAnalysis.innerHTML = `
            <div class="performance-metrics">
                <div class="metric-card">
                    <span class="metric-value">${analysis.score}%</span>
                    <div class="metric-label">Overall Score</div>
                </div>
                <div class="metric-card">
                    <span class="metric-value">${analysis.correctCount}/${analysis.totalQuestions}</span>
                    <div class="metric-label">Correct Answers</div>
                </div>
                <div class="metric-card">
                    <span class="metric-value">${analysis.overallGrade}</span>
                    <div class="metric-label">Grade</div>
                </div>
            </div>
            
            <div class="difficulty-analysis">
                <h6>Performance by Difficulty:</h6>
                <div class="difficulty-bar">
                    <span class="difficulty-label">Easy</span>
                    <div class="difficulty-progress">
                        <div class="difficulty-fill" style="width: ${analysis.difficultyScores.easy}%"></div>
                    </div>
                    <span class="difficulty-score">${analysis.difficultyScores.easy.toFixed(0)}%</span>
                </div>
                <div class="difficulty-bar">
                    <span class="difficulty-label">Medium</span>
                    <div class="difficulty-progress">
                        <div class="difficulty-fill" style="width: ${analysis.difficultyScores.medium}%"></div>
                    </div>
                    <span class="difficulty-score">${analysis.difficultyScores.medium.toFixed(0)}%</span>
                </div>
                <div class="difficulty-bar">
                    <span class="difficulty-label">Hard</span>
                    <div class="difficulty-progress">
                        <div class="difficulty-fill" style="width: ${analysis.difficultyScores.hard}%"></div>
                    </div>
                    <span class="difficulty-score">${analysis.difficultyScores.hard.toFixed(0)}%</span>
                </div>
            </div>
        `;
        
        // Display improvement suggestions
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '';
        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';
            suggestionElement.innerHTML = `
                <i class="fas fa-${suggestion.icon}"></i>
                <div class="suggestion-content">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-text">${suggestion.text}</div>
                </div>
            `;
            suggestionsList.appendChild(suggestionElement);
        });
        
        // Display detailed question feedback
        const questionAnalysis = document.getElementById('questionAnalysis');
        questionAnalysis.innerHTML = '';
        questionFeedback.forEach(feedback => {
            const feedbackElement = document.createElement('div');
            feedbackElement.className = `question-feedback-item ${feedback.isCorrect ? 'correct' : ''}`;
            feedbackElement.innerHTML = `
                <div class="question-header">
                    <span class="question-number">Question ${feedback.questionNumber}</span>
                    <span class="question-status ${feedback.isCorrect ? 'correct' : 'incorrect'}">
                        <i class="fas fa-${feedback.isCorrect ? 'check' : 'times'}"></i>
                        ${feedback.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                </div>
                <div class="question-text">${feedback.question}</div>
                <div class="answer-analysis">
                    <div class="answer-label">Your Answer:</div>
                    <div class="answer-text">${feedback.userAnswer}</div>
                </div>
                ${!feedback.isCorrect ? `
                    <div class="answer-analysis">
                        <div class="answer-label">Correct Answer:</div>
                        <div class="answer-text">${feedback.correctAnswer}</div>
                    </div>
                ` : ''}
                <div class="ai-explanation">
                    <div class="ai-explanation-header">
                        <i class="fas fa-robot"></i>
                        AI Explanation
                    </div>
                    <div class="ai-explanation-text">${feedback.explanation}</div>
                </div>
            `;
            questionAnalysis.appendChild(feedbackElement);
        });
    }
    
    async createPersonalizedStudyPlan() {
        if (!this.currentExam) {
            this.showNotification('No exam data available for study plan creation', 'error');
            return;
        }
        
        this.showAIStatus('Creating your personalized study plan...', 50);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const analysis = this.analyzeExamPerformance(this.currentExam);
            const studyPlan = this.generateStudyPlan(analysis);
            
            this.showAIStatus('Study plan ready!', 100);
            this.displayStudyPlan(studyPlan);
            this.hideAIStatus();
            
            this.showNotification('Personalized study plan created! 📚✨', 'success');
            this.addActivity('Created AI study plan', 'calendar-plus');
            
        } catch (error) {
            console.error('Error creating study plan:', error);
            this.showNotification('Failed to create study plan. Please try again.', 'error');
            this.hideAIStatus();
        }
    }
    
    generateStudyPlan(analysis) {
        const plan = {
            duration: '2 weeks',
            dailyTime: '30-45 minutes',
            focus: analysis.weakTopics.length > 0 ? analysis.weakTopics[0].topic : 'General Review',
            activities: []
        };
        
        // Week 1: Foundation building
        plan.activities.push({
            week: 1,
            title: 'Foundation Building',
            tasks: [
                `Review ${plan.focus} fundamentals using textbook/notes`,
                'Create 10-15 flashcards on weak topics',
                'Practice 5 easy-level questions daily',
                'Watch educational videos on challenging concepts'
            ]
        });
        
        // Week 2: Application and practice
        plan.activities.push({
            week: 2,
            title: 'Application & Practice',
            tasks: [
                'Complete practice problems of increasing difficulty',
                'Review flashcards daily (spaced repetition)',
                'Take another mock exam to measure progress',
                'Focus on time management and exam strategies'
            ]
        });
        
        return plan;
    }
    
    displayStudyPlan(plan) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Your Personalized Study Plan</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="study-plan-overview">
                        <p><strong>Duration:</strong> ${plan.duration}</p>
                        <p><strong>Daily Time:</strong> ${plan.dailyTime}</p>
                        <p><strong>Primary Focus:</strong> ${plan.focus}</p>
                    </div>
                    ${plan.activities.map(activity => `
                        <div class="study-week">
                            <h4>Week ${activity.week}: ${activity.title}</h4>
                            <ul>
                                ${activity.tasks.map(task => `<li>${task}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                    <div class="study-plan-tips">
                        <h4>Study Tips:</h4>
                        <ul>
                            <li>Set specific study times and stick to them</li>
                            <li>Take breaks every 25-30 minutes (Pomodoro technique)</li>
                            <li>Review flashcards using spaced repetition</li>
                            <li>Track your progress and adjust as needed</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Helper methods for exam analysis
    estimateQuestionDifficulty(question) {
        const questionText = question.question.toLowerCase();
        const hardKeywords = ['analyze', 'evaluate', 'compare', 'synthesize', 'complex', 'advanced'];
        const mediumKeywords = ['explain', 'describe', 'apply', 'calculate', 'determine'];
        
        if (hardKeywords.some(keyword => questionText.includes(keyword))) {
            return 'hard';
        } else if (mediumKeywords.some(keyword => questionText.includes(keyword))) {
            return 'medium';
        } else {
            return 'easy';
        }
    }
    
    extractQuestionTopic(questionText) {
        const topics = {
            'math': ['calculate', 'equation', 'formula', 'number', 'solve', 'mathematics'],
            'science': ['theory', 'experiment', 'hypothesis', 'scientific', 'research', 'biology', 'chemistry', 'physics'],
            'history': ['year', 'century', 'historical', 'ancient', 'war', 'empire'],
            'language': ['grammar', 'sentence', 'word', 'literature', 'writing', 'reading'],
            'geography': ['country', 'continent', 'ocean', 'mountain', 'climate', 'population']
        };
        
        const lowerText = questionText.toLowerCase();
        for (const [topic, keywords] of Object.entries(topics)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return topic.charAt(0).toUpperCase() + topic.slice(1);
            }
        }
        
        return 'General Knowledge';
    }
    
    categorizeQuestion(question) {
        const questionText = question.question.toLowerCase();
        if (questionText.includes('calculate') || questionText.includes('solve') || questionText.includes('equation')) {
            return 'math';
        } else if (questionText.includes('theory') || questionText.includes('experiment') || questionText.includes('scientific')) {
            return 'science';
        } else {
            return 'general';
        }
    }
    
    generateMathExplanation(question) {
        return 'follow the order of operations and double-check your arithmetic';
    }
    
    generateScienceExplanation(question) {
        return 'the fundamental principles govern the observed phenomena';
    }
    
    generateGeneralExplanation(question) {
        return 'it directly addresses the key concept being tested';
    }
    
    calculateGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }
    
    // AI To-Do List Methods
    async generateTodoList() {
        try {
            this.showNotification('Generating personalized to-do list...', 'info');
            
            // Show loading state
            const container = document.getElementById('todoContainer');
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>AI is analyzing your progress and grade level...</p>
                </div>
            `;
            
            // Simulate AI processing time
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate grade-specific and personalized tasks
            const tasks = this.generateGradeSpecificTasks();
            this.todoList = tasks;
            
            // Display the tasks
            this.displayTodoList();
            
            // Award points and track activity
            this.addScore(15);
            this.addActivity('Generated AI to-do list', 'tasks');
            
            this.showNotification('✨ AI to-do list generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating to-do list:', error);
            this.showNotification('Failed to generate to-do list. Please try again.', 'error');
        }
    }
    
    generateGradeSpecificTasks() {
        const userGrade = this.currentUser?.grade || 8; // Default to grade 8
        const tasks = [];
        
        // Define grade-specific content and subjects
        const gradeContent = this.getGradeSpecificContent(userGrade);
        const userProgress = this.analyzeUserProgress();
        
        // Generate tasks based on grade level and user progress
        const taskTypes = [
            'study_session',
            'flashcard_review',
            'practice_exam',
            'note_organization',
            'subject_focus',
            'skill_building'
        ];
        
        taskTypes.forEach(type => {
            const task = this.generateTaskByType(type, userGrade, gradeContent, userProgress);
            if (task) tasks.push(task);
        });
        
        // Add some general study habits tasks
        tasks.push(...this.generateStudyHabitTasks(userGrade));
        
        // Sort by priority and return top 8 tasks
        return tasks.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }).slice(0, 8);
    }
    
    getGradeSpecificContent(grade) {
        // South African CAPS Curriculum alignment
        const capsContent = {
            // Foundation Phase (Grade R-3) - Grade 3 only
            3: {
                phase: 'Foundation Phase',
                subjects: ['English Home Language', 'Mathematics', 'Life Skills'],
                skills: [
                    'Basic reading and writing',
                    'Number recognition and counting',
                    'Simple addition and subtraction',
                    'Personal and social skills',
                    'Creative expression'
                ],
                topics: {
                    'English Home Language': ['Phonics', 'Sight words', 'Simple sentences', 'Story telling'],
                    'Mathematics': ['Numbers 1-100', 'Addition', 'Subtraction', 'Shapes', 'Patterns'],
                    'Life Skills': ['Personal hygiene', 'Safety rules', 'Community helpers', 'Weather']
                },
                studyTime: 25,
                complexity: 'foundation'
            },
            
            // Intermediate Phase (Grade 4-6)
            4: {
                phase: 'Intermediate Phase',
                subjects: ['English Home Language', 'Mathematics', 'Natural Sciences and Technology', 'Social Sciences', 'Life Orientation'],
                skills: [
                    'Reading comprehension',
                    'Written communication',
                    'Problem solving with numbers',
                    'Scientific observation',
                    'Map reading basics'
                ],
                topics: {
                    'English Home Language': ['Reading comprehension', 'Creative writing', 'Grammar basics', 'Vocabulary building'],
                    'Mathematics': ['Place value', 'Four operations', 'Fractions', 'Measurement', 'Data handling'],
                    'Natural Sciences and Technology': ['Living and non-living things', 'Materials', 'Energy and change'],
                    'Social Sciences': ['Geography skills', 'History of SA', 'Map work'],
                    'Life Orientation': ['Health and safety', 'Social responsibility']
                },
                studyTime: 35,
                complexity: 'intermediate'
            },
            
            5: {
                phase: 'Intermediate Phase',
                subjects: ['English Home Language', 'Mathematics', 'Natural Sciences and Technology', 'Social Sciences', 'Life Orientation'],
                skills: [
                    'Advanced reading strategies',
                    'Mathematical reasoning',
                    'Scientific investigation',
                    'Historical thinking',
                    'Geographic analysis'
                ],
                topics: {
                    'English Home Language': ['Literature appreciation', 'Essay writing', 'Language structures', 'Oral presentation'],
                    'Mathematics': ['Decimal fractions', 'Percentages', 'Geometry', 'Algebra introduction', 'Probability'],
                    'Natural Sciences and Technology': ['Life processes', 'Matter and materials', 'Forces and energy'],
                    'Social Sciences': ['South African history', 'Physical geography', 'Human geography'],
                    'Life Orientation': ['Personal development', 'Citizenship education']
                },
                studyTime: 40,
                complexity: 'intermediate'
            },
            
            6: {
                phase: 'Intermediate Phase',
                subjects: ['English Home Language', 'Mathematics', 'Natural Sciences and Technology', 'Social Sciences', 'Life Orientation'],
                skills: [
                    'Critical reading and analysis',
                    'Complex problem solving',
                    'Scientific method application',
                    'Research and inquiry',
                    'Independent learning'
                ],
                topics: {
                    'English Home Language': ['Text analysis', 'Persuasive writing', 'Language conventions', 'Media literacy'],
                    'Mathematics': ['Ratio and proportion', 'Algebraic expressions', 'Coordinate geometry', 'Statistics'],
                    'Natural Sciences and Technology': ['Biodiversity', 'Chemical reactions', 'Mechanical systems'],
                    'Social Sciences': ['Democratic South Africa', 'Economic geography', 'Environmental issues'],
                    'Life Orientation': ['Health promotion', 'Social justice']
                },
                studyTime: 45,
                complexity: 'intermediate'
            },
            
            // Senior Phase (Grade 7-9)
            7: {
                phase: 'Senior Phase',
                subjects: ['English Home Language', 'Mathematics', 'Natural Sciences', 'Technology', 'Social Sciences', 'Economic and Management Sciences', 'Life Orientation'],
                skills: [
                    'Academic writing',
                    'Mathematical modeling',
                    'Scientific investigation',
                    'Design thinking',
                    'Economic reasoning'
                ],
                topics: {
                    'English Home Language': ['Poetry analysis', 'Narrative techniques', 'Formal writing', 'Debate skills'],
                    'Mathematics': ['Integers', 'Rational numbers', 'Algebraic equations', 'Geometric reasoning'],
                    'Natural Sciences': ['Cells and tissues', 'Atoms and compounds', 'Forces and motion'],
                    'Technology': ['Design process', 'Structures', 'Processing'],
                    'Social Sciences': ['Ancient civilizations', 'Climate and weather', 'Settlement geography'],
                    'Economic and Management Sciences': ['Economic systems', 'Entrepreneurship', 'Financial literacy'],
                    'Life Orientation': ['Personal well-being', 'Social relationships']
                },
                studyTime: 50,
                complexity: 'senior'
            },
            
            8: {
                phase: 'Senior Phase',
                subjects: ['English Home Language', 'Mathematics', 'Natural Sciences', 'Technology', 'Social Sciences', 'Economic and Management Sciences', 'Life Orientation'],
                skills: [
                    'Literary analysis',
                    'Advanced mathematics',
                    'Experimental design',
                    'Technological solutions',
                    'Historical interpretation'
                ],
                topics: {
                    'English Home Language': ['Drama and literature', 'Argumentative writing', 'Language variation', 'Critical thinking'],
                    'Mathematics': ['Pythagorean theorem', 'Linear equations', 'Surface area and volume', 'Probability'],
                    'Natural Sciences': ['Photosynthesis and respiration', 'Periodic table', 'Sound and light'],
                    'Technology': ['Mechanical systems', 'Electrical systems', 'Civil technology'],
                    'Social Sciences': ['Colonialism and resistance', 'Development geography', 'Population studies'],
                    'Economic and Management Sciences': ['Markets', 'Business sectors', 'Economic indicators'],
                    'Life Orientation': ['Career choices', 'Study methods']
                },
                studyTime: 55,
                complexity: 'senior'
            },
            
            9: {
                phase: 'Senior Phase',
                subjects: ['English Home Language', 'Mathematics', 'Natural Sciences', 'Technology', 'Social Sciences', 'Economic and Management Sciences', 'Life Orientation'],
                skills: [
                    'Advanced literacy',
                    'Mathematical proof',
                    'Scientific reasoning',
                    'Innovation and design',
                    'Critical analysis'
                ],
                topics: {
                    'English Home Language': ['Shakespeare studies', 'Research projects', 'Media studies', 'Public speaking'],
                    'Mathematics': ['Functions and relationships', 'Geometry and trigonometry', 'Data analysis', 'Financial mathematics'],
                    'Natural Sciences': ['Chemical bonding', 'Genetics', 'Electricity and magnetism'],
                    'Technology': ['Control systems', 'Communication systems', 'Manufacturing'],
                    'Social Sciences': ['Apartheid and democracy', 'Globalization', 'Sustainable development'],
                    'Economic and Management Sciences': ['Economic growth', 'International trade', 'Business management'],
                    'Life Orientation': ['Life skills', 'Constitutional values']
                },
                studyTime: 60,
                complexity: 'senior'
            },
            
            // FET Phase (Grade 10-12)
            10: {
                phase: 'FET Phase',
                subjects: ['English Home Language', 'Mathematics', 'Life Sciences', 'Physical Sciences', 'Geography', 'History', 'Life Orientation'],
                skills: [
                    'Academic research',
                    'Advanced mathematics',
                    'Scientific methodology',
                    'Geographic analysis',
                    'Historical investigation'
                ],
                topics: {
                    'English Home Language': ['Literature studies', 'Language structures', 'Comprehension skills', 'Writing techniques'],
                    'Mathematics': ['Functions', 'Number patterns', 'Finance and growth', 'Statistics'],
                    'Life Sciences': ['Chemistry of life', 'Cells', 'Plant and animal tissues', 'Life processes'],
                    'Physical Sciences': ['Matter and materials', 'Chemical systems', 'Mechanics', 'Waves and sound'],
                    'Geography': ['Geomorphology', 'Weather and climate', 'Population geography', 'Settlement geography'],
                    'History': ['Cold War', 'Independent Africa', 'Civil rights movements', 'Apartheid South Africa'],
                    'Life Orientation': ['Personal well-being', 'Citizenship education', 'Career choices']
                },
                studyTime: 65,
                complexity: 'advanced'
            },
            
            11: {
                phase: 'FET Phase',
                subjects: ['English Home Language', 'Mathematics', 'Life Sciences', 'Physical Sciences', 'Geography', 'History', 'Life Orientation'],
                skills: [
                    'Critical analysis',
                    'Mathematical modeling',
                    'Scientific investigation',
                    'Spatial analysis',
                    'Historical synthesis'
                ],
                topics: {
                    'English Home Language': ['Poetry analysis', 'Novel studies', 'Visual literacy', 'Oral communication'],
                    'Mathematics': ['Algebraic functions', 'Trigonometry', 'Analytical geometry', 'Calculus introduction'],
                    'Life Sciences': ['Biodiversity and classification', 'Body systems', 'Reproduction', 'Genetics and inheritance'],
                    'Physical Sciences': ['Organic chemistry', 'Reaction rates', 'Electric circuits', 'Optical phenomena'],
                    'Geography': ['Climate change', 'Geomorphology processes', 'Economic geography', 'Development geography'],
                    'History': ['Nationalism in South Africa', 'World War impacts', 'Decolonization', 'Social transformation'],
                    'Life Orientation': ['Personal development', 'Social issues', 'Study skills']
                },
                studyTime: 70,
                complexity: 'advanced'
            },
            
            12: {
                phase: 'FET Phase (Matric)',
                subjects: ['English Home Language', 'Mathematics', 'Life Sciences', 'Physical Sciences', 'Geography', 'History', 'Life Orientation'],
                skills: [
                    'Matric exam preparation',
                    'Advanced problem solving',
                    'Research methodology',
                    'Critical evaluation',
                    'Independent study'
                ],
                topics: {
                    'English Home Language': ['Prescribed literature', 'Language in context', 'Writing skills', 'Exam techniques'],
                    'Mathematics': ['Functions and inverses', 'Sequences and series', 'Financial mathematics', 'Probability'],
                    'Life Sciences': ['Evolution', 'Human impact on environment', 'Responding to the environment', 'Exam preparation'],
                    'Physical Sciences': ['Chemical equilibrium', 'Acids and bases', 'Electrodynamics', 'Modern physics'],
                    'Geography': ['Climate and weather', 'Geomorphology', 'Rural and urban settlements', 'Geographical skills'],
                    'History': ['Civil resistance', 'Coming of democracy', 'End of Cold War', 'Historical skills'],
                    'Life Orientation': ['Career preparation', 'Life skills', 'Constitutional values']
                },
                studyTime: 75,
                complexity: 'matric'
            }
        };
        
        return capsContent[grade] || {
            phase: 'General',
            subjects: ['English', 'Mathematics', 'Science'],
            skills: ['Study skills', 'Problem solving'],
            topics: {},
            studyTime: 45,
            complexity: 'general'
        };
    }
    
    generateTaskByType(type, grade, gradeContent, userProgress) {
        const taskId = Date.now() + Math.random();
        
        switch (type) {
            case 'study_session':
                const randomSubject = gradeContent.subjects[Math.floor(Math.random() * gradeContent.subjects.length)];
                const subjectTopics = gradeContent.topics[randomSubject] || ['General concepts'];
                const studyTopic = subjectTopics[Math.floor(Math.random() * subjectTopics.length)];
                return {
                    id: taskId,
                    title: `${gradeContent.studyTime}-min ${randomSubject} study session`,
                    description: `Study ${studyTopic} for ${gradeContent.studyTime} minutes (${gradeContent.phase} level)`,
                    priority: userProgress.studyFrequency < 3 ? 'high' : 'medium',
                    subject: randomSubject,
                    completed: false,
                    type: 'study',
                    capsPhase: gradeContent.phase,
                    topic: studyTopic
                };
                
            case 'flashcard_review':
                const flashcardCount = this.flashcards.length;
                if (flashcardCount === 0) {
                    return {
                        id: taskId,
                        title: 'Create your first flashcards',
                        description: 'Start building your study materials by creating 5-10 flashcards',
                        priority: 'high',
                        subject: 'Study Tools',
                        completed: false,
                        type: 'create'
                    };
                } else {
                    return {
                        id: taskId,
                        title: `Review ${Math.min(flashcardCount, 20)} flashcards`,
                        description: 'Practice with your existing flashcards to reinforce learning',
                        priority: 'medium',
                        subject: 'Review',
                        completed: false,
                        type: 'review'
                    };
                }
                
            case 'practice_exam':
                return {
                    id: taskId,
                    title: 'Take a practice exam',
                    description: `Complete a ${gradeContent.complexity} level practice test`,
                    priority: userProgress.examScores.length === 0 ? 'high' : 'medium',
                    subject: gradeContent.subjects[Math.floor(Math.random() * gradeContent.subjects.length)],
                    completed: false,
                    type: 'exam'
                };
                
            case 'note_organization':
                return {
                    id: taskId,
                    title: 'Organize your study notes',
                    description: 'Review and organize your captured notes by subject',
                    priority: this.notes.length > 5 ? 'medium' : 'low',
                    subject: 'Organization',
                    completed: false,
                    type: 'organize'
                };
                
            case 'subject_focus':
                const weakSubject = userProgress.weakestSubject || gradeContent.subjects[0];
                const focusTopics = gradeContent.topics[weakSubject] || ['General concepts'];
                const randomTopic = focusTopics[Math.floor(Math.random() * focusTopics.length)];
                return {
                    id: taskId,
                    title: `Study ${randomTopic} in ${weakSubject}`,
                    description: `Focus on ${randomTopic} - a key ${gradeContent.phase} topic in ${weakSubject}`,
                    priority: 'high',
                    subject: weakSubject,
                    completed: false,
                    type: 'focus',
                    capsPhase: gradeContent.phase,
                    topic: randomTopic
                };
                
            case 'skill_building':
                const skill = gradeContent.skills[Math.floor(Math.random() * gradeContent.skills.length)];
                return {
                    id: taskId,
                    title: `Practice ${skill.toLowerCase()}`,
                    description: `Work on developing your ${skill.toLowerCase()} abilities`,
                    priority: 'medium',
                    subject: 'Skills',
                    completed: false,
                    type: 'skill'
                };
                
            default:
                return null;
        }
    }
    
    generateStudyHabitTasks(grade) {
        const gradeContent = this.getGradeSpecificContent(grade);
        const capsPhase = gradeContent.phase;
        
        const habits = [
            {
                title: `Create a ${capsPhase} study timetable`,
                description: `Plan your ${gradeContent.studyTime}-minute study sessions for CAPS subjects`,
                priority: 'medium',
                subject: 'Study Planning',
                capsPhase: capsPhase
            },
            {
                title: 'Practice CAPS exam techniques',
                description: `Learn exam strategies specific to ${capsPhase} assessments`,
                priority: 'medium',
                subject: 'Exam Prep',
                capsPhase: capsPhase
            },
            {
                title: 'Review CAPS learning outcomes',
                description: `Check your progress against ${capsPhase} curriculum standards`,
                priority: 'medium',
                subject: 'Self-Assessment',
                capsPhase: capsPhase
            },
            {
                title: 'Take active study breaks',
                description: 'Use the Pomodoro technique: 25 minutes study, 5 minutes break',
                priority: 'low',
                subject: 'Wellness',
                capsPhase: capsPhase
            }
        ];
        
        // Add grade-specific habits
        if (grade >= 10) {
            habits.push({
                title: 'Prepare for Matric exams',
                description: 'Focus on NSC exam preparation and university readiness',
                priority: 'high',
                subject: 'Matric Prep',
                capsPhase: 'FET Phase'
            });
        }
        
        if (grade <= 6) {
            habits.push({
                title: 'Build foundation skills',
                description: 'Strengthen basic literacy and numeracy as per CAPS requirements',
                priority: 'high',
                subject: 'Foundation Skills',
                capsPhase: capsPhase
            });
        }
        
        return habits.map(habit => ({
            id: Date.now() + Math.random(),
            ...habit,
            completed: false,
            type: 'habit'
        }));
    }
    
    analyzeUserProgress() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Analyze recent activity
        const recentActivities = this.activities.filter(activity => 
            new Date(activity.timestamp) > oneWeekAgo
        );
        
        // Calculate study frequency
        const studyDays = new Set(recentActivities.map(activity => 
            new Date(activity.timestamp).toDateString()
        )).size;
        
        // Analyze exam performance
        const examScores = this.mockExams.map(exam => exam.lastScore || 0).filter(score => score > 0);
        const averageScore = examScores.length > 0 ? 
            examScores.reduce((sum, score) => sum + score, 0) / examScores.length : 0;
        
        // Determine weakest subject (simplified)
        const subjectScores = {};
        this.mockExams.forEach(exam => {
            if (exam.lastScore) {
                subjectScores[exam.subject] = exam.lastScore;
            }
        });
        
        const weakestSubject = Object.keys(subjectScores).reduce((weakest, subject) => 
            (!weakest || subjectScores[subject] < subjectScores[weakest]) ? subject : weakest
        , null);
        
        return {
            studyFrequency: studyDays,
            examScores,
            averageScore,
            weakestSubject,
            totalActivities: recentActivities.length
        };
    }
    
    displayTodoList() {
        const container = document.getElementById('todoContainer');
        
        if (this.todoList.length === 0) {
            container.innerHTML = `
                <div class="placeholder-content">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No tasks generated yet. Click "Generate To-Do List" to get started!</p>
                </div>
            `;
            return;
        }
        
        const todoHTML = `
            <div class="todo-list-header">
                <h4><i class="fas fa-graduation-cap"></i> Personalized for Grade ${this.currentUser?.grade || 'N/A'}</h4>
                <p class="todo-count">${this.todoList.filter(t => !t.completed).length} tasks remaining</p>
            </div>
            <ul class="todo-list">
                ${this.todoList.map(task => `
                    <li class="todo-item ${task.completed ? 'completed' : ''}" onclick="studyBuddy.toggleTodoItem('${task.id}')">
                        <div class="todo-item-header">
                            <h5 class="todo-title">${task.title}</h5>
                            <span class="todo-priority priority-${task.priority}">${task.priority}</span>
                        </div>
                        <p class="todo-description">${task.description}</p>
                        <span class="todo-subject">${task.subject}</span>
                    </li>
                `).join('')}
            </ul>
        `;
        
        container.innerHTML = todoHTML;
    }
    
    toggleTodoItem(taskId) {
        const task = this.todoList.find(t => t.id == taskId);
        if (task) {
            task.completed = !task.completed;
            
            if (task.completed) {
                this.addScore(5);
                this.addActivity(`Completed: ${task.title}`, 'check-circle');
                this.showNotification(`✅ Great job completing: ${task.title}!`, 'success');
            }
            
            this.displayTodoList();
            this.saveData();
        }
    }
    
    clearTodoList() {
        if (this.todoList.length === 0) {
            this.showNotification('No tasks to clear', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to clear all tasks? This action cannot be undone.')) {
            this.todoList = [];
            this.displayTodoList();
            this.saveData();
            this.showNotification('To-do list cleared', 'info');
            this.addActivity('Cleared to-do list', 'trash');
        }
    }
    
    // Update user interface to show grade information
    updateUserDisplay() {
        const userDisplayName = document.getElementById('userDisplayName');
        const userEmail = document.getElementById('userEmail');
        const userGrade = document.getElementById('userGrade');
        const gradeSpecificInfo = document.getElementById('gradeSpecificInfo');
        
        if (this.currentUser) {
            const gradeContent = this.getGradeSpecificContent(this.currentUser.grade);
            
            if (userDisplayName) userDisplayName.textContent = this.currentUser.username;
            if (userEmail) userEmail.textContent = this.currentUser.email;
            if (userGrade) userGrade.textContent = `Grade ${this.currentUser.grade} (${gradeContent.phase})`;
            if (gradeSpecificInfo) {
                gradeSpecificInfo.innerHTML = `
                    <p><i class="fas fa-graduation-cap"></i> CAPS ${gradeContent.phase} - Grade ${this.currentUser.grade}</p>
                    <small>Subjects: ${gradeContent.subjects.slice(0, 3).join(', ')}${gradeContent.subjects.length > 3 ? '...' : ''}</small>
                `;
            }
        } else {
            if (userDisplayName) userDisplayName.textContent = 'Guest User';
            if (userEmail) userEmail.textContent = 'Not logged in';
            if (userGrade) userGrade.textContent = 'Grade: Not selected';
            if (gradeSpecificInfo) {
                gradeSpecificInfo.innerHTML = `
                    <p><i class="fas fa-graduation-cap"></i> Sign in for CAPS curriculum content</p>
                `;
            }
        }
    }
    
    // Generate CAPS-specific study guide
    generateCapsStudyGuide(grade) {
        const gradeContent = this.getGradeSpecificContent(grade);
        
        const studyGuide = {
            phase: gradeContent.phase,
            grade: grade,
            recommendedStudyTime: gradeContent.studyTime,
            subjects: gradeContent.subjects,
            keySkills: gradeContent.skills,
            studyTips: this.getCapsStudyTips(grade, gradeContent),
            assessmentInfo: this.getCapsAssessmentInfo(grade, gradeContent),
            resources: this.getCapsResources(grade, gradeContent)
        };
        
        return studyGuide;
    }
    
    getCapsStudyTips(grade, gradeContent) {
        const baseTips = [
            `Allocate ${gradeContent.studyTime} minutes daily for focused study`,
            `Focus on ${gradeContent.phase} curriculum requirements`,
            'Use active learning techniques like summarizing and questioning',
            'Practice past papers and assessment tasks regularly'
        ];
        
        if (grade <= 6) {
            baseTips.push(
                'Build strong foundation skills in literacy and numeracy',
                'Use visual aids and hands-on activities for better understanding',
                'Read aloud daily to improve language skills'
            );
        } else if (grade <= 9) {
            baseTips.push(
                'Develop critical thinking and analysis skills',
                'Start preparing for FET phase subject choices',
                'Practice time management for multiple subjects'
            );
        } else {
            baseTips.push(
                'Focus on NSC exam preparation strategies',
                'Consider university and career requirements',
                'Develop independent research and study skills',
                'Practice exam techniques and time management'
            );
        }
        
        return baseTips;
    }
    
    getCapsAssessmentInfo(grade, gradeContent) {
        const assessmentInfo = {
            phase: gradeContent.phase,
            assessmentTypes: [],
            examPrep: []
        };
        
        if (grade <= 6) {
            assessmentInfo.assessmentTypes = [
                'Continuous assessment tasks',
                'Projects and investigations',
                'Oral presentations',
                'Practical activities'
            ];
            assessmentInfo.examPrep = [
                'Focus on understanding rather than memorization',
                'Practice basic skills regularly',
                'Use visual and practical learning methods'
            ];
        } else if (grade <= 9) {
            assessmentInfo.assessmentTypes = [
                'Formal assessment tasks',
                'Tests and examinations',
                'Projects and assignments',
                'Practical investigations'
            ];
            assessmentInfo.examPrep = [
                'Develop exam writing techniques',
                'Practice time management',
                'Learn to analyze questions carefully'
            ];
        } else {
            assessmentInfo.assessmentTypes = [
                'School-based Assessment (SBA)',
                'National Senior Certificate (NSC) exams',
                'Practical Assessment Tasks (PAT)',
                'Common Assessment Tasks (CAT)'
            ];
            assessmentInfo.examPrep = [
                'Master NSC exam format and requirements',
                'Practice with past Matric papers',
                'Develop advanced exam strategies',
                'Focus on university entrance requirements'
            ];
        }
        
        return assessmentInfo;
    }
    
    getCapsResources(grade, gradeContent) {
        return {
            officialResources: [
                'CAPS documents from Department of Basic Education',
                'Approved textbooks for your grade',
                'Provincial education department materials'
            ],
            studyMaterials: [
                'Mind the Gap study guides (Grade 12)',
                'DBE workbooks and worksheets',
                'Past examination papers',
                'Exemplar papers and marking guidelines'
            ],
            digitalResources: [
                'Siyavula online textbooks',
                'Khan Academy (Mathematics and Science)',
                'BBC Bitesize (English and other subjects)',
                'StudyBuddy AI-powered study tools'
            ],
            supportServices: [
                'School subject teachers',
                'District education support',
                'Community libraries',
                'Online tutoring platforms'
            ]
        };
    }
    
    // Authentication and Data Management Methods
    async loadUserData() {
        if (!this.currentUser) {
            // No user logged in, load sample data for guest mode
            this.loadSampleData();
            return;
        }
        
        try {
            // Load user-specific data from localStorage
            const userDataKey = `studyBuddyData_${this.currentUser.id}`;
            const userData = JSON.parse(localStorage.getItem(userDataKey));
            
            if (userData) {
                this.notes = userData.notes || [];
                this.exams = userData.exams || [];
                this.flashcards = userData.flashcards || [];
                this.mockExams = userData.mockExams || [];
                this.totalScore = userData.totalScore || 0;
                this.activities = userData.activities || [];
                this.todoList = userData.todoList || [];
            } else {
                // First time login, initialize with empty data
                this.notes = [];
                this.exams = [];
                this.flashcards = [];
                this.mockExams = [];
                this.totalScore = 0;
                this.activities = [];
                this.todoList = [];
                
                // Save initial empty state
                this.saveUserData();
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
            // On error, initialize with empty data
            this.notes = [];
            this.exams = [];
            this.flashcards = [];
            this.mockExams = [];
            this.totalScore = 0;
            this.activities = [];
            this.todoList = [];
        }
    }
    
    async saveUserData() {
        if (!this.currentUser) return;
        
        try {
            const userDataKey = `studyBuddyData_${this.currentUser.id}`;
            const userData = {
                notes: this.notes,
                exams: this.exams,
                flashcards: this.flashcards,
                mockExams: this.mockExams,
                totalScore: this.totalScore,
                activities: this.activities,
                todoList: this.todoList,
                lastSync: new Date().toISOString()
            };
            
            localStorage.setItem(userDataKey, JSON.stringify(userData));
            
            // Update user's total score in user record
            const existingUsers = JSON.parse(localStorage.getItem('studyBuddyUsers')) || [];
            const userIndex = existingUsers.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                existingUsers[userIndex].totalScore = this.totalScore;
                existingUsers[userIndex].lastActive = new Date().toISOString();
                localStorage.setItem('studyBuddyUsers', JSON.stringify(existingUsers));
            }
            
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }
    
    // Legacy saveData method for backward compatibility - now routes to saveUserData
    saveData() {
        if (this.currentUser) {
            this.saveUserData();
        } else {
            // For guest users, save to generic localStorage keys
            localStorage.setItem('studyBuddyNotes', JSON.stringify(this.notes));
            localStorage.setItem('studyBuddyExams', JSON.stringify(this.exams));
            localStorage.setItem('studyBuddyFlashcards', JSON.stringify(this.flashcards));
            localStorage.setItem('studyBuddyMockExams', JSON.stringify(this.mockExams));
            localStorage.setItem('studyBuddyScore', this.totalScore.toString());
            localStorage.setItem('studyBuddyActivities', JSON.stringify(this.activities));
        }
    }
    
    // Authentication Methods
    showAuthModal(mode) {
        this.isSignupMode = mode === 'signup';
        const modal = document.getElementById('authModal');
        const title = document.getElementById('authTitle');
        const submitBtn = document.getElementById('authSubmitBtn');
        const switchBtn = document.getElementById('switchAuthMode');
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        const emailGroup = document.querySelector('#email').parentElement;
        const gradeGroup = document.getElementById('gradeGroup');
        
        // Clear any previous form state
        this.clearAuthForm();
        
        if (this.isSignupMode) {
            title.textContent = 'Sign Up for StudyBuddy';
            submitBtn.textContent = 'Sign Up';
            switchBtn.textContent = 'Already have an account? Sign In';
            confirmPasswordGroup.style.display = 'block';
            emailGroup.style.display = 'block';
            gradeGroup.style.display = 'block';
            
            // Set required fields for signup
            document.getElementById('username').required = true;
            document.getElementById('email').required = true;
            document.getElementById('studentGrade').required = true;
            document.getElementById('password').required = true;
            document.getElementById('confirmPassword').required = true;
        } else {
            title.textContent = 'Sign In to StudyBuddy';
            submitBtn.textContent = 'Sign In';
            switchBtn.textContent = 'Need an account? Sign Up';
            confirmPasswordGroup.style.display = 'none';
            emailGroup.style.display = 'none';
            gradeGroup.style.display = 'none';
            
            // Set required fields for login (only username and password)
            document.getElementById('username').required = true;
            document.getElementById('email').required = false;
            document.getElementById('studentGrade').required = false;
            document.getElementById('password').required = true;
            document.getElementById('confirmPassword').required = false;
        }
        
        modal.style.display = 'flex';
        // Focus on the first visible input field
        setTimeout(() => {
            document.getElementById('username').focus();
        }, 100);
    }
    
    hideAuthModal() {
        const modal = document.getElementById('authModal');
        modal.style.display = 'none';
        this.clearAuthForm();
    }
    
    clearAuthForm() {
        document.getElementById('authForm').reset();
        document.querySelectorAll('.auth-error').forEach(error => error.remove());
    }
    
    switchAuthMode() {
        this.showAuthModal(this.isSignupMode ? 'login' : 'signup');
    }
    
    async handleAuth(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const grade = document.getElementById('studentGrade').value;
        
        if (!username || !password) {
            this.showNotification('Username and password are required', 'error');
            return;
        }
        
        if (this.isSignupMode) {
            if (!email || !grade) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                this.showNotification('Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                this.showNotification('Password must be at least 6 characters', 'error');
                return;
            }
            
            await this.signup(username, email, password, grade);
        } else {
            await this.login(username, email || username, password);
        }
    }
    
    async signup(username, email, password, grade) {
        try {
            this.setSyncStatus('syncing');
            
            // Check if user already exists
            const existingUsers = JSON.parse(localStorage.getItem('studyBuddyUsers')) || [];
            if (existingUsers.find(u => u.username === username || u.email === email)) {
                this.showNotification('Username or email already exists', 'error');
                this.setSyncStatus('error');
                return;
            }
            
            // Create new user
            const newUser = {
                id: Date.now(),
                username,
                email,
                password: this.hashPassword(password),
                grade: parseInt(grade),
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                totalScore: 0,
                level: 1
            };
            
            existingUsers.push(newUser);
            localStorage.setItem('studyBuddyUsers', JSON.stringify(existingUsers));
            
            // Auto-login after signup
            this.currentUser = { ...newUser };
            delete this.currentUser.password;
            localStorage.setItem('studyBuddyUser', JSON.stringify(this.currentUser));
            
            // Initialize user data
            await this.loadUserData();
            
            this.hideAuthModal();
            this.updateUserInterface();
            this.setSyncStatus('synced');
            this.showNotification(`Welcome to StudyBuddy, ${username}! 🎉`, 'success');
            this.addActivity('Created StudyBuddy account', 'user-plus');
            
        } catch (error) {
            console.error('Signup error:', error);
            this.showNotification('Signup failed. Please try again.', 'error');
            this.setSyncStatus('error');
        }
    }
    
    async login(username, email, password) {
        try {
            this.setSyncStatus('syncing');
            
            const existingUsers = JSON.parse(localStorage.getItem('studyBuddyUsers')) || [];
            const user = existingUsers.find(u => 
                (u.username === username || u.email === email) && 
                u.password === this.hashPassword(password)
            );
            
            if (!user) {
                this.showNotification('Invalid username/email or password', 'error');
                this.setSyncStatus('error');
                return;
            }
            
            // Login successful
            this.currentUser = { ...user };
            delete this.currentUser.password;
            localStorage.setItem('studyBuddyUser', JSON.stringify(this.currentUser));
            
            // Load user's data
            await this.loadUserData();
            
            this.hideAuthModal();
            this.updateUserInterface();
            this.updateDashboard();
            this.updateScore();
            this.setSyncStatus('synced');
            this.showNotification(`Welcome back, ${user.username}! 🎉`, 'success');
            this.addActivity('Signed in to StudyBuddy', 'sign-in-alt');
            
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
            this.setSyncStatus('error');
        }
    }
    
    logout() {
        if (confirm('Are you sure you want to logout? Your progress will be saved.')) {
            // Save current data before logout
            if (this.currentUser) {
                this.saveUserData();
            }
            
            this.currentUser = null;
            localStorage.removeItem('studyBuddyUser');
            
            // Clear current data and load sample data for guest user
            this.notes = [];
            this.exams = [];
            this.flashcards = [];
            this.mockExams = [];
            this.totalScore = 0;
            this.activities = [];
            this.todoList = [];
            
            this.loadSampleData();
            this.updateUserInterface();
            this.updateDashboard();
            this.updateScore();
            this.setSyncStatus('offline');
            this.showNotification('Logged out successfully', 'info');
        }
    }
    
    setSyncStatus(status) {
        this.syncStatus = status;
        this.updateUserInterface();
        this.updateSyncStatusDisplay();
    }
    
    hashPassword(password) {
        // Simple hash function for demo purposes - in production use proper hashing
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    updateUserInterface() {
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');
        const syncStatusElement = document.getElementById('syncStatus');
        
        if (this.currentUser) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userInfo) {
                userInfo.style.display = 'block';
                userInfo.innerHTML = `
                    <div class="user-details">
                        <div class="user-name">${this.currentUser.username}</div>
                        <div class="user-grade">Grade ${this.currentUser.grade}</div>
                        <div class="user-score">${this.totalScore} points</div>
                    </div>
                `;
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (signupBtn) signupBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userInfo) {
                userInfo.style.display = 'block';
                userInfo.innerHTML = `
                    <div class="user-details">
                        <div class="user-name">Guest User</div>
                        <div class="user-grade">Not logged in</div>
                        <div class="user-score">${this.totalScore} points</div>
                    </div>
                `;
            }
        }
        
        // Update sync status display
        this.updateSyncStatusDisplay();
        
        // Update user display in other sections
        this.updateUserDisplay();
    }
    
    updateSyncStatusDisplay() {
        const syncStatusElement = document.getElementById('syncStatus');
        if (!syncStatusElement) return;
        
        const statusConfig = {
            'offline': { text: 'Offline mode', class: 'status-offline', icon: 'wifi-slash' },
            'syncing': { text: 'Syncing...', class: 'status-syncing', icon: 'sync' },
            'synced': { text: 'Online', class: 'status-synced', icon: 'wifi' },
            'error': { text: 'Sync error', class: 'status-error', icon: 'exclamation-triangle' }
        };
        
        const config = statusConfig[this.syncStatus] || statusConfig['offline'];
        syncStatusElement.innerHTML = `<i class="fas fa-${config.icon}"></i> ${config.text}`;
        syncStatusElement.className = `sync-status ${config.class}`;
    }
    
    setSyncStatus(status) {
        this.syncStatus = status;
        this.updateSyncStatusDisplay();
    }
    
    // File Upload and Management Methods
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }
    
    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.remove('dragover');
    }
    
    processFiles(files) {
        if (files.length === 0) return;
        
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'image/gif'];
        
        files.forEach(file => {
            if (!allowedTypes.includes(file.type)) {
                this.showNotification(`File type ${file.type} is not supported`, 'error');
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                this.showNotification(`File ${file.name} is too large (max 10MB)`, 'error');
                return;
            }
            
            this.uploadFile(file);
        });
    }
    
    async uploadFile(file) {
        try {
            const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Show upload progress
            this.showNotification(`Uploading ${file.name}...`, 'info');
            
            // Create exam object for uploaded file
            const exam = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                uploadDate: new Date().toLocaleString(),
                content: null // In a real app, this would contain the file content
            };
            
            // Add to exams array
            this.exams.push(exam);
            this.saveData();
            
            // Update UI
            this.loadExamsList();
            this.updateDashboard();
            
            // Add activity and points
            this.addActivity(`Uploaded exam: ${file.name}`, 'file-upload');
            this.addScore(10);
            
            this.showNotification(`${file.name} uploaded successfully! +10 points`, 'success');
            
        } catch (error) {
            console.error('File upload error:', error);
            this.showNotification(`Failed to upload ${file.name}`, 'error');
        }
    }
    
    // Exam Management Methods
    deleteExam(examId) {
        if (confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
            const examIndex = this.exams.findIndex(exam => exam.id == examId);
            if (examIndex !== -1) {
                const examName = this.exams[examIndex].name;
                this.exams.splice(examIndex, 1);
                this.saveData();
                this.loadExamsList();
                this.updateDashboard();
                this.addActivity(`Deleted exam: ${examName}`, 'trash');
                this.showNotification('Exam deleted successfully', 'success');
            }
        }
    }
    
    deleteMockExam(examId) {
        if (confirm('Are you sure you want to delete this mock exam? This action cannot be undone.')) {
            const examIndex = this.mockExams.findIndex(exam => exam.id == examId);
            if (examIndex !== -1) {
                const examTitle = this.mockExams[examIndex].title;
                this.mockExams.splice(examIndex, 1);
                this.saveUserData();
                this.loadMockExamsList();
                this.updateDashboard();
                this.addActivity(`Deleted mock exam: ${examTitle}`, 'trash');
                this.showNotification('Mock exam deleted successfully', 'success');
            }
        }
    }
    
    loadExamsList() {
        const examsList = document.getElementById('examsList');
        if (!examsList) return;
        
        if (this.exams.length === 0) {
            examsList.innerHTML = '<p class="empty-state">No exams uploaded yet. Upload your first exam! 📄</p>';
            return;
        }
        
        examsList.innerHTML = this.exams.map(exam => `
            <div class="exam-item">
                <div class="exam-info">
                    <i class="fas fa-file-${exam.type.includes('pdf') ? 'pdf' : 'word'}"></i>
                    <div>
                        <h4>${exam.name}</h4>
                        <p>Uploaded: ${exam.uploadDate}</p>
                        <small>${(exam.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="studyBuddy.deleteExam(${exam.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
    
    loadMockExamsList() {
        const mockExamsList = document.getElementById('mockExamsList');
        if (!mockExamsList) return;
        
        if (this.mockExams.length === 0) {
            mockExamsList.innerHTML = '<p class="empty-state">No mock exams created yet. Create your first exam! 📝</p>';
            return;
        }
        
        mockExamsList.innerHTML = this.mockExams.map(exam => `
            <div class="mock-exam-item">
                <div class="mock-exam-info">
                    <h4>${exam.title}</h4>
                    <p>Subject: ${exam.subject}</p>
                    <p>Questions: ${exam.questions.length}</p>
                    <small>Created: ${exam.created}</small>
                    ${exam.lastScore ? `<p class="exam-score">Last Score: ${exam.lastScore}%</p>` : ''}
                </div>
                <div class="mock-exam-actions">
                    <button class="btn btn-primary btn-sm" onclick="studyBuddy.takeExam(${exam.id})">
                        <i class="fas fa-play"></i> Take Exam
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="studyBuddy.deleteMockExam(${exam.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Note Management Methods
    deleteNote(noteId) {
        // Find the note first to check if it exists
        const noteIndex = this.notes.findIndex(note => note.id == noteId);
        if (noteIndex === -1) {
            this.showNotification('Note not found', 'error');
            return;
        }
        
        // Show confirmation dialog
        if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            const deletedNote = this.notes.splice(noteIndex, 1)[0];
            
            // Clean up OCR extracted text data if it exists
            if (this.extractedTexts && this.extractedTexts.has(noteId)) {
                this.extractedTexts.delete(noteId);
            }
            
            // Save updated user data
            this.saveUserData();
            
            // Update UI displays
            this.updateNotesDisplay();
            this.loadNotesGallery();
            this.updateDashboard();
            
            // Add activity log entry
            this.addActivity('Deleted a note', 'trash');
            
            // Show success notification
            this.showNotification('Note deleted successfully', 'success');
            
            // Disable AI flashcard generation button if no notes remain
            const generateBtn = document.getElementById('generateFlashcardsBtn');
            if (generateBtn && this.notes.length === 0) {
                generateBtn.disabled = true;
            }
        }
    }
    
    loadNotesGallery() {
        const notesGallery = document.getElementById('notesGallery');
        if (!notesGallery) return;
        
        if (this.notes.length === 0) {
            notesGallery.innerHTML = '<p class="empty-state">No notes captured yet. Use the camera to capture your first note! 📸</p>';
            return;
        }
        
        notesGallery.innerHTML = this.notes.map(note => `
            <div class="note-item">
                <div class="note-image">
                    <img src="${note.image}" alt="Note" onclick="studyBuddy.viewNote(${note.id})">
                </div>
                <div class="note-info">
                    <p class="note-date">${note.timestamp}</p>
                    ${note.extractedText ? `<p class="note-text">${note.extractedText.substring(0, 100)}...</p>` : ''}
                </div>
                <div class="note-actions">
                    <button class="btn btn-primary btn-sm" onclick="studyBuddy.viewNote(${note.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="studyBuddy.deleteNote(${note.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    viewNote(noteId) {
        const note = this.notes.find(n => n.id == noteId);
        if (!note) return;
        
        // Create modal to view note
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content note-viewer">
                <div class="modal-header">
                    <h3>View Note</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <img src="${note.image}" alt="Note" style="max-width: 100%; height: auto;">
                    ${note.extractedText ? `<div class="extracted-text"><h4>Extracted Text:</h4><p>${note.extractedText}</p></div>` : ''}
                    <p class="note-timestamp">Captured: ${note.timestamp}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Exam Taking Methods
    takeExam(examId) {
        const exam = this.mockExams.find(e => e.id == examId);
        if (!exam) {
            this.showNotification('Exam not found', 'error');
            return;
        }
        
        if (exam.questions.length === 0) {
            this.showNotification('This exam has no questions', 'error');
            return;
        }
        
        this.currentExam = exam;
        this.examStartTime = new Date();
        this.examAnswers = {};
        this.startExam();
    }
    
    startExam() {
        if (!this.currentExam) return;
        
        // Switch to mock-exams section and show exam-taking interface
        this.switchSection('mock-exams');
        
        // Hide exam creator and results, show exam taking
        document.getElementById('examCreator').style.display = 'none';
        document.getElementById('examResults').style.display = 'none';
        document.getElementById('examTaking').style.display = 'block';
        
        // Hide the exams library
        const examsLibrary = document.querySelector('.exams-library');
        if (examsLibrary) examsLibrary.style.display = 'none';
        
        // Hide exam controls
        const examControls = document.querySelector('.exam-controls');
        if (examControls) examControls.style.display = 'none';
        
        // Display exam questions
        this.displayExamQuestions();
        
        // Start timer if needed
        this.startExamTimer();
        
        this.showNotification(`Started exam: ${this.currentExam.title}`, 'info');
    }
    
    displayExamQuestions() {
        const examContainer = document.getElementById('examQuestions');
        if (!examContainer || !this.currentExam) return;
        
        const exam = this.currentExam;
        
        // Update the exam title in the header
        const examTitleElement = document.getElementById('currentExamTitle');
        if (examTitleElement) {
            examTitleElement.textContent = exam.title;
        }
        
        // Display questions in the exam questions container
        examContainer.innerHTML = `
            <div class="exam-info">
                <p><strong>Subject:</strong> ${exam.subject}</p>
                <p><strong>Total Questions:</strong> ${exam.questions.length}</p>
            </div>
            ${exam.questions.map((question, index) => `
                <div class="question-card" data-question="${index}">
                    <h4>Question ${index + 1}</h4>
                    <p class="question-text">${question.question}</p>
                    <div class="question-options">
                        ${question.options.map((option, optIndex) => `
                            <label class="option-label">
                                <input type="radio" name="question_${index}" value="${optIndex}" 
                                       onchange="studyBuddy.recordAnswer(${index}, ${optIndex})">
                                <span>${String.fromCharCode(65 + optIndex)}. ${option}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        `;
        
        // Initialize progress tracking
        this.updateExamProgress();
    }
    
    recordAnswer(questionIndex, answerIndex) {
        this.examAnswers[questionIndex] = answerIndex;
        
        // Update visual progress indicators
        this.updateExamProgress();
        
        // Mark question as completed visually
        const questionCard = document.querySelector(`[data-question="${questionIndex}"]`);
        if (questionCard) {
            questionCard.classList.add('answered');
        }
    }
    
    updateExamProgress() {
        if (!this.currentExam) return;
        
        const totalQuestions = this.currentExam.questions.length;
        const answeredQuestions = Object.keys(this.examAnswers).length;
        const progressPercentage = Math.round((answeredQuestions / totalQuestions) * 100);
        
        // Update progress bar if it exists
        const progressFill = document.getElementById('examProgressFill');
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }
        
        // Update progress text in exam header
        const examHeader = document.querySelector('.exam-header');
        if (examHeader) {
            let progressText = examHeader.querySelector('.progress-text');
            if (!progressText) {
                progressText = document.createElement('div');
                progressText.className = 'progress-text';
                examHeader.appendChild(progressText);
            }
            progressText.textContent = `Progress: ${answeredQuestions}/${totalQuestions} questions (${progressPercentage}%)`;
        }
        
        // Enable/disable submit button based on completion
        const submitBtn = document.querySelector('#submitExam');
        if (submitBtn) {
            if (answeredQuestions === totalQuestions) {
                submitBtn.classList.add('btn-success');
                submitBtn.classList.remove('btn-secondary');
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Submit Complete Exam';
            } else {
                submitBtn.classList.add('btn-secondary');
                submitBtn.classList.remove('btn-success');
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Submit Exam';
            }
        }
    }
    
    submitExam() {
        if (!this.currentExam) return;
        
        const totalQuestions = this.currentExam.questions.length;
        const answeredQuestions = Object.keys(this.examAnswers).length;
        
        if (answeredQuestions < totalQuestions) {
            if (!confirm(`You have only answered ${answeredQuestions} out of ${totalQuestions} questions. Are you sure you want to submit?`)) {
                return;
            }
        }
        
        // Calculate score
        let correctAnswers = 0;
        this.currentExam.questions.forEach((question, index) => {
            const userAnswer = this.examAnswers[index];
            if (userAnswer !== undefined && userAnswer === question.correct) {
                correctAnswers++;
            }
        });
        
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const timeSpent = Math.round((new Date() - this.examStartTime) / 1000 / 60); // minutes
        
        // Update exam with results
        const examIndex = this.mockExams.findIndex(e => e.id === this.currentExam.id);
        if (examIndex !== -1) {
            this.mockExams[examIndex].lastScore = score;
            this.mockExams[examIndex].lastAttempt = new Date().toLocaleString();
            this.mockExams[examIndex].timeSpent = timeSpent;
        }
        
        // Add points based on performance
        const points = Math.max(5, Math.round(score / 10));
        this.addScore(points);
        
        // Add activity
        this.addActivity(`Completed exam: ${this.currentExam.title} (${score}%)`, 'check-circle');
        
        // Save data
        this.saveUserData();
        
        // Show results
        this.showExamResults(score, correctAnswers, totalQuestions, timeSpent, points);
        
        // Clear current exam
        this.currentExam = null;
        this.examAnswers = {};
        this.examStartTime = null;
        
        if (this.examTimer) {
            clearInterval(this.examTimer);
            this.examTimer = null;
        }
    }
    
    showExamResults(score, correct, total, timeSpent, points) {
        // Hide exam taking interface and show results
        document.getElementById('examTaking').style.display = 'none';
        document.getElementById('examResults').style.display = 'block';
        
        // Update the results data in the existing HTML structure
        const examScoreElement = document.getElementById('examScore');
        const correctAnswersElement = document.getElementById('correctAnswers');
        const totalQuestionsElement = document.getElementById('totalQuestions');
        const timeTakenElement = document.getElementById('timeTaken');
        
        if (examScoreElement) examScoreElement.textContent = score;
        if (correctAnswersElement) correctAnswersElement.textContent = correct;
        if (totalQuestionsElement) totalQuestionsElement.textContent = total;
        if (timeTakenElement) timeTakenElement.textContent = `${timeSpent}:00`;
        
        // Update button handlers to work with the current exam
        const retakeBtn = document.getElementById('retakeExam');
        const backBtn = document.getElementById('backToExams');
        
        if (retakeBtn) {
            retakeBtn.onclick = () => this.retakeCurrentExam();
        }
        
        if (backBtn) {
            backBtn.onclick = () => this.backToExams();
        }
        
        this.showNotification(`Exam completed! Score: ${score}% (+${points} points)`, score >= 70 ? 'success' : 'warning');
    }
    
    getGradeFromScore(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }
    
    startExamTimer() {
        const timerElement = document.getElementById('examTimer');
        if (!timerElement) return;
        
        this.examTimer = setInterval(() => {
            const elapsed = Math.floor((new Date() - this.examStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    exitExam() {
        if (confirm('Are you sure you want to exit the exam? Your progress will be lost.')) {
            this.currentExam = null;
            this.examAnswers = {};
            this.examStartTime = null;
            
            if (this.examTimer) {
                clearInterval(this.examTimer);
                this.examTimer = null;
            }
            
            // Hide exam taking interface and show exam library
            document.getElementById('examTaking').style.display = 'none';
            document.getElementById('examResults').style.display = 'none';
            
            // Show exam controls and library
            const examControls = document.querySelector('.exam-controls');
            if (examControls) examControls.style.display = 'block';
            
            const examsLibrary = document.querySelector('.exams-library');
            if (examsLibrary) examsLibrary.style.display = 'block';
            
            this.showNotification('Exam exited', 'info');
        }
    }
    
    retakeCurrentExam() {
        if (this.currentExam) {
            this.takeExam(this.currentExam.id);
        }
    }
    
    backToExams() {
        // Hide exam results and show exam library
        document.getElementById('examResults').style.display = 'none';
        document.getElementById('examTaking').style.display = 'none';
        
        // Show exam controls and library
        const examControls = document.querySelector('.exam-controls');
        if (examControls) examControls.style.display = 'block';
        
        const examsLibrary = document.querySelector('.exams-library');
        if (examsLibrary) examsLibrary.style.display = 'block';
        
        // Reset exam state
        this.currentExam = null;
        this.examAnswers = {};
        this.examStartTime = null;
        
        if (this.examTimer) {
            clearInterval(this.examTimer);
            this.examTimer = null;
        }
    }
    
    // Fix point abuse in capture notes
    capturePhoto() {
        if (!this.stream) {
            this.showNotification('Camera not started', 'error');
            return;
        }
        
        const video = document.getElementById('cameraPreview');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        const note = {
            id: Date.now(),
            image: imageData,
            timestamp: new Date().toLocaleString(),
            extractedText: null
        };
        
        this.notes.push(note);
        this.saveData();
        this.loadNotesGallery();
        this.updateDashboard();
        
        // Limit points to prevent abuse - only give points for first 3 photos per day
        const today = new Date().toDateString();
        const todayNotes = this.notes.filter(n => 
            new Date(n.timestamp).toDateString() === today
        );
        
        if (todayNotes.length <= 3) {
            this.addScore(10);
            this.addActivity('Captured a note photo', 'camera');
            this.showNotification('Note captured successfully! +10 points', 'success');
        } else {
            this.addActivity('Captured a note photo', 'camera');
            this.showNotification('Note captured successfully! (Daily point limit reached)', 'info');
        }
    }
    
    // AI Study Assistant Methods
    async generateStudyTips() {
        try {
            this.showNotification('Generating personalized study advice...', 'info');
            
            // Analyze user data
            const studyData = this.analyzeUserStudyData();
            const advice = this.generatePersonalizedAdvice(studyData);
            
            // Display advice
            this.displayStudyAdvice(advice);
            
            // Add activity and points
            this.addActivity('Generated AI study advice', 'lightbulb');
            this.addScore(5);
            
            this.showNotification('✨ Study advice generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating study advice:', error);
            this.showNotification('Failed to generate study advice. Please try again.', 'error');
        }
    }
    
    async analyzeProgress() {
        try {
            this.showNotification('Analyzing your learning progress...', 'info');
            
            // Calculate progress metrics
            const progressData = this.calculateProgressMetrics();
            const insights = this.generateProgressInsights(progressData);
            
            // Display analysis
            this.displayProgressAnalysis(progressData, insights);
            
            // Add activity and points
            this.addActivity('Analyzed study progress with AI', 'chart-line');
            this.addScore(10);
            
            this.showNotification('📊 Progress analysis complete!', 'success');
            
        } catch (error) {
            console.error('Error analyzing progress:', error);
            this.showNotification('Failed to analyze progress. Please try again.', 'error');
        }
    }
    
    analyzeUserStudyData() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Analyze recent activities
        const recentActivities = this.activities.filter(activity => 
            new Date(activity.timestamp) >= oneWeekAgo
        );
        
        // Calculate study patterns
        const studyFrequency = recentActivities.length;
        const flashcardSessions = recentActivities.filter(a => a.type && a.type.includes('flashcard')).length;
        const examsTaken = recentActivities.filter(a => a.type && a.type.includes('exam')).length;
        const notesCaptured = recentActivities.filter(a => a.type && a.type.includes('note')).length;
        
        // Analyze performance
        const examScores = this.mockExams.map(exam => exam.lastScore || 0).filter(score => score > 0);
        const averageScore = examScores.length > 0 ? 
            examScores.reduce((sum, score) => sum + score, 0) / examScores.length : 0;
        
        // Time analysis
        const studyTimes = recentActivities.map(a => new Date(a.timestamp).getHours());
        const preferredStudyTime = this.getMostFrequentHour(studyTimes);
        
        // Streak calculation
        const studyStreak = this.calculateStudyStreak();
        
        return {
            studyFrequency,
            flashcardSessions,
            examsTaken,
            notesCaptured,
            averageScore,
            preferredStudyTime,
            studyStreak,
            totalScore: this.totalScore,
            totalFlashcards: this.flashcards.length,
            totalNotes: this.notes.length,
            totalExams: this.mockExams.length
        };
    }
    
    generatePersonalizedAdvice(studyData) {
        const advice = [];
        
        // Study frequency advice
        if (studyData.studyFrequency < 3) {
            advice.push({
                type: 'frequency',
                title: 'Increase Study Frequency',
                message: 'Try to study more regularly! Aim for at least 3-4 study sessions per week for better retention.',
                priority: 'high',
                icon: 'calendar-alt'
            });
        } else if (studyData.studyFrequency > 10) {
            advice.push({
                type: 'balance',
                title: 'Balance Your Studies',
                message: 'Great dedication! Remember to take breaks to avoid burnout and improve long-term retention.',
                priority: 'medium',
                icon: 'balance-scale'
            });
        }
        
        // Flashcard usage advice
        if (studyData.flashcardSessions < 2 && studyData.totalFlashcards > 0) {
            advice.push({
                type: 'flashcards',
                title: 'Use Your Flashcards More',
                message: `You have ${studyData.totalFlashcards} flashcards but haven't used them much. Regular flashcard review improves memory retention by 40%!`,
                priority: 'high',
                icon: 'layer-group'
            });
        }
        
        // Exam performance advice
        if (studyData.averageScore < 70 && studyData.examsTaken > 0) {
            advice.push({
                type: 'performance',
                title: 'Focus on Weak Areas',
                message: `Your average exam score is ${studyData.averageScore.toFixed(1)}%. Review incorrect answers and create more flashcards for challenging topics.`,
                priority: 'high',
                icon: 'bullseye'
            });
        } else if (studyData.averageScore > 85) {
            advice.push({
                type: 'excellence',
                title: 'Excellent Performance!',
                message: `Outstanding! Your average score is ${studyData.averageScore.toFixed(1)}%. Consider helping others or tackling more advanced topics.`,
                priority: 'low',
                icon: 'trophy'
            });
        }
        
        // Note-taking advice
        if (studyData.notesCaptured === 0) {
            advice.push({
                type: 'notes',
                title: 'Start Capturing Notes',
                message: 'Use the camera feature to capture important information from textbooks, whiteboards, or handwritten notes!',
                priority: 'medium',
                icon: 'camera'
            });
        }
        
        // Study time optimization
        if (studyData.preferredStudyTime) {
            const timeString = this.formatStudyTime(studyData.preferredStudyTime);
            advice.push({
                type: 'timing',
                title: 'Optimal Study Time',
                message: `You seem most active around ${timeString}. Try to schedule your most challenging study sessions during this time!`,
                priority: 'low',
                icon: 'clock'
            });
        }
        
        // Streak motivation
        if (studyData.studyStreak > 0) {
            advice.push({
                type: 'streak',
                title: 'Keep Your Streak!',
                message: `Amazing! You have a ${studyData.studyStreak}-day study streak. Don't break the chain!`,
                priority: 'low',
                icon: 'fire'
            });
        }
        
        // General motivation
        if (advice.length === 0) {
            advice.push({
                type: 'motivation',
                title: 'You\'re Doing Great!',
                message: 'Your study habits look good! Keep up the consistent effort and consider setting new learning goals.',
                priority: 'low',
                icon: 'heart'
            });
        }
        
        return advice.slice(0, 4); // Limit to 4 pieces of advice
    }
    
    displayStudyAdvice(advice) {
        const container = document.getElementById('recommendationsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        advice.forEach(item => {
            const adviceElement = document.createElement('div');
            adviceElement.className = 'recommendation-item';
            adviceElement.innerHTML = `
                <i class="fas fa-${item.icon}"></i>
                <div class="recommendation-content">
                    <div class="recommendation-title">${item.title}</div>
                    <div class="recommendation-text">${item.message}</div>
                    <span class="recommendation-priority priority-${item.priority}">${item.priority.toUpperCase()}</span>
                </div>
            `;
            container.appendChild(adviceElement);
        });
        
        // Update the main study tip
        const studyTip = document.getElementById('studyTip');
        if (studyTip && advice.length > 0) {
            studyTip.textContent = advice[0].message;
        }
    }
    
    // AI To-Do List Methods
    async generateTodoList() {
        try {
            this.showNotification('Generating personalized to-do list...', 'info');
            
            // Show loading state
            const container = document.getElementById('todoContainer');
            if (container) {
                container.innerHTML = `
                    <div class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>AI is analyzing your progress and grade level...</p>
                    </div>
                `;
            }
            
            // Simulate AI processing time
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate grade-specific and personalized tasks
            const tasks = this.generateGradeSpecificTasks();
            this.todoList = tasks;
            
            // Display the tasks
            this.displayTodoList();
            
            // Award points and track activity
            this.addScore(15);
            this.addActivity('Generated AI to-do list', 'tasks');
            
            this.showNotification('✨ AI to-do list generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating to-do list:', error);
            this.showNotification('Failed to generate to-do list. Please try again.', 'error');
        }
    }
    
    // Helper methods for AI functionality
    getMostFrequentHour(hours) {
        if (hours.length === 0) return null;
        
        const hourCounts = {};
        hours.forEach(hour => {
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        return Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
    }
    
    formatStudyTime(hour) {
        const h = parseInt(hour);
        if (h === 0) return '12:00 AM';
        if (h < 12) return `${h}:00 AM`;
        if (h === 12) return '12:00 PM';
        return `${h - 12}:00 PM`;
    }
    
    calculateStudyStreak() {
        if (this.activities.length === 0) return 0;
        
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        // Check each day going backwards
        for (let i = 0; i < 30; i++) { // Check up to 30 days
            const dateString = currentDate.toDateString();
            const hasActivity = this.activities.some(activity => 
                new Date(activity.timestamp).toDateString() === dateString
            );
            
            if (hasActivity) {
                streak++;
            } else if (i > 0) { // Don't break on the first day (today)
                break;
            }
            
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return streak;
    }
    
    calculateAverageExamScore() {
        const scores = this.mockExams.map(exam => exam.lastScore || 0).filter(score => score > 0);
        return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    }
    
    calculatePerformanceTrend(recentExams) {
        if (recentExams.length < 2) return 'stable';
        
        const scores = recentExams.map(exam => exam.lastScore || 0);
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg + 5) return 'improving';
        if (secondAvg < firstAvg - 5) return 'declining';
        return 'stable';
    }
    
    getMostActiveDay() {
        const dayCounts = {};
        this.activities.forEach(activity => {
            const day = new Date(activity.timestamp).getDay();
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const mostActiveDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b, 0);
        return days[mostActiveDay] || 'No data';
    }
    
    calculateStudyConsistency() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const studyDays = new Set();
        this.activities.forEach(activity => {
            const activityDate = new Date(activity.timestamp);
            if (activityDate >= oneWeekAgo) {
                studyDays.add(activityDate.toDateString());
            }
        });
        
        return studyDays.size / 7; // Consistency over the past week
    }
    
    // Notes Management Methods
    updateNotesDisplay() {
        const notesGrid = document.getElementById('notesGrid');
        const generateBtn = document.getElementById('generateFlashcardsBtn');
        
        if (!notesGrid) return;
        
        if (this.notes.length === 0) {
            notesGrid.innerHTML = '<p class="empty-state">No notes captured yet. Start by taking a photo! 📸</p>';
            if (generateBtn) generateBtn.disabled = true;
        } else {
            if (generateBtn) generateBtn.disabled = false;
            notesGrid.innerHTML = '';
            
            this.notes.forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.className = 'note-item';
                noteElement.innerHTML = `
                    <img src="${note.imageData || note.image}" alt="Note ${note.id}" onclick="this.classList.toggle('expanded')">
                    <div class="note-info">
                        <small>${new Date(note.timestamp).toLocaleString()}</small>
                        <button class="btn btn-sm btn-danger" onclick="studyBuddy.deleteNote('${note.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                notesGrid.appendChild(noteElement);
            });
        }
    }
    
    loadNotesGallery() {
        const notesGrid = document.getElementById('notesGrid');
        if (!notesGrid) return;
        
        if (this.notes.length === 0) {
            notesGrid.innerHTML = '<p class="empty-state">No notes captured yet. Start by taking a photo! 📸</p>';
            return;
        }
        
        notesGrid.innerHTML = this.notes.map(note => `
            <div class="note-item">
                <img src="${note.imageData || note.image}" alt="${note.title || 'Note'}" onclick="studyBuddy.viewNoteDetails('${note.id}')">
                <div class="note-info">
                    <h4>${note.title || 'Untitled Note'}</h4>
                    <p>${new Date(note.timestamp).toLocaleDateString()}</p>
                    <div class="note-actions">
                        <button class="btn btn-sm btn-primary" onclick="studyBuddy.viewNoteDetails('${note.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="studyBuddy.deleteNote('${note.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    deleteNote(noteId) {
        const noteIndex = this.notes.findIndex(note => note.id === noteId);
        if (noteIndex === -1) {
            this.showNotification('Note not found', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to delete this note?')) {
            const deletedNote = this.notes.splice(noteIndex, 1)[0];
            
            // Save updated data
            this.saveUserData();
            
            // Update displays
            this.updateNotesDisplay();
            this.loadNotesGallery();
            
            // Add activity and show notification
            this.addActivity('Deleted a note', 'trash');
            this.showNotification('Note deleted successfully', 'success');
            
            // Clean up OCR data if it exists
            if (this.extractedTexts && this.extractedTexts.has(noteId)) {
                this.extractedTexts.delete(noteId);
            }
        }
    }
    
    viewNoteDetails(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) {
            this.showNotification('Note not found', 'error');
            return;
        }
        
        // Create a modal to show note details
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-sticky-note"></i> ${note.title || 'Note Details'}</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="note-preview">
                        <img src="${note.imageData || note.image}" alt="Note" style="max-width: 100%; height: auto; border-radius: 8px;">
                    </div>
                    <div class="note-details" style="margin-top: 1rem;">
                        <p><strong>Created:</strong> ${new Date(note.timestamp).toLocaleString()}</p>
                        ${note.extractedText ? `<div class="extracted-text"><strong>Extracted Text:</strong><div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 5px; margin-top: 0.5rem;">${note.extractedText}</div></div>` : ''}
                    </div>
                    <div class="note-actions" style="margin-top: 1rem; display: flex; gap: 1rem;">
                        <button class="btn btn-primary" onclick="studyBuddy.generateFlashcardsFromNote('${noteId}')">
                            <i class="fas fa-layer-group"></i> Generate Flashcards
                        </button>
                        <button class="btn btn-danger" onclick="studyBuddy.deleteNote('${noteId}'); this.closest('.modal').remove();">
                            <i class="fas fa-trash"></i> Delete Note
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    addNoteFromCamera() {
        // This method handles adding notes from camera capture
        const video = document.getElementById('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!video || !video.videoWidth) {
            this.showNotification('Camera not ready. Please try again.', 'error');
            return;
        }
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Create note object
        const note = {
            id: Date.now().toString(),
            title: `Note ${this.notes.length + 1}`,
            imageData: imageData,
            timestamp: new Date().toISOString(),
            extractedText: null
        };
        
        // Add to notes array
        this.notes.push(note);
        
        // Save data
        this.saveUserData();
        
        // Update displays
        this.updateNotesDisplay();
        this.loadNotesGallery();
        
        // Add activity and points
        this.addActivity('Captured a new note', 'camera');
        
        // Check for point abuse prevention
        const today = new Date().toDateString();
        const todaysNotes = this.notes.filter(n => 
            new Date(n.timestamp).toDateString() === today
        ).length;
        
        if (todaysNotes <= 10) { // Limit points to prevent abuse
            this.addScore(2);
            this.showNotification('Note captured successfully! (+2 points)', 'success');
        } else {
            this.showNotification('Note captured successfully! (Daily point limit reached)', 'info');
        }
        
        // Hide camera interface
        this.stopCamera();
        
        return note;
    }
    
    generateFlashcardsFromNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) {
            this.showNotification('Note not found', 'error');
            return;
        }
        
        this.showNotification('Generating flashcards from note...', 'info');
        
        // Simulate AI processing for flashcard generation
        setTimeout(() => {
            const flashcards = this.generateSampleFlashcardsFromNote(note);
            
            flashcards.forEach(flashcard => {
                this.flashcards.push(flashcard);
            });
            
            this.saveUserData();
            this.addActivity(`Generated ${flashcards.length} flashcards from note`, 'layer-group');
            this.addScore(flashcards.length * 3);
            
            this.showNotification(`Generated ${flashcards.length} flashcards from your note! (+${flashcards.length * 3} points)`, 'success');
            
            // Close modal if open
            const modal = document.querySelector('.modal');
            if (modal) modal.remove();
            
        }, 2000);
    }
    
    generateSampleFlashcardsFromNote(note) {
        // Generate sample flashcards based on note content
        const flashcards = [];
        const topics = [
            'Key Concept',
            'Important Formula',
            'Definition',
            'Example',
            'Process Step'
        ];
        
        for (let i = 0; i < 3; i++) {
            const topic = topics[i % topics.length];
            flashcards.push({
                id: Date.now() + i,
                front: `${topic} from Note ${note.title}`,
                back: `This is the explanation or answer for ${topic.toLowerCase()} found in your captured note. Review your note image for specific details.`,
                category: 'From Notes',
                difficulty: 'Medium',
                timestamp: new Date().toISOString(),
                sourceNoteId: note.id
            });
        }
        
        return flashcards;
    }
    
    calculateProgressMetrics() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Weekly metrics
        const weeklyActivities = this.activities.filter(a => new Date(a.timestamp) >= oneWeekAgo);
        const weeklyScore = weeklyActivities.reduce((sum, a) => sum + (a.points || 0), 0);
        
        // Monthly metrics
        const monthlyActivities = this.activities.filter(a => new Date(a.timestamp) >= oneMonthAgo);
        
        // Performance trends
        const recentExams = this.mockExams.filter(exam => 
            exam.lastAttempt && new Date(exam.lastAttempt) >= oneWeekAgo
        ).sort((a, b) => new Date(a.lastAttempt) - new Date(b.lastAttempt));
        
        const performanceTrend = this.calculatePerformanceTrend(recentExams);
        
        return {
            totalScore: this.totalScore,
            weeklyScore,
            weeklyActivities: weeklyActivities.length,
            monthlyActivities: monthlyActivities.length,
            totalFlashcards: this.flashcards.length,
            totalNotes: this.notes.length,
            totalExams: this.mockExams.length,
            averageExamScore: this.calculateAverageExamScore(),
            studyStreak: this.calculateStudyStreak(),
            performanceTrend,
            mostActiveDay: this.getMostActiveDay(),
            studyConsistency: this.calculateStudyConsistency()
        };
    }
    
    generateProgressInsights(data) {
        const insights = [];
        
        // Score insights
        if (data.weeklyScore > 100) {
            insights.push('🔥 You\'ve been very active this week with ' + data.weeklyScore + ' points!');
        }
        
        // Performance trend insights
        if (data.performanceTrend === 'improving') {
            insights.push('📈 Your exam scores are improving - keep up the great work!');
        } else if (data.performanceTrend === 'declining') {
            insights.push('📉 Your recent scores show room for improvement. Consider reviewing challenging topics.');
        }
        
        // Consistency insights
        if (data.studyConsistency > 0.7) {
            insights.push('🎯 Excellent study consistency! You\'re building strong learning habits.');
        } else if (data.studyConsistency < 0.3) {
            insights.push('⚠️ Try to study more consistently. Regular practice leads to better retention.');
        }
        
        // Activity insights
        if (data.mostActiveDay !== 'No data') {
            insights.push(`📅 You\'re most active on ${data.mostActiveDay}s. Consider scheduling important study sessions then.`);
        }
        
        // Streak insights
        if (data.studyStreak >= 7) {
            insights.push(`🔥 Amazing ${data.studyStreak}-day study streak! You\'re on fire!`);
        } else if (data.studyStreak === 0) {
            insights.push('💪 Start building a study streak today - consistency is key to success!');
        }
        
        // Content insights
        if (data.totalFlashcards === 0) {
            insights.push('📚 Create some flashcards to boost your memory retention!');
        }
        
        if (data.totalExams === 0) {
            insights.push('📝 Upload practice exams to test your knowledge!');
        }
        
        return insights.slice(0, 5); // Limit to 5 insights
    }
    
    displayProgressAnalysis(progressData, insights) {
        // Update progress metrics in the UI
        const elements = {
            'totalScore': progressData.totalScore,
            'weeklyScore': progressData.weeklyScore,
            'studyStreak': progressData.studyStreak,
            'averageScore': Math.round(progressData.averageExamScore),
            'studyConsistency': Math.round(progressData.studyConsistency * 100)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value + (id === 'studyConsistency' ? '%' : '');
            }
        });
        
        // Display insights
        const insightsContainer = document.getElementById('progressInsights');
        if (insightsContainer && insights.length > 0) {
            insightsContainer.innerHTML = insights.map(insight => 
                `<div class="insight-item">${insight}</div>`
            ).join('');
        }
        
        // Update performance trend indicator
        const trendElement = document.getElementById('performanceTrend');
        if (trendElement) {
            trendElement.textContent = progressData.performanceTrend;
            trendElement.className = `trend-${progressData.performanceTrend}`;
        }
        
        // Update activity summary
        const activitySummary = document.getElementById('activitySummary');
        if (activitySummary) {
            activitySummary.innerHTML = `
                <div class="activity-stat">
                    <span class="stat-label">This Week:</span>
                    <span class="stat-value">${progressData.weeklyActivities} activities</span>
                </div>
                <div class="activity-stat">
                    <span class="stat-label">This Month:</span>
                    <span class="stat-value">${progressData.monthlyActivities} activities</span>
                </div>
                <div class="activity-stat">
                    <span class="stat-label">Most Active:</span>
                    <span class="stat-value">${progressData.mostActiveDay}</span>
                </div>
            `;
        }
    }
}

// Initialize the app when the page loads
let studyBuddy;
document.addEventListener('DOMContentLoaded', () => {
    studyBuddy = new StudyBuddy();
    
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('StudyBuddy PWA: Service Worker registered successfully:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            if (confirm('A new version of StudyBuddy is available. Reload to update?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('StudyBuddy PWA: Service Worker registration failed:', error);
            });
    }
    
    // Handle PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('StudyBuddy PWA: Install prompt triggered');
        e.preventDefault();
        deferredPrompt = e;
        
        // Show custom install button
        showInstallPrompt();
    });
    
    // Handle successful PWA installation
    window.addEventListener('appinstalled', (evt) => {
        console.log('StudyBuddy PWA: App installed successfully');
        if (studyBuddy) {
            studyBuddy.showNotification('StudyBuddy installed successfully! 🎉', 'success');
        }
    });
    
    // Handle PWA shortcuts
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action && studyBuddy) {
        setTimeout(() => {
            switch (action) {
                case 'todo':
                    studyBuddy.showSection('dashboard');
                    studyBuddy.generateTodoList();
                    break;
                case 'flashcards':
                    studyBuddy.showSection('flashcards');
                    break;
                case 'exam':
                    studyBuddy.showSection('mock-exams');
                    break;
            }
        }, 1000);
    }
});

// Show PWA install prompt
function showInstallPrompt() {
    const installBanner = document.createElement('div');
    installBanner.className = 'install-banner';
    installBanner.innerHTML = `
        <div class="install-content">
            <i class="fas fa-download"></i>
            <span>Install StudyBuddy for the best experience!</span>
            <button id="installBtn" class="btn btn-primary btn-sm">Install App</button>
            <button id="dismissInstall" class="btn btn-secondary btn-sm">×</button>
        </div>
    `;
    
    document.body.appendChild(installBanner);
    
    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('StudyBuddy PWA: User choice:', outcome);
            deferredPrompt = null;
            installBanner.remove();
        }
    });
    
    document.getElementById('dismissInstall').addEventListener('click', () => {
        installBanner.remove();
    });
}

// Add fun animations and interactions
document.addEventListener('DOMContentLoaded', () => {
    // Add click animations to buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn')) {
            e.target.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.target.style.transform = '';
            }, 150);
        }
    });
    
    // Add hover effects to cards
    const observeCards = () => {
        const cards = document.querySelectorAll('.stat-card, .note-item, .flashcard-item, .exam-item');
        cards.forEach(card => {
            if (!card.hasAttribute('data-hover-added')) {
                card.setAttribute('data-hover-added', 'true');
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-5px)';
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            }
        });
    };
    
    // Observe for new cards being added
    const observer = new MutationObserver(observeCards);
    observer.observe(document.body, { childList: true, subtree: true });
    observeCards(); // Initial setup
});

// Add CSS animations and styles
const style = document.createElement('style');
style.textContent = `
    @keyframes bounce {
        0%, 20%, 60%, 100% {
            transform: translate(-50%, -50%) translateY(0);
        }
        40% {
            transform: translate(-50%, -50%) translateY(-30px);
        }
        80% {
            transform: translate(-50%, -50%) translateY(-15px);
        }
    }
    
    .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
    }
    
    .activity-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        border-left: 3px solid #4facfe;
        transition: transform 0.2s ease;
    }
    
    .activity-item:hover {
        transform: translateX(5px);
    }
    
    .activity-item i {
        color: #4facfe;
        width: 20px;
        text-align: center;
    }
    
    .activity-item small {
        margin-left: auto;
        color: #6c757d;
        font-size: 0.75rem;
    }
    
    .dragover {
        border-color: #28a745 !important;
        background: #d4edda !important;
    }
`;
document.head.appendChild(style);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                studyBuddy.switchSection('dashboard');
                break;
            case '2':
                e.preventDefault();
                studyBuddy.switchSection('notes');
                break;
            case '3':
                e.preventDefault();
                studyBuddy.switchSection('upload');
                break;
            case '4':
                e.preventDefault();
                studyBuddy.switchSection('flashcards');
                break;
            case '5':
                e.preventDefault();
                studyBuddy.switchSection('mock-exams');
                break;
        }
    }
    
    // Space bar to flip flashcard in study mode
    if (e.code === 'Space' && studyBuddy && studyBuddy.studyMode) {
        e.preventDefault();
        studyBuddy.flipFlashcard();
    }
    
    // Arrow keys for flashcard navigation
    if (studyBuddy && studyBuddy.studyMode) {
        if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
            e.preventDefault();
            studyBuddy.nextFlashcard();
        }
    }
});

// Add motivational messages
const motivationalMessages = [
    "Great job studying! 🌟",
    "You're doing amazing! 🎉",
    "Keep up the excellent work! 💪",
    "Learning is fun with StudyBuddy! 📚",
    "You're getting smarter every day! 🧠",
    "Practice makes perfect! ✨",
    "You're on fire! 🔥",
    "Knowledge is power! ⚡"
];

// Show random motivational message every 5 minutes
setInterval(() => {
    if (studyBuddy && Math.random() > 0.7) {
        const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        studyBuddy.showNotification(message, 'success');
    }
}, 300000); // 5 minutes
