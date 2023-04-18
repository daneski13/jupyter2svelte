import * as cheerio from 'cheerio';
import * as path from 'path';
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
async function _png2webp(base64png, path, quality) {
	// convert to webp
	const buffer = Buffer.from(base64png, 'base64');
	const webp = await sharp(buffer).webp({ quality }).toBuffer();
	// write the webp file
	writeFile(`${path}.webp`, webp);
}
export var OutputType;
(function (OutputType) {
	// stdout/stderror, print statements
	OutputType['Stream'] = 'stream';
	// Typical output from running code
	OutputType['DisplayData'] = 'display_data';
	// Typical output from running code
	OutputType['ExecuteResult'] = 'execute_result';
})((OutputType = OutputType || (OutputType = {})));
var _DataType;
(function (_DataType) {
	_DataType['HTML'] = 'text/html';
	_DataType['PLAIN'] = 'text/plain';
	_DataType['PNG'] = 'image/png';
	_DataType['PLOTLY'] = 'application/vnd.plotly.v1+json';
})(_DataType || (_DataType = {}));
export function extractOutputType(output) {
	const type = output['output_type'];
	return { type, output };
}
export function updateSvelteFromOutput(output, svelte, conf) {
	const out = output.output;
	if (!out) return;
	switch (output.type) {
		case OutputType.Stream:
			let source = out['text'].join('').trim();
			svelte.add_element(`<pre class="output output-text">${source}</pre>`);
			return;
		case OutputType.ExecuteResult:
		case OutputType.DisplayData:
			let data = out['data'];
			const dataType = Object.keys(data)[0];
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
					const html = $('body').html().trim();
					svelte.add_element(html);
					return;
				case _DataType.PNG:
					let tag;
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
