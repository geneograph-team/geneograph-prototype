# Native Family Chart evaluation (#391)

The project-scoped comparison checkbox opens the pinned upstream chart through one adapter. The existing view switcher selects vertical or horizontal through the native orientation methods. Classic remains the default during evaluation. The #390 calculation and fixtures remain available as a reference. The founder approved retaining native one-open duplicate collapse for now. Cutover requires founder review under #391 and #388.

## Ownership and lifecycle

- The application owns the project, canonical person and family identities, selection, focus, generation settings, existing commands, and inspector.
- `tree-native-input.js` builds detached person-level arrays and keeps separate canonical context indexes. If the complete input has unsupported relationships, the host tries the configured generation projection and labels a successful limited preview. An unsupported relationship inside that scope stops the preview. Classic remains accessible through the checkbox.
- `tree-native-view.js` owns the chart instance, custom GeneoGraph card markup and canonical action bridge. A stable native chart carries expansion state while changing orientation. Focus and data changes flow through the public native chart lifecycle. Normal selection changes the inspector and matching card highlights directly.
- Family Chart and D3 own placement, paths, native duplicate state and viewport transforms. See the [vendor README](../../../src/vendor/README.md) for the exact artifacts, source provenance and reproducible installation.

## Review evidence

Observed in local Edge using direct file opening and the default native duplicate policy.

| Case | Observed | Disposition |
| --- | --- | --- |
| Whiskerfield, Silver, default depths | Classic, #390 and native each showed 14 cards. Native used the same card renderer in both directions. Native vertical host render took 25 ms in one run. | Satisfactory for this fixture. |
| Shared ancestors, fictional cousin partnership | Native exposed two toggles, with one ancestry branch visibly open at a time. Keyboard and pointer toggling moved the shared ancestry between branches. Both directions had ten unique cards, zero disconnected cards and zero invalid displayed links in this fixture. Changing orientation retained the open branch. Canonical data, focus and selection stayed unchanged. | Approved for now. Keep the native collapse policy. |
| Stress fixture #381, six ancestor levels | Both native orientations showed 127 cards in the 1,023-person fixture. Measured preview entry was 67 ms and an in-place switch to horizontal was 38 ms in the final run. | Satisfactory at tested depth. |
| Imported focus examples, six ancestor and five descendant levels | Lydia: Classic 98, #390 99, native 86. Maria: 128, 128, 111. Nikita: 100, 100, 98. Both native orientations agreed on person identities. Against the canonical Classic projection, native omitted 12, 17 and 2 collateral people respectively. Every direct ancestor, direct descendant and direct sibling in those projections remained visible, and the displayed occurrence graph had zero invalid links or disconnected cards in all six renders. After deferring card formatting to visible people, preview entry took 77–114 ms and horizontal switches 25–37 ms in the measured run. | Founder decision needed on collateral coverage. |
| Full MyHeritage sample | Two multiple-parent-family cases were reported. The three tested focus projections excluded those cases and displayed a scope notice in the preview. | Unsupported in full native input. Preserve the canonical memberships. |
| #390 multi-partner chain, unequal/expanded collateral branches | With one extra partner per side the native view displayed 11 of 21, with four it displayed 17 of 57. Both directions agreed. Native showed the central partnership, direct ancestor households and half-siblings, and omitted their other parents and the extended half-sibling households from this focus. The native preview now uses the Classic dashed styling for the divorced central partnership. | Review the remaining collateral visibility difference. |
| Family identity and relationship variations | Multiple parent families, separate family records for the same partners, parentless family records, missing endpoints and ancestry cycles are explicitly rejected by the adapter when present in the evaluation scope. | No cutover until required semantics are resolved. |

Browser interaction checks in both orientations covered selecting without a layout update, opening Edit for the canonical person, opening Add relative for the canonical person, selecting search results without changing focus, explicit focus, keyboard selection and native zoom. Russian localization and the light-theme connector token also passed. At 430 px, both orientations passed the mobile view switcher, native pointer pan, zoom and Fit, and browser fullscreen. Fit reused the same native layout. At zero ancestor and descendant generations, the native chart showed the focus and partner only in the fixture. Changing limits to two ancestor and one descendant generations showed 11 cards while retaining focus. Adapter regression checks use `node scripts/test-family-chart-native.cjs`.

## Decisions still needed

- Keep the native one-open shared ancestry policy for now.
- Show Classic collateral households in the native preview. This coverage decision is approved. The public hierarchy hook receives separate ancestry and progeny trees. Attaching collateral descendants to the ancestry hierarchy there reverses relationship semantics. The extension needs review at the native calculation boundary, using the Classic projection as the visibility contract and preserving real family endpoints. The connector presentation shares Classic width, color and separation/divorce dashes. Sibling connectors with the same family, parent appearances and native junction share one trunk and rail. Single-child connectors retain rounded native turns.
- Multiple parent families cannot use the current person-level adapter without losing family identity. The scoped preview is evidence for evaluation. Production cutover requires a supported way to preserve those relationships.

## Native extension boundary

At zero ancestor depth the adapter disables the public sibling display option.
Family Chart 0.9.0 otherwise finds siblings in the complete data stash and
assumes that the main card has visible parents. The fixture checks that a person
with a known sibling can still open both orientations at zero depth.

The remaining coverage work has two separate parts. For surrounding households,
the native hierarchy needs to place a collateral person's partner and children
while retaining the signed generations of the main ancestry and progeny. The
existing hierarchy hook only receives one direction at a time. The native
sibling pass creates shallow sibling nodes after hierarchy layout. A narrow
extension would take an explicit set of permitted canonical family contexts
from the Classic projection and process those branches in the engine's native
calculation before building links. A second change would be needed for multiple
parent families. Native link construction uses a single parent set and reads
only its first two appearances, so passing more parents to the current adapter
cannot express those families. The regression fixture should require separate
family endpoints and compare the visible memberships in both orientations.

## Approved contextual household extension

The app now supplies Classic’s visible family contexts to the shared native
chart. The compiled extension retains the existing native placements and
adds reachable collateral occurrences on the corresponding generation with
the native card spacing. It supplements links through the native descriptor
builder before the native SVG join. Primary parent links seed the native
ancestry; secondary parent families keep their own canonical memberships
and connector endpoints. The extension runs inside the native calculation
in both orientations. See the vendor README for upgrade and rebuild steps.

Local file-based Edge review after the extension showed all 98, 128 and 100
canonical people in the three imported Classic projections in either
orientation, excluding visual Add parent placeholders. No invalid canonical
links or disconnected cards were detected in those views. The #390
multi-partner fixtures showed all 21 and 57 canonical people in both
orientations. The shared-ancestor toggle retained native one-open behavior.
The Node regression verifies collateral visibility and separate parent sets
in both orientations. Supplemental placement can still produce long links
in dense networks. Cutover remains an explicit review decision under #388.
