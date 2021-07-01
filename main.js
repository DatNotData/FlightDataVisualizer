///////////////////////////////////// DATA FILE PROCESMath.sinG ///////////////////////////////////// 


var data;
var dataAtTime;

var rocketModel;

var rocketModelMeshYaw;
var rocketModelMeshPitch;
var rocketModelMeshRoll;

var rocketZeroHeight = 80; // mm (between model origin and bottom oflegs)

var axesSize = 500;

var smallest_dt; // smallest dt in data
var datadt; // dt between start and end
var sliderTimeValue;
var maxSliderValue;
const sliderMultiplier = 10;

class Indexes {
	t;
	y;
	p;
	r;
	altitude;
	servo1;
	servo2;
	ax;
	ay;
	az;
}

var indexes = new Indexes();



var axisX;
var xChar;
var axisY;
var yChar;
var axisY;
var zChar;
var axes;

class UnitsMultipliers { // all input values are being converted to the following
	distance; // for conversion to meters
	time; // for conversion to seconds
	angles; // for conversion to radians
	rotationDirection; // 1 for normal, -1 for inverted;
}

var unitsMultipliers = new UnitsMultipliers();


function readAndProcessData(file) { // get data from CSV file and clean it up
	var file = document.getElementById('dataFileSelector').files[0];
	var reader = new FileReader;
	reader.readAsText(file);
	reader.onload = function () {
		rawData = reader.result;


		// process data part
		rawData = rawData.split("\n");

		data = []

		for (var i = 0; i < rawData.length; i++) {
			rawData[i] = rawData[i].replace("\r", "");

			if (rawData[i].length > 0) {

				rawData[i] = rawData[i].split(",");

				if (!isNaN(rawData[i][0])) {

					var lineLength = rawData[i].length;

					var line = [];
					for (var j = 0; j < lineLength; j++) {
						line.push(parseFloat(rawData[i][j]));
					}

					data.push(line);
				}
			}
		}
	};
}

function updateTimeMinMax() { // change the slider's min max for the loaded data
	var slider = document.getElementById("timeSlider");
	slider.setAttribute("min", 0);
	slider.setAttribute("max", maxSliderValue);
	slider.setAttribute("value", 0);
	document.getElementById("timeSliderValueText").innerHTML = data[0][indexes.t];
}



function prepareDataViewer() { // prepare indexes and everything for the 3D viewer
	indexes.t = document.getElementById("index_time").value;
	indexes.y = document.getElementById("index_yaw").value;
	indexes.p = document.getElementById("index_pitch").value;
	indexes.r = document.getElementById("index_roll").value;
	indexes.altitude = document.getElementById("index_altitude").value;

	if (document.getElementById("angles_units_degrees").checked) {
		unitsMultipliers.angles = Math.PI / 180; // to convert from deg to rad
	}
	else {
		unitsMultipliers.angles = 1; // if already in rads, keep it that way
	}

	unitsMultipliers.distance = document.getElementById("units_altitude").value;
	unitsMultipliers.time = document.getElementById("units_time").value;



	if (data.length > 2) {
		smallest_dt = data[1][indexes.t] - data[0][indexes.t];
		for (var i = 2; i < data.length; i++) {
			var dt = data[i][indexes.t] - data[i - 1][indexes.t];
			if (dt < smallest_dt) {
				smallest_dt = dt;
			}
		}
		
	}

	datadt = data[data.length-1][indexes.t] - data[0][indexes.t];
	maxSliderValue = datadt / smallest_dt * sliderMultiplier;

	updateTimeMinMax();

	timerSliderUpdate();
}

function getDataAtTime() { // get the data point closest to the time of the slider
	var dataCopy = Array.from(data);
	dataAtTime = dataCopy.sort(function (a, b) {
		a = a[indexes.t];
		b = b[indexes.t];
		return Math.abs(a - sliderTimeValue) - Math.abs(b - sliderTimeValue);
	})[0];
}

