function GPS() {
    var gpsd = require('node-gpsd');

    var listener = new gpsd.Listener({
        port: 2947,
        hostname: 'localhost',
        logger:  {
            info: function() {},
            warn: console.warn,
            error: console.error
        },
        parse: true
    });

    listener.on('TPV', function (tpv) {
        emitter.onChange(tpv);
    });

    listener.connect(function() {
        listener.watch();
    });


    // cleanup
    process.on('exit', function() {
        console.log('CLEANUP:GPS');
        listener.unwatch();

        process.exit();
    });


    // return
    var emitter = {
        onChange: function() { }
    }

    return {
        name: 'GPS',
        emitter: emitter
    };
}

module.exports = GPS;