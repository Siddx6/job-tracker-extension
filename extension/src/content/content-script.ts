interface JobDetails {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  url: string;
}

function getTextContent(selector: string): string | undefined {
  const element = document.querySelector(selector);
  return element ? element.textContent?.trim() : undefined;
}

// Job site parsers
const parsers = {
  linkedin: (): JobDetails => {
    const title = getTextContent('.job-details-jobs-unified-top-card__job-title') ||
                  getTextContent('.jobs-unified-top-card__job-title');
    const company = getTextContent('.job-details-jobs-unified-top-card__company-name') ||
                    getTextContent('.jobs-unified-top-card__company-name');
    const location = getTextContent('.job-details-jobs-unified-top-card__bullet') ||
                     getTextContent('.jobs-unified-top-card__bullet');
    const salary = getTextContent('.job-details-jobs-unified-top-card__job-insight');

    return {
      title,
      company,
      location,
      salary,
      url: window.location.href,
    };
  },

  indeed: (): JobDetails => {
    return {
      title: getTextContent('.jobsearch-JobInfoHeader-title'),
      company: getTextContent('[data-company-name="true"]'),
      location: getTextContent('[data-testid="job-location"]'),
      salary: getTextContent('.js-match-insights-provider-tvvxwd'),
      url: window.location.href,
    };
  },

  glassdoor: (): JobDetails => {
    return {
      title: getTextContent('[data-test="job-title"]'),
      company: getTextContent('[data-test="employer-name"]'),
      location: getTextContent('[data-test="location"]'),
      salary: getTextContent('[data-test="detailSalary"]'),
      url: window.location.href,
    };
  },

  greenhouse: (): JobDetails => {
    return {
      title: getTextContent('.app-title'),
      company: getTextContent('.company-name'),
      location: getTextContent('.location'),
      url: window.location.href,
    };
  },

  lever: (): JobDetails => {
    return {
      title: getTextContent('.posting-headline h2'),
      company: getTextContent('.main-header-text-logo'),
      location: getTextContent('.posting-categories .location'),
      url: window.location.href,
    };
  },
};

function detectJobSite(): keyof typeof parsers | null {
  const hostname = window.location.hostname;

  if (hostname.includes('linkedin.com')) return 'linkedin';
  if (hostname.includes('indeed.com')) return 'indeed';
  if (hostname.includes('glassdoor.com')) return 'glassdoor';
  if (hostname.includes('greenhouse.io')) return 'greenhouse';
  if (hostname.includes('lever.co')) return 'lever';

  return null;
}

function extractJobDetails(): JobDetails | null {
  const site = detectJobSite();
  if (!site) return null;

  return parsers[site]();
}

function isJobPage(): boolean {
  const url = window.location.href;
  const hostname = window.location.hostname;

  if (hostname.includes('linkedin.com')) {
    return url.includes('/jobs/view/');
  }
  if (hostname.includes('indeed.com')) {
    return url.includes('/viewjob');
  }
  if (hostname.includes('glassdoor.com')) {
    return url.includes('/job-listing/');
  }
  if (hostname.includes('greenhouse.io')) {
    return url.includes('/jobs/');
  }
  if (hostname.includes('lever.co')) {
    return url.includes('/jobs/');
  }

  return false;
}

function removeButton(): void {
  const existingButton = document.querySelector('#job-tracker-save-btn');
  if (existingButton) {
    existingButton.remove();
  }
}

function injectSaveButton(): void {
  const site = detectJobSite();
  if (!site) {
    removeButton();
    return;
  }

  if (!isJobPage()) {
    removeButton();
    return;
  }

  if (document.querySelector('#job-tracker-save-btn')) return;

  setTimeout(() => {
    const jobDetails = extractJobDetails();
    if (!jobDetails || !jobDetails.title) {
      removeButton();
      return;
    }

    const button = document.createElement('button');
    button.id = 'job-tracker-save-btn';
    button.textContent = '💼 Save to Tracker';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      padding: 12px 24px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = '#0052a3';
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#0066cc';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = '⏳ Saving...';

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'saveJob',
          data: extractJobDetails(),
        });

        if (response.success) {
          button.textContent = '✅ Saved!';
          button.style.background = '#28a745';
          setTimeout(() => {
            button.textContent = '💼 Save to Tracker';
            button.style.background = '#0066cc';
            button.disabled = false;
          }, 2000);
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        button.textContent = '❌ Error';
        button.style.background = '#dc3545';
        console.error('Failed to save job:', error);
        setTimeout(() => {
          button.textContent = '💼 Save to Tracker';
          button.style.background = '#0066cc';
          button.disabled = false;
        }, 2000);
      }
    });

    document.body.appendChild(button);
  }, 500);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'extractJob') {
    const jobDetails = extractJobDetails();
    sendResponse(jobDetails);
  }
  return true;
});

let lastUrl = window.location.href;

function checkForNavigation(): void {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log('🎯 Navigation detected:', currentUrl);
    removeButton();
    setTimeout(() => {
      injectSaveButton();
    }, 1000);
  }
}

const originalPushState = history.pushState.bind(history);
const originalReplaceState = history.replaceState.bind(history);

history.pushState = function(data: any, unused: string, url?: string | URL | null) {
  originalPushState(data, unused, url);
  checkForNavigation();
};

history.replaceState = function(data: any, unused: string, url?: string | URL | null) {
  originalReplaceState(data, unused, url);
  checkForNavigation();
};

window.addEventListener('popstate', checkForNavigation);

const observer = new MutationObserver(() => {
  checkForNavigation();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

setInterval(checkForNavigation, 2000);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(injectSaveButton, 1000);
  });
} else {
  setTimeout(injectSaveButton, 1000);
}

console.log('🎯 Job Tracker: Content script loaded');