import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates an HTML output file with the parsedObject as a JSON script.
 * @param parsedObject The parsed object from parser.ts.
 * @param outputPath The folder path to write the HTML output to.
 */
export function generateOutput(parsedObject: any, outputPath: string, basePaths: string[]): void {
	outputPath = outputPath.replace('~/', `${process.env.HOME ?? ''}/`);
	copyFile('logo.png', outputPath);
	copyFile('pe.css', outputPath);
	copyFile('pe.js', outputPath);
	
	// Create an empty HTML template
	const htmlContent = fs.readFileSync('projectExplorerOutputTemplate.html', 'utf-8');;
	
	// Write the HTML content to the specified file
	fs.writeFileSync(`${outputPath}/index.html`, render(htmlContent, {
		parsedObject: JSON.stringify(parsedObject),
		basePath: outputPath,
		basePaths: JSON.stringify(basePaths),
	}));
	
	console.log(`HTML output generated at: ${outputPath}`);
}

function render(htmlString: string, dataObject?: any) {
	for (const i in dataObject) {
		if (dataObject.hasOwnProperty(i)) {
			htmlString = htmlString.replace(new RegExp('{{' + i + '}}', 'g'), dataObject[i]);
		}
	}
	
	return htmlString;
}

function copyFile(source: string, outputPath: string): void {
	const sourceFile: string = path.join(__dirname, source);
	const destinationFile: string = path.join(outputPath, source);
	
	// Ensure the output directory exists
	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath, { recursive: true });
	}
	
	// Copy the file
	try {
		fs.copyFileSync(sourceFile, destinationFile);
	} catch (error) {
		console.error(`Error copying file: ${error}`);
	}
}
