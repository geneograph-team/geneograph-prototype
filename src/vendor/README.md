# Local browser libraries

These pinned browser distributions are served locally by the prototype:

- PDF.js `5.6.205` (`pdfjs-*.mjs`), Apache-2.0
- Mammoth `1.13.0` (`mammoth-*.js`), BSD-2-Clause
- DOMPurify `3.3.0` (`dompurify-*.js`), MPL-2.0 / Apache-2.0
- Papa Parse `5.5.3` (`papaparse-*.js`), MIT
- html-to-image `1.11.13` (`html-to-image.js` and source map), MIT

The corresponding license files are included here. Replacing a distribution should update its version note or versioned filename, license, and references in `index.html` or `archive-documents.js` together.

## Family Chart evaluation (#391)

The native evaluation vendors the published Family Chart 0.9.0 UMD and CSS
distributions with D3 7.9.0. The local reference source is in
`temp/family-chart`. The npm artifact reports gitHead
`a68bdc142057ccd945de9387ab83070922ab5f6d`, which differs from the initial
source reference in #391.

To reproduce the files, run `npm pack family-chart@0.9.0` and
`npm pack d3@7.9.0` in a developer scratch directory. Extract each archive
and copy the following files unchanged.

| Package | Archive path | Local file |
| --- | --- | --- |
| Family Chart | `package/dist/family-chart.min.js` | `family-chart-0.9.0.min.js` |
| Family Chart | `package/dist/styles/family-chart.css` | `family-chart-0.9.0.css` |
| Family Chart | `package/LICENSE.txt` | `family-chart-LICENSE.txt` |
| D3 | `package/dist/d3.min.js` | `d3-7.9.0.min.js` |
| D3 | `package/LICENSE` | `d3-LICENSE.txt` |

Archive SHA-256 values are
`266a310b4af71b41f83ccb362c35062d39e8121dbad23165b4a00bba34786765` for
Family Chart and
`7e36605710a2ba54846797c8c6d888911341b215ae53257dc32a49a0b824355e` for D3.
These are developer-only steps. The browser uses local scripts and styles.

The browser loads the GeneoGraph context build generated from the unminified
UMD in the same pinned archive. Run
`node scripts/build-family-chart-context.cjs <path-to-family-chart-0.9.0.tgz>`.
The generator verifies the archive hash and exact insertion sites. The
isolated source is `scripts/family-chart-context-extension.js`. It adds
a family-context input to the native calculation and uses the existing
native link descriptors and SVG renderer. The unchanged UMD file remains
available for upstream comparison.
