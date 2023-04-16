export declare const default_css: string;
export default class SvelteHTML {
    private _raw;
    private _plotly;
    private _style;
    private _embed_images;
    constructor(style: string | undefined, embed_images: boolean);
    get component(): string;
    add_element(value: string): void;
    add_plotly(id: string, data: any, layout: any): void;
}
