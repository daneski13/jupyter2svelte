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
var _OutputTypes;
(function (_OutputTypes) {
    // stdout/stderror, print statements
    _OutputTypes["Stream"] = "stream";
    // Typical output from running code
    _OutputTypes["DisplayData"] = "display_data";
    // Typical output from running code
    _OutputTypes["ExecuteResult"] = "execute_result";
})(_OutputTypes || (_OutputTypes = {}));
var _DataType;
(function (_DataType) {
    _DataType["HTML"] = "text/html";
    _DataType["PLAIN"] = "text/plain";
    _DataType["PNG"] = "image/png";
    _DataType["PLOTLY"] = "application/vnd.plotly.v1+json";
})(_DataType || (_DataType = {}));
export class Output {
    constructor(output, conf, svelte) {
        this._type = output['output_type'];
        this._conf = conf;
        this._svelte = svelte;
        this.html = this._getOutputHTML(this._type, output);
    }
    _getOutputHTML(type, output) {
        switch (type) {
            case _OutputTypes.Stream:
                let source = output['text'].join('').trim();
                return `<pre class="output output-text">${source}</pre>`;
            case _OutputTypes.ExecuteResult:
            case _OutputTypes.DisplayData:
                let data = output['data'];
                const dataType = Object.keys(data)[0];
                const dataTypeStr = dataType.toString();
                data = data[dataTypeStr];
                switch (dataType) {
                    case _DataType.PLAIN:
                        // Plain text
                        data = data.join('').trim();
                        return `<pre class="output output-text">${data}</pre>`;
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
                        return html;
                    case _DataType.PNG:
                        let tag;
                        if (this._conf.embed_images) {
                            // Embed the image
                            tag = `<div class="output output-image"><img src="data:image/png;base64,${data}" /></div>`;
                        }
                        else {
                            // Create the path to the image
                            const image_path = path.join(this._conf.dir, `Output_${this._conf.cell_number}_${this._conf.output_number}`);
                            tag = `<div class="output output-image"><img src="\${img_path_prefix}${path.basename(image_path) + '.webp'}" /></div>`;
                            // Save the image to a file, no need to wait
                            _png2webp(data, image_path, this._conf.quality);
                        }
                        return tag;
                    case _DataType.PLOTLY:
                        this._svelte.add_plotly(`plotly_${this._conf.cell_number}_${this._conf.output_number}`, data['data'], data['layout']);
                        return '';
                    default:
                        return;
                }
        }
    }
}
