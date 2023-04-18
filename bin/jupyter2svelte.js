#!/usr/bin/env node
import Prism from 'prismjs';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import SvelteHTML, { default_css } from './SvelteHTML.js';
import { Output } from './Output.js';
import chalk from 'chalk';
import figlet from 'figlet';
import markdown from './markdown.js';
// Load Python TODO: Use babel?
import loadLanguages from 'prismjs/components/index.js';
loadLanguages(['python']);
const program = new Command();
program
    .name('jupyter2svelte')
    .version('1.0.1')
    .description('Convert Jupyter Notebook to Svelte Component')
    .showSuggestionAfterError(true)
    .configureOutput({
    // Visibly override write routines as example!
    writeOut: (str) => process.stdout.write(`[OUT] ${str}`),
    writeErr: (str) => process.stdout.write(`[ERROR] ${str}`),
    // Highlight errors in color.
    outputError: (str, write) => write(chalk.red(str))
})
    .addHelpText('before', '\n' +
    chalk.hex('#FFA500')(figlet.textSync('Jupyter To Svelte', { horizontalLayout: 'default' })) +
    '\n');
// Style Extension
var StyleType;
(function (StyleType) {
    StyleType["CSS"] = ".css";
    StyleType["SCSS"] = ".scss";
    StyleType["SASS"] = ".sass";
})(StyleType || (StyleType = {}));
// StyleSheet object
class StyleSheet {
    constructor(style, type) {
        this.style = style;
        this.type = type;
    }
    get html() {
        switch (this.type) {
            case StyleType.CSS:
                return `<style>\n${this.style}\n</style>`;
            case StyleType.SCSS:
                return `<style lang="scss">\n${this.style}\n</style>`;
            case StyleType.SASS:
                return `<style lang="sass">\n${this.style}\n</style>`;
        }
    }
}
// Convert command
program
    .command('convert')
    .description('Convert a notebook into a Svelte Component')
    .argument('<notebook_file>', 'Path to the notebook')
    .option('--style <style_sheet>', 'Path to a CSS/Scss/Sass stylesheet to use', undefined)
    .option('-q, --quality <quality>', 'Specify the quality of the webp images', '80')
    .option('-embd, --embed-images', 'Embeds images in the component', false)
    .action(async (notebook_file, options) => {
    let notebook;
    // attempt to read the notebook
    try {
        const data = fs.readFileSync(notebook_file, 'utf8');
        notebook = JSON.parse(data);
        if (notebook['cells'] == undefined) {
            throw new Error('Invalid notebook file');
        }
    }
    catch (err) {
        program.error(`Could not read notebook file, ${err.message}`);
    }
    // Check that the css file exists and that it is a style sheet file
    let style_sheet = new StyleSheet(default_css, StyleType.CSS);
    if (options.style) {
        try {
            // Check that the file exists
            if (!fs.existsSync(options.style)) {
                throw new Error(`File does not exist, ${options.style}`);
            }
            // Check that the file is a css file
            const ext = path.extname(options.style);
            if (ext !== '.css' && ext !== '.scss' && ext !== '.sass') {
                throw new Error(`Invalid css file, ${options.style}`);
            }
            // Read the file
            const file = fs.readFileSync(options.style, 'utf8');
            // Update the style sheet
            style_sheet.style = file;
            style_sheet.type = ext;
        }
        catch (err) {
            program.error(`${err.message}`);
        }
    }
    // Check that the quality is a number
    let quality = 80;
    try {
        quality = parseInt(options.quality);
        if (isNaN(quality)) {
            throw new Error('Invalid quality');
        }
    }
    catch (err) {
        program.error(`${err.message}`);
    }
    // Set the output file
    const dir = path.dirname(notebook_file);
    const ext = path.extname(notebook_file);
    const basename = path.basename(notebook_file, ext);
    const output_path = path.join(dir, basename);
    // initialize the svelte builder
    const svelte = new SvelteHTML(style_sheet.html, options.embed_images);
    // Output config
    let output_conf = {
        quality: quality,
        embed_images: options.embed_images,
        dir: dir,
        cell_number: 0,
        output_number: 0
    };
    // iterate through each cell
    for (let i = 0; i < notebook['cells'].length; i++) {
        // update the output config with the cell number
        output_conf.cell_number = i;
        // get the cell type
        const cell_type = notebook['cells'][i]['cell_type'];
        // get the source
        const source = notebook['cells'][i]['source'];
        // join the source array into a string
        const source_string = source.join('').trim();
        // if the cell is markdown, convert it to HTML using showdown
        if (cell_type == 'markdown') {
            svelte.add_element(`<div class="input input-md">${await markdown(source_string)}</div>`);
        }
        // if the cell is code, convert it to HTML using Prism and process its outputs
        if (cell_type == 'code') {
            const prism = Prism.highlight(source_string, Prism.languages.python, 'python');
            svelte.add_element(`<div class="input input-code"><pre class="language-python"><code class="language-python">${prism}</code></pre></div>`);
            // Loop through each output of the code cell
            const outputs = notebook['cells'][i]['outputs'];
            for (let j = 0; j < outputs.length; j++) {
                // update the output config with cell's the output number
                output_conf.output_number = j;
                const output = outputs[j];
                const output_object = new Output(output, output_conf, svelte);
                if (output_object.html)
                    svelte.add_element(output_object.html);
            }
        }
    }
    // write to the output file
    fs.writeFileSync(output_path + '.svelte', svelte.component);
});
// Output the default CSS
program
    .command('default_css')
    .description('Output the default CSS file')
    .action(() => {
    console.log(default_css);
});
program.parse();
