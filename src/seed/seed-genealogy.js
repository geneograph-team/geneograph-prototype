// Rebuild seeded display names / initials via the shared formatter.
(function normalizeSeededPersonNames()
{
    (sampleData.people || []).forEach(person =>
    {
        if (!person || !person.names) return;
        if (!('prefix' in person.names)) person.names.prefix = '';
        if (!('suffix' in person.names)) person.names.suffix = '';
        rebuildPersonDisplayName(person);
    });
})();

normalizeSampleGenealogyDates();
rebuildSampleEventsAndPruneSourceLinks();
