// Simplified Popup JavaScript for DL Slot Booking
let isTimerActive = false;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize popup
    initializePopup();
    
    // Add event listeners
    addEventListeners();
    
    // Start time display update
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
});

function initializePopup() {
    updateStatus('Ready to start');
}

function addEventListeners() {
    // Timer controls
    document.getElementById('startBtn').addEventListener('click', handleStartTimer);
    document.getElementById('stopBtn').addEventListener('click', handleStopTimer);
    
    // Form filling
    document.getElementById('fillBtn').addEventListener('click', handleFillForm);
}

function handleStartTimer() {
    if (isTimerActive) {
        updateStatus('Timer is already running');
        return;
    }
    
    const targetTime = document.getElementById('targetTime').value;
    if (!targetTime) {
        updateStatus('Please set target time');
        return;
    }
    
    updateStatus('Starting timer...');
    isTimerActive = true;
    
    // Update UI
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    
    // Send message to background script to start timer
    chrome.runtime.sendMessage({
        action: 'startTimer',
        targetTime: targetTime
    }, function(response) {
        if (response && response.success) {
            updateStatus(`Timer started for ${targetTime}`);
        } else {
            updateStatus('Failed to start timer');
            handleStopTimer();
        }
    });
}

function handleStopTimer() {
    updateStatus('Stopping timer...');
    isTimerActive = false;
    
    // Update UI
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    
    // Send message to background script to stop timer
    chrome.runtime.sendMessage({
        action: 'stopTimer'
    }, function(response) {
        updateStatus('Timer stopped');
    });
}

function handleFillForm() {
    updateStatus('Filling DL form...');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'fillDLForm'
        }, function(response) {
            if (chrome.runtime.lastError) {
                updateStatus('Error: Navigate to DL booking page first');
            } else {
                updateStatus('Form filled - Enter captcha manually');
            }
        });
    });
}

function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('currentTime').textContent = timeString;
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
    
    // Clear status after 5 seconds for non-permanent messages
    if (!message.includes('Timer started') && !message.includes('Ready')) {
        setTimeout(() => {
            document.getElementById('status').textContent = isTimerActive ? 'Timer active' : 'Ready to start';
        }, 5000);
    }
}

// Handle messages from background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateStatus') {
        updateStatus(request.message);
    } else if (request.action === 'timerTriggered') {
        updateStatus('🎯 Timer triggered! Auto-submitting...');
    }
});
