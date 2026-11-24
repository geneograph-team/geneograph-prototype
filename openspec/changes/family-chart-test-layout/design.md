# Design

The existing view selects one of two independent layout producers. Classic continues to call its original solver. The experimental producer receives the same visible projection, builds transient compact partner units and separate ancestor/descendant tidy hierarchies, and attaches remaining branches as coherent groups. Family Chart v0.9.0 (c7d22492dfc3090109cf28c6d4c82b1ee4ffd770) is the reference; the locally adapted D3 hierarchy v3.1.2 tidy-tree core is vendored with its ISC notice. The Family Chart MIT notice is retained with the adaptation. This is not the full upstream library, and no premium features or demo assets are used.

The existing geometry constants, connector builder and renderer are shared. All projected real people and family edges remain; any unsupported disconnected projection is explicitly rejected. Crossings/other diagnostics are surfaced, not claimed to be resolved. The experiment currently renders one card per person; crossing-driven repetition is still #319. It does not guarantee every full-depth branch/side invariant in #318.

The checkbox is unchecked by default in each project/session and uses the existing navigation/zoom controls. Switching back restores the saved Classic viewport if focus and zoom have not changed; otherwise it recenters. No canonical records are written.
