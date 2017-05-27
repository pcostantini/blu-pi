// PATH
// takes a gps stream
// returns a 'Path' stream with all points
module.exports = function PathReducer(gpsEvents) {
    var lastPoint = [Number.MAX_VALUE, Number.MAX_VALUE];
    return gpsEvents
        .map(gps => [gps.latitude, gps.longitude])
        .filter(point => point[0] && point[1] && (lastPoint[0] !== point[0] || lastPoint[1] !== point[1]))
        .scan((path, point) => {
            lastPoint = point;
            path.push(point);
            return path;
        }, [])
        .map((path) => ({
            name: 'Path',
            value: { length: path.length, points: path }
        }));
};