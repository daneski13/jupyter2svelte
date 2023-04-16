import SvelteHTML from './SvelteHTML.js';
export type OutputConf = {
    embed_images: boolean;
    quality: number;
    dir: string;
    cell_number: number;
    output_number: number;
};
export declare class Output {
    private _type;
    private _conf;
    private _svelte;
    html: any;
    constructor(output: any, conf: OutputConf, svelte: SvelteHTML);
    private _getOutputHTML;
}
