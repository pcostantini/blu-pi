var fs = require('fs');
var gpx = require('gpx-stream');
var points = new gpx();
var source = fs.createReadStream('./sample.gpx');
 
source.pipe(points);
 
points.on('readable', function(){
  var point;
 
  while(point = points.read()){
    console.log([
      'Lat:', point.lat,
      'Lon:', point.lon,
      'elevation:', point.elevation,
      '@time', point.time
    ].join(' '));
  }
});
 
points.on('end', function(){
  console.log('finished');
});
