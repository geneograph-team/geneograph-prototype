const publishTypes = [
    { id: 'report', title: 'Family report', label: 'Report', desc: 'Create a readable person, branch, ancestor, or descendant report.', formats: ['PDF', 'DOCX later', 'HTML later'], best: 'Narrative family history with sources and notes.' },
    { id: 'chart', title: 'Family chart', label: 'Chart', desc: 'Create a visual ancestor, descendant, fan, or tree snapshot.', formats: ['PDF', 'PNG', 'SVG later'], best: 'Printable visual overview for relatives.' },
    { id: 'export', title: 'Data export', label: 'Export', desc: 'Prepare a structured data package for backup or sharing.', formats: ['GEDCOM', 'GEDZip later', 'Media package later'], best: 'Moving data between genealogy tools.' }
];

sampleData.publishDrafts = [
    { id: 'pub1', title: 'Who was Luna Purrington-s father?', type: 'report', preview: 'report', scope: 'Research case report', updated: 'Just now', privacy: 'Draft', sources: '8 sources', format: 'PDF', status: 'draft', details: ['18 pages', '3 people', '8 sources', '6 notes'] },
    { id: 'pub2', title: 'The Whiskerfield Family - Our Story', type: 'report', preview: 'book', scope: 'Book project', updated: '2 days ago', privacy: 'In progress', sources: '116 sources', format: 'PDF', status: 'draft', details: ['12 chapters', '42 photos', '116 sources', '78% complete'] },
    { id: 'pub3', title: 'Maternal Line - Geneograph Board', type: 'chart', preview: 'chart', scope: 'Geneograph poster', updated: '3 days ago', privacy: 'Ready to export', sources: '1 board', format: 'PNG', status: 'draft', details: ['A3 landscape', 'Includes 1 board', 'High resolution'] },
    { id: 'pub4', title: 'Migration of the Whiskerfield Family', type: 'chart', preview: 'map', scope: 'Migration map', updated: '6 days ago', privacy: 'Ready to export', sources: 'Places and events included', format: 'PDF', status: 'draft', details: ['Places: 14', 'Events: 32', 'Time range: 1860-1970'] },
    { id: 'pub5', title: 'Metric Book 1887 - Index', type: 'export', preview: 'index', scope: 'Archive index', updated: '1 week ago', privacy: 'Published', sources: 'Archive files included', format: 'CSV', status: 'exported', details: ['Pages: 248', 'Extracted entries: 381', 'People: 192', 'Places: 37'] },
    { id: 'pub6', title: 'Barnaby Whiskerfield - Biography', type: 'report', preview: 'biography', scope: 'Person biography', updated: '1 week ago', privacy: 'Draft', sources: '46 sources', format: 'PDF', status: 'draft', details: ['24 pages', '27 photos', '46 sources', '2 maps'] }
].map(draft => ({
    ...draft,
    projectId: 'p1'
}));

function getProjectPublishDrafts(projectId = currentProjectId())
{
    if (!projectId) return [];
    return (sampleData.publishDrafts || []).filter(draft =>
        draft.projectId === projectId
    );
}

function getPublishDraft(draftId, projectId = currentProjectId())
{
    return getProjectPublishDrafts(projectId).find(draft => draft.id === draftId) || null;
}

function publishProjectPeople()
{
    return getPeople(currentProjectId());
}

function publishFocusPerson()
{
    const people = publishProjectPeople();
    const selected = people.find(person => person.id === state.publishFocusPersonId);
    return selected || people[0] || null;
}

function publishTypeNeedsPeople(typeId)
{
    return typeId === 'report' || typeId === 'chart';
}

