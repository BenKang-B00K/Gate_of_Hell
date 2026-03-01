/* js/logger.js - QA Logging System */

const GameLogger = {
    logs: [],
    maxLogs: 100,
    isEnabled: true,
    isUIVisible: false,

    init() {
        console.log("🛠️ GameLogger Initialized.");
        this.createLogUI();
        
        // Intercept global errors
        window.onerror = (msg, url, line, col, error) => {
            this.error(`[Global Error] ${msg} at ${line}:${col}`);
            return false; 
        };
    },

    log(message, type = 'info') {
        if (!this.isEnabled) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, message, type };
        
        this.logs.unshift(logEntry);
        if (this.logs.length > this.maxLogs) this.logs.pop();

        // Standard console output
        const styles = {
            info: 'color: #00e5ff',
            warn: 'color: #ffa500',
            error: 'color: #ff1744; font-weight: bold',
            debug: 'color: #9400d3',
            success: 'color: #00ff00'
        };
        console.log(`%c[${timestamp}] [${type.toUpperCase()}] ${message}`, styles[type] || '');

        this.updateLogUI();
    },

    info(msg) { this.log(msg, 'info'); },
    warn(msg) { this.log(msg, 'warn'); },
    error(msg) { this.log(msg, 'error'); },
    debug(msg) { this.log(msg, 'debug'); },
    success(msg) { this.log(msg, 'success'); },

    createLogUI() {
        const container = document.createElement('div');
        container.id = 'qa-log-console';
        container.style.cssText = `
            position: fixed; top: 10px; right: 10px; width: 300px; height: 400px;
            background: rgba(0, 0, 0, 0.85); color: #fff; font-family: monospace;
            font-size: 12px; z-index: 10000; border: 2px solid #444; border-radius: 8px;
            display: none; flex-direction: column; overflow: hidden; pointer-events: auto;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 8px; background: #222; border-bottom: 1px solid #444;
            display: flex; justify-content: space-between; align-items: center;
            font-weight: bold; color: #ffd700; cursor: move;
        `;
        header.innerHTML = `<span>🛡️ QA CONSOLE</span><button id="close-qa-btn" style="background:none; border:none; color:#ff1744; cursor:pointer; font-weight:bold;">[X]</button>`;
        
        const content = document.createElement('div');
        content.id = 'qa-log-content';
        content.style.cssText = `flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 4px;`;

        container.appendChild(header);
        container.appendChild(content);
        document.body.appendChild(container);

        header.querySelector('#close-qa-btn').onclick = () => this.toggleUI();

        // Keyboard Shortcut: ` (Backtick) or Ctrl+L to toggle
        window.addEventListener('keydown', (e) => {
            if (e.key === '`' || (e.ctrlKey && e.key === 'l')) {
                this.toggleUI();
            }
        });
    },

    toggleUI() {
        this.isUIVisible = !this.isUIVisible;
        const el = document.getElementById('qa-log-console');
        if (el) el.style.display = this.isUIVisible ? 'flex' : 'none';
    },

    updateLogUI() {
        const content = document.getElementById('qa-log-content');
        if (!content || !this.isUIVisible) return;

        content.innerHTML = this.logs.map(log => {
            let color = '#ccc';
            if (log.type === 'error') color = '#ff1744';
            if (log.type === 'warn') color = '#ffa500';
            if (log.type === 'success') color = '#00ff00';
            if (log.type === 'debug') color = '#9400d3';
            return `<div style="border-bottom: 1px solid #222; padding-bottom: 2px;">
                <span style="color:#666;">[${log.timestamp}]</span> 
                <span style="color:${color};">${log.message}</span>
            </div>`;
        }).join('');
    }
};

// Global Export
window.GameLogger = GameLogger;
document.addEventListener('DOMContentLoaded', () => GameLogger.init());
