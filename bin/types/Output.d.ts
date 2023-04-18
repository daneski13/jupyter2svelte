import SvelteHTML from './SvelteHTML.js';
export declare enum OutputType {
	Stream = 'stream',
	DisplayData = 'display_data',
	ExecuteResult = 'execute_result'
}
export type OutputConf = {
	embed_images: boolean;
	quality: number;
	dir: string;
	cell_number: number;
	output_number: number;
};
export type Output = {
	type: OutputType;
	output: any;
};
export declare function extractOutputType(output: any): Output;
export declare function updateSvelteFromOutput(
	output: Output,
	svelte: SvelteHTML,
	conf: OutputConf
): void;
