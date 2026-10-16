import { Chalk } from "chalk";
//#region app/utils/logger.ts
var chalk = new Chalk({ level: 3 });
var currentLevel = "info";
var logger = {
	trace: (...messages) => logWithDebugCapture("trace", void 0, messages),
	debug: (...messages) => logWithDebugCapture("debug", void 0, messages),
	info: (...messages) => logWithDebugCapture("info", void 0, messages),
	warn: (...messages) => logWithDebugCapture("warn", void 0, messages),
	error: (...messages) => logWithDebugCapture("error", void 0, messages),
	setLevel
};
function createScopedLogger(scope) {
	return {
		trace: (...messages) => logWithDebugCapture("trace", scope, messages),
		debug: (...messages) => logWithDebugCapture("debug", scope, messages),
		info: (...messages) => logWithDebugCapture("info", scope, messages),
		warn: (...messages) => logWithDebugCapture("warn", scope, messages),
		error: (...messages) => logWithDebugCapture("error", scope, messages),
		setLevel
	};
}
function setLevel(level) {
	if ((level === "trace" || level === "debug") && true) return;
	currentLevel = level;
}
function log(level, scope, messages) {
	const levelOrder = [
		"trace",
		"debug",
		"info",
		"warn",
		"error",
		"none"
	];
	if (levelOrder.indexOf(level) < levelOrder.indexOf(currentLevel)) return;
	if (currentLevel === "none") return;
	const allMessages = messages.reduce((acc, current) => {
		if (acc.endsWith("\n")) return acc + current;
		if (!acc) return current;
		return `${acc} ${current}`;
	}, "");
	const labelBackgroundColor = getColorForLevel(level);
	const labelTextColor = level === "warn" ? "#000000" : "#FFFFFF";
	const labelStyles = getLabelStyles(labelBackgroundColor, labelTextColor);
	const scopeStyles = getLabelStyles("#77828D", "white");
	const styles = [labelStyles];
	if (typeof scope === "string") styles.push("", scopeStyles);
	let labelText = formatText(` ${level.toUpperCase()} `, labelTextColor, labelBackgroundColor);
	if (scope) labelText = `${labelText} ${formatText(` ${scope} `, "#FFFFFF", "77828D")}`;
	if (typeof window !== "undefined") console.log(`%c${level.toUpperCase()}${scope ? `%c %c${scope}` : ""}`, ...styles, allMessages);
	else console.log(`${labelText}`, allMessages);
}
function formatText(text, color, bg) {
	return chalk.bgHex(bg)(chalk.hex(color)(text));
}
function getLabelStyles(color, textColor) {
	return `background-color: ${color}; color: white; border: 4px solid ${color}; color: ${textColor};`;
}
function getColorForLevel(level) {
	switch (level) {
		case "trace":
		case "debug": return "#77828D";
		case "info": return "#1389FD";
		case "warn": return "#FFDB6C";
		case "error": return "#EE4744";
		default: return "#000000";
	}
}
var debugLogger = null;
var getDebugLogger = () => {
	if (!debugLogger && typeof window !== "undefined") try {
		import("./debugLogger-DO5ZVEER.js").then(({ debugLogger: loggerInstance }) => {
			debugLogger = loggerInstance;
		}).catch(() => {});
	} catch {}
	return debugLogger;
};
function logWithDebugCapture(level, scope, messages) {
	log(level, scope, messages);
	const debug = getDebugLogger();
	if (debug) debug.captureLog(level, scope, messages);
}
//#endregion
export { logger as n, createScopedLogger as t };
