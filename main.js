///////////////////////////////////// DATA FILE PROCESMath.sinG ///////////////////////////////////// 


var rawData = "";
var data;
var dataLength = 0;
var sliderTimeValue;
var dataAtTime;

var rocketModel;

var rocketModelMeshYaw;
var rocketModelMeshPitch;
var rocketModelMeshRoll;

function readDataFile(file) { // get data from CSV file and clean it up
	var file = document.getElementById('dataFileSelector').files[0];
	var reader = new FileReader;
	reader.readAsText(file);
	reader.onload = function () {
		rawData = reader.result;

		processData();

		printData();
	};

}

function printData() {
	console.log(data);
}

function processData() { // this is to get raw data into array of floats like we need it
	data = rawData.split("\n");

	dataLength = data.length;

	for (var i = 0; i < dataLength; i++) {
		data[i] = data[i].replace("\r", "");
		data[i] = data[i].split(",");

		var lineLength = data[i].length;

		var line = [];
		for (var j = 0; j < lineLength; j++) {
			line.push(parseFloat(data[i][j]));
		}

		data[i] = line;
	}

}



///////////////////////////////////// TIME MANAGEMENT ///////////////////////////////////// 


function timerSliderUpdate() { // when the timer slider has moved
	sliderTimeValue = document.getElementById("timeSlider").value; // get the slider value

	getDataAtTime(); // get new data at time

	document.getElementById("timeSliderValueText").innerHTML = dataAtTime[document.getElementById("index_time").value]; // udpate the text

	updateRocketModelOrientation();
}

function updateTimeMinMax() {
	var slider = document.getElementById("timeSlider");
	slider.setAttribute("min", data[0][document.getElementById("index_time").value]);
	slider.setAttribute("max", data[dataLength - 1][document.getElementById("index_time").value]);
	slider.setAttribute("value", data[0][document.getElementById("index_time").value]);
	document.getElementById("timeSliderValueText").innerHTML = document.getElementById("timeSlider").value;
	sliderTimeValue = parseFloat(document.getElementById("timeSlider").value);
}




function prepareDataViewer() {
	updateTimeMinMax();
}

function getDataAtTime() {
	dataAtTime = data.sort(function (a, b) {
		a = a[document.getElementById("index_time").value];
		b = b[document.getElementById("index_time").value];
		return Math.abs(a - sliderTimeValue) - Math.abs(b - sliderTimeValue);
	})[0];
}

function updateRocketModelOrientation() { // get the needed data and update the model orientation
	var yaw = dataAtTime[document.getElementById("index_yaw").value];
	var pitch = dataAtTime[document.getElementById("index_pitch").value];
	var roll = dataAtTime[document.getElementById("index_roll").value];

	console.log(dataAtTime);
	console.log(yaw, pitch, roll);

	yaw = yaw * Math.PI / 180;
	pitch = pitch * Math.PI / 180;
	roll = roll * Math.PI / 180;

	//console.log(rotationMatrix);

	rocketModel.rotationQuaternion = null;

	rocketModel.rotation.x = 0;
	rocketModel.rotation.y = 0;
	rocketModel.rotation.z = 0;

	
	rocketModel.rotate(BABYLON.Axis.X, -yaw, BABYLON.Space.LOCAL);
	rocketModel.rotate(BABYLON.Axis.Z, -pitch, BABYLON.Space.LOCAL);
	rocketModel.rotate(BABYLON.Axis.Y, -roll, BABYLON.Space.LOCAL);
	


	/*
	var rotationMatrix = XYZ_to_rotationMatrix(yaw, pitch, roll);

	
rocketModelMeshYaw = -Math.atan2(rotationMatrix[0][2], rotationMatrix[1][2]);
rocketModelMeshPitch = Math.acos(rotationMatrix[2][2])0;
rocketModelMeshRoll = Math.atan2(rotationMatrix[2][0], rotationMatrix[2][1]);

rocketModel.rotation = new BABYLON.Vector3(rocketModelMeshYaw, rocketModelMeshPitch, rocketModelMeshRoll);
*/
}




///////////////////////////////////// HELPER FUNCTIONS ///////////////////////////////////// 


function XYZ_to_rotationMatrix(x1, x2, x3) {
	var a11 = Math.cos(x2) * Math.cos(x3);
	var a12 = -Math.cos(x2) * Math.sin(x3);
	var a13 = Math.sin(x2);

	var a21 = Math.cos(x1) * Math.sin(x3) + Math.cos(x3) * Math.sin(x1) * Math.sin(x2);
	var a22 = Math.cos(x1) * Math.cos(x3) - Math.sin(x1) * Math.sin(x2) * Math.sin(x3);
	var a23 = -Math.cos(x2) * Math.sin(x1);

	var a31 = Math.sin(x1) * Math.sin(x3) - Math.cos(x1) * Math.cos(x3) * Math.sin(x2);
	var a32 = Math.cos(x3) * Math.sin(x1) + Math.cos(x1) * Math.sin(x2) * Math.sin(x3);
	var a33 = Math.cos(x1) * Math.cos(x2);


	return [
		[a11, a12, a13],
		[a21, a22, a23],
		[a31, a32, a33]
	]
}

///////////////////////////////////// 3D MODEL STUFF ///////////////////////////////////// 

const createScene = () => {
	const scene = new BABYLON.Scene(engine);
	scene.clearColor = new BABYLON.Color3(0.53, 0.81, 0.93);

	//const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 4, Math.PI / 4, 1000, new BABYLON.Vector3(0, 150, 0));
	const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 4, Math.PI / 4, 1500, new BABYLON.Vector3(0, 0, 0));
	camera.attachControl(canvas, true);

	

	const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0));

	//const box = BABYLON.MeshBuilder.CreateBox("box", {});

	const ground = BABYLON.Mesh.CreateGround("ground", 2000, 2000, 10, scene);
	ground.position = new BABYLON.Vector3(0, -250, 0);

	const groundMat = new BABYLON.StandardMaterial("groundMat");
	groundMat.diffuseColor = new BABYLON.Color3(0, 0.4, 0.05);
	ground.material = groundMat; //Place the material property of the ground




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

	var size = 500;
	var axisX = BABYLON.Mesh.CreateLines("axisX", [
		BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
		new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
	], scene);
	axisX.color = new BABYLON.Color3(1, 0, 0);
	var xChar = makeTextPlane("X", "red", size / 10);
	xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
	var axisY = BABYLON.Mesh.CreateLines("axisY", [
		BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
		new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
	], scene);
	axisY.color = new BABYLON.Color3(0, 1, 0);
	var yChar = makeTextPlane("Y", "green", size / 10);
	yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
	var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
		BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
		new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
	], scene);
	axisZ.color = new BABYLON.Color3(0, 0, 1);
	var zChar = makeTextPlane("Z", "blue", size / 10);
	zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);






	BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/DatNotData/FlightDataVisualizer/master/", "DH_RKT_15.obj", scene, function (meshes) {
		rocketModel = BABYLON.Mesh.MergeMeshes(meshes);
		console.log(rocketModel);

		rocketModel.rotation.x = 0;
		rocketModel.rotation.y = 0;
		rocketModel.rotation.z = 0;

		//rocketModel.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);

		//rocketModel.rotate(BABYLON.Axis.X, Math.PI/4, BABYLON.Space.LOCAL);
		//rocketModel.rotate(BABYLON.Axis.Z, Math.PI/4, BABYLON.Space.LOCAL);
	});


	return scene;
}