function updateRocketModel() { // get the needed data and update the model orientation
	var yaw = dataAtTime[indexes.y];
	var pitch = dataAtTime[indexes.p];
	var roll = dataAtTime[indexes.r];

	yaw *= unitsMultipliers.angles;
	pitch *= unitsMultipliers.angles;
	roll *= unitsMultipliers.angles;

	rocketModel.rotationQuaternion = null;

	rocketModel.rotation.x = 0;
	rocketModel.rotation.y = 0;
	rocketModel.rotation.z = 0;


	rocketModel.rotate(BABYLON.Axis.X, -yaw, BABYLON.Space.LOCAL);
	rocketModel.rotate(BABYLON.Axis.Z, -pitch, BABYLON.Space.LOCAL);
	rocketModel.rotate(BABYLON.Axis.Y, -roll, BABYLON.Space.LOCAL);

	if (!(indexes.altitude === "")) {
		var altitude = dataAtTime[indexes.altitude] * unitsMultipliers.distance; // converts to meters
		rocketModel.position = new BABYLON.Vector3(0, rocketZeroHeight + altitude * 1000, 0); // reconverts to mm for displaying

		//axes.position = new BABYLON.Vector3(0, rocketZeroHeight + altitude, 0);
		var position = new BABYLON.Vector3(0, altitude * 1000, 0);
		axisX.position = position;
		axisY.position = position;
		axisZ.position = position;
		xChar.position = new BABYLON.Vector3(0.9 * axesSize, 0.05 * axesSize + altitude * 1000 + rocketZeroHeight, 0);
		yChar.position = new BABYLON.Vector3(0, 0.9 * axesSize + altitude * 1000 + rocketZeroHeight, -0.05 * axesSize);
		zChar.position = new BABYLON.Vector3(0, 0.05 * axesSize + altitude * 1000 + rocketZeroHeight, 0.9 * axesSize);


	}
	else {
		var altitude = 0.25; // converts to meters
		rocketModel.position = new BABYLON.Vector3(0, rocketZeroHeight + altitude * 1000, 0); // reconverts to mm for displaying	
		var position = new BABYLON.Vector3(0, altitude * 1000, 0);
		axisX.position = position;
		axisY.position = position;
		axisZ.position = position;
		xChar.position = new BABYLON.Vector3(0.9 * axesSize, 0.05 * axesSize + altitude * 1000 + rocketZeroHeight, 0);
		yChar.position = new BABYLON.Vector3(0, 0.9 * axesSize + altitude * 1000 + rocketZeroHeight, -0.05 * axesSize);
		zChar.position = new BABYLON.Vector3(0, 0.05 * axesSize + altitude * 1000 + rocketZeroHeight, 0.9 * axesSize);
	}
}


function timerSliderUpdate() { // when the timer slider has moved
	var sliderRawValue = parseFloat(document.getElementById("timeSlider").value); // get the slider value
	
	sliderTimeValue = sliderRawValue/maxSliderValue * datadt + data[0][indexes.t];
	getDataAtTime(); // get new data at time

	document.getElementById("timeSliderValueText").innerHTML = dataAtTime[indexes.t]; // udpate the text

	updateRocketModel();
}




///////////////////////////////////// 3D MODEL STUFF ///////////////////////////////////// 

