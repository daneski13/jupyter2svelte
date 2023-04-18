import * as cheerio from 'cheerio';
import * as path from 'path';
import SvelteHTML from './SvelteHTML.js';
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

async function _png2webp(base64png: string, quality: number): Promise<string> {
	// convert to webp
	const buffer = Buffer.from(base64png, 'base64');
	return await sharp(buffer)
		.webp({ quality })
		.toBuffer()
		.then((buffer) => buffer.toString('base64'));
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

export async function updateSvelteFromOutput(output: Output, svelte: SvelteHTML, conf: OutputConf) {
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
					const image = await _png2webp(data, conf.quality);

					if (conf.embed_images) {
						// Embed the image
						tag = `<div class="output output-image"><img src="data:image/webp;base64,${image}" /></div>`;
					} else {
						// Create the path to the image
						const image_path = path.join(
							conf.dir,
							`Output_${conf.cell_number}_${conf.output_number}.webp`
						);
						tag = `<div class="output output-image"><img src="\${img_path_prefix}${path.basename(
							image_path
						)}" /></div>`;
						// Save the image to a file, no need to wait
						writeFile(image_path, image, 'base64');
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
