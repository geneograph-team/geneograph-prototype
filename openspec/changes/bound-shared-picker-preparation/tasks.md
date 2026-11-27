# Tasks

- [x] Reproduce and isolate expensive picker work using a 6,481-person browser fixture.
- [x] Bound shared results and index repeated association work.
- [x] Run hosted and direct-file Edge smoke checks and focused regressions.
- [ ] Obtain founder acceptance.

## Verification

One paired synthetic Edge run measured single-picker open at 629 ms before and 14 ms after, with mounted rows dropping from 6,481 to 50. The shared Notes People linker went from 174 ms to 22 ms. Birth-place query went from 3,124 ms to 7 ms on the same 250-place fixture.

The final Geneograph flow opened in 123 ms hosted and 147 ms via file. Selection took 2.10 and 2.17 seconds, almost entirely in the board review continuation. Both flows also checked Notes linking, the photo person filter, and choosing, cancelling and saving birth-place entries. The fixture uses synthetic data and blocks live geocoder traffic.
