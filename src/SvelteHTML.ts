import * as cheerio from 'cheerio';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

export const default_css = () => {
	const css_path = path.join(__dirname, '..', 'assets', 'default.css');
	return fs.readFileSync(css_path, 'utf8');
};

const _script = (embed_images: boolean, num_images: number, plotly: string, raw: string) => {
	let exports =
		`
    // Path prefix for the images
	export let img_path_prefix;`.trim() + '\n\n';
	if (embed_images && num_images > 0) exports = '';

	return (
		'<script>\n' +
		`// Array of alt text for the images
		export let img_alt_text = Array.apply(null, Array(${num_images})).map(function () {
			return 'Image';
		});` +
		exports +
		`// Render Plotly plots, called when the Plotly script is loaded
	const renderPlotly = () => {
		/* Plotly Plots */
        ${plotly}
	};

    const raw = \`${raw}\`;</script>`
	);
};

const _head: string = `<svelte:head>
    <script src="https://cdn.plot.ly/plotly-2.20.0.min.js" charset="utf-8" on:load={renderPlotly}></script>
</svelte:head>`;

const _body: string = `<div class="jupyter">
    {@html raw}
</div>`;

// SvelteHTML class
export default class SvelteHTML {
	private _raw: string = '';
	private _plotly: string = '';
	private _style: string;
	private _embed_images: boolean;

	constructor(style: string | undefined, embed_images: boolean) {
		if (!style) style = default_css();
		this._style = style;
		this._embed_images = embed_images;
	}

	// Outputs the svelte component as a string
	public get component(): string {
		// Load the current raw
		const $ = cheerio.load(this._raw, null, false);
		// Count the image tags and add alt text
		let num_images = $('img').length;
		$('img').each((i, elem) => {
			$(elem).attr('alt', `\${img_alt_text[${i}]}`);
		});

		// Surround each heading with an anchor tag for linking
		$('h1, h2, h3, h4, h5, h6').each((_, elem) => {
			const heading = $(elem);
			const id = heading.attr('id');
			heading.append(`<a href="#${id}"> ¶</a>`);
			heading.wrap('<span class="heading"></span>');
		});

		let html = $.html()
			// double escape the backslashes
			.replace(/\\/g, '\\\\')
			// escape backticks
			.replace(/`/g, '\\`');

		// Add the style sheet
		html += this._style;

		// Get the script tag
		const script = _script(this._embed_images, num_images, this._plotly, html);
		// return the html string
		return `${script}\n\n${_head}\n\n${_body}`.trim();
	}

	public add_element(value: string) {
		this._raw += value;
	}

	public add_plotly(id: string, data: any, layout: any) {
		const script = `Plotly.newPlot('${id}', ${JSON.stringify(data)}, ${JSON.stringify(layout)});`;
		// append to plotly
		this._plotly += `${script}\n`;
		// add a figure to the raw for the graph
		this.add_element(`<div class="output"><figure id="${id}" class="output"></figure></div>`);
	}
}
