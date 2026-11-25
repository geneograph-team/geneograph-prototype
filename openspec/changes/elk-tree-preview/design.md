# Design

The application shell enters and leaves the Tree module. The Tree uses canonical visibility projection, Tree renderer, viewport, inspector and commands. The ELK adapter owns request cancellation and converts detached output into card occurrences and connectors. A future Fan renderer can use canonical focus, selection and commands at the shell boundary and own its radial projection and hit testing.

The port uses the approved compound graph, balanced Brandes–Köpf placement, bounded occurrence split and dynamic spacing calculation. The shared Tree card dimensions replace the standalone dimensions in the application. The algorithm uses the original dimensions for the reference regression. Single-parent families use a card-edge connector when there is no add-parent slot. Distinct same-pair records can reuse the same physical gap with separate inline lanes. Geometry that the inline rules cannot represent uses the affected native ELK routes with a diagnostic. Inconsistent generation constraints are surfaced as a layout error with a localized Retry action that preserves the project and focus.

The ELK 0.10.0 browser bundle runs in its own local HTML document. Its interface accepts standard ELK JSON graphs with anonymous IDs, dimensions, ports and layout options. Genealogy records and app state stay in the Tree. Browser work is scheduled asynchronously through messages, including the bundled solver's non-worker execution in offline file URLs. Request ownership is checked after each response and when leaving the presentation.

## Third-party distribution

The EPL-2.0 ELK bundle is distributed unchanged as a separate graph-layout program alongside the GPL-3.0 application. Neither license is used to relicense the other program. The programs exchange ordinary ELK layout JSON and maintain separate execution contexts. The upstream license remains beside the distribution.

Acquire the package with `npm pack elkjs@0.10.0` and extract `package/lib/elk.bundled.js` and `package/LICENSE.md` into the corresponding paths below `src/vendor/elkjs-0.10.0/`. No package installation is needed for the browser. SHA-256 of the tarball is `04f7f7031b7a46c91d24556888cdb53163cb4ced07c7fdb5aa640357fd9798bd`. SHA-256 of `elk.bundled.js` is `48d338d5aeddd9503ccf1d12661c11b5d7d43c6afc5f66c7ddb2ea4170c0f6bf`. Upstream source is available from the [elkjs v0.10.0 release](https://github.com/kieler/elkjs/tree/v0.10.0) and [Eclipse ELK](https://github.com/eclipse-elk/elk).
