import { generateOutput } from './generator';
import { getParsedObject, parseFile } from './parser';
import { join } from 'path';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';

export function runProgram(pathsFile: string, output: string, filename: string | undefined): void {
	pathsFile = pathsFile.replace('~/', `${process.env.HOME ?? ''}/`);
	
	if (!existsSync(pathsFile)) {
		console.error(`Error: '${pathsFile}' file is required and must contain paths to traverse.`);
		process.exit(1);
	}
	
	// Read paths from paths.txt
	const paths = loadPaths(pathsFile);
	
	if (paths.length === 0) {
		console.error(`Error: '${pathsFile}' must contain at least one path.`);
		process.exit(1);
	}
	
	// Traverse each path listed in paths.txt
	for (const path of paths) {
		if (filename) {
			const fullPath = join(path, filename);
			parseSpecificFile(fullPath);
		} else {
			listFilesAndFolders(path);
		}
	}
	
	generateOutput(JSON.stringify(getParsedObject()), output, paths);
}

/**
 * Reads and parses the paths.txt file.
 * @param filePath The path to the paths.txt file.
 * @returns An array of paths listed in the file.
 */
function loadPaths(filePath: string): string[] {
	try {
		const content = readFileSync(filePath, 'utf-8');
		return content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
	} catch (error: any) {
		console.error(`Error reading '${filePath}':`, error.message);
		process.exit(1);
	}
}

/**
 * Recursively list files and folders, applying ignore patterns.
 * @param path The directory path to list files and folders.
 */
function listFilesAndFolders(path: string): void {
	const entries = readdirSync(path);
	
	for (const entry of entries) {
		const fullPath = join(path, entry);
		const stats = statSync(fullPath);
		
		if (stats.isDirectory()) {
			listFilesAndFolders(fullPath);
		} else if (stats.isFile()) {
			parseSpecificFile(fullPath);
		}
	}
}

/**
 * Parse a specific file if it matches supported file extensions.
 * @param filePath The full path to the file.
 */
function parseSpecificFile(filePath: string): void {
	const fileExtension = filePath.split('.').pop()?.toLowerCase();
	
	if (fileExtension === 'ts' || fileExtension === 'html' || fileExtension === 'htm' || fileExtension === 'css') {
		parseFile(filePath, fileExtension);
	}
}
