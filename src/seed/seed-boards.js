const geneoSeedBoardEntries = window.GENEO_SEED_BOARD_ASSETS || [];
const geneoSeedBoardIds = new Set();
sampleData.boards = geneoSeedBoardEntries.map(entry =>
{
    const payload = validateGeneographBoardFile(entry.payload);
    if (!entry.id || geneoSeedBoardIds.has(entry.id)
        || payload.sourceProjectId !== entry.projectId
        || !sampleData.projects.some(project => project.id === entry.projectId))
        throw new Error('The seeded Geneograph board has invalid project or board identifiers.');
    geneoSeedBoardIds.add(entry.id);
    if (payload.viewport) state.geneoBoardViewports[entry.id] = structuredClone(payload.viewport);
    return {
        id: entry.id,
        projectId: entry.projectId,
        title: payload.board.title,
        description: payload.board.description,
        collectionIds: ['board-col-research-theory'],
        createdAt: payload.exportedAt,
        modifiedAt: payload.exportedAt,
        favorite: true,
        archived: false,
        thumb: 'tree',
        diagram: structuredClone(payload.board.diagram)
    };
});