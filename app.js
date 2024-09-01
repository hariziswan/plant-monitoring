let model;
const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const capturedImageElement = document.getElementById('capturedImage');
const captureButton = document.getElementById('captureButton');
const predictButton = document.getElementById('predictButton');
const predictedLabel = document.getElementById('predictedLabel');

// Load the TensorFlow.js model
async function loadModel() {
    model = await tf.loadLayersModel('web_model/model.json');
    console.log("Model loaded.");
}

// Initialize the webcam
async function setupWebcam() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcamElement.srcObject = stream;
    return new Promise((resolve) => {
        webcamElement.onloadedmetadata = () => {
            resolve();
        };
    });
}

// Capture image from webcam
captureButton.addEventListener('click', () => {
    const context = canvasElement.getContext('2d');
    canvasElement.width = webcamElement.videoWidth;
    canvasElement.height = webcamElement.videoHeight;
    context.drawImage(webcamElement, 0, 0, canvasElement.width, canvasElement.height);
    const dataUrl = canvasElement.toDataURL('image/png');
    capturedImageElement.src = dataUrl;
    capturedImageElement.classList.remove('hidden');
    predictButton.classList.remove('hidden');
});

// Predict the plant condition
predictButton.addEventListener('click', async () => {
    const img = tf.browser.fromPixels(capturedImageElement).resizeNearestNeighbor([224, 224]).toFloat().expandDims();
    const prediction = await model.predict(img).data();
    const classNames = ['Soil', '1 month', '2 month', '3 month', '4 month', 'harvest'];
    const maxIndex = prediction.indexOf(Math.max(...prediction));
    predictedLabel.textContent = `Plant Condition: ${classNames[maxIndex]}`;
});

// Load the model and setup webcam
loadModel().then(setupWebcam);
