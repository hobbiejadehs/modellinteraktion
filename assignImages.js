/*
- dateinamen und url der bilder
- diese struktur ist nur zum testen.
- sp�ter->dateinamen und serveradresse der bilder aus einer datenbank/cloudspeicher lesen und automatisch zuordnen

*/
var aBDateinamen = [
	[ 'JPEG_20200708_121238_2048566100', 'https://ccs.jade-hs.de/f/222963050' ],
	[ 'JPEG_20200708_121312_941589308', 'https://ccs.jade-hs.de/f/222963049' ],
	[ 'JPEG_20200708_121351_1358658552', 'https://ccs.jade-hs.de/f/222963056' ],
	[ 'JPEG_20200708_121525_1974293843', 'https://ccs.jade-hs.de/f/222963062' ],
	[ 'JPEG_20200708_121614_1061279963', 'https://ccs.jade-hs.de/f/222963059' ],
	[ 'JPEG_20200708_121714_118519822', 'https://ccs.jade-hs.de/f/222963064' ],
	[ 'JPEG_20200708_121758_729405936', 'https://ccs.jade-hs.de/f/222963066' ],
	[ 'JPEG_20200708_121836_2144390645', 'https://ccs.jade-hs.de/f/222963067' ],
	[ 'JPEG_20200708_121937_1941501167', 'https://ccs.jade-hs.de/f/222963069' ]
];

//id des containers mit den punkten
var containerID = '427a79df-6c15-4356-b557-b3b05ab3a741';

//alle objekte, die im container enthalten sind (punkte)
var pList = desiteAPI.getContainedElements(containerID, 0, false);

//schleife �ber die dateinamen der bilder
for (var i = 0; i < aBDateinamen.length; ++i) {
	//dateiname des bildes
	var strIFileName = aBDateinamen[i][0];
	//aus dem dateinamen die uhrzeit
	var formatedTimeStamp = getTimeString(strIFileName);

	//schleife �ber alle punkte
	for (var j = 0; j < pList.length; ++j) {
		var objID = pList[j];
		//timestamp des aktuellen punktes
		var strPTimeStamp = desiteAPI.getPropertyValue(objID, 'TimeStamp', 'xs:string');
		//weitermachen solange der zeitstempel in dem dateinamen sp�ter als in dem aktuellen punkt war
		if (formatedTimeStamp > strPTimeStamp) {
			continue;
		} else {
			//die url als attribut des punktes hinzuf�gen und die schleife abbrechen->Bild kann nur einem Punktzugeordnet werden
			desiteAPI.setPropertyValue(objID, 'TagName', 'xs:string', aBDateinamen[i][1]);
			break;
		}
	}
}

//liefert uhrzeit in dem format hh:mm:ss (00:15:30) zur�ck
function getTimeString(timestamp) {
	//string anhand der unterstriche aufteilen
	var pDName = timestamp.split('_');

	//die zeit: stunden, minuten, sekunden auslesen
	var str_time = pDName[2];
	var hours = str_time.substr(0, 2);
	var minutes = str_time.substr(2, 2);
	var seconds = str_time.substr(4, 2);

	//aus den zahlen ein datum erstellen
	var d = new Date();
	d.setHours(hours);
	d.setMinutes(minutes);
	d.setSeconds(seconds);

	return d.toLocaleTimeString();
}
