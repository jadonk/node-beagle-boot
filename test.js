var BB = require('./main');

var emitter = BB.tftpServer([
    {vid: 0x0451, pid: 0x6141, file_path: './bin/spl'}, // ROM
    {vid: 0x0525, pid: 0xa4a2, file_path: './bin/uboot'}, // SPL
]);

console.log('USB tester and EEPROM writer started');
console.log('Connect board via USB');

emitter.on('progress', function(status){
    //console.log(status);
});

emitter.on('done', function(){
    console.log('Program load completed');
});

emitter.on('error', function(error){
    //console.log('Error: '+error);
});

emitter.on('connect', function(device){
    console.log("Detected " +device);
    if(device == "UMS") console.log("Ready");
});

