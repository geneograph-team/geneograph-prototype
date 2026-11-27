# Design

See the [runtime design](../../../doc/design-document.md#project-read-model-and-performance), [data contract](../../../doc/project-data-contract.md#project-scoped-derived-data), and [implemented interfaces](../../../doc/source-map.md#shared-project-read-model). The coordinator stores one value per key for the active project. Providers own index construction and reuse canonical relationship rules.
