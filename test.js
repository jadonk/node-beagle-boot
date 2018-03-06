var BB = require('./main');
var fs = require('fs');

var umsMountPoint = '/media';
var umsVolume = '/BOOT';

var emitter = BB.tftpServer([
    {vid: 0x0451, pid: 0x6141, file_path: './bin/u-boot-spl.bin'}, // ROM
    {vid: 0x0451, pid: 0xd022, file_path: './bin/u-boot.img'}, // SPL
    {vid: 0x0525, pid: 0xa4a2, file_path: './bin/u-boot.img'}, // SPL
]);

console.log('USB tester and EEPROM writer started');
console.log('Connect board via USB');

emitter.on('progress', function(status){
    console.log(status);
});

emitter.on('done', function(){
    console.log('Program load completed');
});

emitter.on('error', function(error){
    console.log('Error: '+error);
});

emitter.on('connect', function(device){
    console.log("Detected " +device);
    if(device == 'UMS') doScan();
});

fs.watch(umsMountPoint, onMountChange);

function onMountChange(eventType, filename) {
    console.log(eventType + ' ' + filename);
    umsVolume = '/' + filename;
    if(eventType == 'rename') doReadback();
}

function doScan() {
    var volumes = fs.readdirSync(umsMountPoint);
    console.log('volumes = ' + volumes);
}

function doReadback() {
    var envTxt = umsMountPoint+umsVolume+'/env.txt';
    var eepromBin = umsMountPoint+umsVolume+'/eeprom.bin';

    try {
        var env = fs.readFileSync(envTxt, 'utf8');
        console.log('env = ' + env);

        var eeprom = fs.readFileSync(eepromBin);
        console.log('eeprom = ' + eeprom);
    } catch(ex) {
        console.log(envTxt + ' unavailable');
    }
}
