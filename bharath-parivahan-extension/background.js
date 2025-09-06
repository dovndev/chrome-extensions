// Simplified Background Service Worker for DL Slot Booking
console.log('DL Slot Booking Extension background script loaded');

let timeChecker = null;
let isTimerActive = false;
let targetTime = '09:00:00';

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received:', request);
    
    switch(request.action) {
        case 'startTimer':
            startTimeChecker(request.targetTime);
            sendResponse({success: true, message: 'Timer started'});
            break;
            
        case 'stopTimer':
            stopTimeChecker();
            sendResponse({success: true, message: 'Timer stopped'});
            break;
            
        case 'showNotification':
            showNotification(request.title, request.message);
            sendResponse({success: true});
            break;
            
        default:
            sendResponse({success: false, message: 'Unknown action'});
    }
    
    return true; // Keep message channel open for async response
});

function startTimeChecker(time) {
    if (isTimerActive) {
        console.log('Timer already active');
        return;
    }
    
    console.log('Starting time checker for:', time);
    targetTime = time;
    isTimerActive = true;
    
    // Clear existing checker
    if (timeChecker) {
        clearInterval(timeChecker);
    }
    
    // Check time every 100ms for precision
    timeChecker = setInterval(() => {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 8);
        
        if (currentTime === targetTime) {
            console.log('Target time reached!', currentTime);
            triggerTimeBasedAction();
        }
    }, 100);
    
    // Show notification
    showNotification('DL Timer Started', `Timer set for ${time}. Extension will auto-submit when time is reached.`);
}

function stopTimeChecker() {
    if (timeChecker) {
        clearInterval(timeChecker);
        timeChecker = null;
        isTimerActive = false;
        console.log('Time checker stopped');
        
        showNotification('Timer Stopped', 'DL slot booking timer has been stopped');
    }
}

function triggerTimeBasedAction() {
    console.log('Triggering time-based action at:', targetTime);
    
    // Stop the timer
    stopTimeChecker();
    
    // Send message to content script on DL booking page
    chrome.tabs.query({
        url: ["*://sarathi.parivahan.gov.in/*"]
    }, (tabs) => {
        if (tabs.length > 0) {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'triggerTimeBasedSubmit',
                    targetTime: targetTime
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Could not send message to tab:', chrome.runtime.lastError.message);
                    } else {
                        console.log('Time-based action triggered on tab:', tab.id);
                    }
                });
            });
        } else {
            showNotification('No DL Page Found', 'Please open the DL slot booking page first');
        }
    });
    
    // Show notification
    showNotification('Time Reached!', `It's ${targetTime}! Starting automatic submission...`);
}

function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.png',
        title: title,
        message: message
    });
}
