// MultiJointModel.js (c) 2012 matsuda and itami
// Vertex shader program
var VSHADER_SOURCE =
'attribute vec4 a_Position;\n' +
'attribute vec4 a_Normal;\n' +
'attribute vec2 a_TexCoord;\n' +
'uniform mat4 u_MvpMatrix;\n' +
'uniform mat4 u_NormalMatrix;\n' +
'varying vec2 v_TexCoord;\n' +
'varying vec4 v_Color;\n' +
'void main() {\n' +
' gl_Position = u_MvpMatrix * a_Position;\n' +
' v_TexCoord = a_TexCoord;\n' +
// Shading calculation to make the arm look three-dimensional
' vec3 lightDirection = normalize(vec3(0.7, -0.2, 0.2));\n' + // Light direction
' vec4 color = vec4(1.0, 0.4, 0.0, 1.0);\n' + // Robot color
' vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
' float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
' v_Color = vec4(color.rgb * nDotL + vec3(0.1), color.a);\n' +
'}\n';
// Fragment shader program
var FSHADER_SOURCE =
'#ifdef GL_ES\n' +
'precision mediump float;\n' +
'#endif\n' +
'uniform sampler2D u_Sampler;\n' +
'varying vec2 v_TexCoord;\n' +
'varying vec4 v_Color;\n' +
'void main() {\n' +
' gl_FragColor = v_Color * texture2D(u_Sampler, v_TexCoord);\n' +
'}\n';

function main() {
// Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  // Set the vertex information
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  var tn = initTextureBuffers(gl);
  if (tn<0) {
    console.log('Failed to set the texture information');
    return;
  }

  // Set texture
  if (!initTextures(gl, n)) {
    console.log('Failed to intialize the texture.');
    return;
  }
  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  var	w = canvas.width;
	var	h = canvas.height;

  gl.viewport(0, 0, w/2, h);
  // Get the storage locations of uniform variables
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_MvpMatrix || !u_NormalMatrix) {
    console.log('Failed to get the storage location');
    return;
  }
  // Calculate the view projection matrix
  var viewProjMatrix = new Matrix4();
  viewProjMatrix.setPerspective(50.0, canvas.width / canvas.height, 1.0, 100.0);
  viewProjMatrix.lookAt(0.0, -30.0, 10.0, 0.0, 30.0, 0.0, 0.0, 1.0, 0.0);
  // Register the event handler to be called on key press
  document.onkeydown = function(ev){ keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix,
  u_NormalMatrix); };
  draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, canvas); // Draw the robot arm

}

var rot=0.0, tran=0.0, g_z=0.0;
var accM = new Matrix4();
var MM = new Matrix4();
var rotor_accM = new Matrix4();

function keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {

  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of joint1 around the z-axis
      tran = tran + 0.1;
      MM.setIdentity();

      MM.translate(0.1, 0.0, 0.0);
      break;
    case 38: // Down arrow key -> the negative rotation of joint1 around the z-axis
      tran = tran - 0.1;
      MM.setIdentity();

      MM.translate(-0.1, 0.0, 0.0);
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      rot = rot - 10.0;
      MM.setIdentity();

      MM.rotate(-10.0, 0,0,1);
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      rot = rot + 10.0;
      MM.setIdentity();

      MM.rotate(10.0, 0,0,1);
      break;
    case 87: // 'w' 'W' key -> the positive rotation of joint2
    case 119:
      g_z = g_z + 0.1;
      MM.setIdentity();

      MM.translate(0,0,0.1);
      break;
    case 83: // 's' 'S' key -> the negative rotation of joint2
    case 115:
      g_z = g_z - 0.1;
      MM.setIdentity();

      MM.translate(0,0,-0.1);
      break;

    default: return; // Skip drawing at no effective action
  }
  // Draw the robot arm
  draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

function initTextureBuffers(gl) {
  var verticesTexCoords = new Float32Array([
    // Vertex coordinates, texture coordinate
    -0.5,  0.5,   0.0, 1.0,
    -0.5, -0.5,   0.0, 0.0,
     0.5,  0.5,   1.0, 1.0,
     0.5, -0.5,   1.0, 0.0,
  ]);
  var n = 4; // The number of vertices

  // Create the buffer object
  var vertexTexCoordBuffer = gl.createBuffer();
  if (!vertexTexCoordBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

  var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_TexCoord
  var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
  }
  // Assign the buffer object to a_TexCoord variable
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
  gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object

  return n;
}

