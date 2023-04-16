import * as cheerio from 'cheerio';

export const default_css: string = `/* Do Not Remove  */
/* Used to render latex math */
@import url('https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css');

/* Link on hover */
.heading > * > a {
    visibility: hidden;
    text-decoration: none;
}
.heading:hover > * > a {
    visibility: visible;
}
div .heading > * > a:hover {
    color: rgb(69, 69, 255);
}

pre {
    margin: 0;
}

/* Controls all inputs */
.input {
    max-width: 100%;
}

/* Controls the code blocks */
.input-code {
    margin-bottom: 1.5em;
    font-size: 0.95em;
}

/* Controls the markdown blocks */
.input-md {
    margin-top: 1.5em;
}

/* Controls all output blocks */
.output {
    display: block;
    max-width: 100%;
    overflow: auto;
}

/* Controls stdout (print statements, text output) */
.output-text {
    font-size: 1em;
}

/* Controls Images */
img {
    max-width: 100%;
}

/* Controls plotly figures */
figure {
    max-width: 100%;
    max-height: 100%;
    margin: 0 auto;
    display: block;
}

/* Wrapper around table outputs */
.output-html-table {
    font-size: 0.85em;
}
/* Table formatting */
th {
    text-align: right;
    border: 0px;
    padding: 0.2em 0.5em;
}
td {
    text-align: right;
    border: 0px;
    padding: 0.2em 0.5em;
}
/* Table headings */
thead > tr > th {
    background-color: #ccc;
    border: 0px;
}
thead > tr:nth-child(2) > th {
    background-color: #ddd;
}
/* Highlight Every other row */
tr:nth-child(even) {
    background-color: #ddd;
}
/* Give rows a border */
tr {
    border: 1px solid #ddd;
}
table {
    border-collapse: collapse;
    margin-right: auto;
    margin: 10px 0;
    display: block;
    width: max-content;
    max-width: 100%;
    overflow: auto;
}`;

const _script = (embed_images: boolean, num_images: number, plotly: string, raw: string) => {
	let exports =
		`
    // Path prefix for the images
	export let img_path_prefix;
    // Array of alt text for the images
    export let img_alt_text = Array.apply(null, Array(${num_images})).map(function () {
        return 'Image';
    });`.trim() + '\n\n';
	if (embed_images && num_images > 0) exports = '';

	return (
		'<script>\n' +
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
		if (!style) style = default_css;
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
