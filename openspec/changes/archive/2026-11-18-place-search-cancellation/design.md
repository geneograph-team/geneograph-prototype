# Design — Place-search cancellation lifecycle

The UI owns one AbortController per actively running autocomplete
search. Each input change clears its debounce timer and aborts the
preceding controller. Completed requests clear their controller only
if it still belongs to that UI instance, so an obsolete completion
cannot accidentally remove a newer request.

The geocoder owns provider routing. In modern browsers, an
AbortSignal.any([caller, AbortSignal.timeout(6500)]) signals fetch
directly, avoiding a nested forwarding abort event. Older browsers
retain a local AbortController and listener with explicit cleanup.
Both paths preserve caller cancellation reasons. TimeoutException
and AbortError from an internal timeout remain provider failures and
may trigger LocationIQ fallback; deliberate caller abort stops the
chain entirely.

The shared search wrapper returns [] for caller-cancelled requests;
each interface rejects stale updates using aborted state and query
checks. Fire-and-forget timers attach a terminal catch to prevent
unhandled rejection on unexpected UI/render failures.

The browser regression uses real input events, AbortController, and
actual source scripts with an in-page fetch stub and artificial
latency. Test-only strings replace credentials. Node tests cover
provider errors, timeout, transport cancellation and body parsing.

The initial isolated Chromium reproduction did not generate an
unhandledrejection; explicit production QA remains a release gate.
