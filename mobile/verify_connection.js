const axios = require('axios');

const projectId = "quick-sos-97d28";
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`;

async function testConnection() {
    console.log(`Attempting to connect to Firestore REST API: ${url}`);
    try {
        const response = await axios.get(url);
        console.log("SUCCESS: Connected to Firestore REST API!");
        console.log("Status:", response.status);
        process.exit(0);
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log("SUCCESS: Connected to Firestore (but got error response, which is fine for connectivity check)");
            console.log("Status:", error.response.status);
            process.exit(0);
        } else if (error.request) {
            // The request was made but no response was received
            console.error("FAILURE: No response received from Firestore.");
            console.error("Error:", error.message);
            process.exit(1);
        } else {
            console.error("FAILURE: Error setting up request.");
            console.error("Error:", error.message);
            process.exit(1);
        }
    }
}

testConnection();
