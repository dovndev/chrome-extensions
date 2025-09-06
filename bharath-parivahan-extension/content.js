// Simplified Content Script for DL Slot Booking
(function() {
    'use strict';
    
    console.log('DL Slot Booking Extension loaded');
    
    // Initialize extension
    init();
    
    function init() {
        addStyles();
        chrome.runtime.onMessage.addListener(handleMessage);
        
        // DL slot booking specific setup
        if (window.location.href.includes('dlslotbook.do')) {
            setupDLSlotBooking();
        }
    }
    
    
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .dl-ext-highlight {
                border: 3px solid #ff6b6b !important;
                background-color: rgba(255, 107, 107, 0.2) !important;
                transition: all 0.3s ease !important;
            }
            
            .dl-ext-tooltip {
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                background: #333 !important;
                color: white !important;
                padding: 10px 15px !important;
                border-radius: 5px !important;
                font-size: 14px !important;
                z-index: 10000 !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    function handleMessage(request, sender, sendResponse) {
        console.log('Received message:', request);
        
        switch(request.action) {
            case 'triggerTimeBasedClick':
                handleTimeBasedSubmission(request.targetTime);
                sendResponse({status: 'Time-based action triggered'});
                break;
                
            case 'fillDLForm':
                fillDLFormData();
                sendResponse({status: 'Form filled'});
                break;
                
            default:
                sendResponse({status: 'Unknown action'});
        }
    }
    
    function setupDLSlotBooking() {
        console.log('Setting up DL slot booking automation');
        showTooltip('🎯 DL Slot Booking automation active!');
    }
    
    function handleTimeBasedSubmission(targetTime) {
        console.log(`Time-based submission triggered at ${targetTime}`);
        showTooltip(`🕘 ${targetTime} - Starting DL slot booking process...`);
        
        // Step 1: Submit the main form
        submitDLForm();
    }
    
    function submitDLForm() {
        const submitButton = document.querySelector('input[value="SUBMIT"], button[type="submit"]');
        
        if (submitButton && !submitButton.disabled) {
            if (checkFormFields()) {
                console.log('Submitting DL form');
                highlightElement(submitButton);
                
                setTimeout(() => {
                    submitButton.click();
                    showTooltip('✅ Form submitted!');
                    
                    // Wait for next page and handle vehicle selection
                    setTimeout(() => {
                        handleVehicleSelection();
                    }, 3000);
                }, 1000);
            } else {
                showTooltip('⚠️ Please fill required fields and captcha');
            }
        } else {
            showTooltip('❌ Submit button not found');
        }
    }
    
    function checkFormFields() {
        const appField = document.querySelector('input[name*="application" i]');
        const dobField = document.querySelector('input[name*="birth" i]');
        const captchaField = document.querySelector('input[name*="captcha" i]');
        
        console.log('Checking form fields:');
        console.log('App Number:', appField?.value || 'Empty');
        console.log('DOB:', dobField?.value || 'Empty');
        console.log('Captcha:', captchaField?.value || 'Empty');
        
        // Return true if fields have values
        return (appField?.value && dobField?.value && captchaField?.value);
    }
    
    function handleVehicleSelection() {
        console.log('Handling vehicle class selection');
        showTooltip('🚗 Selecting vehicle classes...');
        
        setTimeout(() => {
            // Find and check vehicle class checkboxes
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            let checkedAny = false;
            
            checkboxes.forEach(checkbox => {
                const parentText = checkbox.closest('tr, td')?.textContent?.toUpperCase() || '';
                
                if (parentText.includes('LIGHT MOTOR VEHICLE') || 
                    parentText.includes('MOTOR CYCLE') ||
                    parentText.includes('LMV') ||
                    parentText.includes('MCWG')) {
                    
                    if (!checkbox.checked) {
                        console.log('Checking:', parentText);
                        highlightElement(checkbox);
                        
                        setTimeout(() => {
                            checkbox.click();
                            checkedAny = true;
                        }, 500);
                    }
                }
            });
            
            if (checkedAny) {
                // Wait for checkboxes to be selected, then proceed
                setTimeout(() => {
                    clickProceedButton();
                }, 2000);
            } else {
                showTooltip('⚠️ No vehicle checkboxes found');
            }
        }, 1000);
    }
    
    function clickProceedButton() {
        const proceedButton = document.querySelector('input[value*="PROCEED" i], button:contains("PROCEED")');
        
        if (proceedButton && !proceedButton.disabled) {
            console.log('Clicking proceed button');
            highlightElement(proceedButton);
            
            setTimeout(() => {
                proceedButton.click();
                showTooltip('✅ Proceeding to slot selection!');
                
                // Set up slot selection monitoring
                setTimeout(() => {
                    monitorSlotSelection();
                }, 3000);
            }, 1000);
        } else {
            showTooltip('⚠️ Proceed button not found - retrying...');
            setTimeout(() => {
                clickProceedButton();
            }, 2000);
        }
    }
    
    function monitorSlotSelection() {
        console.log('Monitoring for available slots');
        showTooltip('🎯 Looking for available slots...');
        
        // Check for available slots every few seconds
        const slotChecker = setInterval(() => {
            const slots = document.querySelectorAll('input[type="radio"], .available-slot, td:contains("Available")');
            
            if (slots.length > 0) {
                console.log(`Found ${slots.length} potential slots`);
                
                // Try to select first available slot
                slots.forEach(slot => {
                    if (slot.type === 'radio' && !slot.checked) {
                        console.log('Selecting slot:', slot);
                        highlightElement(slot);
                        slot.click();
                        
                        showTooltip('✅ Slot selected! Please complete booking manually.');
                        clearInterval(slotChecker);
                        return;
                    }
                });
            }
        }, 2000);
        
        // Stop checking after 2 minutes
        setTimeout(() => {
            clearInterval(slotChecker);
            showTooltip('ℹ️ Slot monitoring stopped. Continue manually if needed.');
        }, 120000);
    }
    
    function fillDLFormData() {
        console.log('Filling DL form with sample data');
        showTooltip('📝 Filling form...');
        
        // Fill Application Number
        const appField = document.querySelector('input[name*="application" i]');
        if (appField && !appField.value) {
            appField.value = '2712270625';
            appField.dispatchEvent(new Event('input', { bubbles: true }));
            highlightElement(appField);
        }
        
        // Fill Date of Birth
        const dobField = document.querySelector('input[name*="birth" i]');
        if (dobField && !dobField.value) {
            dobField.value = '25-03-1969';
            dobField.dispatchEvent(new Event('input', { bubbles: true }));
            highlightElement(dobField);
        }
        
        // Highlight captcha field for manual entry
        const captchaField = document.querySelector('input[name*="captcha" i]');
        if (captchaField) {
            highlightElement(captchaField);
            showTooltip('⚠️ Please enter captcha manually');
        } else {
            showTooltip('✅ Form filled (except captcha)');
        }
    }
    
    function highlightElement(element) {
        if (!element) return;
        
        element.classList.add('dl-ext-highlight');
        
        setTimeout(() => {
            element.classList.remove('dl-ext-highlight');
        }, 3000);
    }
    
    function showTooltip(message) {
        // Remove existing tooltip
        const existing = document.querySelector('.dl-ext-tooltip');
        if (existing) existing.remove();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'dl-ext-tooltip';
        tooltip.textContent = message;
        
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.remove();
        }, 5000);
    }
    
})();
