// Einlesen und Trasnformieren der Punkte

//durchmesser der Punkte/Objekte in Meter
var durchmesserPunkte = 0.1;

//container, in dem die Punkte gespeichert werden
var containerID = "e1c9b76d-a623-423e-b98b-630647948f0c";

//inhalt der textdatei einlesen
var lineList = desiteAPI.readTextFile(desiteAPI.getProjectDirectory() + '/punkte-testdaten.txt');

desiteAPI.startProjectTransaction()
{
	//schleife ?ber alle zeilen der datei
	for (var i = 0; i < lineList.length; i++) {
		//zeile mit ?berschrift ?berspringen
		if (i <= 1) {
			continue;
		}

		//die eintr?ge in der zeile in array speichern (annahme: durch Leerezeichen getrennt)
		var aCols = lineList[i].trim().split(/\s+/);

		//einzelne attribute aus den spalten lesen
		var timp_stamp = aCols[0];
		var step_count = aCols[1];
		var x_coordinate = aCols[2];
		var y_coordinate = aCols[3];
		var z_coordinate = aCols[4];

		//hier muss ich ein bisschen basteln. Ich hoffe die Struktur ?ndert sich nicht
		var tag_name = "";
		for (var j = 11; j < aCols.length; j++) {
			tag_name += aCols[j] + " ";
		}

		//z-koordinate manuell angepasst, da keine werte in input-datei
		var rID = create3DObject(parseFloat(x_coordinate.replace(/,/, '.')), parseFloat(y_coordinate.replace(/,/, '.')),8.41, durchmesserPunkte, "TrackingPoint-" + (i-1));


		//den timestamp als Attribut zum Punkt hinzuf?gen
		desiteAPI.setPropertyValue(rID, "TimeStamp", "xs:string", timp_stamp);

		//TagName setzen, falls einer existiert
		if (tag_name != "") {
			desiteAPI.setPropertyValue(rID, "TagName", "xs:string", tag_name);
		}		

	}
}

desiteAPI.endProjectTransaction(); //hier wurden die Punkte erfolgreich als Objekte eingelesen


//Diese beiden Punkte werden sp�ter direkt aus dem Modell gelesen. In dem Tag (Input-Datei) steht, bei welchem Objekt der Punkt aufgenommen wurde

//startpunkt, aus dem Modell lesen ->getPropertyValue BBox
var startPoint = {x: -5.326210, y:-74.40756};
//soll, aus dem Modell lesen ->getPropertyValue BBox
var refPoint = {x: -17.202351, y:-37.292046};

//virtuell verschieben f�r die Berechnung des Winkels
refPoint.x -= startPoint.x;
refPoint.y -= startPoint.y;

//punkt aus der input-Datei, der mit dem ref2 punkt �bereinstimmen soll -> diese Verkn�pfung wird sp�ter �ber einen Tag in der Input-Datei hergestellt
var p59 = {x: 4.54, y: 38.26};

//berechnung des drehwinkels
var angleRef = Math.atan(refPoint.x/refPoint.y) * (180 /Math.PI);
var angleIPoint = Math.atan(p59.x/p59.y) * (180 /Math.PI);

//berechnung f�r negative winkel anpassen

//winkel, um den die punkte gedreht werden m�ssen
var rotateAngle = Math.abs(angleRef) + Math.abs(angleIPoint);

if( angleRef < 0 || angleIPoint < 0 ){
	rotateAngle *= -1;
}

//f�r die rotation �ber die api muss ich den winkel nochmal in rad umrechnen
var drehungRad = rotateAngle * (Math.PI/180);

//einstellungen f�r die 3x3 Rotationsmatrix (siehe Desite Dokumentation)
var trans = '<t>' + 
'	<scale sx="1.0" sy="1.0" sz="1.0" />' +
	'<translate dx="0" dy="0" dz="0" />' +
	'<rotate x="0" y="0" z="0" m="' + Math.cos(drehungRad) +' ' + -1 * Math.sin(drehungRad)   + ' 0.0 ' +  Math.sin(drehungRad) + ' ' + Math.cos(drehungRad) + ' 0.0 0.0 0.0 1.0" /> '+
'</t>'


//alle Punkte aus dem Container in einer Liste speichern
var pList = desiteAPI.getContainedElements("e1c9b76d-a623-423e-b98b-630647948f0c",0,false);

//schleife �ber alle Punkte
for( var i = 0; i < pList.length; ++i){
	//id des aktuellen Objektes
	var objID = pList[i];
	//den punkt/objekt, um den ausgerechneten Winkel drehen
	desiteAPI.transformObject(objID,trans);
}

//Angabe f�r die Translation. Der Startpunkt dient hier als Referenz, da wir die Position in dem Modell bekannt ist
trans = '<t>' +
	'<translate dx="' + startPoint.x + '" dy="' + startPoint.y + '" dz="0.0" /></t>'

