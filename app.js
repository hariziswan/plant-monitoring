let model;
const webcamElement = document.getElementById('webcam');
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
            video: { facingMode: 'environment' }  // Request the back camera
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

// Function to make real-time predictions with proper memory management
async function predictFrame() {
    try {
        const canvasElement = document.createElement('canvas');
        const context = canvasElement.getContext('2d');
        canvasElement.width = webcamElement.videoWidth;
        canvasElement.height = webcamElement.videoHeight;
        
        // Draw the current video frame to the canvas
        context.drawImage(webcamElement, 0, 0, canvasElement.width, canvasElement.height);

        // Make predictions using the captured frame from the video
        const img = tf.browser.fromPixels(canvasElement).resizeNearestNeighbor([224, 224]).toFloat().expandDims();
        
        // Predict and update UI
        const prediction = await model.predict(img).data();
        const classNames = ['Soil', '1 month', '2 month', '3 month', '4 month', 'harvest'];
        const maxIndex = prediction.indexOf(Math.max(...prediction));
        
        // Update the predicted label and graph
        predictedLabel.textContent = `Plant Condition: ${classNames[maxIndex]}`;
        predictionChart.data.datasets[0].data = Array.from(prediction);
        predictionChart.update();

        // Dispose of the tensor to prevent memory leaks
        img.dispose();
    } catch (error) {
        console.error("Error during prediction: ", error);
        predictedLabel.textContent = "Error during prediction. Check console for details.";
    } finally {
        // Request the next frame prediction
        requestAnimationFrame(predictFrame);
    }
}

// Load the model, setup the webcam, and start the real-time predictions
loadModel().then(() => setupWebcam()).then(() => {
    predictFrame();  // Start real-time prediction loop
});
