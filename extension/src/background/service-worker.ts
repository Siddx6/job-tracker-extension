import { apiClient } from '../api/client';

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'saveJob') {
    handleSaveJob(message.data)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (message.action === 'checkAuth') {
    checkAuth()
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ authenticated: false, error: error.message }));
    return true;
  }

  return false;
});

async function handleSaveJob(jobData: any) {
  try {
    // Check if user is authenticated
    const token = await apiClient.getToken();
    if (!token) {
      return {
        success: false,
        error: 'Please log in first',
        requiresAuth: true,
      };
    }

    // Create job application
    const job = await apiClient.createJob({
      title: jobData.title || 'Unknown Title',
      company: jobData.company || 'Unknown Company',
      location: jobData.location,
      salary: jobData.salary,
      url: jobData.url,
    });

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Job Saved!',
      message: `${job.title} at ${job.company}`,
    });

    return { success: true, job };
  } catch (error: any) {
    console.error('Error saving job:', error);
    return { success: false, error: error.message };
  }
}

async function checkAuth() {
  try {
    const token = await apiClient.getToken();
    if (!token) {
      return { authenticated: false };
    }

    await apiClient.getMe();
    return { authenticated: true };
  } catch (error) {
    await apiClient.clearToken();
    return { authenticated: false };
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Job Tracker Extension installed');
});