//weitere schleife �ber alle Punkte
for( var i = 0; i < pList.length; ++i){
	//id des aktuellen Objektes
	var objID = pList[i];
	//punkte an die neuen Positionen verschieben
	desiteAPI.transformObject(objID,trans);
}


//erzeugt ein 3D-Objekt und gibt die ID des Objektes zur�ck
function create3DObject(x, y, z, d, name) {

	//variablen um die werte der dreiecke zwischenzuspeichern
	var px1, py1, pz1;
	var px2, py2, pz2;
	var px3, py3, pz3;
	var d2 = d / 2.0;

	//d1
	px1 = x - d2;
	px2 = x - d2;
	px3 = x + d2;
	py1 = y - d2;
	py2 = y - d2;
	py3 = y - d2;
	pz1 = z - d2;
	pz2 = z + d2;
	pz3 = z - d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o1ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//d2
	px1 = x + d2;
	px2 = x + d2;
	px3 = x - d2;
	py1 = y - d2;
	py2 = y - d2;
	py3 = y - d2;
	pz1 = z + d2;
	pz2 = z - d2;
	pz3 = z + d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o2ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//d3
	px1 = x - d2;
	px2 = x - d2;
	px3 = x + d2;
	py1 = y + d2;
	py2 = y + d2;
	py3 = y + d2;
	pz1 = z - d2;
	pz2 = z + d2;
	pz3 = z - d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o3ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//d4
	px1 = x + d2;
	px2 = x + d2;
	px3 = x - d2;
	py1 = y + d2;
	py2 = y + d2;
	py3 = y + d2;
	pz1 = z + d2;
	pz2 = z - d2;
	pz3 = z + d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o4ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//d5
	px1 = x - d2;
	px2 = x - d2;
	px3 = x + d2;
	py1 = y - d2;
	py2 = y + d2;
	py3 = y + d2;
	pz1 = z - d2;
	pz2 = z - d2;
	pz3 = z - d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o5ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//d6
	px1 = x + d2;
	px2 = x + d2;
	px3 = x - d2;
	py1 = y + d2;
	py2 = y - d2;
	py3 = y - d2;
	pz1 = z - d2;
	pz2 = z - d2;
	pz3 = z - d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o6ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//d7
	px1 = x - d2;
	px2 = x - d2;
	px3 = x + d2;
	py1 = y - d2;
	py2 = y + d2;
	py3 = y + d2;
	pz1 = z + d2;
	pz2 = z + d2;
	pz3 = z + d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o7ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//d8
	px1 = x + d2;
	px2 = x + d2;
	px3 = x - d2;
	py1 = y + d2;
	py2 = y - d2;
	py3 = y - d2;
	pz1 = z + d2;
	pz2 = z + d2;
	pz3 = z + d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o8ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//d9
	px1 = x - d2;
	px2 = x - d2;
	px3 = x - d2;
	py1 = y + d2;
	py2 = y + d2;
	py3 = y - d2;
	pz1 = z - d2;
	pz2 = z + d2;
	pz3 = z - d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o9ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//d10
	px1 = x - d2;
	px2 = x - d2;
	px3 = x - d2;
	py1 = y + d2;
	py2 = y - d2;
	py3 = y - d2;
	pz1 = z + d2;
	pz2 = z + d2;
	pz3 = z - d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o10ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//d11
	px1 = x + d2;
	px2 = x + d2;
	px3 = x + d2;
	py1 = y + d2;
	py2 = y + d2;
	py3 = y - d2;
	pz1 = z - d2;
	pz2 = z + d2;
	pz3 = z - d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o11ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//d12
	px1 = x + d2;
	px2 = x + d2;
	px3 = x + d2;
	py1 = y + d2;
	py2 = y - d2;
	py3 = y - d2;
	pz1 = z + d2;
	pz2 = z + d2;
	pz3 = z - d2;

	var newObject = '<object3D name="' + name + '">' +
		'<p nr="0" x="' + px1 + '" y="' + py1 + '" z="' + pz1 + '" />' +
		'<p nr="1" x="' + px1 + '" y="' + py2 + '" z="' + pz2 + '" />' +
		'<p nr="2" x="' + px3 + '" y="' + py3 + '" z="' + pz3 + '" />' +
		'<t p1="0" p2="1" p3="2"/></object3D>';

	var o12ID = desiteAPI.createObjectFromXml(containerID, newObject);

	//alle dreiecke zu einem neuen objekt zusammensetzen
	objIds = o1ID + ";" + o2ID + ";" + o3ID + ";" + o4ID + ";" + o5ID + ";" + o6ID + ";" + o7ID + ";" + o8ID + ";" + o9ID + ";" + o10ID + ";" + o11ID + ";" + o12ID;

	var newObjectID = desiteAPI.mergeObjects(containerID, objIds, false, false);

	desiteAPI.deleteObjects(objIds);

	//das material der punkte setzten	
	desiteAPI.setMaterialToObjects("default-mat-07", newObjectID);

	return newObjectID;
}