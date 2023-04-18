# Jupyter to Svelte

Convert Jupyter Notebooks into Svelte Components

- [Motivation](#motivation)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Specifying a Style Sheet](#specifying-a-style-sheet)
    - [Creating a Style Sheet](#creating-a-style-sheet)
- [Contributing](#contributing)

## Motivation

Jupyter Notebooks are great for exploratory data analysis, but they are not so great for sharing your work with others. This tool converts Jupyter Notebooks into Svelte components, which can be used in any Svelte application.

**What's wrong with [Jupyter's built-in conversion](https://github.com/jupyter/nbconvert)?**

Jupyter's built-in conversion tool is great when you want to share a standalone file, be it markdown, HTML, or PDF. However, it doesn't work well when you want to have the notebook in a web application. For example, if you want to write a blog post in a Jupyter notebook, you can use this tool to convert the notebook into a Svelte component, which you can then use in your Svelte based web application.

Other reasons:

- The markdown outputted by Jupyter doesn't play nicely with [MDsveX](https://mdsvex.com/)
- Jupyter's built-in tool doesn't support [Plotly](https://plotly.com/python/) interactive charts
- Custom styling
  - consistent look and feel across your web application
  - Want to use a [PrismJS](https://prismjs.com/) theme for code

## Features

- [x] [PrismJS](https://prismjs.com/) syntax highlighting for code blocks (Python only, R is not supported)
  - Assumes that a you have chosen a [PrismJS theme](https://github.com/PrismJS/prism-themes) and imported the css.
- [x] Math displayed with [KaTeX](https://katex.org/docs/supported.html)
- [x] Interactive [Plotly](https://plotly.com/python/) charts work out of the box
- [x] Specify your own CSS/Scss/Sass style sheet for your notebook

## Installation

Assuming you have [Node.js](https://nodejs.org/en/) installed:

```bash
npm install --global jupyter2svelte
```

## Usage

### Basic Usage

Pass the path to the Jupyter Notebook you want to convert as an argument to the `convert` command:

```bash
jupyter2svelte convert notebook.ipynb
```

This will create a new file called `notebook.svelte` in the same directory as the notebook which you can then import into your Svelte application.

**Options:**

- `--style <style_sheet>` Path to a CSS/Scss/Sass stylesheet to use
- `-q, --quality <quality>` Specify the quality of the WebP images (default: "80")
- `-embd, --embed-images` Embeds images in the component (default: false)
- `-h, --help` display help

Assuming you did not specify the embed image flag, WebP images will also be created in the same directory as the notebook. Also, the Svelte component will accept 2 props:

- `img_path_prefix` - The path to the directory where the images are stored, in a typical SvelteKit application you will place the images in the `static` directory and you would set this prop to `"/"` or `"/some/folder/"`
- `img_alt_text` - An array of strings that will be used as the `alt` attribute for the nth image. By default, the alt text will be just "Image".

```svelte
<script>
  import Jupyter from "./notebook.svelte";
</script>

<Jupyter img_path_prefix={"/notebook/"} img_alt_text={["Graph 1", "Graph 2"]}/>
```

### Specifying a Style Sheet

You can specify a style sheet to be applied to the notebook by passing the path to the style sheet as an argument to the `convert` command:

```bash
jupyter2svelte convert --style style.scss notebook.ipynb
```

#### Creating a Style Sheet

You can create a style sheet by hand from scratch, or you can use the `default_css` command to output the default style sheet and go from there.

```bash
jupyter2svelte default_css > style.scss
```

Classes:

| Class (all classes are attached to an outer div) | Description                                           |
| ------------------------------------------------ | ----------------------------------------------------- |
| input                                            | what was an input block in Jupyter (markdown or code) |
| input-md                                         | markdown block in Jupyter                             |
| input-code                                       | code block in Jupyter                                 |
| output                                           | what was an output block from code in Jupyter         |
| output-text                                      | standard text output (e.g. print statement output)    |
| output-html-table                                | pandas dataframes                                     |
| output-image                                     | images (e.g. Matplotlib/Seaborn plots)                |

## Contributing

Contributions are welcome! Please open an issue or a pull request. If you want to contribute code, please make sure to run `npm run format` before committing.

Features that would be nice to have:

- [ ] Support for other interactive plotting libraries (e.g. [Bokeh](https://docs.bokeh.org/en/latest/index.html))
- [ ] Support for R notebooks?
