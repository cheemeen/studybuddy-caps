const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // File dialogs
    showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
    showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
    
    // Navigation listeners
    onNavigateTo: (callback) => ipcRenderer.on('navigate-to', callback),
    onGenerateTodo: (callback) => ipcRenderer.on('generate-todo', callback),
    onGenerateStudyTips: (callback) => ipcRenderer.on('generate-study-tips', callback),
    onAnalyzeProgress: (callback) => ipcRenderer.on('analyze-progress', callback),
    onSmartFlashcards: (callback) => ipcRenderer.on('smart-flashcards', callback),
    onShowPreferences: (callback) => ipcRenderer.on('show-preferences', callback),
    onShowStudyTips: (callback) => ipcRenderer.on('show-study-tips', callback),
    
    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    
    // Platform info
    platform: process.platform,
    isElectron: true
});

// StudyBuddy specific API
contextBridge.exposeInMainWorld('studyBuddyElectron', {
    // Check if running in Electron
    isElectron: true,
    
    // Platform detection
    isWindows: process.platform === 'win32',
    isMac: process.platform === 'darwin',
    isLinux: process.platform === 'linux',
    
    // App metadata
    appName: 'StudyBuddy CAPS',
    appVersion: '1.0.0',
    
    // Enhanced data storage APIs
    saveUserData: (key, data) => ipcRenderer.invoke('save-user-data', key, data),
    loadUserData: (key) => ipcRenderer.invoke('load-user-data', key),
    deleteUserData: (key) => ipcRenderer.invoke('delete-user-data', key),
    getDataFiles: () => ipcRenderer.invoke('get-data-files'),
    exportUserData: (exportPath) => ipcRenderer.invoke('export-user-data', exportPath),
    importUserData: (importPath) => ipcRenderer.invoke('import-user-data', importPath),
    getDataPath: () => ipcRenderer.invoke('get-data-path'),
    
    // Feature flags for Electron-specific features
    features: {
        nativeMenus: true,
        fileSystemAccess: true,
        notifications: true,
        autoUpdater: true,
        offlineMode: true,
        enhancedDataStorage: true
    }
});

console.log('StudyBuddy Electron preload script loaded');
