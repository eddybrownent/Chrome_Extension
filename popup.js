document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const searchInput = document.getElementById("search");
  const tabList = document.getElementById("tab-list");
  const newTabButton = document.getElementById("new-tab");
  const tabCount = document.getElementById("tab-count");
  const sessionNameInput = document.getElementById("session-name");
  const saveSessionButton = document.getElementById("save-session");
  const sessionList = document.getElementById("session-list");
  const muteAllTabsButton = document.getElementById("mute-all-tabs");
  const tooltip = document.getElementById("mute-tooltip");
  const muteIcon = document.getElementById("mute-icon");

  let isMuted = false;
  let selectedTabs = [];

  // Event listeners
  searchInput.addEventListener("input", function () {
    const query = searchInput.value.toLowerCase();
    chrome.tabs.query({}, function (tabs) {
      const filteredTabs = tabs.filter((tab) =>
        tab.title.toLowerCase().includes(query)
      );
      renderTabs(filteredTabs);
    });
  });

  newTabButton.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://www.google.com" });
  });

  muteAllTabsButton.addEventListener("click", toggleMuteAllTabs);

  saveSessionButton.addEventListener("click", () => {
    const sessionName = sessionNameInput.value.trim();
    if (sessionName) {
      saveSession(sessionName);
      sessionNameInput.value = "";
    } else {
      alert("Please enter a session name");
    }
  });

  document
    .getElementById("pin-tab")
    .addEventListener("click", togglePinCurrentTab);

  // Initialize  when the extension loads
  initializeMuteState();
  displaySessions();
  fetchTabsAndWindows();

  // Check initial mute state of tabs
  function initializeMuteState() {
    chrome.tabs.query({}, function (tabs) {
      // Check if at least one tab is muted
      isMuted = tabs.some((tab) => tab.mutedInfo && tab.mutedInfo.muted);
      updateTooltip(); // Update tooltip and icon based on initial state
    });
  }

  // Fetch tabs and windows
  function fetchTabsAndWindows() {
    chrome.windows.getAll({ populate: true }, function (windows) {
      const allTabs = [];
      windowCount = windows.length;
      windows.forEach((window) => {
        allTabs.push(...window.tabs);
      });
      console.log("All tabs fetched:", allTabs);
      renderTabs(allTabs);
    });
  }

  // Move and reorder tabs
  function moveTabs(newOrder, targetWindowId) {
    const tabIds = newOrder
      .map((tabId) => parseInt(tabId, 10))
      .filter(Number.isInteger);
    if (tabIds.length === 0) {
      console.error("No valid tab IDs provided for moving.");
      return;
    }

    const moveProperties = targetWindowId
      ? { windowId: targetWindowId, index: -1 }
      : { index: 0 };

    chrome.tabs.move(tabIds, moveProperties, function () {
      if (chrome.runtime.lastError) {
        console.error("Error moving tabs:", chrome.runtime.lastError.message);
      } else {
        console.log("Tabs moved successfully");
        fetchTabsAndWindows(); // Refresh the tab and window list
      }
    });
  }

  // Group the Tabs By window and Domain
  function groupTabsByWindowAndDomain(tabs) {
    const groupedTabs = {};
    tabs.forEach((tab) => {
      if (!groupedTabs[tab.windowId]) {
        groupedTabs[tab.windowId] = {};
      }
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!groupedTabs[tab.windowId][domain]) {
        groupedTabs[tab.windowId][domain] = [];
      }
      groupedTabs[tab.windowId][domain].push(tab);
    });
    return groupedTabs;
  }

  // Render tabs
  function renderTabs(tabs) {
    tabList.innerHTML = "";

    // Count unique windowIds to get the number of open windows
    const uniqueWindows = new Set(tabs.map((tab) => tab.windowId)).size;

    // Display the number of tabs and windows
    tabCount.textContent = `You have ${tabs.length} open ${
      tabs.length === 1 ? "tab" : "tabs"
    } across ${uniqueWindows} open ${
      uniqueWindows === 1 ? "window" : "windows"
    }.`;

    chrome.tabs.query(
      { active: true, currentWindow: true },
      function (activeTabs) {
        // Check if there are active tabs and get the ID of the active tab
        const activeTabId = activeTabs.length > 0 ? activeTabs[0].id : null;
        const groupedTabs = groupTabsByWindowAndDomain(tabs);
        let windowIndex = 1;

        Object.keys(groupedTabs).forEach((windowId) => {
          const windowHeader = document.createElement("h2");
          windowHeader.className =
            "text-lg font-semibold mt-4 mb-2 ml-2 text-blue-600 dark:text-blue-300";
          windowHeader.textContent = `Window: #${windowIndex}`;
          tabList.appendChild(windowHeader);

          Object.keys(groupedTabs[windowId]).forEach((domain) => {
            const domainHeader = document.createElement("h3");
            domainHeader.className =
              "text-md font-semibold mt-2 mb-1 ml-4 text-blue-400 dark:text-blue-200";
            domainHeader.textContent = domain;
            // tabList.appendChild(domainHeader);

            groupedTabs[windowId][domain].forEach((tab) => {
              const tabItem = document.createElement("li");
              tabItem.className = `flex justify-between items-center p-2 rounded mb-2 ml-1 mr-1 cursor-pointer transition duration-150 ${
                tab.id === activeTabId
                  ? "bg-blue-200 border-l-4 border-blue-400"
                  : "bg-blue-50 hover:bg-blue-100"
              }`;
              tabItem.dataset.tabId = tab.id;
              tabItem.dataset.windowId = tab.windowId;

              const tabIcon = document.createElement("img");
              tabIcon.src = tab.favIconUrl || "./icons/www.png";
              tabIcon.alt = tab.title;
              tabIcon.className = "w-8 h-8 mr-2 ml-2";

              const tabTitle = document.createElement("span");
              tabTitle.className =
                "tab-title overflow-hidden text-ellipsis whitespace-nowrap max-w-xs dark:text-white";
              tabTitle.textContent = tab.title;

              // Create the checkbox wrapper
              const checkboxWrapper = document.createElement("div");
              checkboxWrapper.classList.add("absolute", "bottom-1", "left-1");

              // checkbox
              const checkbox = document.createElement("input");
              checkbox.type = "checkbox";
              checkbox.classList.add(
                "form-checkbox",
                "h-3",
                "w-3",
                "text-blue-600"
              );
              checkbox.addEventListener("change", (event) => {
                event.stopPropagation();
                if (event.target.checked) {
                  selectedTabs.push(tab.id);
                } else {
                  selectedTabs = selectedTabs.filter((id) => id !== tab.id);
                }
              });

              // Prevent checkbox click from switching to the tab
              checkbox.addEventListener("click", (event) => {
                event.stopPropagation();
              });

              const closeBtn = document.createElement("button");
              const closeIcon = document.createElement("i");
              closeIcon.className = "fas fa-times";
              closeBtn.className =
                "bg-blue-400 text-white rounded px-2 py-1 hover:bg-red-700 transition duration-200 ml-2";
              closeBtn.appendChild(closeIcon);

              closeBtn.addEventListener("click", (event) => {
                event.preventDefault(); // Prevent the popup from refreshing or closing
                event.stopPropagation(); // Prevent further propagation of the click event

                // Attempt to remove the tab and handle errors if the tab ID is invalid
                chrome.tabs.remove(tab.id, () => {
                  if (chrome.runtime.lastError) {
                    console.warn(
                      "Error removing tab:",
                      chrome.runtime.lastError.message
                    );
                  } else {
                    tabItem.remove(); // Remove the UI element
                    fetchTabsAndWindows(); // Update tab and window count
                  }
                });
              });

              // Check if the tab is in the current window or another window
              tabItem.addEventListener("click", () => {
                chrome.windows.getCurrent(
                  { populate: false },
                  function (currentWindow) {
                    if (currentWindow.id !== tab.windowId) {
                      // Switch to a different window
                      chrome.windows.update(
                        tab.windowId,
                        { focused: true },
                        function () {
                          chrome.tabs.update(tab.id, { active: true });
                          moveTabs([tab.id], tab.windowId);
                        }
                      );
                    } else {
                      // The tab is in the current window, just activate the tab
                      chrome.tabs.update(tab.id, { active: true });
                      moveTabs([tab.id], tab.windowId);
                    }
                  }
                );
              });

              tabItem.appendChild(checkboxWrapper);
              tabItem.appendChild(checkbox);
              tabItem.appendChild(tabIcon);
              tabItem.appendChild(tabTitle);
              tabItem.appendChild(closeBtn);
              tabList.appendChild(tabItem);
            });
          });

          windowIndex++;

          // Initialize sortable for tab reordering
          new Sortable(tabList, {
            animation: 150,
            onEnd: (evt) => {
              const newOrder = Array.from(tabList.children).map((li) =>
                parseInt(li.dataset.tabId, 10)
              );
              moveTabs(newOrder);
            },
          });
        });
      }
    );
  }

  // Save session to storage
  function saveSession(sessionName) {
    chrome.tabs.query({}, function (tabs) {
      const sessionData = tabs.map((tab) => tab.url);
      chrome.storage.local.get({ savedSessions: [] }, function (result) {
        const savedSessions = result.savedSessions;
        savedSessions.push({ name: sessionName, tabs: sessionData });
        chrome.storage.local.set({ savedSessions }, function () {
          displaySessions();
        });
      });
    });
  }

  // fuction to Restore a saved session
  function restoreSession(tabs) {
    chrome.windows.create({ url: tabs });
  }

  // function to handle saved sessions
  function displaySessions() {
    chrome.storage.local.get("savedSessions", function (result) {
      const savedSessions = result.savedSessions || [];
      sessionList.innerHTML = "";
      savedSessions.forEach((session, index) => {
        const sessionItem = document.createElement("li");
        sessionItem.className =
          "flex justify-between items-center bg-blue-50 p-2 rounded mb-2";
        const sessionTitle = document.createElement("span");
        sessionTitle.className = "text-gray-900 dark:text-gray-100";
        sessionTitle.textContent = session.name;

        const restoreBtn = document.createElement("button");
        const restoreIcon = document.createElement("i");
        restoreIcon.className = "fa-solid fa-undo";
        restoreBtn.className =
          "bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-700 transition duration-200 ml-2";
        restoreBtn.appendChild(restoreIcon);
        restoreBtn.addEventListener("click", () => {
          restoreSession(session.tabs);
        });

        const deleteBtn = document.createElement("button");
        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fa-solid fa-trash-can";
        deleteBtn.className =
          "bg-red-500 text-white rounded px-2 py-1 hover:bg-red-700 transition duration-200 ml-2";
        deleteBtn.appendChild(deleteIcon);
        deleteBtn.addEventListener("click", () => {
          savedSessions.splice(index, 1);
          chrome.storage.local.set({ savedSessions }, displaySessions);
        });

        sessionItem.appendChild(sessionTitle);
        sessionItem.appendChild(restoreBtn);
        sessionItem.appendChild(deleteBtn);
        sessionList.appendChild(sessionItem);
      });
    });
  }

  // Function to mute/unmute all tabs
  function toggleMuteAllTabs() {
    isMuted = !isMuted; // Toggle mute state

    chrome.tabs.query({}, function (tabs) {
      tabs.forEach((tab) => {
        chrome.tabs.update(tab.id, { muted: isMuted }); // Mute/unmute all tabs
      });
      updateTooltip(); // Update tooltip after muting/unmuting
    });
  }

  // Update the mutetooltip dynamically based on mute/unmute state
  function updateTooltip() {
    tooltip.textContent = isMuted ? "Unmute all tabs" : "Mute all tabs";
    muteIcon.classList.toggle("fa-volume-mute", !isMuted);
    muteIcon.classList.toggle("fa-volume-high", isMuted);
  }

  // Pin/unpin current tab
  function togglePinCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      chrome.tabs.update(
        currentTab.id,
        { pinned: !currentTab.pinned },
        function (updatedTab) {
          const pinBtn = document.getElementById("pin-tab");
          const tooltip = pinBtn.querySelector("span");
          tooltip.textContent = updatedTab.pinned
            ? "Unpin the current tab"
            : "Pin the current tab";
        }
      );
    });
  }

  // Close all tabs in the current window
  document
    .getElementById("close-selected-tabs")
    .addEventListener("click", () => {
      // Close only the selected tabs
      if (selectedTabs.length > 0) {
        // Close the selected tabs by their IDs
        chrome.tabs.remove(selectedTabs, () => {
          // Optionally, you could clear the selectedTabs array here
          selectedTabs = []; // Clear the selected tabs after closing them
          // Fetch updated windows and tabs after closing
          chrome.windows.getAll({ populate: true }, function (windows) {
            const allTabs = [];
            windowCount = windows.length; // Update window count here
            windows.forEach((window) => {
              allTabs.push(...window.tabs);
            });
            renderTabs(allTabs); // Refresh the tab list
            fetchTabsAndWindows();
          });
        });
      } else {
        // show a message if no tabs are selected
        console.log("No tabs selected to close.");
      }
    });
});
