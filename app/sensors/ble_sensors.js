var noble = require('@abandonware/noble');
var Rx = require('rxjs');

const UINT16_MAX = 65536;  // 2^16
const UINT32_MAX = 4294967296;  // 2^32
const updateRatio = 0.85; // Percent ratio between old/new stats
const wheelSize = 2130;

function BleSensors(deviceAddresses) {
  return Rx.Observable.create(function (observer) {
    console.log('ble:init()')
    init(observer, deviceAddresses);
  }).share();
}

function init(observer, deviceAddresses) {

  var cadenceAddress = deviceAddresses.cadence;
  var previousSample, midSample, currentSample, bluetoothStats, hasWheel, hasCrank, startDistance;

  noble.on('stateChange', function (state) {
    if (state === 'poweredOn') {
      console.log('ble:on!')
      noble.startScanning();
    } else {
      noble.stopScanning();
    }
  });

  // search device
  noble.on('discover', function (peripheral) {
    if (peripheral.id === cadenceAddress || peripheral.address === cadenceAddress) {

      console.log('ble:found:', [peripheral.id, peripheral.advertisement]);
      noble.stopScanning();

      // connect to device
      peripheral.connect((err) => {

        if (err) return console.error('ble:connect().err!', err);

        // subscribe to services
        peripheral.discoverServices(['1816'], function (error, services) {
          var service = services[0];
          service.discoverCharacteristics([], function (error, characteristics) {

            if (error) return console.error('ble:discoverCharacteristics.err!', err);
            console.log('ble:discoverCharacteristics.chars:', characteristics.map(c => [c.uuid, c.name, c.properties]))

            measurement = characteristics.find(o => o.name === 'CSC Measurement')
            if (!measurement) {
              return console.log('ble:discoverCharacteristics: CSC Measurement not found.')
            }

            measurement.subscribe((err) => {
              if (err) {
                return console.log('err!', err);
              }

              setInterval(() => {

                previousSample = currentSample;
                currentSample = midSample;
                
                calculateStats();

                if(bluetoothStats) {
                  observer.next({ name: 'Cadence', value: {
                    cranks: bluetoothStats.cranks,
                    cadence: bluetoothStats.cadence,
                    raw: currentSample
                  }});
                }

              }, 1000);
            });

            measurement.on('data', function (data, isNotification) {
              // var buf = new Uint8Array(data)
              // console.log('data: ', buf);
              // console.log(data.readUInt16BE(1));
              // this.setState({power: data.readUInt16BE(1)})

              var flags = data.readUInt8(0);
              hasWheel = flags === 1 || flags === 3;
              hasCrank = flags === 2 || flags === 3;
              // console.log({ flags, hasWheel, hasCrank, data });

              midSample = {
                crank: data.readUIntLE(1),
                crankTime: data.readUInt16LE(3),
                wheel: 0,
                wheelTime: 0
                // wheel: data.readUInt32BE(1),
                // wheelTime: data.readUInt16BE(2),
                // crank: data.readUInt16BE(3),
                // crankTime: 0 //data.readUInt16BE(4),
              };
            });
          });
        });

        function calculateStats() {

          if (!currentSample) {
            return;
          }

          if (!previousSample) {
            if (hasWheel) {
              startDistance = currentSample.wheel * wheelSize / 1000 / 1000; // km
            }
            
            return;
          }

          var distance, cadence, speed;
          if (hasWheel) {
            let wheelTimeDiff = diffForSample(currentSample.wheelTime, previousSample.wheelTime, UINT16_MAX);
            wheelTimeDiff /= 1024; // Convert from fractional seconds (roughly ms) -> full seconds
            let wheelDiff = diffForSample(currentSample.wheel, previousSample.wheel, UINT32_MAX);

            var sampleDistance = wheelDiff * wheelSize / 1000; // distance in meters
            speed = (wheelTimeDiff == 0) ? 0 : sampleDistance / wheelTimeDiff * 3.6; // km/hr

            distance = currentSample.wheel * wheelSize / 1000 / 1000; // km
            distance -= startDistance;
          }

          if (hasCrank) {
            let crankTimeDiff = diffForSample(currentSample.crankTime, previousSample.crankTime, UINT16_MAX);
            crankTimeDiff /= 1024; // Convert from fractional seconds (roughly ms) -> full seconds
            let crankDiff = diffForSample(currentSample.crank, previousSample.crank, UINT16_MAX);

            cadence = (crankTimeDiff == 0) ? 0 : (60 * crankDiff / crankTimeDiff); // RPM
          }

          if (bluetoothStats) {
            bluetoothStats = {
              cranks: currentSample.crank,
              cadence: Math.round(bluetoothStats.cadence * (1 - updateRatio) + cadence * updateRatio),
              distance: distance,
              speed: bluetoothStats.speed * (1 - updateRatio) + speed * updateRatio
            };
          } else {
            bluetoothStats = {
              cranks: currentSample.crank,
              cadence: cadence,
              distance: distance,
              speed: speed
            };
          }
        }

        function diffForSample(current, previous, max) {
          if (current >= previous) {
            return current - previous;
          } else {
            return (max - previous) + current;
          }
        }
      });
    }
  });
}

module.exports = BleSensors;