function initTextures(gl, n) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  // Get the storage location of u_Sampler
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }
  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function(){ loadTexture(gl, n, texture, u_Sampler, image); };
  // Tell the browser to load an image
  image.src = 'hyunmj.github.io/a/map.jpg';

  return true;
}

function loadTexture(gl, n, texture, u_Sampler, image) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler, 0);

  gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
}

function initVertexBuffers(gl) {
// Coordinates竊뉱ube which length of one side is 1 with the origin on the center of the bottom)
  var vertices = new Float32Array([
    0.5, 0.5, 1.0,   -0.5, 0.5, 1.0,  -0.5, -0.5, 1.0,   0.5, -0.5, 1.0, // v0-v1-v2-v3 front
    0.5, 0.5, 1.0,   0.5, -0.5, 1.0,   0.5, -0.5, 0.0,  0.5, 0.5, 0.0, // v0-v3-v4-v5 right
    0.5, 0.5, 1.0,   0.5, 0.5, 0.0,  -0.5, 0.5, 0.0,  -0.5, 0.5, 1.0, // v0-v5-v6-v1 up
    -0.5, 0.5, 1.0,  -0.5, 0.5, 0.0,   -0.5, -0.5, 0.0,  -0.5, -0.5, 1.0, // v1-v6-v7-v2 left
    -0.5, -0.5, 0.0,   0.5, -0.5, 0.0,  0.5, -0.5, 1.0,   -0.5, -0.5, 1.0, // v7-v4-v3-v2 down
    0.5, -0.5, 0.0,   -0.5, -0.5, 0.0,   -0.5, 0.5, 0.0,  0.5, 0.5, 0.0 // v4-v7-v6-v5 back
  ]);
  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0 // v4-v7-v6-v5 back
  ]);
  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2, 0, 2, 3, // front
    4, 5, 6, 4, 6, 7, // right
    8, 9,10, 8,10,11, // up
    12,13,14, 12,14,15, // left
    16,17,18, 16,18,19, // down
    20,21,22, 20,22,23 // back
  ]);
  // Write the vertex property to buffers (coordinates and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, gl.FLOAT, 3)) return -1;
  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return indices.length;
}
function initArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);
  return true;
}


// Coordinate transformation matrix
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4();
function draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, canvas) {
  var currentAngle = 0.0;
  function tick() {

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw a base
    var baseHeight = 3.0;
    var baseWidth = 4.0;
    var baseDepth = 3.0;

    g_modelMatrix.translate(0.0, 0.0, 0.0);
    accM.multiply(MM);
    g_modelMatrix.set(accM);
    MM.setIdentity();
    drawBox(gl, n, baseWidth, baseDepth, baseHeight, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

    //Draw a tail
    pushMatrix(g_modelMatrix);
    var tailLength = 2.0;
    var tailHeight = 0.8;
    var tailDepth = 0.8;
    g_modelMatrix.translate(baseWidth, 0.0, (baseHeight-tailHeight)/2.0 );
    drawBox(gl, n, tailLength, tailDepth, tailHeight, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    g_modelMatrix = popMatrix();

    // rotor
    pushMatrix(g_modelMatrix);
    var rotorHeight = 1.0;
    var rotorWidth = 8.0;
    var rotorDepth = 1.0;

    g_modelMatrix.translate(0.0, 0.0, baseHeight); // Move onto the base

    currentAngle = animate(currentAngle);

    rotor_accM.rotate(currentAngle, 0.0, 0.0, 1.0);
    g_modelMatrix.multiply(rotor_accM);

    drawBox(gl, n, rotorWidth, rotorDepth, rotorHeight, viewProjMatrix, u_MvpMatrix, u_NormalMatrix); // Draw
    g_modelMatrix = popMatrix();

    requestAnimationFrame(tick, canvas);

  }
  tick();


}
var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
var m2 = new Matrix4(m);
g_matrixStack.push(m2);
}
function popMatrix() { // Retrieve the matrix from the array
return g_matrixStack.pop();
}
var g_normalMatrix = new Matrix4(); // Coordinate transformation matrix for normals
// Draw rectangular solid
function drawBox(gl, n, width, height, depth, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  pushMatrix(g_modelMatrix); // Save the model matrix
  // Scale a cube and draw
  g_modelMatrix.scale(width, height, depth);
  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
  // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
  // Draw
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  g_modelMatrix = popMatrix(); // Retrieve the model matrix
}
var g_last = Date.now();
var ANGLE_STEP = 180.0;
function animate(angle) {
  var now = Date.now();
  var elapsed = now-g_last;
  g_last = now;
  var newAngle = angle+(ANGLE_STEP * elapsed)/1000.0;
  return newAngle %=360;
}
