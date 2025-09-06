console.log("Content script loaded.");

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "applyCursor" && message.imageData) {
        console.log("Received message to apply cursor:", message.imageData);
        // Apply the custom cursor using the CSS cursor property
        document.body.style.cursor = `url(${message.imageData}), auto`;
        console.log("Custom cursor applied.");
        sendResponse({ status: "success" });
    } else if (message.action === "updateCursorSize" && message.size) {
        chrome.storage.local.get('customCursorImage', ({ customCursorImage }) => {
            if (customCursorImage) {
                document.body.style.cursor = `url(${customCursorImage}) ${message.size} ${message.size}, auto`;
            }
        });
        sendResponse({ status: "success" });
    }
});

// Apply the saved cursor on page load
chrome.storage.local.get(['customCursorImage', 'cursorSize'], ({ customCursorImage, cursorSize }) => {
    if (customCursorImage) {
        const size = cursorSize || 32;
        console.log("Applying saved custom cursor on page load:", customCursorImage);
        document.body.style.cursor = `url(${customCursorImage}) ${size} ${size}, auto`;
    } else {
        console.log("No custom cursor image found in storage.");
    }
});