document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('qr-video');
    const resultContainer = document.getElementById('result-container');
    const detailsDiv = document.getElementById('details');
    const messageDiv = document.getElementById('message');
    const scanAgainBtn = document.getElementById('scan-again');

    let scanning = true;

    // Function to start the camera and scan
    const startScan = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            video.setAttribute('playsinline', true); // Required for iOS
            video.play();
            scanning = true;
            resultContainer.style.display = 'none';
            messageDiv.style.display = 'block';
            detailsDiv.innerHTML = '';
            requestAnimationFrame(tick);
        } catch (err) {
            messageDiv.innerHTML = '<p style="color:red;">Camera access denied or not available. Please allow access to scan a QR code.</p>';
        }
    };

    const tick = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code && code.data.startsWith('upi://')) {
                scanning = false;
                video.srcObject.getTracks().forEach(track => track.stop());
                displayUpiDetails(code.data);
            }
        }
        if (scanning) {
            requestAnimationFrame(tick);
        }
    };

    // Function to parse the UPI string and display details
    const displayUpiDetails = (upiString) => {
        const urlParams = new URLSearchParams(upiString.replace('upi://pay?', ''));
        let details = `
            <p><strong>Payee Address:</strong> ${urlParams.get('pa') || 'N/A'}</p>
            <p><strong>Payee Name:</strong> ${urlParams.get('pn') || 'N/A'}</p>
            <p><strong>Amount:</strong> ₹${urlParams.get('am') || 'N/A'}</p>
            <p><strong>Transaction ID:</strong> ${urlParams.get('tid') || 'N/A'}</p>
            <p><strong>Remark:</strong> ${urlParams.get('tr') || 'N/A'}</p>
        `;
        detailsDiv.innerHTML = details;
        resultContainer.style.display = 'block';
        messageDiv.style.display = 'none';
    };

    // Button to restart scanning
    scanAgainBtn.addEventListener('click', () => {
        startScan();
    });

    // Start the process
    startScan();
});
