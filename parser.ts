import { readFileSync } from "fs";
import * as ts from "typescript";
import { JSDOM } from "jsdom";

const parsedObject: { ts: Record<string, any>; html: Record<string, any>; css: Record<string, any> } = {
	ts: {},
	html: {},
	css: {},
};

/**
 * Parses a file based on its type and adds the output to the global parsedObject.
 * @param filePath The path to the file.
 * @param fileType The type of the file (extension).
 */
export function parseFile(filePath: string, fileType: string): void {
	const fileContent = readFileSync(filePath, "utf-8");
	
	switch (fileType) {
		case "ts":
			parsedObject.ts[filePath] = parseTypescript(filePath, fileContent);
			break;
		
		case "html":
		case "htm":
			parsedObject.html[filePath] = parseHTML(filePath, fileContent);
			break;
		
		case "css":
			parsedObject.css[filePath] = parseCSS(filePath, fileContent);
			break;
	}
}

/**
 * Returns the combined parsed object for all processed files.
 * @returns The global parsedObject containing TypeScript, HTML, and CSS data.
 */
export function getParsedObject(): typeof parsedObject {
	return parsedObject;
}

/**
 * Parses a TypeScript file for function definitions and builds a recursive JSON tree of function calls.
 * @param filePath The path to the file.
 * @param content The content of the file.
 * @returns A JSON representation of the TypeScript function tree.
 */
function parseTypescript(filePath: string, content: string): any {
	return buildFunctionTree(ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext, true));
}

/**
 * Builds a recursive JSON tree of function definitions and their call hierarchy.
 * @param sourceFile The TypeScript source file.
 * @returns A JSON representation of the function tree.
 */
function buildFunctionTree(sourceFile: ts.SourceFile): any {
	const functionTree: { [methodName: string]: any } = {};
	const externalClasses = new Map<string, Set<string>>();
	
	function parseNode(node: ts.Node): void {
		if (ts.isClassDeclaration(node) && node.name) {
			const className = node.name.getText();
			functionTree[className] = functionTree[className] || {};
			
			node.members.forEach(member => {
				if (ts.isMethodDeclaration(member) && member.name) {
					const methodName = member.name.getText();
					const calls = analyzeFunctionCalls(member.body || ts.factory.createBlock([]));
					functionTree[className][methodName] = calls;
				}
			});
		} else if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
			const importClause = node.importClause;
			
			if (importClause) {
				if (importClause.name) {
					externalClasses.set(importClause.name.getText(), new Set());
				}
				
				if (importClause.namedBindings) {
					if (ts.isNamedImports(importClause.namedBindings)) {
						importClause.namedBindings.elements.forEach(element => { externalClasses.set(element.name.getText(), new Set()); });
					} else if (ts.isNamespaceImport(importClause.namedBindings)) {
						externalClasses.set(importClause.namedBindings.name.getText(), new Set());
					}
				}
			}
		} else if (ts.isCallExpression(node)) {
			const [namespace, method] = node.expression.getText().split(".");
			
			if (externalClasses.has(namespace)) {
				externalClasses.get(namespace)!.add(method || namespace);
			}
		}
		
		ts.forEachChild(node, parseNode);
	}
	
	function analyzeFunctionCalls(body: ts.Block): string[] {
		const calls: string[] = [];
		
		function findCalls(node: ts.Node) {
			if (ts.isCallExpression(node)) {
				calls.push(node.expression.getText());
			}
			
			ts.forEachChild(node, findCalls);
		}
		
		findCalls(body);
		return calls;
	}
	
	parseNode(sourceFile);
	
	for (const [className, methods] of externalClasses.entries()) {
		if (!functionTree[className]) {
			functionTree[className] = {};
		}
		
		functionTree[className] = Array.from(methods);
	}
	
	return functionTree;
}

/**
 * Parses CSS file content.
 * @param filePath The path to the file.
 * @param content The content of the file.
 * @returns A JSON representation of the CSS tree.
 */
function parseCSS(filePath: string, content: string): any {
	const cssTree: Record<string, any> = {};
	const globalEntries: Record<string, string> = {};
	const mediaQueries: Record<string, Record<string, string>> = {};
	const strippedContent = stripCSSComments(content);
	const globalMatches = extractSelectors(strippedContent);
	
	for (const match of globalMatches) {
		globalEntries[match.selector] = match.rules;
	}
	
	const regexMediaQuery = /@media\s*[^{]+\{([^{}]*{[^{}]*})\s*\}/g;
	let mediaMatch;
	
	while ((mediaMatch = regexMediaQuery.exec(strippedContent))) {
		const mediaQuery = mediaMatch[0].match(/@media[^{]+/)?.[0].trim();
		const mediaContent = mediaMatch[1];
		const mediaSelectors = extractSelectors(mediaContent);
		
		if (mediaQuery != null && !mediaQueries[mediaQuery]) { mediaQueries[mediaQuery] = {}; }
		
		for (const mediaSelector of mediaSelectors) {
			if (mediaQuery != null) { mediaQueries[mediaQuery][mediaSelector.selector] = mediaSelector.rules; }
		}
	}
	
	cssTree[filePath] = { ...globalEntries, media: mediaQueries };
	return cssTree[filePath];
}

function extractSelectors(content: string): Array<{ selector: string; rules: string }> {
	const selectorRegex = /([.#]?[a-zA-Z0-9_-]+)\s*{\s*([^}]+)\s*}/g;
	const matches: Array<{ selector: string; rules: string }> = [];
	let match;
	
	while ((match = selectorRegex.exec(content))) {
		matches.push({ selector: match[1].trim(), rules: match[2].trim() });
	}
	
	return matches;
}

function stripCSSComments(content: string): string {
	return content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "").trim();
}

/**
 * Parses HTML file content.
 * @param filePath The path to the file.
 * @param content The content of the file.
 * @returns A JSON representation of the HTML tree.
 */
function parseHTML(filePath: string, content: string): any {
	const rootKey = filePath.split("/").pop();
	if (!rootKey) throw new Error(`Invalid file path provided: ${filePath}`);
	
	const dom = new JSDOM(content);
	return parseNode(dom.window.document.body);
}

function parseNode(node: Element | null): any {
	if (!node) return null;
	
	const nodeData: any = {
		[node.tagName.toLowerCase()]: {
			id: node.id || null,
			classes: Array.from(node.classList),
			attributes: extractAttributes(node),
			children: [],
		}
	};
	
	for (const child of Array.from(node.children)) {
		const childNode = parseNode(child);
		
		if (childNode) {
			nodeData[node.tagName.toLowerCase()].children.push(childNode);
		}
	}
	
	return nodeData;
}

function extractAttributes(element: Element): Record<string, string> {
	const attributes: Record<string, string> = {};
	
	for (const attr of Array.from(element.attributes)) {
		if (attr.name !== "class") {
			attributes[attr.name] = attr.value;
		}
	}
	
	return attributes;
}
