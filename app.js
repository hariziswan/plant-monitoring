let model;
const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const capturedImageElement = document.getElementById('capturedImage');
const captureButton = document.getElementById('captureButton');
const predictButton = document.getElementById('predictButton');
const predictedLabel = document.getElementById('predictedLabel');

// Initialize Chart.js for prediction graph
const ctx = document.getElementById('predictionGraph').getContext('2d');
const predictionChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Soil', '1 month', '2 month', '3 month', '4 month', 'harvest'],
        datasets: [{
            label: 'Prediction Probability',
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// Load the TensorFlow.js model
async function loadModel() {
    try {
        model = await tf.loadLayersModel('web_model/model.json');
        console.log("Model loaded.");
    } catch (error) {
        console.error("Error loading model: ", error);
        predictedLabel.textContent = "Error loading model. Check console for details.";
    }
}

// Initialize the webcam with constraints to use the back camera
async function setupWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } // This requests the back camera
        });
        webcamElement.srcObject = stream;
        return new Promise((resolve) => {
            webcamElement.onloadedmetadata = () => {
                resolve();
            };
        });
    } catch (error) {
        console.error("Error accessing webcam: ", error);
        predictedLabel.textContent = "Error accessing webcam. Check console for details.";
    }
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

// Predict the plant condition and update the graph
predictButton.addEventListener('click', async () => {
    try {
        const img = tf.browser.fromPixels(capturedImageElement).resizeNearestNeighbor([224, 224]).toFloat().expandDims();
        const prediction = await model.predict(img).data();
        const classNames = ['Soil', '1 month', '2 month', '3 month', '4 month', 'harvest'];
        const maxIndex = prediction.indexOf(Math.max(...prediction));
        predictedLabel.textContent = `Plant Condition: ${classNames[maxIndex]}`;

        // Update the prediction graph
        predictionChart.data.datasets[0].data = Array.from(prediction);
        predictionChart.update();
    } catch (error) {
        console.error("Error during prediction: ", error);
        predictedLabel.textContent = "Error during prediction. Check console for details.";
    }
});

// Load the model and setup webcam
loadModel().then(setupWebcam);
