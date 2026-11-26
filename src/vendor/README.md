# Local browser libraries

These pinned browser distributions are served locally by the prototype:

- D3.js `7.9.0` (`d3-7.9.0/dist/d3.min.js`), ISC
- PDF.js `5.6.205` (`pdfjs-*.mjs`), Apache-2.0
- Mammoth `1.13.0` (`mammoth-*.js`), BSD-2-Clause
- DOMPurify `3.3.0` (`dompurify-*.js`), MPL-2.0 OR Apache-2.0
- Papa Parse `5.5.3` (`papaparse-*.js`), MIT
- ELK.js `0.12.1` (`elkjs-0.12.1/lib/elk.bundled.js`), EPL-2.0 OR GPL-3.0-or-later, as declared in the [0.12.1 package](https://github.com/kieler/elkjs/blob/0.12.1/package.json) and [source header](https://github.com/kieler/elkjs/blob/0.12.1/src/java/org/eclipse/elk/js/ElkJs.java); unchanged bundle in a separate local frame
- html-to-image `1.11.13` (`html-to-image.js` and source map), MIT

The primary license files are included here. Full bundle-level transitive notice and corresponding-source verification remains tracked under #428.

The hosted runtime also uses Quill `2.0.3` (BSD-3-Clause, jsDelivr) and MapLibre GL JS `6.16.0` (BSD-3-Clause, unpkg). Their exact tagged upstream license texts are copied as `quill-2.0.3-LICENSE.txt` and `maplibre-gl-6.16.0-LICENSE.txt`; their runtime files are not vendored. See [the shared website notice index](https://geneograph.com/legal.html#licenses).
Replacing a distribution should update its version note or versioned filename, license, and references in `index.html` or `archive-documents.js` together. Reconcile the website's published component index and exact license copies in the same release.
