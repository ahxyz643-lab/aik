import { n as logger$1, t as createScopedLogger } from "./logger-D7cp7B9y.js";
import { createOpenAI } from "@ai-sdk/openai";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createCerebras } from "@ai-sdk/cerebras";
import { createCohere } from "@ai-sdk/cohere";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createFireworks } from "@ai-sdk/fireworks";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createOllama } from "ollama-ai-provider-v2";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import crypto from "node:crypto";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region app/lib/modules/llm/env.ts
var env = {};
function setEnv(nextEnv) {
	env = nextEnv;
}
function getEnv() {
	return env;
}
//#endregion
//#region app/lib/modules/llm/base-provider.ts
/** Default timeout for model listing API calls (5 seconds) */
var MODEL_FETCH_TIMEOUT = 5e3;
var BaseProvider = class {
	cachedDynamicModels;
	getApiKeyLink;
	labelForGetApiKey;
	icon;
	/**
	* Convert Cloudflare Env bindings to a plain Record<string, string>.
	* Useful because provider methods expect Record<string, string> but
	* Cloudflare Workers pass an Env interface.
	*/
	convertEnvToRecord(env) {
		if (!env) return {};
		return Object.entries(env).reduce((acc, [key, value]) => {
			acc[key] = String(value);
			return acc;
		}, {});
	}
	/**
	* Rewrite localhost / 127.0.0.1 URLs to host.docker.internal when
	* running inside Docker. Only applies on the server side.
	*/
	resolveDockerUrl(baseUrl, serverEnv) {
		if (!(process?.env?.RUNNING_IN_DOCKER === "true" || serverEnv?.RUNNING_IN_DOCKER === "true")) return baseUrl;
		return baseUrl.replace("localhost", "host.docker.internal").replace("127.0.0.1", "host.docker.internal");
	}
	/**
	* Create an AbortSignal that times out after the given milliseconds.
	* Used to prevent model-listing fetches from hanging indefinitely.
	*/
	createTimeoutSignal(ms = MODEL_FETCH_TIMEOUT) {
		return AbortSignal.timeout(ms);
	}
	getProviderBaseUrlAndKey(options) {
		const { apiKeys, providerSettings, serverEnv, defaultBaseUrlKey, defaultApiTokenKey } = options;
		let settingsBaseUrl = providerSettings?.baseUrl;
		const managerEnv = getEnv();
		if (settingsBaseUrl && settingsBaseUrl.length == 0) settingsBaseUrl = void 0;
		const baseUrlKey = this.config.baseUrlKey || defaultBaseUrlKey;
		let baseUrl = settingsBaseUrl || serverEnv?.[baseUrlKey] || process?.env?.[baseUrlKey] || managerEnv?.[baseUrlKey] || this.config.baseUrl;
		if (baseUrl && baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
		const apiTokenKey = this.config.apiTokenKey || defaultApiTokenKey;
		const apiKey = apiKeys?.[this.name] || serverEnv?.[apiTokenKey] || process?.env?.[apiTokenKey] || managerEnv?.[apiTokenKey];
		return {
			baseUrl,
			apiKey
		};
	}
	getModelsFromCache(options) {
		if (!this.cachedDynamicModels) return null;
		if (this.cachedDynamicModels.cacheId !== this.getDynamicModelsCacheKey(options)) {
			this.cachedDynamicModels = void 0;
			return null;
		}
		return this.cachedDynamicModels.models;
	}
	getDynamicModelsCacheKey(options) {
		const relevantEnvKeys = [this.config.baseUrlKey, this.config.apiTokenKey].filter(Boolean);
		const relevantEnv = {};
		for (const key of relevantEnvKeys) if (options.serverEnv?.[key]) relevantEnv[key] = options.serverEnv[key];
		return JSON.stringify({
			apiKeys: options.apiKeys?.[this.name],
			providerSettings: options.providerSettings?.[this.name],
			serverEnv: relevantEnv
		});
	}
	storeDynamicModels(options, models) {
		const cacheId = this.getDynamicModelsCacheKey(options);
		this.cachedDynamicModels = {
			cacheId,
			models
		};
	}
};
function getOpenAILikeModel(baseURL, apiKey, model) {
	return createOpenAI({
		baseURL,
		apiKey
	}).chat(model);
}
//#endregion
//#region app/lib/modules/llm/providers/amazon-bedrock.ts
var AmazonBedrockProvider = class extends BaseProvider {
	name = "AmazonBedrock";
	getApiKeyLink = "https://console.aws.amazon.com/iam/home";
	config = { apiTokenKey: "AWS_BEDROCK_CONFIG" };
	staticModels = [
		{
			name: "anthropic.claude-3-5-sonnet-20241022-v2:0",
			label: "Claude 3.5 Sonnet v2 (Bedrock)",
			provider: "AmazonBedrock",
			maxTokenAllowed: 2e5
		},
		{
			name: "anthropic.claude-3-5-sonnet-20240620-v1:0",
			label: "Claude 3.5 Sonnet (Bedrock)",
			provider: "AmazonBedrock",
			maxTokenAllowed: 4096
		},
		{
			name: "anthropic.claude-3-sonnet-20240229-v1:0",
			label: "Claude 3 Sonnet (Bedrock)",
			provider: "AmazonBedrock",
			maxTokenAllowed: 4096
		},
		{
			name: "anthropic.claude-3-haiku-20240307-v1:0",
			label: "Claude 3 Haiku (Bedrock)",
			provider: "AmazonBedrock",
			maxTokenAllowed: 4096
		},
		{
			name: "amazon.nova-pro-v1:0",
			label: "Amazon Nova Pro (Bedrock)",
			provider: "AmazonBedrock",
			maxTokenAllowed: 5120
		},
		{
			name: "amazon.nova-lite-v1:0",
			label: "Amazon Nova Lite (Bedrock)",
			provider: "AmazonBedrock",
			maxTokenAllowed: 5120
		},
		{
			name: "mistral.mistral-large-2402-v1:0",
			label: "Mistral Large 24.02 (Bedrock)",
			provider: "AmazonBedrock",
			maxTokenAllowed: 8192
		}
	];
	_parseAndValidateConfig(apiKey) {
		let parsedConfig;
		try {
			parsedConfig = JSON.parse(apiKey);
		} catch {
			throw new Error("Invalid AWS Bedrock configuration format. Please provide a valid JSON string containing region, accessKeyId, and secretAccessKey.");
		}
		const { region, accessKeyId, secretAccessKey, sessionToken } = parsedConfig;
		if (!region || !accessKeyId || !secretAccessKey) throw new Error("Missing required AWS credentials. Configuration must include region, accessKeyId, and secretAccessKey.");
		return {
			region,
			accessKeyId,
			secretAccessKey,
			...sessionToken && { sessionToken }
		};
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "AWS_BEDROCK_CONFIG"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		const config = this._parseAndValidateConfig(apiKey);
		return createAmazonBedrock(config)(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/anthropic.ts
var AnthropicProvider = class extends BaseProvider {
	name = "Anthropic";
	getApiKeyLink = "https://console.anthropic.com/settings/keys";
	config = { apiTokenKey: "ANTHROPIC_API_KEY" };
	staticModels = [
		{
			name: "claude-fable-5",
			label: "Claude Fable 5",
			provider: "Anthropic",
			maxTokenAllowed: 1e6,
			maxCompletionTokens: 128e3
		},
		{
			name: "claude-opus-4-8",
			label: "Claude Opus 4.8",
			provider: "Anthropic",
			maxTokenAllowed: 1e6,
			maxCompletionTokens: 128e3
		},
		{
			name: "claude-sonnet-4-6",
			label: "Claude Sonnet 4.6",
			provider: "Anthropic",
			maxTokenAllowed: 1e6,
			maxCompletionTokens: 128e3
		},
		{
			name: "claude-haiku-4-5-20251001",
			label: "Claude Haiku 4.5",
			provider: "Anthropic",
			maxTokenAllowed: 2e5,
			maxCompletionTokens: 64e3
		},
		{
			name: "claude-3-5-sonnet-20241022",
			label: "Claude 3.5 Sonnet",
			provider: "Anthropic",
			maxTokenAllowed: 2e5,
			maxCompletionTokens: 128e3
		},
		{
			name: "claude-3-haiku-20240307",
			label: "Claude 3 Haiku",
			provider: "Anthropic",
			maxTokenAllowed: 2e5,
			maxCompletionTokens: 128e3
		},
		{
			name: "claude-opus-4-20250514",
			label: "Claude 4 Opus",
			provider: "Anthropic",
			maxTokenAllowed: 2e5,
			maxCompletionTokens: 32e3
		}
	];
	async getDynamicModels(apiKeys, settings, serverEnv) {
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "ANTHROPIC_API_KEY"
		});
		if (!apiKey) throw `Missing Api Key configuration for ${this.name} provider`;
		const res = await (await fetch(`https://api.anthropic.com/v1/models`, { headers: {
			"x-api-key": `${apiKey}`,
			"anthropic-version": "2023-06-01"
		} })).json();
		const staticModelIds = this.staticModels.map((m) => m.name);
		return res.data.filter((model) => model.type === "model" && !staticModelIds.includes(model.id)).map((m) => {
			let contextWindow = 32e3;
			if (m.max_tokens) contextWindow = m.max_tokens;
			else if (m.id?.includes("claude-fable-5") || m.id?.includes("claude-opus-4-8") || m.id?.includes("claude-sonnet-4-6")) contextWindow = 1e6;
			else if (m.id?.includes("claude-haiku-4-5")) contextWindow = 2e5;
			else if (m.id?.includes("claude-3-5-sonnet")) contextWindow = 2e5;
			else if (m.id?.includes("claude-3-haiku")) contextWindow = 2e5;
			else if (m.id?.includes("claude-3-opus")) contextWindow = 2e5;
			else if (m.id?.includes("claude-3-sonnet")) contextWindow = 2e5;
			let maxCompletionTokens = 128e3;
			if (m.id?.includes("claude-fable-5") || m.id?.includes("claude-opus-4-8") || m.id?.includes("claude-sonnet-4-6")) maxCompletionTokens = 128e3;
			else if (m.id?.includes("claude-haiku-4-5")) maxCompletionTokens = 64e3;
			else if (m.id?.includes("claude-opus-4")) maxCompletionTokens = 32e3;
			else if (m.id?.includes("claude-sonnet-4")) maxCompletionTokens = 64e3;
			else if (m.id?.includes("claude-4")) maxCompletionTokens = 32e3;
			return {
				name: m.id,
				label: `${m.display_name} (${Math.floor(contextWindow / 1e3)}k context)`,
				provider: this.name,
				maxTokenAllowed: contextWindow,
				maxCompletionTokens
			};
		});
	}
	getModelInstance = (options) => {
		const { apiKeys, providerSettings, serverEnv, model } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings,
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "ANTHROPIC_API_KEY"
		});
		return createAnthropic({
			apiKey,
			headers: { "anthropic-beta": "output-128k-2025-02-19" }
		})(model);
	};
};
//#endregion
//#region app/lib/modules/llm/providers/cerebras.ts
var CerebrasProvider = class extends BaseProvider {
	name = "Cerebras";
	getApiKeyLink = "https://cloud.cerebras.ai/settings";
	config = { apiTokenKey: "CEREBRAS_API_KEY" };
	staticModels = [
		{
			name: "qwen3-coder-480b",
			label: "Qwen3-Coder 480B (2000 tok/s, Best for Coding)",
			provider: "Cerebras",
			maxTokenAllowed: 262e3
		},
		{
			name: "llama3.1-8b",
			label: "Llama 3.1 8B",
			provider: "Cerebras",
			maxTokenAllowed: 8e3
		},
		{
			name: "gpt-oss-120b",
			label: "GPT OSS 120B (Reasoning)",
			provider: "Cerebras",
			maxTokenAllowed: 8e3
		},
		{
			name: "qwen-3-235b-a22b-instruct-2507",
			label: "Qwen 3 235B A22B Instruct",
			provider: "Cerebras",
			maxTokenAllowed: 8e3
		},
		{
			name: "qwen-3-235b-a22b-thinking-2507",
			label: "Qwen 3 235B A22B Thinking",
			provider: "Cerebras",
			maxTokenAllowed: 8e3
		},
		{
			name: "zai-glm-4.6",
			label: "ZAI GLM 4.6 (Coding: 73.8% SWE-bench)",
			provider: "Cerebras",
			maxTokenAllowed: 8e3
		},
		{
			name: "zai-glm-4.7",
			label: "ZAI GLM 4.7 (Reasoning)",
			provider: "Cerebras",
			maxTokenAllowed: 8e3
		}
	];
	async getDynamicModels(apiKeys, settings, serverEnv) {
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "CEREBRAS_API_KEY"
		});
		if (!apiKey) return [];
		try {
			const response = await fetch("https://api.cerebras.ai/v1/models", {
				headers: { Authorization: `Bearer ${apiKey}` },
				signal: this.createTimeoutSignal(5e3)
			});
			if (!response.ok) {
				console.error(`Cerebras API error: ${response.statusText}`);
				return [];
			}
			const data = await response.json();
			const staticModelIds = this.staticModels.map((m) => m.name);
			return data.data?.filter((model) => !staticModelIds.includes(model.id)).map((m) => ({
				name: m.id,
				label: `${m.id} (Dynamic)`,
				provider: this.name,
				maxTokenAllowed: 32e3
			})) || [];
		} catch (error) {
			console.error(`Failed to fetch Cerebras models:`, error);
			return [];
		}
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "CEREBRAS_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		return createCerebras({ apiKey })(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/cohere.ts
var CohereProvider = class extends BaseProvider {
	name = "Cohere";
	getApiKeyLink = "https://dashboard.cohere.com/api-keys";
	config = { apiTokenKey: "COHERE_API_KEY" };
	staticModels = [
		{
			name: "command-r-plus-08-2024",
			label: "Command R plus Latest",
			provider: "Cohere",
			maxTokenAllowed: 4096,
			maxCompletionTokens: 4e3
		},
		{
			name: "command-r-08-2024",
			label: "Command R Latest",
			provider: "Cohere",
			maxTokenAllowed: 4096,
			maxCompletionTokens: 4e3
		},
		{
			name: "command-r-plus",
			label: "Command R plus",
			provider: "Cohere",
			maxTokenAllowed: 4096,
			maxCompletionTokens: 4e3
		},
		{
			name: "command-r",
			label: "Command R",
			provider: "Cohere",
			maxTokenAllowed: 4096,
			maxCompletionTokens: 4e3
		},
		{
			name: "command",
			label: "Command",
			provider: "Cohere",
			maxTokenAllowed: 4096,
			maxCompletionTokens: 4e3
		},
		{
			name: "command-nightly",
			label: "Command Nightly",
			provider: "Cohere",
			maxTokenAllowed: 4096,
			maxCompletionTokens: 4e3
		},
		{
			name: "command-light",
			label: "Command Light",
			provider: "Cohere",
			maxTokenAllowed: 4096,
			maxCompletionTokens: 4e3
		},
		{
			name: "command-light-nightly",
			label: "Command Light Nightly",
			provider: "Cohere",
			maxTokenAllowed: 4096,
			maxCompletionTokens: 4e3
		},
		{
			name: "c4ai-aya-expanse-8b",
			label: "c4AI Aya Expanse 8b",
			provider: "Cohere",
			maxTokenAllowed: 4096,
			maxCompletionTokens: 4e3
		},
		{
			name: "c4ai-aya-expanse-32b",
			label: "c4AI Aya Expanse 32b",
			provider: "Cohere",
			maxTokenAllowed: 4096,
			maxCompletionTokens: 4e3
		}
	];
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "COHERE_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		return createCohere({ apiKey })(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/deepseek.ts
var DeepseekProvider = class extends BaseProvider {
	name = "Deepseek";
	getApiKeyLink = "https://platform.deepseek.com/apiKeys";
	config = { apiTokenKey: "DEEPSEEK_API_KEY" };
	staticModels = [
		{
			name: "deepseek-v4-pro",
			label: "DeepSeek V4 Pro",
			provider: "Deepseek",
			maxTokenAllowed: 1e6,
			maxCompletionTokens: 384e3
		},
		{
			name: "deepseek-v4-flash",
			label: "DeepSeek V4 Flash",
			provider: "Deepseek",
			maxTokenAllowed: 1e6,
			maxCompletionTokens: 384e3
		},
		{
			name: "deepseek-coder",
			label: "Deepseek-Coder",
			provider: "Deepseek",
			maxTokenAllowed: 8e3,
			maxCompletionTokens: 8192
		},
		{
			name: "deepseek-chat",
			label: "Deepseek-Chat",
			provider: "Deepseek",
			maxTokenAllowed: 8e3,
			maxCompletionTokens: 8192
		},
		{
			name: "deepseek-reasoner",
			label: "Deepseek-Reasoner",
			provider: "Deepseek",
			maxTokenAllowed: 8e3,
			maxCompletionTokens: 8192
		},
		{
			name: "deepseek-v3.2",
			label: "DeepSeek V3.2 (Coding + Tool Use)",
			provider: "Deepseek",
			maxTokenAllowed: 64e3,
			maxCompletionTokens: 8192
		},
		{
			name: "deepseek-v3.2-speciale",
			label: "DeepSeek V3.2 Speciale (High-Compute)",
			provider: "Deepseek",
			maxTokenAllowed: 64e3,
			maxCompletionTokens: 8192
		}
	];
	async getDynamicModels(apiKeys, settings, serverEnv) {
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "DEEPSEEK_API_KEY"
		});
		if (!apiKey) return [];
		try {
			const response = await fetch("https://api.deepseek.com/models", {
				headers: { Authorization: `Bearer ${apiKey}` },
				signal: this.createTimeoutSignal(5e3)
			});
			if (!response.ok) {
				console.error(`DeepSeek API error: ${response.statusText}`);
				return [];
			}
			const data = await response.json();
			const staticModelIds = this.staticModels.map((m) => m.name);
			return data.data?.filter((model) => !staticModelIds.includes(model.id)).map((m) => ({
				name: m.id,
				label: `${m.id} (Dynamic)`,
				provider: this.name,
				maxTokenAllowed: m.id?.startsWith("deepseek-v4") ? 1e6 : 64e3,
				maxCompletionTokens: m.id?.startsWith("deepseek-v4") ? 384e3 : 8192
			})) || [];
		} catch (error) {
			console.error(`Failed to fetch DeepSeek models:`, error);
			return [];
		}
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "DEEPSEEK_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		return createDeepSeek({ apiKey }).chat(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/fireworks.ts
var FireworksProvider = class extends BaseProvider {
	name = "Fireworks";
	getApiKeyLink = "https://fireworks.ai/api-keys";
	config = { apiTokenKey: "FIREWORKS_API_KEY" };
	staticModels = [
		{
			name: "accounts/fireworks/models/qwen3-coder-480b-a35b-instruct",
			label: "Qwen3-Coder 480B (Best for Coding)",
			provider: "Fireworks",
			maxTokenAllowed: 262e3
		},
		{
			name: "accounts/fireworks/models/qwen3-coder-30b-a3b-instruct",
			label: "Qwen3-Coder 30B (Fast Coding)",
			provider: "Fireworks",
			maxTokenAllowed: 262e3
		},
		{
			name: "accounts/fireworks/models/llama-v3p1-405b-instruct",
			label: "Llama 3.1 405B Instruct",
			provider: "Fireworks",
			maxTokenAllowed: 128e3
		},
		{
			name: "accounts/fireworks/models/llama-v3p1-70b-instruct",
			label: "Llama 3.1 70B Instruct",
			provider: "Fireworks",
			maxTokenAllowed: 128e3
		},
		{
			name: "accounts/fireworks/models/llama-v3p1-8b-instruct",
			label: "Llama 3.1 8B Instruct",
			provider: "Fireworks",
			maxTokenAllowed: 128e3
		},
		{
			name: "accounts/fireworks/models/deepseek-r1",
			label: "DeepSeek R1 (Reasoning)",
			provider: "Fireworks",
			maxTokenAllowed: 64e3
		},
		{
			name: "accounts/fireworks/models/qwen2p5-72b-instruct",
			label: "Qwen 2.5 72B Instruct",
			provider: "Fireworks",
			maxTokenAllowed: 128e3
		},
		{
			name: "accounts/fireworks/models/firefunction-v2",
			label: "FireFunction V2",
			provider: "Fireworks",
			maxTokenAllowed: 8e3
		}
	];
	async getDynamicModels(apiKeys, settings, serverEnv) {
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "FIREWORKS_API_KEY"
		});
		if (!apiKey) return [];
		try {
			const response = await fetch("https://api.fireworks.ai/v1/accounts/fireworks/models?page_size=100", {
				headers: { Authorization: `Bearer ${apiKey}` },
				signal: this.createTimeoutSignal(5e3)
			});
			if (!response.ok) {
				console.error(`Fireworks API error: ${response.statusText}`);
				return [];
			}
			const data = await response.json();
			const staticModelIds = this.staticModels.map((m) => m.name);
			return data.data?.filter((model) => {
				const modelPath = `accounts/fireworks/models/${model.id}`;
				return !staticModelIds.includes(modelPath) && !staticModelIds.includes(model.id);
			}).map((m) => ({
				name: `accounts/fireworks/models/${m.id}`,
				label: `${m.id} (Dynamic)`,
				provider: this.name,
				maxTokenAllowed: m.context_length || 128e3
			})) || [];
		} catch (error) {
			console.error(`Failed to fetch Fireworks models:`, error);
			return [];
		}
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "FIREWORKS_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		return createFireworks({ apiKey })(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/github.ts
var GithubProvider = class extends BaseProvider {
	name = "Github";
	getApiKeyLink = "https://github.com/settings/personal-access-tokens";
	config = { apiTokenKey: "GITHUB_API_KEY" };
	staticModels = [
		{
			name: "openai/gpt-4o",
			label: "GPT-4o",
			provider: "Github",
			maxTokenAllowed: 131072,
			maxCompletionTokens: 4096
		},
		{
			name: "openai/gpt-4o-mini",
			label: "GPT-4o Mini",
			provider: "Github",
			maxTokenAllowed: 131072,
			maxCompletionTokens: 4096
		},
		{
			name: "openai/o1-preview",
			label: "o1-preview",
			provider: "Github",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 32e3
		},
		{
			name: "openai/o1-mini",
			label: "o1-mini",
			provider: "Github",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 65e3
		},
		{
			name: "openai/o1",
			label: "o1",
			provider: "Github",
			maxTokenAllowed: 2e5,
			maxCompletionTokens: 1e5
		},
		{
			name: "openai/gpt-4.1",
			label: "GPT-4.1",
			provider: "Github",
			maxTokenAllowed: 1048576,
			maxCompletionTokens: 32768
		},
		{
			name: "openai/gpt-4.1-mini",
			label: "GPT-4.1-mini",
			provider: "Github",
			maxTokenAllowed: 1048576,
			maxCompletionTokens: 32768
		},
		{
			name: "deepseek/deepseek-r1",
			label: "DeepSeek-R1",
			provider: "Github",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 4096
		}
	];
	async getDynamicModels(apiKeys, settings, serverEnv) {
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "GITHUB_API_KEY"
		});
		if (!apiKey) {
			console.log("GitHub: No API key found. Make sure GITHUB_API_KEY is set in your .env.local file");
			return this.staticModels;
		}
		console.log("GitHub: API key found, attempting to fetch dynamic models...");
		try {
			const response = await fetch("https://models.github.ai/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
			if (response.ok) {
				const data = await response.json();
				console.log("GitHub: Successfully fetched models from API");
				if (data.data && Array.isArray(data.data)) return data.data.map((model) => ({
					name: model.id,
					label: model.name || model.id.split("/").pop() || model.id,
					provider: "Github",
					maxTokenAllowed: model.limits?.max_input_tokens || 128e3,
					maxCompletionTokens: model.limits?.max_output_tokens || 16384
				}));
			} else console.warn("GitHub: API request failed with status:", response.status, response.statusText);
		} catch (error) {
			console.warn("GitHub: Failed to fetch models, using static models:", error);
		}
		console.log("GitHub: Using static models as fallback");
		return this.staticModels;
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		console.log(`GitHub: Creating model instance for ${model}`);
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "GITHUB_API_KEY"
		});
		if (!apiKey) {
			console.error("GitHub: No API key found");
			throw new Error(`Missing API key for ${this.name} provider`);
		}
		console.log("GitHub: Using configured API key");
		const openai = createOpenAI({
			baseURL: "https://models.github.ai/inference",
			apiKey
		});
		console.log(`GitHub: Created OpenAI client, requesting model: ${model}`);
		return openai.chat(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/google.ts
var GoogleProvider = class extends BaseProvider {
	name = "Google";
	getApiKeyLink = "https://aistudio.google.com/app/apikey";
	config = { apiTokenKey: "GOOGLE_GENERATIVE_AI_API_KEY" };
	staticModels = [
		{
			name: "gemini-3.1-pro-preview",
			label: "Gemini 3.1 Pro Preview",
			provider: "Google",
			maxTokenAllowed: 1048576,
			maxCompletionTokens: 65536
		},
		{
			name: "gemini-3.5-flash",
			label: "Gemini 3.5 Flash",
			provider: "Google",
			maxTokenAllowed: 1048576,
			maxCompletionTokens: 65536
		},
		{
			name: "gemini-3-flash-preview",
			label: "Gemini 3 Flash Preview",
			provider: "Google",
			maxTokenAllowed: 1048576,
			maxCompletionTokens: 65536
		},
		{
			name: "gemini-2.5-pro",
			label: "Gemini 2.5 Pro",
			provider: "Google",
			maxTokenAllowed: 1048576,
			maxCompletionTokens: 65536
		},
		{
			name: "gemini-2.5-flash",
			label: "Gemini 2.5 Flash",
			provider: "Google",
			maxTokenAllowed: 1048576,
			maxCompletionTokens: 65536
		},
		{
			name: "gemini-2.5-flash-lite",
			label: "Gemini 2.5 Flash-Lite",
			provider: "Google",
			maxTokenAllowed: 1048576,
			maxCompletionTokens: 65536
		},
		{
			name: "gemini-1.5-pro",
			label: "Gemini 1.5 Pro",
			provider: "Google",
			maxTokenAllowed: 2e6,
			maxCompletionTokens: 8192
		},
		{
			name: "gemini-1.5-flash",
			label: "Gemini 1.5 Flash",
			provider: "Google",
			maxTokenAllowed: 1e6,
			maxCompletionTokens: 8192
		}
	];
	async getDynamicModels(apiKeys, settings, serverEnv) {
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "GOOGLE_GENERATIVE_AI_API_KEY"
		});
		if (!apiKey) throw `Missing Api Key configuration for ${this.name} provider`;
		const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, { headers: { ["Content-Type"]: "application/json" } });
		if (!response.ok) throw new Error(`Failed to fetch models from Google API: ${response.status} ${response.statusText}`);
		const res = await response.json();
		if (!res.models || !Array.isArray(res.models)) throw new Error("Invalid response format from Google API");
		return res.models.filter((model) => {
			const hasGoodTokenLimit = (model.outputTokenLimit || 0) > 8e3;
			const isStable = !model.name.includes("exp") || model.name.includes("flash-exp");
			return hasGoodTokenLimit && isStable;
		}).map((m) => {
			const modelName = m.name.replace("models/", "");
			let contextWindow = 32e3;
			if (m.inputTokenLimit && m.outputTokenLimit) contextWindow = m.inputTokenLimit;
			else if (modelName.includes("gemini-3") || modelName.includes("gemini-2.5")) contextWindow = 1048576;
			else if (modelName.includes("gemini-1.5-pro")) contextWindow = 2e6;
			else if (modelName.includes("gemini-1.5-flash")) contextWindow = 1e6;
			else if (modelName.includes("gemini-2.0-flash")) contextWindow = 1e6;
			else if (modelName.includes("gemini-pro")) contextWindow = 32e3;
			else if (modelName.includes("gemini-flash")) contextWindow = 32e3;
			const finalContext = Math.min(contextWindow, 2e6);
			let completionTokens = modelName.includes("gemini-3") || modelName.includes("gemini-2.5") ? 65536 : 8192;
			if (m.outputTokenLimit && m.outputTokenLimit > 0) completionTokens = Math.min(m.outputTokenLimit, 128e3);
			return {
				name: modelName,
				label: `${m.displayName} (${finalContext >= 1e6 ? Math.floor(finalContext / 1e6) + "M" : Math.floor(finalContext / 1e3) + "k"} context)`,
				provider: this.name,
				maxTokenAllowed: finalContext,
				maxCompletionTokens: completionTokens
			};
		});
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "GOOGLE_GENERATIVE_AI_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		return createGoogleGenerativeAI({ apiKey })(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/groq.ts
var GroqProvider = class extends BaseProvider {
	name = "Groq";
	getApiKeyLink = "https://console.groq.com/keys";
	config = { apiTokenKey: "GROQ_API_KEY" };
	staticModels = [
		{
			name: "llama-3.1-8b-instant",
			label: "Llama 3.1 8B",
			provider: "Groq",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 8192
		},
		{
			name: "llama-3.3-70b-versatile",
			label: "Llama 3.3 70B",
			provider: "Groq",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 8192
		},
		{
			name: "openai/gpt-oss-120b",
			label: "GPT-OSS 120B",
			provider: "Groq",
			maxTokenAllowed: 131072,
			maxCompletionTokens: 65536
		},
		{
			name: "openai/gpt-oss-20b",
			label: "GPT-OSS 20B",
			provider: "Groq",
			maxTokenAllowed: 131072,
			maxCompletionTokens: 65536
		},
		{
			name: "groq/compound",
			label: "Groq Compound",
			provider: "Groq",
			maxTokenAllowed: 131072,
			maxCompletionTokens: 65536
		},
		{
			name: "groq/compound-mini",
			label: "Groq Compound Mini",
			provider: "Groq",
			maxTokenAllowed: 131072,
			maxCompletionTokens: 65536
		},
		{
			name: "qwen/qwen3-32b",
			label: "Qwen3 32B",
			provider: "Groq",
			maxTokenAllowed: 131072,
			maxCompletionTokens: 65536
		},
		{
			name: "qwen/qwen3.6-27b",
			label: "Qwen3.6 27B",
			provider: "Groq",
			maxTokenAllowed: 131072,
			maxCompletionTokens: 65536
		}
	];
	async getDynamicModels(apiKeys, settings, serverEnv) {
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "GROQ_API_KEY"
		});
		if (!apiKey) throw `Missing Api Key configuration for ${this.name} provider`;
		return (await (await fetch(`https://api.groq.com/openai/v1/models`, { headers: { Authorization: `Bearer ${apiKey}` } })).json()).data.filter((model) => model.object === "model" && model.active && model.context_window > 8e3).map((m) => ({
			name: m.id,
			label: `${m.id} - context ${m.context_window ? Math.floor(m.context_window / 1e3) + "k" : "N/A"} [ by ${m.owned_by}]`,
			provider: this.name,
			maxTokenAllowed: Math.min(m.context_window || 8192, 16384),
			maxCompletionTokens: 8192
		}));
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "GROQ_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		return createOpenAI({
			baseURL: "https://api.groq.com/openai/v1",
			apiKey
		}).chat(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/huggingface.ts
var HuggingFaceProvider = class extends BaseProvider {
	name = "HuggingFace";
	getApiKeyLink = "https://huggingface.co/settings/tokens";
	config = { apiTokenKey: "HuggingFace_API_KEY" };
	staticModels = [
		{
			name: "Qwen/Qwen2.5-Coder-32B-Instruct",
			label: "Qwen2.5-Coder-32B-Instruct (HuggingFace)",
			provider: "HuggingFace",
			maxTokenAllowed: 8e3
		},
		{
			name: "01-ai/Yi-1.5-34B-Chat",
			label: "Yi-1.5-34B-Chat (HuggingFace)",
			provider: "HuggingFace",
			maxTokenAllowed: 8e3
		},
		{
			name: "codellama/CodeLlama-34b-Instruct-hf",
			label: "CodeLlama-34b-Instruct (HuggingFace)",
			provider: "HuggingFace",
			maxTokenAllowed: 8e3
		},
		{
			name: "NousResearch/Hermes-3-Llama-3.1-8B",
			label: "Hermes-3-Llama-3.1-8B (HuggingFace)",
			provider: "HuggingFace",
			maxTokenAllowed: 8e3
		},
		{
			name: "Qwen/Qwen2.5-Coder-32B-Instruct",
			label: "Qwen2.5-Coder-32B-Instruct (HuggingFace)",
			provider: "HuggingFace",
			maxTokenAllowed: 8e3
		},
		{
			name: "Qwen/Qwen2.5-72B-Instruct",
			label: "Qwen2.5-72B-Instruct (HuggingFace)",
			provider: "HuggingFace",
			maxTokenAllowed: 8e3
		},
		{
			name: "meta-llama/Llama-3.1-70B-Instruct",
			label: "Llama-3.1-70B-Instruct (HuggingFace)",
			provider: "HuggingFace",
			maxTokenAllowed: 8e3
		},
		{
			name: "meta-llama/Llama-3.1-405B",
			label: "Llama-3.1-405B (HuggingFace)",
			provider: "HuggingFace",
			maxTokenAllowed: 8e3
		},
		{
			name: "01-ai/Yi-1.5-34B-Chat",
			label: "Yi-1.5-34B-Chat (HuggingFace)",
			provider: "HuggingFace",
			maxTokenAllowed: 8e3
		},
		{
			name: "codellama/CodeLlama-34b-Instruct-hf",
			label: "CodeLlama-34b-Instruct (HuggingFace)",
			provider: "HuggingFace",
			maxTokenAllowed: 8e3
		},
		{
			name: "NousResearch/Hermes-3-Llama-3.1-8B",
			label: "Hermes-3-Llama-3.1-8B (HuggingFace)",
			provider: "HuggingFace",
			maxTokenAllowed: 8e3
		}
	];
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "HuggingFace_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		return createOpenAI({
			baseURL: "https://api-inference.huggingface.co/v1/",
			apiKey
		}).chat(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/hyperbolic.ts
var HyperbolicProvider = class extends BaseProvider {
	name = "Hyperbolic";
	getApiKeyLink = "https://app.hyperbolic.xyz/settings";
	config = { apiTokenKey: "HYPERBOLIC_API_KEY" };
	staticModels = [
		{
			name: "Qwen/Qwen2.5-Coder-32B-Instruct",
			label: "Qwen 2.5 Coder 32B Instruct",
			provider: "Hyperbolic",
			maxTokenAllowed: 8192
		},
		{
			name: "Qwen/Qwen2.5-72B-Instruct",
			label: "Qwen2.5-72B-Instruct",
			provider: "Hyperbolic",
			maxTokenAllowed: 8192
		},
		{
			name: "deepseek-ai/DeepSeek-V2.5",
			label: "DeepSeek-V2.5",
			provider: "Hyperbolic",
			maxTokenAllowed: 8192
		},
		{
			name: "Qwen/QwQ-32B-Preview",
			label: "QwQ-32B-Preview",
			provider: "Hyperbolic",
			maxTokenAllowed: 8192
		},
		{
			name: "Qwen/Qwen2-VL-72B-Instruct",
			label: "Qwen2-VL-72B-Instruct",
			provider: "Hyperbolic",
			maxTokenAllowed: 8192
		}
	];
	async getDynamicModels(apiKeys, settings, serverEnv = {}) {
		const { baseUrl: fetchBaseUrl, apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "HYPERBOLIC_API_KEY"
		});
		const baseUrl = fetchBaseUrl || "https://api.hyperbolic.xyz/v1";
		if (!apiKey) throw `Missing Api Key configuration for ${this.name} provider`;
		return (await (await fetch(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${apiKey}` } })).json()).data.filter((model) => model.object === "model" && model.supports_chat).map((m) => ({
			name: m.id,
			label: `${m.id} - context ${m.context_length ? Math.floor(m.context_length / 1e3) + "k" : "N/A"}`,
			provider: this.name,
			maxTokenAllowed: m.context_length || 8e3
		}));
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "HYPERBOLIC_API_KEY"
		});
		if (!apiKey) throw `Missing Api Key configuration for ${this.name} provider`;
		return createOpenAI({
			baseURL: "https://api.hyperbolic.xyz/v1/",
			apiKey
		}).chat(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/lmstudio.ts
var LMStudioProvider = class extends BaseProvider {
	name = "LMStudio";
	getApiKeyLink = "https://lmstudio.ai/";
	labelForGetApiKey = "Get LMStudio";
	icon = "i-ph:cloud-arrow-down";
	config = {
		baseUrlKey: "LMSTUDIO_API_BASE_URL",
		baseUrl: "http://localhost:1234/"
	};
	staticModels = [];
	_resolveBaseUrl(apiKeys, settings, serverEnv) {
		let { baseUrl } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "LMSTUDIO_API_BASE_URL",
			defaultApiTokenKey: ""
		});
		if (!baseUrl) throw new Error("No baseUrl found for LMStudio provider");
		baseUrl = this.resolveDockerUrl(baseUrl, serverEnv);
		return baseUrl;
	}
	async getDynamicModels(apiKeys, settings, serverEnv = {}) {
		const baseUrl = this._resolveBaseUrl(apiKeys, settings, serverEnv);
		try {
			const response = await fetch(`${baseUrl}/v1/models`, { signal: this.createTimeoutSignal() });
			if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			return (await response.json()).data.map((model) => ({
				name: model.id,
				label: model.id,
				provider: this.name,
				maxTokenAllowed: 8e3
			}));
		} catch (error) {
			if (error instanceof DOMException && error.name === "TimeoutError") {
				logger$1.warn("LMStudio model fetch timed out — is LM Studio running?");
				return [];
			}
			if (error instanceof TypeError && error.message.includes("fetch")) {
				logger$1.warn(`LMStudio not reachable at ${baseUrl} — is LM Studio running?`);
				return [];
			}
			logger$1.error("Error fetching LMStudio models:", error);
			return [];
		}
	}
	getModelInstance = (options) => {
		const { apiKeys, providerSettings, serverEnv, model } = options;
		const envRecord = this.convertEnvToRecord(serverEnv);
		const baseUrl = this._resolveBaseUrl(apiKeys, providerSettings?.[this.name], envRecord);
		logger$1.debug("LMStudio Base Url used: ", baseUrl);
		return createOpenAI({
			baseURL: `${baseUrl}/v1`,
			apiKey: ""
		}).chat(model);
	};
};
//#endregion
//#region app/lib/modules/llm/providers/mistral.ts
var MistralProvider = class extends BaseProvider {
	name = "Mistral";
	getApiKeyLink = "https://console.mistral.ai/api-keys/";
	config = { apiTokenKey: "MISTRAL_API_KEY" };
	staticModels = [
		{
			name: "mistral-medium-latest",
			label: "Mistral Medium 3.5",
			provider: "Mistral",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 32768
		},
		{
			name: "mistral-small-latest",
			label: "Mistral Small 4",
			provider: "Mistral",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 32768
		},
		{
			name: "codestral-latest",
			label: "Codestral Premier",
			provider: "Mistral",
			maxTokenAllowed: 256e3,
			maxCompletionTokens: 32768
		},
		{
			name: "mistral-large-latest",
			label: "Mistral Large Latest",
			provider: "Mistral",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 32768
		},
		{
			name: "open-mistral-7b",
			label: "Mistral 7B",
			provider: "Mistral",
			maxTokenAllowed: 32e3,
			maxCompletionTokens: 8192
		},
		{
			name: "open-mixtral-8x7b",
			label: "Mistral 8x7B",
			provider: "Mistral",
			maxTokenAllowed: 32e3,
			maxCompletionTokens: 8192
		},
		{
			name: "open-mixtral-8x22b",
			label: "Mistral 8x22B",
			provider: "Mistral",
			maxTokenAllowed: 64e3,
			maxCompletionTokens: 8192
		},
		{
			name: "open-codestral-mamba",
			label: "Codestral Mamba",
			provider: "Mistral",
			maxTokenAllowed: 256e3,
			maxCompletionTokens: 8192
		},
		{
			name: "open-mistral-nemo",
			label: "Mistral Nemo",
			provider: "Mistral",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 8192
		},
		{
			name: "ministral-8b-latest",
			label: "Mistral 8B",
			provider: "Mistral",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 8192
		}
	];
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "MISTRAL_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		return createMistral({ apiKey })(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/moonshot.ts
var MoonshotProvider = class extends BaseProvider {
	name = "Moonshot";
	getApiKeyLink = "https://platform.moonshot.ai/console/api-keys";
	config = { apiTokenKey: "MOONSHOT_API_KEY" };
	staticModels = [
		{
			name: "moonshot-v1-8k",
			label: "Moonshot v1 8K",
			provider: "Moonshot",
			maxTokenAllowed: 8e3
		},
		{
			name: "moonshot-v1-32k",
			label: "Moonshot v1 32K",
			provider: "Moonshot",
			maxTokenAllowed: 32e3
		},
		{
			name: "moonshot-v1-128k",
			label: "Moonshot v1 128K",
			provider: "Moonshot",
			maxTokenAllowed: 128e3
		},
		{
			name: "moonshot-v1-auto",
			label: "Moonshot v1 Auto",
			provider: "Moonshot",
			maxTokenAllowed: 128e3
		},
		{
			name: "moonshot-v1-8k-vision-preview",
			label: "Moonshot v1 8K Vision",
			provider: "Moonshot",
			maxTokenAllowed: 8e3
		},
		{
			name: "moonshot-v1-32k-vision-preview",
			label: "Moonshot v1 32K Vision",
			provider: "Moonshot",
			maxTokenAllowed: 32e3
		},
		{
			name: "moonshot-v1-128k-vision-preview",
			label: "Moonshot v1 128K Vision",
			provider: "Moonshot",
			maxTokenAllowed: 128e3
		},
		{
			name: "kimi-latest",
			label: "Kimi Latest",
			provider: "Moonshot",
			maxTokenAllowed: 128e3
		},
		{
			name: "kimi-k2-0711-preview",
			label: "Kimi K2 Preview",
			provider: "Moonshot",
			maxTokenAllowed: 128e3
		},
		{
			name: "kimi-k2-turbo-preview",
			label: "Kimi K2 Turbo",
			provider: "Moonshot",
			maxTokenAllowed: 128e3
		},
		{
			name: "kimi-thinking-preview",
			label: "Kimi Thinking",
			provider: "Moonshot",
			maxTokenAllowed: 128e3
		}
	];
	async getDynamicModels(apiKeys, settings, serverEnv) {
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "MOONSHOT_API_KEY"
		});
		if (!apiKey) return [];
		try {
			const response = await fetch("https://api.moonshot.ai/v1/models", {
				headers: { Authorization: `Bearer ${apiKey}` },
				signal: this.createTimeoutSignal(5e3)
			});
			if (!response.ok) {
				console.error(`Moonshot API error: ${response.statusText}`);
				return [];
			}
			const data = await response.json();
			const staticModelIds = this.staticModels.map((m) => m.name);
			return data.data?.filter((model) => !staticModelIds.includes(model.id)).map((m) => ({
				name: m.id,
				label: `${m.id} (Dynamic)`,
				provider: this.name,
				maxTokenAllowed: 128e3
			})) || [];
		} catch (error) {
			console.error(`Failed to fetch Moonshot models:`, error);
			return [];
		}
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "MOONSHOT_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		return createOpenAI({
			baseURL: "https://api.moonshot.ai/v1",
			apiKey
		}).chat(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/ollama.ts
var OllamaProvider = class extends BaseProvider {
	name = "Ollama";
	getApiKeyLink = "https://ollama.com/download";
	labelForGetApiKey = "Download Ollama";
	icon = "i-ph:cloud-arrow-down";
	config = { baseUrlKey: "OLLAMA_API_BASE_URL" };
	staticModels = [];
	getDefaultNumCtx(serverEnv) {
		const envRecord = this.convertEnvToRecord(serverEnv);
		return envRecord.DEFAULT_NUM_CTX ? parseInt(envRecord.DEFAULT_NUM_CTX, 10) : 32768;
	}
	_resolveBaseUrl(apiKeys, settings, serverEnv) {
		let { baseUrl } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "OLLAMA_API_BASE_URL",
			defaultApiTokenKey: ""
		});
		if (!baseUrl) throw new Error("No baseUrl found for Ollama provider");
		baseUrl = this.resolveDockerUrl(baseUrl, serverEnv);
		return baseUrl;
	}
	async getDynamicModels(apiKeys, settings, serverEnv = {}) {
		const baseUrl = this._resolveBaseUrl(apiKeys, settings, serverEnv);
		try {
			const response = await fetch(`${baseUrl}/api/tags`, { signal: this.createTimeoutSignal() });
			if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			return (await response.json()).models.map((model) => ({
				name: model.name,
				label: `${model.name} (${model.details.parameter_size})`,
				provider: this.name,
				maxTokenAllowed: 8e3
			}));
		} catch (error) {
			if (error instanceof DOMException && error.name === "TimeoutError") {
				logger$1.warn("Ollama model fetch timed out — is Ollama running?");
				return [];
			}
			if (error instanceof TypeError && error.message.includes("fetch")) {
				logger$1.warn(`Ollama not reachable at ${baseUrl} — is Ollama running?`);
				return [];
			}
			logger$1.error("Error fetching Ollama models:", error);
			return [];
		}
	}
	getModelInstance = (options) => {
		const { apiKeys, providerSettings, serverEnv, model } = options;
		const envRecord = this.convertEnvToRecord(serverEnv);
		const baseUrl = this._resolveBaseUrl(apiKeys, providerSettings?.[this.name], envRecord);
		logger$1.debug("Ollama Base Url used: ", baseUrl);
		return createOllama({ baseURL: `${baseUrl}/api` }).chat(model, { options: { num_ctx: this.getDefaultNumCtx(serverEnv) } });
	};
};
//#endregion
//#region app/lib/modules/llm/providers/open-router.ts
var OpenRouterProvider = class extends BaseProvider {
	name = "OpenRouter";
	getApiKeyLink = "https://openrouter.ai/settings/keys";
	config = { apiTokenKey: "OPEN_ROUTER_API_KEY" };
	staticModels = [
		{
			name: "z-ai/glm-5.3-flash",
			label: "GLM 5.3 Flash",
			provider: "OpenRouter",
			maxTokenAllowed: 1310720,
			maxCompletionTokens: 16384
		},
		{
			name: "anthropic/claude-3.5-sonnet",
			label: "Claude 3.5 Sonnet",
			provider: "OpenRouter",
			maxTokenAllowed: 2e5
		},
		{
			name: "openai/gpt-4o",
			label: "GPT-4o",
			provider: "OpenRouter",
			maxTokenAllowed: 128e3
		}
	];
	async getDynamicModels(_apiKeys, _settings, _serverEnv = {}) {
		try {
			const response = await fetch("https://openrouter.ai/api/v1/models", { headers: { "Content-Type": "application/json" } });
			if (!response.ok) throw new Error(`OpenRouter model list request failed (${response.status}).`);
			return (await response.json()).data.filter((model) => !model.architecture?.output_modalities || model.architecture.output_modalities.includes("text")).sort((a, b) => a.name.localeCompare(b.name)).map((m) => {
				const contextWindow = m.context_length || 32e3;
				const finalContext = Math.min(contextWindow, 2e6);
				return {
					name: m.id,
					label: `${m.name} - in:$${(Number(m.pricing.prompt) * 1e6).toFixed(2)} out:$${(Number(m.pricing.completion) * 1e6).toFixed(2)} - context ${finalContext >= 1e6 ? Math.floor(finalContext / 1e6) + "M" : Math.floor(finalContext / 1e3) + "k"}`,
					provider: this.name,
					isFree: Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0,
					maxTokenAllowed: finalContext
				};
			});
		} catch (error) {
			console.error("Error getting OpenRouter models:", error);
			return [];
		}
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "OPEN_ROUTER_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		return createOpenRouter({ apiKey }).chat(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/openai.ts
function isResponsesOnlyModel(modelId) {
	return modelId.includes("codex") || modelId.startsWith("codex-");
}
var OpenAIProvider = class extends BaseProvider {
	name = "OpenAI";
	getApiKeyLink = "https://platform.openai.com/api-keys";
	config = { apiTokenKey: "OPENAI_API_KEY" };
	staticModels = [
		{
			name: "gpt-5.5",
			label: "GPT-5.5",
			provider: "OpenAI",
			maxTokenAllowed: 1e6,
			maxCompletionTokens: 128e3
		},
		{
			name: "gpt-5.5-pro",
			label: "GPT-5.5 Pro",
			provider: "OpenAI",
			maxTokenAllowed: 1e6,
			maxCompletionTokens: 128e3
		},
		{
			name: "gpt-5.4",
			label: "GPT-5.4",
			provider: "OpenAI",
			maxTokenAllowed: 1e6,
			maxCompletionTokens: 128e3
		},
		{
			name: "gpt-5.4-pro",
			label: "GPT-5.4 Pro",
			provider: "OpenAI",
			maxTokenAllowed: 1e6,
			maxCompletionTokens: 128e3
		},
		{
			name: "gpt-5.4-mini",
			label: "GPT-5.4 Mini",
			provider: "OpenAI",
			maxTokenAllowed: 4e5,
			maxCompletionTokens: 128e3
		},
		{
			name: "gpt-5.4-nano",
			label: "GPT-5.4 Nano",
			provider: "OpenAI",
			maxTokenAllowed: 4e5,
			maxCompletionTokens: 128e3
		},
		{
			name: "gpt-5.3-codex",
			label: "GPT-5.3 Codex",
			provider: "OpenAI",
			maxTokenAllowed: 4e5,
			maxCompletionTokens: 128e3
		},
		{
			name: "gpt-4o",
			label: "GPT-4o",
			provider: "OpenAI",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 4096
		},
		{
			name: "gpt-4o-mini",
			label: "GPT-4o Mini",
			provider: "OpenAI",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 4096
		},
		{
			name: "gpt-3.5-turbo",
			label: "GPT-3.5 Turbo",
			provider: "OpenAI",
			maxTokenAllowed: 16e3,
			maxCompletionTokens: 4096
		},
		{
			name: "o1-preview",
			label: "o1-preview",
			provider: "OpenAI",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 32e3
		},
		{
			name: "o1-mini",
			label: "o1-mini",
			provider: "OpenAI",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 65e3
		}
	];
	async getDynamicModels(apiKeys, settings, serverEnv) {
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "OPENAI_API_KEY"
		});
		if (!apiKey) throw `Missing Api Key configuration for ${this.name} provider`;
		const res = await (await fetch(`https://api.openai.com/v1/models`, { headers: { Authorization: `Bearer ${apiKey}` } })).json();
		const staticModelIds = this.staticModels.map((m) => m.name);
		return res.data.filter((model) => model.object === "model" && (model.id.startsWith("gpt-") || model.id.startsWith("o") || model.id.startsWith("chatgpt-") || model.id.startsWith("codex-")) && !staticModelIds.includes(model.id)).map((m) => {
			let contextWindow = 32e3;
			if (m.context_length) contextWindow = m.context_length;
			else if (m.id?.includes("gpt-5.5")) contextWindow = 1e6;
			else if (m.id?.includes("gpt-5.4")) contextWindow = 1e6;
			else if (m.id?.includes("gpt-5.3-codex")) contextWindow = 4e5;
			else if (m.id?.includes("gpt-4o")) contextWindow = 128e3;
			else if (m.id?.includes("gpt-4-turbo") || m.id?.includes("gpt-4-1106")) contextWindow = 128e3;
			else if (m.id?.includes("gpt-4")) contextWindow = 8192;
			else if (m.id?.includes("gpt-3.5-turbo")) contextWindow = 16385;
			let maxCompletionTokens = 4096;
			if (m.id?.includes("gpt-5.5") || m.id?.includes("gpt-5.4") || m.id?.includes("gpt-5.3-codex")) maxCompletionTokens = 128e3;
			else if (m.id?.startsWith("o1-preview")) maxCompletionTokens = 32e3;
			else if (m.id?.startsWith("o1-mini")) maxCompletionTokens = 65e3;
			else if (m.id?.startsWith("o1")) maxCompletionTokens = 32e3;
			else if (m.id?.includes("o3") || m.id?.includes("o4")) maxCompletionTokens = 1e5;
			else if (m.id?.includes("gpt-4o")) maxCompletionTokens = 4096;
			else if (m.id?.includes("gpt-4")) maxCompletionTokens = 8192;
			else if (m.id?.includes("gpt-3.5-turbo")) maxCompletionTokens = 4096;
			return {
				name: m.id,
				label: `${m.id} (${Math.floor(contextWindow / 1e3)}k context)`,
				provider: this.name,
				maxTokenAllowed: Math.min(contextWindow, 1e6),
				maxCompletionTokens
			};
		});
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "OPENAI_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		const openai = createOpenAI({ apiKey });
		if (isResponsesOnlyModel(model) && typeof openai.responses === "function") return openai.responses(model);
		return openai.chat(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/openai-like.ts
var OpenAILikeProvider = class extends BaseProvider {
	name = "OpenAILike";
	getApiKeyLink = void 0;
	config = {
		baseUrlKey: "OPENAI_LIKE_API_BASE_URL",
		apiTokenKey: "OPENAI_LIKE_API_KEY",
		modelsKey: "OPENAI_LIKE_API_MODELS"
	};
	staticModels = [];
	async getDynamicModels(apiKeys, settings, serverEnv = {}) {
		const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "OPENAI_LIKE_API_BASE_URL",
			defaultApiTokenKey: "OPENAI_LIKE_API_KEY"
		});
		if (!baseUrl || !apiKey) return [];
		try {
			const response = await fetch(`${baseUrl}/models`, {
				headers: { Authorization: `Bearer ${apiKey}` },
				signal: this.createTimeoutSignal()
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			return (await response.json()).data.map((model) => ({
				name: model.id,
				label: model.id,
				provider: this.name,
				maxTokenAllowed: 8e3
			}));
		} catch (error) {
			logger$1.info(`${this.name}: Could not fetch /models endpoint, checking fallback env`, error);
			const modelsEnv = serverEnv["OPENAI_LIKE_API_MODELS"] || settings?.OPENAI_LIKE_API_MODELS;
			if (modelsEnv) {
				logger$1.info(`${this.name}: Using OPENAI_LIKE_API_MODELS fallback`);
				return this._parseModelsFromEnv(modelsEnv);
			}
			return [];
		}
	}
	/**
	* Parse OPENAI_LIKE_API_MODELS environment variable
	* Format: path/to/model1:limit;path/to/model2:limit;path/to/model3:limit
	*/
	_parseModelsFromEnv(modelsEnv) {
		if (!modelsEnv) return [];
		try {
			const models = [];
			const modelEntries = modelsEnv.split(";");
			for (const entry of modelEntries) {
				const trimmedEntry = entry.trim();
				if (!trimmedEntry) continue;
				const [modelPath, limitStr] = trimmedEntry.split(":");
				if (!modelPath) continue;
				const limit = limitStr ? parseInt(limitStr.trim(), 10) : 8e3;
				const modelName = modelPath.trim();
				const label = this._generateModelLabel(modelName);
				models.push({
					name: modelName,
					label,
					provider: this.name,
					maxTokenAllowed: limit
				});
			}
			logger$1.info(`${this.name}: Parsed ${models.length} models from env`);
			return models;
		} catch (error) {
			logger$1.error(`${this.name}: Error parsing OPENAI_LIKE_API_MODELS:`, error);
			return [];
		}
	}
	/**
	* Generate a readable label from model path
	*/
	_generateModelLabel(modelPath) {
		const parts = modelPath.split("/");
		let label = parts[parts.length - 1].replace(/^accounts\//, "").replace(/^fireworks\/models\//, "").replace(/^models\//, "").replace(/\b\w/g, (l) => l.toUpperCase()).replace(/\s+/g, "-");
		if (!label.includes("Fireworks") && !label.includes("OpenAI")) label += " (OpenAI Compatible)";
		return label;
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const envRecord = this.convertEnvToRecord(serverEnv);
		const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv: envRecord,
			defaultBaseUrlKey: "OPENAI_LIKE_API_BASE_URL",
			defaultApiTokenKey: "OPENAI_LIKE_API_KEY"
		});
		if (!baseUrl || !apiKey) throw new Error(`Missing configuration for ${this.name} provider`);
		return getOpenAILikeModel(baseUrl, apiKey, model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/perplexity.ts
var PerplexityProvider = class extends BaseProvider {
	name = "Perplexity";
	getApiKeyLink = "https://www.perplexity.ai/settings/api";
	config = { apiTokenKey: "PERPLEXITY_API_KEY" };
	staticModels = [
		{
			name: "sonar",
			label: "Sonar",
			provider: "Perplexity",
			maxTokenAllowed: 8192
		},
		{
			name: "sonar-pro",
			label: "Sonar Pro",
			provider: "Perplexity",
			maxTokenAllowed: 8192
		},
		{
			name: "sonar-reasoning-pro",
			label: "Sonar Reasoning Pro",
			provider: "Perplexity",
			maxTokenAllowed: 8192
		}
	];
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "PERPLEXITY_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		return createOpenAI({
			baseURL: "https://api.perplexity.ai/",
			apiKey
		}).chat(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/together.ts
var TogetherProvider = class extends BaseProvider {
	name = "Together";
	getApiKeyLink = "https://api.together.xyz/settings/api-keys";
	config = {
		baseUrlKey: "TOGETHER_API_BASE_URL",
		apiTokenKey: "TOGETHER_API_KEY"
	};
	staticModels = [{
		name: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
		label: "Llama 3.2 90B Vision",
		provider: "Together",
		maxTokenAllowed: 128e3,
		maxCompletionTokens: 8192
	}, {
		name: "mistralai/Mixtral-8x7B-Instruct-v0.1",
		label: "Mixtral 8x7B Instruct",
		provider: "Together",
		maxTokenAllowed: 32e3,
		maxCompletionTokens: 8192
	}];
	async getDynamicModels(apiKeys, settings, serverEnv = {}) {
		const { baseUrl: fetchBaseUrl, apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "TOGETHER_API_BASE_URL",
			defaultApiTokenKey: "TOGETHER_API_KEY"
		});
		const baseUrl = fetchBaseUrl || "https://api.together.xyz/v1";
		if (!baseUrl || !apiKey) return [];
		return (await (await fetch(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${apiKey}` } })).json() || []).filter((model) => model.type === "chat").map((m) => ({
			name: m.id,
			label: `${m.display_name} - in:$${m.pricing.input.toFixed(2)} out:$${m.pricing.output.toFixed(2)} - context ${Math.floor(m.context_length / 1e3)}k`,
			provider: this.name,
			maxTokenAllowed: 8e3,
			maxCompletionTokens: 8192
		}));
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "TOGETHER_API_BASE_URL",
			defaultApiTokenKey: "TOGETHER_API_KEY"
		});
		if (!baseUrl || !apiKey) throw new Error(`Missing configuration for ${this.name} provider`);
		return getOpenAILikeModel(baseUrl, apiKey, model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/xai.ts
var XAIProvider = class extends BaseProvider {
	name = "xAI";
	getApiKeyLink = "https://docs.x.ai/docs/quickstart#creating-an-api-key";
	config = { apiTokenKey: "XAI_API_KEY" };
	staticModels = [
		{
			name: "grok-4.3",
			label: "xAI Grok 4.3",
			provider: "xAI",
			maxTokenAllowed: 256e3,
			maxCompletionTokens: 65536
		},
		{
			name: "grok-build-0.1",
			label: "xAI Grok Build 0.1",
			provider: "xAI",
			maxTokenAllowed: 256e3,
			maxCompletionTokens: 65536
		},
		{
			name: "grok-code-fast-1",
			label: "xAI Grok Code Fast 1",
			provider: "xAI",
			maxTokenAllowed: 131e3,
			maxCompletionTokens: 32768
		},
		{
			name: "grok-4",
			label: "xAI Grok 4",
			provider: "xAI",
			maxTokenAllowed: 256e3
		},
		{
			name: "grok-4-07-09",
			label: "xAI Grok 4 (07-09)",
			provider: "xAI",
			maxTokenAllowed: 256e3
		},
		{
			name: "grok-3-mini",
			label: "xAI Grok 3 Mini",
			provider: "xAI",
			maxTokenAllowed: 131e3
		},
		{
			name: "grok-3-mini-fast",
			label: "xAI Grok 3 Mini Fast",
			provider: "xAI",
			maxTokenAllowed: 131e3
		}
	];
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "",
			defaultApiTokenKey: "XAI_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		const openai = createOpenAI({
			baseURL: "https://api.x.ai/v1",
			apiKey
		});
		if ((model === "grok-4.3" || model.startsWith("grok-build-")) && typeof openai.responses === "function") return openai.responses(model);
		return openai.chat(model);
	}
};
//#endregion
//#region app/lib/modules/llm/providers/z-ai.ts
var ZaiProvider = class extends BaseProvider {
	name = "Z.ai";
	getApiKeyLink = "https://open.bigmodel.cn/usercenter/apikeys";
	config = {
		baseUrlKey: "ZAI_BASE_URL",
		apiTokenKey: "ZAI_API_KEY",
		baseUrl: "https://api.z.ai/api/coding/paas/v4"
	};
	staticModels = [
		{
			name: "glm-4.6",
			label: "GLM-4.6 (200K)",
			provider: "Z.ai",
			maxTokenAllowed: 2e5,
			maxCompletionTokens: 65536
		},
		{
			name: "glm-4.5",
			label: "GLM-4.5 (128K)",
			provider: "Z.ai",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 65536
		},
		{
			name: "glm-4.5-flash",
			label: "GLM-4.5 Flash (128K)",
			provider: "Z.ai",
			maxTokenAllowed: 128e3,
			maxCompletionTokens: 65536
		}
	];
	async getDynamicModels(apiKeys, settings, serverEnv) {
		const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: settings,
			serverEnv,
			defaultBaseUrlKey: "ZAI_BASE_URL",
			defaultApiTokenKey: "ZAI_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing Api Key configuration for ${this.name} provider`);
		const token = this._generateToken(apiKey);
		if (!this._isValidToken(token)) throw new Error(`Invalid API key format for ${this.name} provider`);
		try {
			const response = await fetch(`${baseUrl}/models`, { headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json"
			} });
			if (!response.ok) throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
			const res = await response.json();
			const staticModelIds = this.staticModels.map((m) => m.name);
			return (res.data?.filter((model) => model.object === "model" && model.id?.startsWith("glm-") && !staticModelIds.includes(model.id)) || []).map((m) => {
				let contextWindow = 128e3;
				let maxCompletionTokens = 65536;
				if (m.id?.includes("glm-4.6")) {
					contextWindow = 2e5;
					maxCompletionTokens = 65536;
				} else if (m.id?.includes("glm-4.5")) {
					contextWindow = 128e3;
					maxCompletionTokens = 65536;
				} else if (m.id?.includes("glm-4")) {
					contextWindow = 128e3;
					maxCompletionTokens = 8192;
				} else if (m.id?.includes("glm-3")) {
					contextWindow = 32e3;
					maxCompletionTokens = 4096;
				}
				return {
					name: m.id,
					label: `${m.id} (${Math.floor(contextWindow / 1e3)}k context)`,
					provider: this.name,
					maxTokenAllowed: contextWindow,
					maxCompletionTokens
				};
			});
		} catch (error) {
			console.error(`Failed to fetch dynamic models for ${this.name}:`, error);
			return [];
		}
	}
	_generateToken(apiKey) {
		try {
			const [id, secret] = apiKey.split(".");
			if (!id || !secret) throw new Error(`Invalid API key format for ${this.name}. Expected: id.secret`);
			const now = Date.now();
			const payload = {
				apiKey: id,
				exp: now + 36e5,
				timestamp: now
			};
			const header = {
				alg: "HS256",
				sign_type: "SIGN"
			};
			const base64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
			const signature = crypto.createHmac("sha256", secret).update(base64Url(header) + "." + base64Url(payload)).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
			return `${base64Url(header)}.${base64Url(payload)}.${signature}`;
		} catch (error) {
			console.error(`Failed to generate JWT token for ${this.name}:`, error);
			throw new Error(`Failed to generate JWT token: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}
	/**
	* Validates JWT token format
	*/
	_isValidToken(token) {
		try {
			const parts = token.split(".");
			return parts.length === 3 && parts.every((part) => part.length > 0);
		} catch {
			return false;
		}
	}
	getModelInstance(options) {
		const { model, serverEnv, apiKeys, providerSettings } = options;
		const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
			apiKeys,
			providerSettings: providerSettings?.[this.name],
			serverEnv,
			defaultBaseUrlKey: "ZAI_BASE_URL",
			defaultApiTokenKey: "ZAI_API_KEY"
		});
		if (!apiKey) throw new Error(`Missing API key for ${this.name} provider`);
		const token = this._generateToken(apiKey);
		return createOpenAI({
			baseURL: baseUrl,
			apiKey: token
		}).chat(model);
	}
};
//#endregion
//#region app/lib/modules/llm/registry.ts
var registry_exports = /* @__PURE__ */ __exportAll({
	AmazonBedrockProvider: () => AmazonBedrockProvider,
	AnthropicProvider: () => AnthropicProvider,
	CerebrasProvider: () => CerebrasProvider,
	CohereProvider: () => CohereProvider,
	DeepseekProvider: () => DeepseekProvider,
	FireworksProvider: () => FireworksProvider,
	GithubProvider: () => GithubProvider,
	GoogleProvider: () => GoogleProvider,
	GroqProvider: () => GroqProvider,
	HuggingFaceProvider: () => HuggingFaceProvider,
	HyperbolicProvider: () => HyperbolicProvider,
	LMStudioProvider: () => LMStudioProvider,
	MistralProvider: () => MistralProvider,
	MoonshotProvider: () => MoonshotProvider,
	OllamaProvider: () => OllamaProvider,
	OpenAILikeProvider: () => OpenAILikeProvider,
	OpenAIProvider: () => OpenAIProvider,
	OpenRouterProvider: () => OpenRouterProvider,
	PerplexityProvider: () => PerplexityProvider,
	TogetherProvider: () => TogetherProvider,
	XAIProvider: () => XAIProvider,
	ZaiProvider: () => ZaiProvider
});
//#endregion
//#region app/lib/modules/llm/manager.ts
var logger = createScopedLogger("LLMManager");
var ENABLED_PROVIDERS = /* @__PURE__ */ new Set([
	"OpenRouter",
	"Anthropic",
	"OpenAI",
	"Google",
	"Groq",
	"HuggingFace",
	"Cohere",
	"Mistral",
	"Perplexity",
	"Deepseek",
	"xAI",
	"Together",
	"Fireworks",
	"Cerebras",
	"AmazonBedrock",
	"Github",
	"Moonshot",
	"Hyperbolic",
	"Z.ai",
	"Ollama",
	"LMStudio",
	"OpenAILike"
]);
var LLMManager = class LLMManager {
	static _instance;
	_providers = /* @__PURE__ */ new Map();
	_modelList = [];
	_env = {};
	constructor(_env) {
		this._registerProvidersFromDirectory();
		this._env = _env;
		setEnv(_env);
	}
	static getInstance(env = {}) {
		if (!LLMManager._instance) LLMManager._instance = new LLMManager(env);
		else if (Object.keys(env).length > 0) {
			LLMManager._instance._env = env;
			setEnv(env);
		}
		return LLMManager._instance;
	}
	get env() {
		return this._env;
	}
	async _registerProvidersFromDirectory() {
		try {
			for (const exportedItem of Object.values(registry_exports)) if (typeof exportedItem === "function" && exportedItem.prototype instanceof BaseProvider) {
				const provider = new exportedItem();
				if (!ENABLED_PROVIDERS.has(provider.name)) continue;
				try {
					this.registerProvider(provider);
				} catch (error) {
					logger.warn("Failed To Register Provider: ", provider.name, "error:", error.message);
				}
			}
		} catch (error) {
			logger.error("Error registering providers:", error);
		}
	}
	registerProvider(provider) {
		if (this._providers.has(provider.name)) {
			logger.warn(`Provider ${provider.name} is already registered. Skipping.`);
			return;
		}
		logger.info("Registering Provider: ", provider.name);
		this._providers.set(provider.name, provider);
		this._modelList = [...this._modelList, ...provider.staticModels];
	}
	getProvider(name) {
		return this._providers.get(name);
	}
	getAllProviders() {
		return Array.from(this._providers.values());
	}
	getModelList() {
		return this._modelList;
	}
	async updateModelList(options) {
		const { apiKeys, providerSettings, serverEnv, enabledProviderNames } = options;
		let enabledProviders = Array.from(this._providers.values()).map((p) => p.name);
		if (enabledProviderNames) enabledProviders = enabledProviders.filter((name) => enabledProviderNames.includes(name));
		if (!enabledProviderNames && providerSettings && Object.keys(providerSettings).length > 0) enabledProviders = enabledProviders.filter((name) => providerSettings[name]?.enabled);
		const dynamicModels = await Promise.all(Array.from(this._providers.values()).filter((provider) => enabledProviders.includes(provider.name)).filter((provider) => !!provider.getDynamicModels).map(async (provider) => {
			const cachedModels = provider.getModelsFromCache(options);
			if (cachedModels) return cachedModels;
			return await provider.getDynamicModels(apiKeys, providerSettings?.[provider.name], serverEnv).then((models) => {
				logger.info(`Caching ${models.length} dynamic models for ${provider.name}`);
				provider.storeDynamicModels(options, models);
				return models;
			}).catch((err) => {
				const message = err instanceof Error ? err.message : String(err);
				if (message.toLowerCase().includes("missing api key")) logger.debug(`Dynamic models skipped for ${provider.name}: ${message}`);
				else logger.error(`Error getting dynamic models ${provider.name} :`, err);
				return [];
			});
		}));
		const staticModels = Array.from(this._providers.values()).filter((provider) => enabledProviders.includes(provider.name)).flatMap((provider) => provider.staticModels || []);
		const dynamicModelsFlat = dynamicModels.flat();
		const dynamicModelKeys = dynamicModelsFlat.map((d) => `${d.name}-${d.provider}`);
		const filteredStaticModels = staticModels.filter((m) => !dynamicModelKeys.includes(`${m.name}-${m.provider}`));
		const modelList = [...dynamicModelsFlat, ...filteredStaticModels];
		modelList.sort((a, b) => a.name.localeCompare(b.name));
		this._modelList = modelList;
		return modelList;
	}
	getStaticModelList() {
		return [...this._providers.values()].flatMap((p) => p.staticModels || []);
	}
	async getModelListFromProvider(providerArg, options) {
		const provider = this._providers.get(providerArg.name);
		if (!provider) throw new Error(`Provider ${providerArg.name} not found`);
		const staticModels = provider.staticModels || [];
		if (!provider.getDynamicModels) return staticModels;
		const { apiKeys, providerSettings, serverEnv } = options;
		const cachedModels = provider.getModelsFromCache({
			apiKeys,
			providerSettings,
			serverEnv
		});
		if (cachedModels) {
			logger.info(`Found ${cachedModels.length} cached models for ${provider.name}`);
			const cachedModelNames = new Set(cachedModels.map((model) => model.name));
			return [...cachedModels, ...staticModels.filter((model) => !cachedModelNames.has(model.name))];
		}
		logger.info(`Getting dynamic models for ${provider.name}`);
		const dynamicModels = await provider.getDynamicModels?.(apiKeys, providerSettings?.[provider.name], serverEnv).then((models) => {
			logger.info(`Got ${models.length} dynamic models for ${provider.name}`);
			provider.storeDynamicModels(options, models);
			return models;
		}).catch((err) => {
			const message = err instanceof Error ? err.message : String(err);
			if (message.toLowerCase().includes("missing api key")) logger.debug(`Dynamic models skipped for ${provider.name}: ${message}`);
			else logger.error(`Error getting dynamic models ${provider.name} :`, err);
			return [];
		});
		const dynamicModelsName = dynamicModels.map((d) => d.name);
		const filteredStaticList = staticModels.filter((m) => !dynamicModelsName.includes(m.name));
		const modelList = [...dynamicModels, ...filteredStaticList];
		modelList.sort((a, b) => a.name.localeCompare(b.name));
		return modelList;
	}
	getStaticModelListFromProvider(providerArg) {
		const provider = this._providers.get(providerArg.name);
		if (!provider) throw new Error(`Provider ${providerArg.name} not found`);
		return [...provider.staticModels || []];
	}
	getDefaultProvider() {
		const openRouter = this._providers.get("OpenRouter");
		if (openRouter) return openRouter;
		const firstProvider = this._providers.values().next().value;
		if (!firstProvider) throw new Error("No providers registered");
		return firstProvider;
	}
};
var WORK_DIR = `/home/project`;
var MODIFICATIONS_TAG_NAME = "bolt_file_modifications";
var MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
var PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
var DEFAULT_MODEL = "claude-3-5-sonnet-latest";
var TOOL_EXECUTION_APPROVAL = {
	APPROVE: "Yes, approved.",
	REJECT: "No, rejected."
};
var TOOL_NO_EXECUTE_FUNCTION = "Error: No execute function found on tool";
var TOOL_EXECUTION_DENIED = "Error: User denied access to tool execution";
var TOOL_EXECUTION_ERROR = "Error: An error occured while calling tool";
var llmManager = LLMManager.getInstance({
	"BASE_URL": "/",
	"DEV": false,
	"LMSTUDIO_API_BASE_URL": "",
	"MODE": "production",
	"OLLAMA_API_BASE_URL": "",
	"OPENAI_LIKE_API_BASE_URL": "",
	"PROD": true,
	"SSR": true,
	"TOGETHER_API_BASE_URL": "",
	"VITE_GITHUB_ACCESS_TOKEN": "",
	"VITE_GITHUB_TOKEN_TYPE": "",
	"VITE_GITLAB_ACCESS_TOKEN": "",
	"VITE_GITLAB_TOKEN_TYPE": "personal-access-token",
	"VITE_GITLAB_URL": "https://gitlab.com",
	"VITE_LOG_LEVEL": "",
	"VITE_NETLIFY_ACCESS_TOKEN": "",
	"VITE_SUPABASE_ACCESS_TOKEN": "",
	"VITE_SUPABASE_ANON_KEY": "",
	"VITE_SUPABASE_URL": "",
	"VITE_VERCEL_ACCESS_TOKEN": ""
});
var PROVIDER_LIST = llmManager.getAllProviders();
var DEFAULT_PROVIDER = llmManager.getDefaultProvider();
var providerBaseUrlEnvKeys = {};
PROVIDER_LIST.forEach((provider) => {
	providerBaseUrlEnvKeys[provider.name] = {
		baseUrlKey: provider.config.baseUrlKey,
		apiTokenKey: provider.config.apiTokenKey
	};
});
var STARTER_TEMPLATES = [
	{
		name: "Expo App",
		label: "Expo App",
		description: "Expo starter template for building cross-platform mobile apps",
		githubRepo: "blueberry-llm/bolt-expo-template",
		tags: [
			"mobile",
			"expo",
			"mobile-app",
			"android",
			"iphone"
		],
		icon: "i-bolt:expo"
	},
	{
		name: "Basic Astro",
		label: "Astro Basic",
		description: "Lightweight Astro starter template for building fast static websites",
		githubRepo: "blueberry-llm/bolt-astro-basic-template",
		tags: [
			"astro",
			"blog",
			"performance"
		],
		icon: "i-bolt:astro"
	},
	{
		name: "NextJS Shadcn",
		label: "Next.js with shadcn/ui",
		description: "Next.js starter fullstack template integrated with shadcn/ui components and styling system",
		githubRepo: "blueberry-llm/bolt-nextjs-shadcn-template",
		tags: [
			"nextjs",
			"react",
			"typescript",
			"shadcn",
			"tailwind"
		],
		icon: "i-bolt:nextjs"
	},
	{
		name: "Vite Shadcn",
		label: "Vite with shadcn/ui",
		description: "Vite starter fullstack template integrated with shadcn/ui components and styling system",
		githubRepo: "blueberry-llm/vite-shadcn",
		tags: [
			"vite",
			"react",
			"typescript",
			"shadcn",
			"tailwind"
		],
		icon: "i-bolt:shadcn"
	},
	{
		name: "Qwik Typescript",
		label: "Qwik TypeScript",
		description: "Qwik framework starter with TypeScript for building resumable applications",
		githubRepo: "blueberry-llm/bolt-qwik-ts-template",
		tags: [
			"qwik",
			"typescript",
			"performance",
			"resumable"
		],
		icon: "i-bolt:qwik"
	},
	{
		name: "Remix Typescript",
		label: "Remix TypeScript",
		description: "Remix framework starter with TypeScript for full-stack web applications",
		githubRepo: "blueberry-llm/bolt-remix-ts-template",
		tags: [
			"remix",
			"typescript",
			"fullstack",
			"react"
		],
		icon: "i-bolt:remix"
	},
	{
		name: "Slidev",
		label: "Slidev Presentation",
		description: "Slidev starter template for creating developer-friendly presentations using Markdown",
		githubRepo: "blueberry-llm/bolt-slidev-template",
		tags: [
			"slidev",
			"presentation",
			"markdown"
		],
		icon: "i-bolt:slidev"
	},
	{
		name: "Sveltekit",
		label: "SvelteKit",
		description: "SvelteKit starter template for building fast, efficient web applications",
		githubRepo: "blueberry-llm/bolt-sveltekit-template",
		tags: [
			"svelte",
			"sveltekit",
			"typescript"
		],
		icon: "i-bolt:svelte"
	},
	{
		name: "Vanilla Vite",
		label: "Vanilla + Vite",
		description: "Minimal Vite starter template for vanilla JavaScript projects",
		githubRepo: "blueberry-llm/vanilla-vite-template",
		tags: [
			"vite",
			"vanilla-js",
			"minimal"
		],
		icon: "i-bolt:vite"
	},
	{
		name: "Vite React",
		label: "React + Vite + typescript",
		description: "React starter template powered by Vite for fast development experience",
		githubRepo: "blueberry-llm/bolt-vite-react-ts-template",
		tags: [
			"react",
			"vite",
			"frontend",
			"website",
			"app"
		],
		icon: "i-bolt:react"
	},
	{
		name: "Vite Typescript",
		label: "Vite + TypeScript",
		description: "Vite starter template with TypeScript configuration for type-safe development",
		githubRepo: "blueberry-llm/bolt-vite-ts-template",
		tags: [
			"vite",
			"typescript",
			"minimal"
		],
		icon: "i-bolt:typescript"
	},
	{
		name: "Vue",
		label: "Vue.js",
		description: "Vue.js starter template with modern tooling and best practices",
		githubRepo: "blueberry-llm/bolt-vue-template",
		tags: [
			"vue",
			"typescript",
			"frontend"
		],
		icon: "i-bolt:vue"
	},
	{
		name: "Angular",
		label: "Angular Starter",
		description: "A modern Angular starter template with TypeScript support and best practices configuration",
		githubRepo: "blueberry-llm/bolt-angular-template",
		tags: [
			"angular",
			"typescript",
			"frontend",
			"spa"
		],
		icon: "i-bolt:angular"
	},
	{
		name: "SolidJS",
		label: "SolidJS Tailwind",
		description: "Lightweight SolidJS starter template for building fast static websites",
		githubRepo: "blueberry-llm/solidjs-ts-tw",
		tags: ["solidjs"],
		icon: "i-bolt:solidjs"
	}
];
//#endregion
export { PROVIDER_LIST as a, TOOL_EXECUTION_APPROVAL as c, TOOL_NO_EXECUTE_FUNCTION as d, WORK_DIR as f, MODIFICATIONS_TAG_NAME as i, TOOL_EXECUTION_DENIED as l, __exportAll as m, DEFAULT_PROVIDER as n, PROVIDER_REGEX as o, LLMManager as p, MODEL_REGEX as r, STARTER_TEMPLATES as s, DEFAULT_MODEL as t, TOOL_EXECUTION_ERROR as u };
