/* js/logger.js - Responsive QA Logging System */

const GameLogger = {
    logs: [],
    maxLogs: 50,
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

        const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const logEntry = { timestamp, message, type };
        
        this.logs.unshift(logEntry);
        if (this.logs.length > this.maxLogs) this.logs.pop();

        // Console output
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
        // Responsive CSS for 1080x1920
        container.style.cssText = `
            position: fixed; top: 5%; right: 5%; width: 80%; max-width: 300px; height: 30%;
            background: rgba(0, 0, 0, 0.9); color: #fff; font-family: 'Courier New', monospace;
            font-size: clamp(8px, 1.5vw, 11px); z-index: 9999; border: 2px solid #444; border-radius: 8px;
            display: none; flex-direction: column; overflow: hidden; pointer-events: auto;
            box-shadow: 0 0 30px rgba(0,0,0,0.8); backdrop-filter: blur(5px);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 6px 10px; background: #1a1a1a; border-bottom: 1px solid #333;
            display: flex; justify-content: space-between; align-items: center;
            font-weight: bold; color: #ffd700; cursor: grab; user-select: none;
        `;
        header.innerHTML = `<span>🛡️ LOG SYSTEM</span><button id="close-qa-btn" style="background:none; border:none; color:#ff1744; cursor:pointer; font-weight:bold; font-size:14px;">[×]</button>`;
        
        const content = document.id = 'qa-log-content';
        const contentDiv = document.createElement('div');
        contentDiv.id = 'qa-log-content';
        contentDiv.style.cssText = `flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 2px; scrollbar-width: thin;`;

        container.appendChild(header);
        container.appendChild(contentDiv);
        document.body.appendChild(container);

        header.querySelector('#close-qa-btn').onclick = (e) => { e.stopPropagation(); this.toggleUI(); };

        // Keyboard Shortcut: ` (Backtick) or Settings button long press
        window.addEventListener('keydown', (e) => {
            if (e.key === '`') this.toggleUI();
        });

        // Simple drag logic
        let isDragging = false;
        let offset = { x: 0, y: 0 };
        header.onmousedown = (e) => {
            isDragging = true;
            offset.x = e.clientX - container.offsetLeft;
            offset.y = e.clientY - container.offsetTop;
            header.style.cursor = 'grabbing';
        };
        window.onmousemove = (e) => {
            if (isDragging) {
                container.style.left = (e.clientX - offset.x) + 'px';
                container.style.top = (e.clientY - offset.y) + 'px';
                container.style.right = 'auto';
            }
        };
        window.onmouseup = () => { isDragging = false; header.style.cursor = 'grab'; };
    },

    toggleUI() {
        this.isUIVisible = !this.isUIVisible;
        const el = document.getElementById('qa-log-console');
        if (el) {
            el.style.display = this.isUIVisible ? 'flex' : 'none';
            if (this.isUIVisible) this.updateLogUI();
        }
    },

    updateLogUI() {
        const content = document.getElementById('qa-log-content');
        if (!content || !this.isUIVisible) return;

        content.innerHTML = this.logs.map(log => {
            let color = '#00e5ff';
            if (log.type === 'error') color = '#ff1744';
            if (log.type === 'warn') color = '#ffa500';
            if (log.type === 'success') color = '#00ff00';
            if (log.type === 'debug') color = '#9400d3';
            return `<div style="border-bottom: 1px solid #222; padding-bottom: 1px; line-height: 1.2;">
                <span style="color:#555; font-size:0.9em;">[${log.timestamp}]</span> 
                <span style="color:${color};">${log.message}</span>
            </div>`;
        }).join('');
        content.scrollTop = 0;
    }
};

// Global Export
window.GameLogger = GameLogger;
document.addEventListener('DOMContentLoaded', () => GameLogger.init());
