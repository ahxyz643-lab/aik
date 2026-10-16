import { a as PROVIDER_LIST, t as DEFAULT_MODEL } from "./constants-CaqEnYX9.js";
import { n as logger } from "./logger-D7cp7B9y.js";
//#region app/utils/os.ts
var isMac = typeof navigator !== "undefined" ? navigator.platform.toLowerCase().includes("mac") : false;
var isWindows = typeof navigator !== "undefined" ? navigator.platform.toLowerCase().includes("win") : false;
var isLinux = typeof navigator !== "undefined" ? navigator.platform.toLowerCase().includes("linux") : false;
//#endregion
//#region app/utils/mobile.ts
function isMobile() {
	return globalThis.innerWidth < 640;
}
//#endregion
//#region app/utils/debugLogger.ts
var logStore = null;
var getLogStore = () => {
	if (!logStore && typeof window !== "undefined") try {
		import("./logs-BndizCRE.js").then(({ logStore: store }) => {
			logStore = store;
		}).catch(() => {});
	} catch {}
	return logStore;
};
var CircularBuffer = class {
	_capacity;
	_buffer;
	_head = 0;
	_tail = 0;
	_size = 0;
	constructor(_capacity) {
		this._capacity = _capacity;
		this._buffer = new Array(_capacity);
	}
	push(item) {
		this._buffer[this._tail] = item;
		this._tail = (this._tail + 1) % this._capacity;
		if (this._size < this._capacity) this._size++;
		else this._head = (this._head + 1) % this._capacity;
	}
	toArray() {
		const result = [];
		let current = this._head;
		for (let i = 0; i < this._size; i++) {
			const item = this._buffer[current];
			if (item !== void 0) result.push(item);
			current = (current + 1) % this._capacity;
		}
		return result;
	}
	clear() {
		this._buffer = new Array(this._capacity);
		this._head = 0;
		this._tail = 0;
		this._size = 0;
	}
	getSize() {
		return this._size;
	}
};
var DebugLogger = class {
	_logs;
	_errors;
	_networkRequests;
	_userActions;
	_terminalLogs;
	_config;
	_isCapturing = false;
	_isInitialized = false;
	_originalConsoleLog;
	_originalConsoleError;
	_originalConsoleWarn;
	_originalFetch = null;
	_boundErrorHandler;
	_boundRejectionHandler;
	_boundUnloadHandler;
	_terminalLogQueue = [];
	_terminalLogTimer = null;
	_seenObjects = /* @__PURE__ */ new WeakSet();
	constructor(config = {}) {
		this._config = {
			enabled: false,
			maxEntries: 1e3,
			captureConsole: true,
			captureNetwork: true,
			captureErrors: true,
			debounceTerminal: 100,
			...config
		};
		this._logs = new CircularBuffer(this._config.maxEntries);
		this._errors = new CircularBuffer(this._config.maxEntries);
		this._networkRequests = new CircularBuffer(this._config.maxEntries);
		this._userActions = new CircularBuffer(this._config.maxEntries);
		this._terminalLogs = new CircularBuffer(this._config.maxEntries);
		this._originalConsoleLog = console.log;
		this._originalConsoleError = console.error;
		this._originalConsoleWarn = console.warn;
		this._boundErrorHandler = this._handleError.bind(this);
		this._boundRejectionHandler = this._handleUnhandledRejection.bind(this);
		this._boundUnloadHandler = this._cleanup.bind(this);
		if (typeof window !== "undefined") window.addEventListener("beforeunload", this._boundUnloadHandler);
	}
	initialize() {
		if (this._isInitialized) return;
		try {
			if (typeof window === "undefined") return;
			this._isInitialized = true;
			if (this._config.enabled) this.startCapture();
			logger.info("Debug logger initialized");
		} catch (error) {
			logger.error("Failed to initialize debug logger:", error);
		}
	}
	startCapture() {
		if (this._isCapturing) return;
		try {
			this._isCapturing = true;
			this._config.enabled = true;
			if (this._config.captureConsole) this._interceptConsole();
			if (this._config.captureErrors) this._interceptErrors();
			if (this._config.captureNetwork) this._interceptNetwork();
			logger.info("Debug logging started");
		} catch (error) {
			logger.error("Failed to start debug capture:", error);
			this._isCapturing = false;
		}
	}
	stopCapture() {
		if (!this._isCapturing) return;
		try {
			this._isCapturing = false;
			this._config.enabled = false;
			this._restoreConsole();
			this._restoreErrors();
			this._restoreNetwork();
			if (this._terminalLogTimer) {
				clearTimeout(this._terminalLogTimer);
				this._terminalLogTimer = null;
				this._flushTerminalLogs();
			}
			logger.info("Debug logging stopped");
		} catch (error) {
			logger.error("Failed to stop debug capture:", error);
		}
	}
	enableDebugMode() {
		this._config.enabled = true;
		if (!this._isInitialized) this.initialize();
		else if (!this._isCapturing) this.startCapture();
	}
	disableDebugMode() {
		this.stopCapture();
	}
	getStatus() {
		return {
			initialized: this._isInitialized,
			capturing: this._isCapturing,
			enabled: this._config.enabled
		};
	}
	updateConfig(newConfig) {
		const wasCapturing = this._isCapturing;
		if (wasCapturing) this.stopCapture();
		this._config = {
			...this._config,
			...newConfig
		};
		if (newConfig.maxEntries && newConfig.maxEntries !== this._config.maxEntries) {
			const oldLogs = this._logs.toArray();
			const oldErrors = this._errors.toArray();
			const oldNetworkRequests = this._networkRequests.toArray();
			const oldUserActions = this._userActions.toArray();
			const oldTerminalLogs = this._terminalLogs.toArray();
			this._logs = new CircularBuffer(this._config.maxEntries);
			this._errors = new CircularBuffer(this._config.maxEntries);
			this._networkRequests = new CircularBuffer(this._config.maxEntries);
			this._userActions = new CircularBuffer(this._config.maxEntries);
			this._terminalLogs = new CircularBuffer(this._config.maxEntries);
			oldLogs.forEach((log) => this._logs.push(log));
			oldErrors.forEach((error) => this._errors.push(error));
			oldNetworkRequests.forEach((request) => this._networkRequests.push(request));
			oldUserActions.forEach((action) => this._userActions.push(action));
			oldTerminalLogs.forEach((log) => this._terminalLogs.push(log));
		}
		if (wasCapturing && this._config.enabled) this.startCapture();
	}
	_cleanup() {
		this.stopCapture();
		if (typeof window !== "undefined") window.removeEventListener("beforeunload", this._boundUnloadHandler);
	}
	_interceptConsole() {
		const self = this;
		console.log = function(...args) {
			self.captureLog("info", void 0, args);
			self._originalConsoleLog.apply(console, args);
		};
		console.error = function(...args) {
			self.captureLog("error", void 0, args);
			self._originalConsoleError.apply(console, args);
		};
		console.warn = function(...args) {
			self.captureLog("warn", void 0, args);
			self._originalConsoleWarn.apply(console, args);
		};
	}
	_restoreConsole() {
		console.log = this._originalConsoleLog;
		console.error = this._originalConsoleError;
		console.warn = this._originalConsoleWarn;
	}
	_interceptErrors() {
		try {
			window.addEventListener("error", this._boundErrorHandler);
			window.addEventListener("unhandledrejection", this._boundRejectionHandler);
		} catch (error) {
			logger.error("Failed to intercept errors:", error);
		}
	}
	_restoreErrors() {
		try {
			window.removeEventListener("error", this._boundErrorHandler);
			window.removeEventListener("unhandledrejection", this._boundRejectionHandler);
		} catch (error) {
			logger.error("Failed to restore error handlers:", error);
		}
	}
	_interceptNetwork() {
		try {
			if (!this._originalFetch && typeof window !== "undefined") this._originalFetch = window.fetch;
			if (!this._originalFetch) return;
			const originalFetch = this._originalFetch;
			const self = this;
			window.fetch = async function(...args) {
				if (!self._isCapturing) return originalFetch.apply(this, args);
				const startTime = performance.now();
				const [resource, config] = args;
				try {
					const response = await originalFetch.apply(this, args);
					const duration = Math.round(performance.now() - startTime);
					if (self._isCapturing) self.captureNetworkRequest({
						timestamp: (/* @__PURE__ */ new Date()).toISOString(),
						method: config?.method || "GET",
						url: typeof resource === "string" ? resource : resource.url,
						status: response.status,
						duration
					});
					return response;
				} catch (error) {
					const duration = Math.round(performance.now() - startTime);
					if (self._isCapturing) self.captureNetworkRequest({
						timestamp: (/* @__PURE__ */ new Date()).toISOString(),
						method: config?.method || "GET",
						url: typeof resource === "string" ? resource : resource.url,
						duration,
						error: error instanceof Error ? error.message : "Network error"
					});
					throw error;
				}
			};
		} catch (error) {
			logger.error("Failed to intercept network requests:", error);
		}
	}
	_restoreNetwork() {
		try {
			if (this._originalFetch && typeof window !== "undefined") window.fetch = this._originalFetch;
		} catch (error) {
			logger.error("Failed to restore network fetch:", error);
		}
	}
	_handleError(event) {
		this.captureError({
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			type: "javascript",
			message: event.message,
			stack: event.error?.stack,
			url: event.filename,
			line: event.lineno,
			column: event.colno,
			userAgent: navigator.userAgent
		});
	}
	_handleUnhandledRejection(event) {
		this.captureError({
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			type: "javascript",
			message: event.reason?.message || "Unhandled promise rejection",
			stack: event.reason?.stack,
			userAgent: navigator.userAgent
		});
	}
	captureLog(level, scope, args = []) {
		if (!this._isCapturing) return;
		try {
			const entry = {
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				level,
				scope,
				message: this._formatMessage(args),
				data: args.length === 1 && typeof args[0] === "object" ? args[0] : void 0
			};
			this._logs.push(entry);
		} catch (error) {
			console.error("Debug logger failed to capture log:", error);
		}
	}
	_formatMessage(args) {
		this._seenObjects = /* @__PURE__ */ new WeakSet();
		return args.map((arg) => {
			if (typeof arg === "object" && arg !== null) try {
				return JSON.stringify(arg, this._jsonReplacer.bind(this), 2);
			} catch {
				return "[Object]";
			}
			return String(arg);
		}).join(" ");
	}
	_jsonReplacer(_key, value) {
		if (typeof value === "object" && value !== null) {
			if (this._seenObjects.has(value)) return "[Circular]";
			this._seenObjects.add(value);
		}
		return value;
	}
	captureError(error) {
		try {
			this._errors.push(error);
		} catch (err) {
			console.error("Debug logger failed to capture error:", err);
		}
	}
	captureNetworkRequest(request) {
		try {
			this._networkRequests.push(request);
		} catch (error) {
			console.error("Debug logger failed to capture network request:", error);
		}
	}
	captureUserAction(action, target, data) {
		if (!this._isCapturing) return;
		try {
			const entry = {
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				action,
				target,
				data
			};
			this._userActions.push(entry);
		} catch (error) {
			console.error("Debug logger failed to capture user action:", error);
		}
	}
	captureTerminalLog(entry) {
		try {
			if (this._config.debounceTerminal > 0) {
				this._terminalLogQueue.push(entry);
				if (this._terminalLogTimer) clearTimeout(this._terminalLogTimer);
				this._terminalLogTimer = setTimeout(() => {
					this._flushTerminalLogs();
				}, this._config.debounceTerminal);
			} else this._terminalLogs.push(entry);
		} catch (error) {
			console.error("Debug logger failed to capture terminal log:", error);
		}
	}
	_flushTerminalLogs() {
		try {
			while (this._terminalLogQueue.length > 0) {
				const entry = this._terminalLogQueue.shift();
				if (entry) this._terminalLogs.push(entry);
			}
			this._terminalLogTimer = null;
		} catch (error) {
			console.error("Debug logger failed to flush terminal logs:", error);
		}
	}
	async generateDebugLog() {
		try {
			const wasEnabled = this._config.enabled;
			if (!wasEnabled) this.enableDebugMode();
			if (this._terminalLogTimer) {
				clearTimeout(this._terminalLogTimer);
				this._flushTerminalLogs();
			}
			const [systemInfo, appInfo, performanceInfo, state] = await Promise.all([
				this._collectSystemInfo(),
				this._collectAppInfo(),
				Promise.resolve(this._collectPerformanceInfo()),
				Promise.resolve(this._collectStateInfo())
			]);
			const logStoreLogs = await this._getLogStoreLogs();
			const debugData = {
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				sessionId: this._generateSessionId(),
				systemInfo,
				appInfo,
				logs: [...this._logs.toArray(), ...logStoreLogs],
				errors: this._errors.toArray(),
				networkRequests: this._networkRequests.toArray(),
				performance: performanceInfo,
				state,
				userActions: this._userActions.toArray(),
				terminalLogs: this._terminalLogs.toArray()
			};
			if (!wasEnabled) this.disableDebugMode();
			return debugData;
		} catch (error) {
			logger.error("Failed to generate debug log:", error);
			throw error;
		}
	}
	async _getLogStoreLogs() {
		try {
			const store = getLogStore();
			if (!store) try {
				const { logStore: storeModule } = await import("./logs-BndizCRE.js");
				logStore = storeModule;
				return this._getLogStoreLogs();
			} catch {
				return [];
			}
			return (store.getLogs?.() || []).slice(0, 500).map((log) => ({
				timestamp: log.timestamp,
				level: log.level,
				scope: log.category,
				message: log.message,
				data: log.details
			}));
		} catch (error) {
			logger.warn("Failed to get logStore logs:", error);
			return [];
		}
	}
	async _collectSystemInfo() {
		let platform = "Unknown";
		if (isMac) platform = "macOS";
		else if (isWindows) platform = "Windows";
		else if (isLinux) platform = "Linux";
		return {
			platform,
			userAgent: navigator.userAgent,
			screenResolution: `${screen.width}x${screen.height}`,
			viewportSize: `${window.innerWidth}x${window.innerHeight}`,
			isMobile: isMobile(),
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			language: navigator.language,
			cookiesEnabled: navigator.cookieEnabled,
			localStorageEnabled: this._testLocalStorage(),
			sessionStorageEnabled: this._testSessionStorage()
		};
	}
	async _collectAppInfo() {
		let workbenchInfo = {
			currentView: "code",
			showWorkbench: false,
			showTerminal: true,
			artifactsCount: 0,
			filesCount: 0,
			unsavedFiles: 0,
			hasActivePreview: false
		};
		try {
			if (typeof window !== "undefined") {
				const workbenchStore = window.__bolt_workbench_store;
				if (workbenchStore) {
					const state = workbenchStore.get?.() || {};
					workbenchInfo = {
						currentView: state.currentView || "code",
						showWorkbench: state.showWorkbench || false,
						showTerminal: state.showTerminal !== void 0 ? state.showTerminal : true,
						artifactsCount: Object.keys(state.artifacts || {}).length,
						filesCount: Object.keys(state.files || {}).length,
						unsavedFiles: state.unsavedFiles?.size || 0,
						hasActivePreview: (state.previews || []).length > 0
					};
				}
			}
		} catch {}
		return {
			version: this._getAppVersion(),
			buildTime: (/* @__PURE__ */ new Date()).toISOString(),
			currentModel: this._getCurrentModel(),
			currentProvider: this._getCurrentProvider(),
			projectType: this._getProjectType(),
			workbenchView: workbenchInfo.currentView,
			hasActivePreview: workbenchInfo.hasActivePreview,
			unsavedFiles: workbenchInfo.unsavedFiles,
			workbenchState: workbenchInfo,
			gitInfo: await this._getGitInfo()
		};
	}
	_getAppVersion() {
		try {
			return "1.0.0";
		} catch {
			return "1.0.0";
		}
	}
	_getCurrentModel() {
		try {
			if (typeof window !== "undefined") {
				const stored = localStorage.getItem("bolt_current_model");
				if (stored) return stored;
			}
			return DEFAULT_MODEL;
		} catch {
			return DEFAULT_MODEL;
		}
	}
	_getCurrentProvider() {
		try {
			if (typeof window !== "undefined") {
				const stored = localStorage.getItem("bolt_current_provider");
				if (stored) return stored;
			}
			return PROVIDER_LIST[0]?.name || "unknown";
		} catch {
			return PROVIDER_LIST[0]?.name || "unknown";
		}
	}
	_getProjectType() {
		try {
			if (typeof window !== "undefined") {
				const stored = localStorage.getItem("bolt_project_type");
				if (stored) return stored;
			}
			return "unknown";
		} catch {
			return "unknown";
		}
	}
	async _getGitInfo() {
		try {
			const response = await fetch("/api/system/git-info");
			if (response.ok) {
				const gitInfoTyped = await response.json();
				return {
					branch: gitInfoTyped.local?.branch || "unknown",
					commit: gitInfoTyped.local?.commitHash || "unknown",
					isDirty: false,
					remoteUrl: gitInfoTyped.local?.remoteUrl,
					lastCommit: gitInfoTyped.local ? {
						message: "Latest commit",
						date: gitInfoTyped.local.commitTime,
						author: gitInfoTyped.local.author
					} : void 0
				};
			}
		} catch {
			console.warn("Git info API not available, using fallback");
		}
		return this._getGitInfoFallback();
	}
	_getGitInfoFallback() {
		try {
			const stored = localStorage.getItem("bolt_git_info");
			if (stored) return JSON.parse(stored);
			return {
				branch: "unknown",
				commit: "unknown",
				isDirty: false
			};
		} catch {
			return {
				branch: "unknown",
				commit: "unknown",
				isDirty: false
			};
		}
	}
	_collectPerformanceInfo() {
		const timing = performance.timing;
		const paintEntries = performance.getEntriesByType("paint");
		return {
			navigationStart: timing.navigationStart,
			loadTime: timing.loadEventEnd - timing.navigationStart,
			domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
			firstPaint: paintEntries.find((entry) => entry.name === "first-paint")?.startTime,
			firstContentfulPaint: paintEntries.find((entry) => entry.name === "first-contentful-paint")?.startTime,
			memoryUsage: performance.memory ? {
				used: performance.memory.usedJSHeapSize,
				total: performance.memory.totalJSHeapSize,
				limit: performance.memory.jsHeapSizeLimit
			} : void 0,
			timing
		};
	}
	_collectStateInfo() {
		const store = getLogStore();
		let alerts = [];
		if (store) try {
			alerts = (store.getLogs?.() || []).filter((log) => ["error", "warning"].includes(log.level)).slice(0, 10).map((log) => ({
				type: log.level,
				title: log.message.substring(0, 100),
				source: log.category
			}));
		} catch {}
		let workbenchState = {
			currentView: "code",
			showWorkbench: false,
			showTerminal: true,
			artifactsCount: 0,
			filesCount: 0
		};
		try {
			if (typeof window !== "undefined") {
				const workbenchStore = window.__bolt_workbench_store;
				if (workbenchStore) {
					const state = workbenchStore.get?.() || {};
					workbenchState = {
						currentView: state.currentView || "code",
						showWorkbench: state.showWorkbench || false,
						showTerminal: state.showTerminal !== void 0 ? state.showTerminal : true,
						artifactsCount: Object.keys(state.artifacts || {}).length,
						filesCount: Object.keys(state.files || {}).length
					};
				}
			}
		} catch {}
		return {
			currentView: workbenchState.currentView,
			showWorkbench: workbenchState.showWorkbench,
			showTerminal: workbenchState.showTerminal,
			artifactsCount: workbenchState.artifactsCount,
			filesCount: workbenchState.filesCount,
			alerts
		};
	}
	_testLocalStorage() {
		try {
			localStorage.setItem("test", "test");
			localStorage.removeItem("test");
			return true;
		} catch {
			return false;
		}
	}
	_testSessionStorage() {
		try {
			sessionStorage.setItem("test", "test");
			sessionStorage.removeItem("test");
			return true;
		} catch {
			return false;
		}
	}
	_generateSessionId() {
		return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
	}
	clearLogs() {
		try {
			this._logs.clear();
			this._errors.clear();
			this._networkRequests.clear();
			this._userActions.clear();
			this._terminalLogs.clear();
			this._terminalLogQueue = [];
			if (this._terminalLogTimer) {
				clearTimeout(this._terminalLogTimer);
				this._terminalLogTimer = null;
			}
			logger.info("Debug logs cleared");
		} catch (error) {
			logger.error("Failed to clear logs:", error);
		}
	}
	getMemoryStats() {
		const stats = {
			logs: this._logs.getSize(),
			errors: this._errors.getSize(),
			networkRequests: this._networkRequests.getSize(),
			userActions: this._userActions.getSize(),
			terminalLogs: this._terminalLogs.getSize(),
			total: 0
		};
		stats.total = stats.logs + stats.errors + stats.networkRequests + stats.userActions + stats.terminalLogs;
		return stats;
	}
};
var debugLogger = new DebugLogger({
	enabled: false,
	maxEntries: 1e3,
	captureConsole: true,
	captureNetwork: true,
	captureErrors: true,
	debounceTerminal: 100
});
function captureTerminalLog(content, type = "output", command) {
	if (!content || content.trim().length === 0) return;
	try {
		debugLogger.captureTerminalLog({
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			type,
			content: content.trim(),
			command
		});
	} catch (error) {
		console.error("Failed to capture terminal log:", error);
	}
}
if (typeof window !== "undefined") setTimeout(() => {
	debugLogger.initialize();
}, 0);
//#endregion
export { captureTerminalLog, debugLogger };
