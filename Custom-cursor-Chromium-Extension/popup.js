import dotenv from 'dotenv';
dotenv.config();

document.addEventListener('DOMContentLoaded', () => {
    const addCursorBtn = document.getElementById('addCursorBtn');
    const fileInput = document.getElementById('fileInput');
    const removeBgCheckbox = document.getElementById('removeBgCheckbox');
    const uploadsContainer = document.getElementById('uploadsContainer');
    const sizeSlider = document.getElementById('sizeSlider');
    const sizeValue = document.getElementById('sizeValue');

    const loadUploadedCursors = () => {
        chrome.storage.local.get('uploadedCursors', (result) => {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving cursors:", chrome.runtime.lastError);
                uploadsContainer.innerHTML = '<p>Failed to load uploaded cursors.</p>';
                return;
            }

            const uploadedCursors = result.uploadedCursors || [];
            console.log("Uploaded cursors retrieved:", uploadedCursors); // Debugging log
            uploadsContainer.innerHTML = ''; // Clear existing content

            if (uploadedCursors.length === 0) {
                uploadsContainer.innerHTML = '<p>No uploaded cursors yet.</p>';
                return;
            }

            uploadedCursors.forEach((cursor, index) => {
                const cursorItem = document.createElement('div');
                cursorItem.className = 'cursor-item';
                cursorItem.innerHTML = `
                    <img src="${cursor}" alt="Cursor ${index + 1}" class="cursor-preview" />
                    <button class="apply-btn" data-index="${index}">Apply</button>
                `;
                uploadsContainer.appendChild(cursorItem);
            });

            // Add event listeners to "Apply" buttons
            document.querySelectorAll('.apply-btn').forEach((button) => {
                button.addEventListener('click', (e) => {
                    const index = e.target.dataset.index;
                    const selectedCursor = uploadedCursors[index];
                    chrome.storage.local.set({ customCursorImage: selectedCursor }, () => {
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            chrome.tabs.sendMessage(tabs[0].id, { action: "applyCursor", imageData: selectedCursor });
                        });
                        alert("Cursor applied! Refresh the page to see the changes.");
                    });
                });
            });
        });
    };

    addCursorBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                let base64Image;

                if (removeBgCheckbox.checked) {
                    // Remove background using remove.bg API
                    const formData = new FormData();
                    formData.append("size", "auto");
                    formData.append("image_file", file);

                    const API_KEY = process.env.REMOVE_BG_API_KEY;

                    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
                        method: "POST",
                        headers: { "X-Api-Key": API_KEY },
                        body: formData,
                    });

                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        base64Image = `data:image/png;base64,${btoa(
                            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
                        )}`;
                    } else {
                        const errorText = await response.text();
                        console.error(`Failed to remove background: ${response.status}: ${errorText}`);
                        alert(`Failed to remove background: ${response.status}: ${errorText}`);
                        return;
                    }
                } else {
                    // Convert file to Base64 without removing background
                    const reader = new FileReader();
                    base64Image = await new Promise((resolve) => {
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(file);
                    });
                }

                // Save the processed image
                chrome.storage.local.get('uploadedCursors', (result) => {
                    const uploadedCursors = result.uploadedCursors || [];
                    uploadedCursors.push(base64Image);
                    chrome.storage.local.set({ uploadedCursors }, () => {
                        if (chrome.runtime.lastError) {
                            console.error("Error saving cursor:", chrome.runtime.lastError);
                        } else {
                            console.log('Cursor image uploaded and saved.');
                            loadUploadedCursors(); // Refresh the list
                        }
                        alert("Cursor uploaded! Refresh the page to see the changes.");
                    });
                });
            } catch (error) {
                console.error("Failed to process the image:", error);
                alert("Failed to process the image. Please try again.");
            }
        }
    });

    // Handle size slider change
    sizeSlider.addEventListener('input', (event) => {
        const size = event.target.value;
        sizeValue.textContent = `${size}px`;
        chrome.storage.local.set({ cursorSize: size }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "updateCursorSize", size });
            });
        });
    });

    // Load uploaded cursors and size on popup load
    loadUploadedCursors();
    chrome.storage.local.get('cursorSize', (result) => {
        const size = result.cursorSize || 32;
        sizeSlider.value = size;
        sizeValue.textContent = `${size}px`;
    });
});