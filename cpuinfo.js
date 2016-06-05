var fs = require('fs');

setup_board();

function setup_board()
{
        var cpuinfo, boardrev, match, gpiomap;

        // cpuinfo = fs.readFileSync('/proc/cpuinfo', 'ascii', function(err) {
        //         if (err)
        //                 throw err;
        // });

        // cpuinfo.toString().split(/\n/).forEach(function (line) {
        //         match = line.match(/^Revision.*(.{4})/);
        //         if (match) {
        //                 console.log(match[1])
        //                 boardrev = parseInt(match[1], 16);
        //                 return;
        //         }
        // });

        // switch (boardrev) {
        // case 0x2:
        // case 0x3:
        //         gpiomap = "v1rev1";
        //         break;
        // case 0x4:
        // case 0x5:
        // case 0x6:
        // case 0x7:
        // case 0x8:
        // case 0x9:
        // case 0xd:
        // case 0xe:
        // case 0xf:
        //         gpiomap = "v1rev2";
        //         break;
        // case 0x10:
        // case 0x12:
        // case 0x13:
        // case 0x15:
        // case 0x92:
        // case 0x1041:
        // case 0x2082:
        //         gpiomap = "v2plus";
        //         break;
        // }

        // console.log(boardrev);
        // console.log(gpiomap);

        gpiomap = 'v2plus'

}
