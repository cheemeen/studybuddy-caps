const { app, ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');

class ElectronDataStorage {
    constructor() {
        this.userDataPath = app.getPath('userData');
        this.dataDir = path.join(this.userDataPath, 'StudyBuddy');
        this.init();
    }

    async init() {
        try {
            // Ensure data directory exists
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Setup IPC handlers for data operations
            this.setupIPCHandlers();
            
            console.log('StudyBuddy data storage initialized at:', this.dataDir);
        } catch (error) {
            console.error('Failed to initialize data storage:', error);
        }
    }

    setupIPCHandlers() {
        // Save user data
        ipcMain.handle('save-user-data', async (event, key, data) => {
            try {
                const filePath = path.join(this.dataDir, `${key}.json`);
                await fs.writeFile(filePath, JSON.stringify(data, null, 2));
                return { success: true };
            } catch (error) {
                console.error('Failed to save data:', error);
                return { success: false, error: error.message };
            }
        });

        // Load user data
        ipcMain.handle('load-user-data', async (event, key) => {
            try {
                const filePath = path.join(this.dataDir, `${key}.json`);
                const data = await fs.readFile(filePath, 'utf8');
                return { success: true, data: JSON.parse(data) };
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // File doesn't exist, return empty data
                    return { success: true, data: null };
                }
                console.error('Failed to load data:', error);
                return { success: false, error: error.message };
            }
        });

        // Get all user data files
        ipcMain.handle('get-data-files', async () => {
            try {
                const files = await fs.readdir(this.dataDir);
                return { success: true, files: files.filter(f => f.endsWith('.json')) };
            } catch (error) {
                console.error('Failed to get data files:', error);
                return { success: false, error: error.message };
            }
        });

        // Delete user data
        ipcMain.handle('delete-user-data', async (event, key) => {
            try {
                const filePath = path.join(this.dataDir, `${key}.json`);
                await fs.unlink(filePath);
                return { success: true };
            } catch (error) {
                console.error('Failed to delete data:', error);
                return { success: false, error: error.message };
            }
        });

        // Export user data
        ipcMain.handle('export-user-data', async (event, exportPath) => {
            try {
                const files = await fs.readdir(this.dataDir);
                const userData = {};
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const key = file.replace('.json', '');
                        const filePath = path.join(this.dataDir, file);
                        const data = await fs.readFile(filePath, 'utf8');
                        userData[key] = JSON.parse(data);
                    }
                }
                
                await fs.writeFile(exportPath, JSON.stringify(userData, null, 2));
                return { success: true };
            } catch (error) {
                console.error('Failed to export data:', error);
                return { success: false, error: error.message };
            }
        });

        // Import user data
        ipcMain.handle('import-user-data', async (event, importPath) => {
            try {
                const data = await fs.readFile(importPath, 'utf8');
                const userData = JSON.parse(data);
                
                for (const [key, value] of Object.entries(userData)) {
                    const filePath = path.join(this.dataDir, `${key}.json`);
                    await fs.writeFile(filePath, JSON.stringify(value, null, 2));
                }
                
                return { success: true };
            } catch (error) {
                console.error('Failed to import data:', error);
                return { success: false, error: error.message };
            }
        });

        // Get data directory path
        ipcMain.handle('get-data-path', () => {
            return { success: true, path: this.dataDir };
        });
    }
}

module.exports = ElectronDataStorage;
