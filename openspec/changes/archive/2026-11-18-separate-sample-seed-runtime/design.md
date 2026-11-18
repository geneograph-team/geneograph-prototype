# Design

Extract existing contiguous seed blocks without rewriting their records. Keep each new script at the same dependency point in `src/index.html`: Geneograph runtime immediately before its consumers; board collections at the former mixed-script position; Archive seed records before Archive model consumers; document-place enrichment after Archive file and navigation helpers; Notes seed records immediately before Notes model helpers.

The Archive initializer remains because canonical seed files do not carry `documentPlaceId` or `documentPlaceText`; the current operation derives them from existing linked places. Compare pre/post record-array hashes and initialized Archive file snapshots, then verify syntax, script references and UI workflows.
