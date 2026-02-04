// --- 1. Types & Interfaces ---
interface JobDetails {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  url: string;
}

// --- 2. Helper Functions ---
function getTextContent(selector: string): string | undefined {
  const element = document.querySelector(selector);
  return element ? element.textContent?.trim() : undefined;
}

// --- 3. Job Site Parsers ---
const parsers = {
  linkedin: (): JobDetails => {
    // LinkedIn has multiple layouts (Single job view, Collections, Premium)
    // We try multiple selectors to ensure we catch the data.
    const title = getTextContent('.job-details-jobs-unified-top-card__job-title') || 
                  getTextContent('.jobs-unified-top-card__job-title') ||
                  getTextContent('h1.t-24'); 
                  
    const company = getTextContent('.job-details-jobs-unified-top-card__company-name') || 
                    getTextContent('.jobs-unified-top-card__company-name') ||
                    getTextContent('.job-details-jobs-unified-top-card__company-name a');

    const location = getTextContent('.job-details-jobs-unified-top-card__bullet') || 
                     getTextContent('.jobs-unified-top-card__bullet');
                     
    const salary = getTextContent('.job-details-jobs-unified-top-card__job-insight');

    return { title, company, location, salary, url: window.location.href };
  },
  indeed: (): JobDetails => ({
    title: getTextContent('.jobsearch-JobInfoHeader-title'),
    company: getTextContent('[data-company-name="true"]'),
    location: getTextContent('[data-testid="job-location"]'),
    salary: getTextContent('.js-match-insights-provider-tvvxwd'),
    url: window.location.href,
  }),
  glassdoor: (): JobDetails => ({
    title: getTextContent('[data-test="job-title"]'),
    company: getTextContent('[data-test="employer-name"]'),
    location: getTextContent('[data-test="location"]'),
    salary: getTextContent('[data-test="detailSalary"]'),
    url: window.location.href,
  }),
  greenhouse: (): JobDetails => ({
    title: getTextContent('.app-title'),
    company: getTextContent('.company-name'),
    location: getTextContent('.location'),
    url: window.location.href,
  }),
  lever: (): JobDetails => ({
    title: getTextContent('.posting-headline h2'),
    company: getTextContent('.main-header-text-logo'),
    location: getTextContent('.posting-categories .location'),
    url: window.location.href,
  }),
};

// --- 4. Site Detection ---
function detectJobSite(): keyof typeof parsers | null {
  const host = window.location.hostname;
  if (host.includes('linkedin')) return 'linkedin';
  if (host.includes('indeed')) return 'indeed';
  if (host.includes('glassdoor')) return 'glassdoor';
  if (host.includes('greenhouse')) return 'greenhouse';
  if (host.includes('lever')) return 'lever';
  return null;
}

function extractJobDetails(): JobDetails | null {
  const site = detectJobSite();
  if (!site) return null;
  return parsers[site]();
}

// --- 5. UI: Create the Floating Button ---
function createFloatingButton(job: JobDetails) {
  const btn = document.createElement('button');
  btn.id = 'job-tracker-save-btn';
  btn.textContent = '💼 Save to Tracker';
  // Store title to detect if the button becomes stale (e.g. user switches jobs)
  btn.dataset.jobTitle = job.title; 
  
  // Cyber/Dark Theme Styling
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 99999;
    padding: 12px 24px;
    background: #0f172a;
    color: white;
    border: 1px solid #3b82f6;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  `;

  // Hover Effects
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0)';
  });

  // Click Handler
  btn.addEventListener('click', async () => {
    btn.textContent = '⏳ Saving...';
    btn.disabled = true;

    try {
      // Re-extract data on click to ensure it's fresh
      const freshDetails = extractJobDetails(); 
      const response = await chrome.runtime.sendMessage({
        action: 'saveJob',
        data: freshDetails || job,
      });

      if (response && response.success) {
        btn.textContent = '✅ Saved!';
        btn.style.borderColor = '#22c55e'; // Green
        setTimeout(() => {
            btn.textContent = '💼 Save to Tracker';
            btn.disabled = false;
            btn.style.borderColor = '#3b82f6'; // Back to Blue
        }, 2000);
      } else {
        throw new Error(response?.error || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
      btn.textContent = '❌ Error';
      btn.style.borderColor = '#ef4444'; // Red
      setTimeout(() => {
        btn.textContent = '💼 Save to Tracker';
        btn.disabled = false;
        btn.style.borderColor = '#3b82f6';
      }, 2000);
    }
  });

  document.body.appendChild(btn);
}

// --- 6. Main Logic: Inject or Update Button ---
function tryInjectButton() {
  const job = extractJobDetails();
  
  // A. If no job data found (not on a job page yet), remove any old button
  if (!job || !job.title) {
    const existing = document.getElementById('job-tracker-save-btn');
    if (existing) existing.remove();
    return;
  }

  // B. Check if button already exists
  const existingBtn = document.getElementById('job-tracker-save-btn');
  
  if (existingBtn) {
    // CRITICAL: If button exists but titles don't match, it's stale. Replace it.
    if (existingBtn.dataset.jobTitle !== job.title) {
        existingBtn.remove();
        createFloatingButton(job); 
    }
    return;
  }

  // C. Create fresh button
  createFloatingButton(job);
}

// --- 7. Message Listener (For Popup) ---
// Allows the popup to request job details manually if needed
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'extractJob') {
    const jobDetails = extractJobDetails();
    sendResponse(jobDetails);
  }
  return true;
});

// --- 8. Mutation Observer (LinkedIn SPA Fix) ---
let debounceTimer: number | undefined;
const observer = new MutationObserver((mutations) => {
    // Look specifically for changes inside the LinkedIn job details view
    const isJobDetailMutation = mutations.some(m => 
        m.target instanceof HTMLElement && (
            m.target.classList?.contains('jobs-search__job-details') ||
            m.target.closest?.('.jobs-search__job-details')
        )
    );

    if (isJobDetailMutation || mutations.length > 20) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            console.log('DOM change detected, re-injecting button...');
            tryInjectButton();
        }, 400); 
    }
});

// Observe the main container specifically to catch "silent" content swaps
const mainContent = document.querySelector('main') || document.body;
observer.observe(mainContent, {
    childList: true,
    subtree: true
});

// --- 9. Navigation Listener (The Refresh-Killer) ---
// This triggers when the URL changes without a page reload
window.addEventListener('popstate', () => {
    console.log('URL change detected, re-injecting...');
    setTimeout(tryInjectButton, 500);
});

// Initial run for the first page load
tryInjectButton();