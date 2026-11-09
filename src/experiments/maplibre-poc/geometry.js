/* Standalone, dependency-free geodesic geometry for issue #156. */
(function (root)
{
    'use strict';

    const EARTH_RADIUS_METERS = 6371008.8;
    const TO_RADIANS = Math.PI / 180;
    const TO_DEGREES = 180 / Math.PI;

    function assertCoordinate(center)
    {
        if (!Array.isArray(center) || center.length !== 2)
        {
            throw new RangeError('Expected [longitude, latitude].');
        }
        const [lng, lat] = center;
        if (!Number.isFinite(lng) || !Number.isFinite(lat)
            || lng < -180 || lng > 180 || lat < -85 || lat > 85)
        {
            throw new RangeError('Coordinate is out of range.');
        }
    }

    function geodesicCircle(center, radiusMeters, steps = 96)
    {
        assertCoordinate(center);
        if (!Number.isFinite(radiusMeters) || radiusMeters <= 0 || radiusMeters > 100000)
        {
            throw new RangeError('Radius must be between 0 and 100000 metres.');
        }
        if (!Number.isInteger(steps) || steps < 16 || steps > 360)
        {
            throw new RangeError('Invalid segment count.');
        }

        const [longitude, latitude] = center;
        const lat1 = latitude * TO_RADIANS;
        const lon1 = longitude * TO_RADIANS;
        const angularDistance = radiusMeters / EARTH_RADIUS_METERS;
        const ring = [];
        for (let index = 0; index < steps; index++)
        {
            const bearing = 2 * Math.PI * index / steps;
            const lat2 = Math.asin(
                Math.sin(lat1) * Math.cos(angularDistance)
                + Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
            );
            const lon2 = lon1 + Math.atan2(
                Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
                Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
            );
            const wrappedLng = ((lon2 * TO_DEGREES + 540) % 360) - 180;
            ring.push([wrappedLng, lat2 * TO_DEGREES]);
        }
        ring.push([...ring[0]]);
        return {
            type: 'Feature',
            properties: { radiusMeters },
            geometry: { type: 'Polygon', coordinates: [ring] }
        };
    }

    function distanceMeters(first, second)
    {
        assertCoordinate(first);
        assertCoordinate(second);
        const latitudeDiff = (second[1] - first[1]) * TO_RADIANS;
        const longitudeDiff = (second[0] - first[0]) * TO_RADIANS;
        const firstLatitude = first[1] * TO_RADIANS;
        const secondLatitude = second[1] * TO_RADIANS;
        const haversine = Math.sin(latitudeDiff / 2) ** 2
            + Math.cos(firstLatitude) * Math.cos(secondLatitude)
            * Math.sin(longitudeDiff / 2) ** 2;
        return 2 * EARTH_RADIUS_METERS * Math.atan2(
            Math.sqrt(haversine),
            Math.sqrt(Math.max(0, 1 - haversine))
        );
    }

    const api = Object.freeze({ geodesicCircle, distanceMeters });
    if (root) root.GGMapPocGeometry = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : null);
