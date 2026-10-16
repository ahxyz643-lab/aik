import { t as createScopedLogger } from "./logger-D7cp7B9y.js";
import Cookies from "js-cookie";
import { atom, map } from "nanostores";
//#region app/lib/stores/logs.ts
var logger = createScopedLogger("LogStore");
var MAX_LOGS = 1e3;
var LogStore = class {
	_logs = map({});
	showLogs = atom(true);
	_readLogs = /* @__PURE__ */ new Set();
	constructor() {
		this._loadLogs();
		if (typeof window !== "undefined") this._loadReadLogs();
	}
	get logs() {
		return this._logs;
	}
	_loadLogs() {
		const savedLogs = Cookies.get("eventLogs");
		if (savedLogs) try {
			const parsedLogs = JSON.parse(savedLogs);
			this._logs.set(parsedLogs);
		} catch (error) {
			logger.error("Failed to parse logs from cookies:", error);
		}
	}
	_loadReadLogs() {
		if (typeof window === "undefined") return;
		const savedReadLogs = localStorage.getItem("bolt_read_logs");
		if (savedReadLogs) try {
			const parsedReadLogs = JSON.parse(savedReadLogs);
			this._readLogs = new Set(parsedReadLogs);
		} catch (error) {
			logger.error("Failed to parse read logs:", error);
		}
	}
	_saveLogs() {
		const currentLogs = this._logs.get();
		Cookies.set("eventLogs", JSON.stringify(currentLogs));
	}
	_saveReadLogs() {
		if (typeof window === "undefined") return;
		localStorage.setItem("bolt_read_logs", JSON.stringify(Array.from(this._readLogs)));
	}
	_generateId() {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
	_trimLogs() {
		const currentLogs = Object.entries(this._logs.get());
		if (currentLogs.length > MAX_LOGS) {
			const sortedLogs = currentLogs.sort(([, a], [, b]) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
			const newLogs = Object.fromEntries(sortedLogs.slice(0, MAX_LOGS));
			this._logs.set(newLogs);
		}
	}
	_addLog(message, level, category, details, metadata) {
		const id = this._generateId();
		const entry = {
			id,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			level,
			message,
			details,
			category,
			metadata
		};
		this._logs.setKey(id, entry);
		this._trimLogs();
		this._saveLogs();
		return id;
	}
	_addApiLog(message, method, url, details) {
		const statusCode = details.statusCode;
		return this._addLog(message, statusCode >= 400 ? "error" : "info", "api", details, {
			component: "api",
			action: method
		});
	}
	logSystem(message, details) {
		return this._addLog(message, "info", "system", details);
	}
	logProvider(message, details) {
		return this._addLog(message, "info", "provider", details);
	}
	logUserAction(message, details) {
		return this._addLog(message, "info", "user", details);
	}
	logAPIRequest(endpoint, method, duration, statusCode, details) {
		const message = `${method} ${endpoint} - ${statusCode} (${duration}ms)`;
		const level = statusCode >= 400 ? "error" : statusCode >= 300 ? "warning" : "info";
		return this._addLog(message, level, "api", {
			...details,
			endpoint,
			method,
			duration,
			statusCode,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	logAuth(action, success, details) {
		const message = `Auth ${action} - ${success ? "Success" : "Failed"}`;
		const level = success ? "info" : "error";
		return this._addLog(message, level, "auth", {
			...details,
			action,
			success,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	logNetworkStatus(status, details) {
		const message = `Network ${status}`;
		const level = status === "offline" ? "error" : status === "reconnecting" ? "warning" : "info";
		return this._addLog(message, level, "network", {
			...details,
			status,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	logDatabase(operation, success, duration, details) {
		const message = `DB ${operation} - ${success ? "Success" : "Failed"} (${duration}ms)`;
		const level = success ? "info" : "error";
		return this._addLog(message, level, "database", {
			...details,
			operation,
			success,
			duration,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	logError(message, error, details) {
		const errorDetails = error instanceof Error ? {
			name: error.name,
			message: error.message,
			stack: error.stack,
			...details
		} : {
			error,
			...details
		};
		return this._addLog(message, "error", "error", errorDetails);
	}
	logWarning(message, details) {
		return this._addLog(message, "warning", "system", details);
	}
	logDebug(message, details) {
		return this._addLog(message, "debug", "system", details);
	}
	clearLogs() {
		this._logs.set({});
		this._saveLogs();
	}
	getLogs() {
		return Object.values(this._logs.get()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
	}
	getFilteredLogs(level, category, searchQuery) {
		return this.getLogs().filter((log) => {
			const matchesLevel = !level || level === "debug" || log.level === level;
			const matchesCategory = !category || log.category === category;
			const matchesSearch = !searchQuery || log.message.toLowerCase().includes(searchQuery.toLowerCase()) || JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase());
			return matchesLevel && matchesCategory && matchesSearch;
		});
	}
	markAsRead(logId) {
		this._readLogs.add(logId);
		this._saveReadLogs();
	}
	isRead(logId) {
		return this._readLogs.has(logId);
	}
	clearReadLogs() {
		this._readLogs.clear();
		this._saveReadLogs();
	}
	logApiCall(method, endpoint, statusCode, duration, requestData, responseData) {
		return this._addLog(`API ${method} ${endpoint}`, statusCode >= 400 ? "error" : "info", "api", {
			method,
			endpoint,
			statusCode,
			duration,
			request: requestData,
			response: responseData
		}, {
			component: "api",
			action: method
		});
	}
	logNetworkRequest(method, url, statusCode, duration, requestData, responseData) {
		return this._addLog(`${method} ${url}`, statusCode >= 400 ? "error" : "info", "network", {
			method,
			url,
			statusCode,
			duration,
			request: requestData,
			response: responseData
		}, {
			component: "network",
			action: method
		});
	}
	logAuthEvent(event, success, details) {
		return this._addLog(`Auth ${event} ${success ? "succeeded" : "failed"}`, success ? "info" : "error", "auth", details, {
			component: "auth",
			action: event
		});
	}
	logPerformance(operation, duration, details) {
		return this._addLog(`Performance: ${operation}`, duration > 1e3 ? "warning" : "info", "performance", {
			operation,
			duration,
			...details
		}, {
			component: "performance",
			action: "metric"
		});
	}
	logErrorWithStack(error, category = "error", details) {
		return this._addLog(error.message, "error", category, {
			...details,
			name: error.name,
			stack: error.stack
		}, {
			component: category,
			action: "error"
		});
	}
	refreshLogs() {
		const currentLogs = this._logs.get();
		this._logs.set({ ...currentLogs });
	}
	logInfo(message, details) {
		return this._addLog(message, "info", "system", details);
	}
	logSuccess(message, details) {
		return this._addLog(message, "info", "system", {
			...details,
			success: true
		});
	}
	logApiRequest(method, url, details) {
		return this._addApiLog(`API ${method} ${url}`, method, url, details);
	}
	logSettingsChange(component, setting, oldValue, newValue) {
		return this._addLog(`Settings changed in ${component}: ${setting}`, "info", "settings", {
			setting,
			previousValue: oldValue,
			newValue
		}, {
			component,
			action: "settings_change",
			previousValue: oldValue,
			newValue
		});
	}
	logFeatureToggle(featureId, enabled) {
		return this._addLog(`Feature ${featureId} ${enabled ? "enabled" : "disabled"}`, "info", "feature", {
			featureId,
			enabled
		}, {
			component: "features",
			action: "feature_toggle"
		});
	}
	logTaskOperation(taskId, operation, status, details) {
		return this._addLog(`Task ${taskId}: ${operation} - ${status}`, "info", "task", {
			taskId,
			operation,
			status,
			...details
		}, {
			component: "task-manager",
			action: "task_operation"
		});
	}
	logProviderAction(provider, action, success, details) {
		return this._addLog(`Provider ${provider}: ${action} - ${success ? "Success" : "Failed"}`, success ? "info" : "error", "provider", {
			provider,
			action,
			success,
			...details
		}, {
			component: "providers",
			action: "provider_action"
		});
	}
	logPerformanceMetric(component, operation, duration, details) {
		return this._addLog(`Performance: ${component} - ${operation} took ${duration}ms`, duration > 1e3 ? "warning" : "info", "performance", {
			component,
			operation,
			duration,
			...details
		}, {
			component,
			action: "performance_metric"
		});
	}
};
var logStore = new LogStore();
//#endregion
export { logStore as t };
