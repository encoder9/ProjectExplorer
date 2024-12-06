import { runProgram } from './program';
import { parseArgs } from "util";

const { values } = parseArgs({
	args: Bun.argv,
	options: {
		paths: {
			type: 'string',
		},
		file: {
			type: 'string',
		},
		output: {
			type: 'string',
		},
		help: {
			type: 'boolean',
		}
	},
	strict: true,
	allowPositionals: true,
});

if (values.help) {
	console.log("Usage: bun run index.ts --paths=<path_to_file_with_paths_to_traverse> [--file=<specific_filename_only>] --output=<output_folder_path>\n");
} else {
	// Ensure required parameters are provided
	if (!values.paths) {
		console.error("Error: 'paths' parameter is required");
		process.exit(1);
	} else if (!values.output) {
		console.error("Error: 'output' parameter is required");
		process.exit(1);
	}
	
	// Pass the arguments to program.ts
	runProgram(values.paths, values.output, values.file);
}
