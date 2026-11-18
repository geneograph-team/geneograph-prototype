const GENEO_WORLD_LIMIT = 1000000;
const GENEO_CANVAS_MARGIN = 900;
const GENEO_CANVAS_EDGE_THRESHOLD = 160;
const GENEO_CANVAS_EXPANSION = 1200;

function createGeneoCanvasRuntime(boardId = '')
{
    return {
        boardId,
        objectHighlight: 'none',
        bounds: null,
        connectionClick: null,
        connectionPreviewPoint: null,
        connectionPreviewFrame: null,
        zoomFrame: null,
        zoomDelta: 0,
        zoomClientX: 0,
        zoomClientY: 0,
        zoomSettleFrame: null,
        edgeExpansionFrame: null,
        viewportReleaseFrame: null,
        viewportRestoreToken: 0,
        pendingEdgeExpansion: false,
        suppressEdgeExpansion: false,
        zooming: false,
        suppressNodeClick: false,
        autoPersonHeightSignatures:
          new Map()
    };
}

function createGeneoPaintRuntime()
{
    return {
        target: null,
        opener: null,
        popover: null,
        controller: null,
        interaction: null,
        hsv: null,
        invalidHex: false
    };
}

