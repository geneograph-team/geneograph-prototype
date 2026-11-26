# Local browser libraries

These pinned browser distributions are served locally by the prototype:

- D3.js `7.9.0` (`d3-7.9.0/dist/d3.min.js`), ISC
- PDF.js `5.6.205` (`pdfjs-*.mjs`), Apache-2.0
- Mammoth `1.13.0` (`mammoth-*.js`), BSD-2-Clause
- DOMPurify `3.3.0` (`dompurify-*.js`), MPL-2.0 OR Apache-2.0
- Papa Parse `5.5.3` (`papaparse-*.js`), MIT
- ELK.js `0.12.1` (`elkjs-0.12.1/lib/elk.bundled.js`), EPL-2.0 OR GPL-3.0-or-later, as declared in the [0.12.1 package](https://github.com/kieler/elkjs/blob/0.12.1/package.json) and [source header](https://github.com/kieler/elkjs/blob/0.12.1/src/java/org/eclipse/elk/js/ElkJs.java); unchanged bundle in a separate local frame
- Quill `2.0.3` (`quill-2.0.3/dist/`), BSD-3-Clause, JavaScript and Snow CSS
- MapLibre GL JS `6.16.0` (`maplibre-gl-6.16.0/dist/`), BSD-3-Clause, CSS and lazy HTTP(S) module with its adjacent worker
- html-to-image `1.11.13` (`html-to-image.js` and source map), MIT

The primary license files are included here. Full bundle-level transitive notice and corresponding-source verification remains tracked under #428.

## Quill and MapLibre distributions

The shipped runtime files are byte-for-byte copies from the official npm tarballs. The archive SHA-512 values were independently checked against npm registry version metadata.

| Package and upstream source | Archive SHA-512 (npm SRI) | Shipped runtime bytes |
| --- | --- | ---: |
| [Quill 2.0.3 package](https://registry.npmjs.org/quill/-/quill-2.0.3.tgz), [source at npm revision](https://github.com/slab/quill/tree/522fd7ee0682498516df7389bacb6f7eb6e92b77) | sha512-xEYQBqfYx/sfb33VJiKnSJp8ehloavImQ2A6564GAbqG55PGw1dAWUn1MUbQB62t0azawUS2CZZhWCjO8gRvTw== | 233,880 |
| [MapLibre GL JS 6.16.0 package](https://registry.npmjs.org/maplibre-gl/-/maplibre-gl-6.16.0.tgz), [source at npm revision](https://github.com/maplibre/maplibre-gl-js/tree/538a7680ab16d5cf5a6564ee0ce72a11be14d142) | sha512-gApO66EMtoDZuio680RUBvskR7ahFd/NNhLN4tBAs+Y7FeT4gQV8zVFgYVMRmFxQznOEzecW19w6xOd9XjZjiA== | 1,699,017 |

The two directories add 1,995,660 bytes including bundled notices. The npm archives include the upstream source maps. The vendor directories include notices for dependencies identified from those maps and the pinned release lockfiles. The primary licenses remain at `quill-2.0.3-LICENSE.txt` and `maplibre-gl-6.16.0-LICENSE.txt`. See the [website notice index](https://geneograph.com/legal.html#licenses).

The static deployment copies both vendor directories. Map styles, tiles, sprites, glyphs and geocoding still use their configured services on hosted pages.

Replacing a distribution should update its version note or versioned filename, license, and references in `index.html` or `archive-documents.js` together. Reconcile the website's published component index and exact license copies in the same release.
