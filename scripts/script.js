// JavaScript for CipherTrack

document.getElementById('phone-details-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Collect form data
    const formData = new FormData(event.target);
    const phoneDetails = {
        model: formData.get('model'),
        serialNumber: formData.get('serial-number'),
        imeisv: formData.get('imeisv'),
        ipAddress: formData.get('ip-address')
    };

    // Display phone details in table
    displayPhoneDetails(phoneDetails);

    // Track location using Geolocation API
    const locationData = await trackLocation(phoneDetails.ipAddress);

    // Get carrier information using Twilio Lookup API
    const carrierInfo = await getCarrierInfo(phoneDetails.serialNumber);

    // Combine tracking info
    const trackingInfo = {
        Location: locationData ? `${locationData.city}, ${locationData.region}, ${locationData.country} (Lat: ${locationData.lat}, Lng: ${locationData.lng})` : 'Unavailable',
        'Active SIM Card': carrierInfo ? carrierInfo.carrier_name : 'Unavailable',
        'SIM Activation Time': new Date().toLocaleString()
    };

    // Display tracking results in table
    displayTrackingResults(trackingInfo);

    // Store tracking history in Firebase
    storeTrackingHistory({ phoneDetails, trackingInfo });

    // Show the results section
    document.getElementById('results-section').style.display = 'block';
});

// Function to track location using Geolocation API (Google Maps API)
async function trackLocation(ipAddress) {
    try {
        const apiKey = 'AIzaSyCBV73xlBUIqgfArPOxcYxge_G2w8yOqsA';  // Replace with your Google Maps API key
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${ipAddress}&key=${apiKey}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch location data');
        }

        const data = await response.json();
        if (data.status !== 'OK') {
            throw new Error('Geolocation API error: ' + data.status);
        }

        const location = data.results[0].geometry.location;
        const city = data.results[0].address_components.find(component => component.types.includes('locality')).long_name;
        const region = data.results[0].address_components.find(component => component.types.includes('administrative_area_level_1')).long_name;
        const country = data.results[0].address_components.find(component => component.types.includes('country')).long_name;

        return {
            lat: location.lat,
            lng: location.lng,
            city: city,
            region: region,
            country: country
        };
    } catch (error) {
        console.error('Error tracking location:', error);
        return null;
    }
}

// Function to get carrier information using Twilio Lookup API
async function getCarrierInfo(serialNumber) {
    const accountSid = 'AC6923ace3d5f02727204e560bb510e75c';
    const authToken = '07401407142bf72078ff0260bc0ae754';

    try {
        // This is a placeholder. In a real-world scenario, you'd need a secure way to map serial numbers to phone numbers.
        const phoneNumber = '+1234567890'; // Replace with actual phone number or method to get it from serial number

        const url = `https://lookups.twilio.com/v1/PhoneNumbers/${phoneNumber}?Type=carrier`;
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch carrier information');
        }

        const data = await response.json();
        return data.carrier;
    } catch (error) {
        console.error('Error fetching carrier info:', error);
        return null;
    }
}

// Function to display phone details in a table
function displayPhoneDetails(phoneDetails) {
    const phoneDetailsTableBody = document.querySelector('#details-table tbody');
    phoneDetailsTableBody.innerHTML = '';

    for (const key in phoneDetails) {
        const row = document.createElement('tr');
        const attributeCell = document.createElement('td');
        const valueCell = document.createElement('td');
        
        attributeCell.textContent = key;
        valueCell.textContent = phoneDetails[key];

        row.appendChild(attributeCell);
        row.appendChild(valueCell);
        phoneDetailsTableBody.appendChild(row);
    }

    document.getElementById('details-table-section').style.display = 'block';
}

// Function to display tracking results in a table
function displayTrackingResults(trackingInfo) {
    const resultsTableBody = document.querySelector('#results-table tbody');
    resultsTableBody.innerHTML = '';

    for (const key in trackingInfo) {
        const row = document.createElement('tr');
        const attributeCell = document.createElement('td');
        const valueCell = document.createElement('td');
        
        attributeCell.textContent = key;
        valueCell.textContent = trackingInfo[key];

        row.appendChild(attributeCell);
        row.appendChild(valueCell);
        resultsTableBody.appendChild(row);
    }
}

// Function to store tracking history in Firebase
async function storeTrackingHistory(trackingData) {
    try {
        const response = await fetch('/store-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ trackingData })
        });

        if (!response.ok) {
            throw new Error('Failed to store tracking history');
        }
    } catch (error) {
        console.error('Error storing tracking history:', error);
    }
}

// ... (rest of the code remains unchanged)

// PDF Download Functionality
document.getElementById('download-pdf').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const rows = [];
    const tableHeaders = ['Attribute', 'Value'];

    // Collect data from phone details table
    document.querySelectorAll('#details-table tbody tr').forEach((tr) => {
        const row = [];
        tr.querySelectorAll('td').forEach((td) => {
            row.push(td.innerText);
        });
        rows.push(row);
    });

    // Collect data from results table
    document.querySelectorAll('#results-table tbody tr').forEach((tr) => {
        const row = [];
        tr.querySelectorAll('td').forEach((td) => {
            row.push(td.innerText);
        });
        rows.push(row);
    });

    doc.text("Tracking Results", 14, 16);
    doc.autoTable({
        head: [tableHeaders],
        body: rows,
        startY: 20
    });
    doc.save('tracking-results.pdf');
});

// Share Functionality
document.getElementById('share-button').addEventListener('click', function() {
    if (navigator.share) {
        navigator.share({
            title: 'CipherTrack',
            text: 'Check out this futuristic phone tracking app!',
            url: window.location.href
        }).then(() => {
            console.log('Thanks for sharing!');
        }).catch(console.error);
    } else {
        alert('Web Share API is not supported in your browser.');
    }
});

// About Popup Functionality
document.getElementById('about-button').addEventListener('click', function() {
    document.getElementById('about-popup').style.display = 'flex';
});

document.getElementById('close-popup').addEventListener('click', function() {
    document.getElementById('about-popup').style.display = 'none';
});

// Home Button Scroll Functionality
document.getElementById('home-button').addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