const createScene = () => {
	const scene = new BABYLON.Scene(engine);
	scene.clearColor = new BABYLON.Color3(0.53, 0.81, 0.93);

	//const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 4, Math.PI / 4, 1000, new BABYLON.Vector3(0, 150, 0));
	const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 4, Math.PI * 0.45, 1500, new BABYLON.Vector3(0, rocketZeroHeight, 0));
	camera.attachControl(canvas, true);
	camera.maxZ = 10000000


	const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0));


	// code to make tiled ground

	const groundSize = 100000;
	var numTiles = groundSize / 1000;

	var grid = {
		'h': 10,
		'w': 10
	};

	const tiledGround = new BABYLON.MeshBuilder.CreateTiledGround("Tiled Ground", { xmin: -groundSize, zmin: -groundSize, xmax: groundSize, zmax: groundSize, subdivisions: grid });

	//Create the multi material
	//Create differents materials
	const whiteMaterial = new BABYLON.StandardMaterial("White");
	whiteMaterial.diffuseColor = new BABYLON.Color3(0, 0.4, 0.05);

	const blackMaterial = new BABYLON.StandardMaterial("Black");
	blackMaterial.diffuseColor = new BABYLON.Color3(0, 0.6, 0.08);

	// Create Multi Material
	const multimat = new BABYLON.MultiMaterial("multi", scene);
	multimat.subMaterials.push(whiteMaterial);
	multimat.subMaterials.push(blackMaterial);


	// Apply the multi material
	// Define multimat as material of the tiled ground
	tiledGround.material = multimat;

	// Needed variables to set subMeshes
	const verticesCount = tiledGround.getTotalVertices();
	const tileIndicesLength = tiledGround.getIndices().length / (grid.w * grid.h);

	// Set subMeshes of the tiled ground
	tiledGround.subMeshes = [];
	let base = 0;
	for (let row = 0; row < grid.h; row++) {
		for (let col = 0; col < grid.w; col++) {
			tiledGround.subMeshes.push(new BABYLON.SubMesh(row % 2 ^ col % 2, 0, verticesCount, base, tileIndicesLength, tiledGround));
			base += tileIndicesLength;
		}
	}





	// draw world axis
	var makeTextPlane = function (text, color, size) {
		var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
		dynamicTexture.hasAlpha = true;
		dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
		var plane = BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
		plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
		plane.material.backFaceCulling = false;
		plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
		plane.material.diffuseTexture = dynamicTexture;
		return plane;
	};

	var axesHeight = rocketZeroHeight;
	axisX = BABYLON.Mesh.CreateLines("axisX", [
		new BABYLON.Vector3(0, axesHeight, 0), new BABYLON.Vector3(axesSize, axesHeight, 0), new BABYLON.Vector3(axesSize * 0.95, 0.05 * axesSize + axesHeight, 0),
		new BABYLON.Vector3(axesSize, axesHeight, 0), new BABYLON.Vector3(axesSize * 0.95, -0.05 * axesSize + axesHeight, 0)
	], scene, updatable = true);
	axisX.color = new BABYLON.Color3(1, 0, 0);
	xChar = makeTextPlane("X", "red", axesSize / 10);
	xChar.position = new BABYLON.Vector3(0.9 * axesSize, 0.05 * axesSize + axesHeight, 0);
	axisY = BABYLON.Mesh.CreateLines("axisY", [
		new BABYLON.Vector3(0, axesHeight, 0), new BABYLON.Vector3(0, axesSize + axesHeight, 0), new BABYLON.Vector3(-0.05 * axesSize, axesSize * 0.95 + axesHeight, 0),
		new BABYLON.Vector3(0, axesSize + axesHeight, 0), new BABYLON.Vector3(0.05 * axesSize, axesSize * 0.95 + axesHeight, 0)
	], scene, updatable = true);
	axisY.color = new BABYLON.Color3(0, 1, 0);
	yChar = makeTextPlane("Y", "green", axesSize / 10);
	yChar.position = new BABYLON.Vector3(0, 0.9 * axesSize + axesHeight, -0.05 * axesSize);
	axisZ = BABYLON.Mesh.CreateLines("axisZ", [
		new BABYLON.Vector3(0, axesHeight, 0), new BABYLON.Vector3(0, axesHeight, axesSize), new BABYLON.Vector3(0, -0.05 * axesSize + axesHeight, axesSize * 0.95),
		new BABYLON.Vector3(0, axesHeight, axesSize), new BABYLON.Vector3(0, 0.05 * axesSize + axesHeight, axesSize * 0.95)
	], scene, updatable = true);
	axisZ.color = new BABYLON.Color3(0, 0, 1);
	zChar = makeTextPlane("Z", "blue", axesSize / 10);
	zChar.position = new BABYLON.Vector3(0, 0.05 * axesSize + axesHeight, 0.9 * axesSize);

	//axes = BABYLON.Mesh.MergeMeshes([axisX, axisY, axisZ]);
	//axes = BABYLON.MeshBuilder.CreateLineSystem("lineSystem", [axisX, axisY, axisZ], scene);



	BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/DatNotData/FlightDataVisualizer/master/", "DH_RKT_15.obj", scene, function (meshes) {
		rocketModel = BABYLON.Mesh.MergeMeshes(meshes);

		rocketModel.rotation.x = 0;
		rocketModel.rotation.y = 0;
		rocketModel.rotation.z = 0;

		rocketModel.position = new BABYLON.Vector3(0, rocketZeroHeight, 0);

		camera.lockedTarget = rocketModel;
	});


	return scene;
}