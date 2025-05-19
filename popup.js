document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const addButton = document.getElementById('add-current');
    const bookmarksList = document.getElementById('bookmarks');
    let bookmarks = [];

    // Load bookmarks from storage
    chrome.storage.sync.get({ bookmarks: [] }, (result) => { // Provide a default value
        bookmarks = result.bookmarks;
        renderBookmarks();
    });

    // Add current tab
    addButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;
            const tab = tabs[0];
            addBookmark(tab.title, tab.url, tab.favIconUrl);
        });
    });

    // Filter bookmarks
    searchInput.addEventListener('input', () => {
        renderBookmarks(searchInput.value.toLowerCase());
    });

    function addBookmark(title, url, favicon) {
        bookmarks.push({ title, url, favicon });
        chrome.storage.sync.set({ bookmarks: bookmarks }, () => { // Ensure bookmarks is passed correctly
            renderBookmarks();

            // Modern success feedback
            const originalContent = addButton.innerHTML;
            addButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Added!
        `;
            addButton.style.backgroundColor = 'var(--primary)';

            setTimeout(() => {
                addButton.innerHTML = originalContent;
                addButton.style.backgroundColor = 'var(--primary)';
            }, 1500);
        });
    }

    function renderBookmarks(filter = '') {
        bookmarksList.innerHTML = '';

        const filtered = filter
            ? bookmarks.filter(b =>
                b.title.toLowerCase().includes(filter) ||
                b.url.toLowerCase().includes(filter)
            )
            : bookmarks;

        if (filtered.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = filter ? 'No matching bookmarks' : 'No bookmarks saved yet';
            bookmarksList.appendChild(emptyState);
            return;
        }

        filtered.forEach((bookmark, index) => {
            const li = document.createElement('li');

            const link = document.createElement('a');
            link.href = bookmark.url;
            link.target = '_blank';

            // Add favicon if available
            if (bookmark.favicon) {
                const favicon = document.createElement('img');
                favicon.src = bookmark.favicon;
                favicon.className = 'favicon';
                favicon.onerror = () => favicon.style.display = 'none';
                link.appendChild(favicon);
            } else {
                // Fallback icon
                const icon = document.createElement('span');
                icon.className = 'default-favicon';
                link.appendChild(icon);
            }

            link.appendChild(document.createTextNode(bookmark.title));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete';
            deleteBtn.dataset.index = index;
            deleteBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;

            li.appendChild(link);
            li.appendChild(deleteBtn);
            bookmarksList.appendChild(li);
        });

        // Add delete event listeners
        document.querySelectorAll('.delete').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(button.dataset.index);
                bookmarks.splice(index, 1);
                chrome.storage.sync.set({ bookmarks: bookmarks }, () => { // Ensure bookmarks is passed correctly
                    renderBookmarks(searchInput.value.toLowerCase());
                });
            });
        });
    }
});