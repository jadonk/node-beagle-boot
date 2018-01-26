var BB = require('./main');
var fs = require('fs');

var umsMountPoint = '/Volumes';
var umsVolume = '/BOOT';

var server = BB.connect();

server.addTftpServer(
    {vid: 0x0451, pid: 0x6141, file_path: './bin/spl'} // ROM
);
server.addTftpServer(
    {vid: 0x0525, pid: 0xa4a2, file_path: './bin/uboot'} // SPL
);


console.log('USB tester and EEPROM writer started');
console.log('Connect board via USB');

server.on('progress', function(status){
    //console.log(status);
});

server.on('done', function(){
    console.log('Program load completed');
});

server.on('error', function(error){
    //console.log('Error: '+error);
});

server.on('connect', function(device){
    console.log("Detected " +device);
    if(device == 'UMS') doScan();
});

fs.watch(umsMountPoint, onMountChange);

server.probeDevices();

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
