sampleData.archiveFiles.forEach(file =>
{
    const place =
        archiveDocumentPlace(
            file
        );

    archiveApplyDocumentPlace(
        file,
        place.placeId,
        place.placeText
    );
});

