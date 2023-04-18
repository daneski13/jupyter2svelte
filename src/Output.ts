import * as cheerio from 'cheerio';
import * as path from 'path';
import SvelteHTML from './SvelteHTML.js';
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

async function _png2webp(base64png: string, path: string, quality: number) {
	// convert to webp
	const buffer = Buffer.from(base64png, 'base64');
	const webp = await sharp(buffer).webp({ quality }).toBuffer();
	// write the webp file
	writeFile(`${path}.webp`, webp);
}

export enum OutputType {
	// stdout/stderror, print statements
	Stream = 'stream',
	// Typical output from running code
	DisplayData = 'display_data',
	// Typical output from running code
	ExecuteResult = 'execute_result'
}

enum _DataType {
	HTML = 'text/html',
	PLAIN = 'text/plain',
	PNG = 'image/png',
	PLOTLY = 'application/vnd.plotly.v1+json'
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

export function extractOutputType(output: any): Output {
	const type: OutputType = output['output_type'];
	return { type, output };
}

export function updateSvelteFromOutput(output: Output, svelte: SvelteHTML, conf: OutputConf) {
	const out = output.output;
	if (!out) return;
	switch (output.type) {
		case OutputType.Stream:
			let source = out['text'].join('').trim();
			svelte.add_element(`<pre class="output output-text">${source}</pre>`);
			return;

		case OutputType.ExecuteResult:
		case OutputType.DisplayData:
			let data = out['data'] as any;
			const dataType: _DataType = Object.keys(data)[0] as _DataType;
			const dataTypeStr = dataType.toString();
			data = data[dataTypeStr];

			switch (dataType) {
				case _DataType.PLAIN:
					// Plain text
					data = data.join('').trim();
					svelte.add_element(`<pre class="output output-text">${data}</pre>`);
					return;

				case _DataType.HTML:
					// HTML
					const $ = cheerio.load(data.join('').trim());
					// Remove the <style> tag
					$('style').remove();
					// Remove all the classes
					$('*').removeClass();
					// add the output class
					$('div').addClass('output output-html-table');
					const html = $('body').html()!.trim();
					svelte.add_element(html);
					return;

				case _DataType.PNG:
					let tag: string;
					if (conf.embed_images) {
						// Embed the image
						tag = `<div class="output output-image"><img src="data:image/png;base64,${data}" /></div>`;
					} else {
						// Create the path to the image
						const image_path = path.join(
							conf.dir,
							`Output_${conf.cell_number}_${conf.output_number}`
						);
						tag = `<div class="output output-image"><img src="\${img_path_prefix}${
							path.basename(image_path) + '.webp'
						}" /></div>`;
						console.log(data);
						// Save the image to a file, no need to wait
						_png2webp(data, image_path, conf.quality);
					}
					svelte.add_element(tag);
					return;

				case _DataType.PLOTLY:
					svelte.add_plotly(
						`plotly_${conf.cell_number}_${conf.output_number}`,
						data['data'],
						data['layout']
					);
					svelte.add_element('');
					return;

				default:
					svelte.add_element('');
					return;
			}
	}
}
