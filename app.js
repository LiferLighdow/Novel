// Lifer_Lighdow原創小說 - 靜態版本
class NovelReader {
    constructor() {
        this.currentView = 'library';
        this.selectedBook = null;
        this.currentChapter = 0;
        this.isDarkMode = false;
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.books = [];
        this.builtInNovels = []; // 內建小說列表
        this.searchTerm = '';
        this.selectedCategory = '全部';
        this.readerSettings = {
            fontSize: 18,
            lineHeight: 1.8,
            fontFamily: 'MyCustomFont, sans-serif',
            maxWidth: 800
        };
        
        this.init();
    }

    async init() {
        this.loadData();
        this.applyReaderSettings();
        await this.loadBuiltInNovels();
        this.bindEvents();
        this.updateTheme();
        this.renderLibrary();

        // Set initial icon state
        const viewToggle = document.getElementById('view-toggle');
        if (viewToggle) {
            console.log('Setting initial view icons.');
            const gridIcon = viewToggle.querySelector('.grid-icon');
            const listIcon = viewToggle.querySelector('.list-icon');
            if (this.viewMode === 'grid') {
                // We are in grid view, show the icon to switch to list
                gridIcon.classList.add('hidden');
                listIcon.classList.remove('hidden');
            } else {
                // We are in list view, show the icon to switch to grid
                gridIcon.classList.remove('hidden');
                listIcon.classList.add('hidden');
            }
        }
    }

    // 載入內建小說
    async loadBuiltInNovels() {
        const novelFiles = ['影夜','暗夜之影','影樂傳奇','夜下浮影','無影之夜','夜影漫舞','影夜之謎','初音之影','影夜聚一','夢','輪迴之夢','覺醒之夢','無盡之夢','錯位的愛恨','背上鬼女兒的戀'];
        
        for (const fileName of novelFiles) {
            try {
                const response = await fetch(`novels/${fileName}.html`);
                if (response.ok) {
                    const htmlContent = await response.text();
                    const novel = this.parseNovelHTML(htmlContent, fileName);
                    if (novel) {
                        this.builtInNovels.push(novel);
                    }
                }
            } catch (error) {
                console.warn(`無法載入內建小說 ${fileName}:`, error);
            }
        }
    }

    // 解析小說HTML文件
    parseNovelHTML(htmlContent, fileName) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            // 從meta標籤或novel-info區塊獲取基本信息
            const title = doc.querySelector('title')?.textContent || 
                         doc.querySelector('.novel-info h1')?.textContent || 
                         fileName.replace('.html', '');
            
            const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || 
                          doc.querySelector('.novel-info .author')?.textContent?.replace('作者：', '') || 
                          '未知作者';
            
            const category = doc.querySelector('meta[name="category"]')?.getAttribute('content') || 
                            doc.querySelector('.novel-info .category')?.textContent?.replace('類別：', '') || 
                            '內建小說';
            
            const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                               doc.querySelector('.novel-info .description')?.textContent || 
                               '';
            
            // 獲取封面圖片
            let cover = doc.querySelector('meta[name="cover"]')?.getAttribute('content') || 
                         doc.querySelector('.novel-info .cover')?.getAttribute('src') || 
                         doc.querySelector('.cover-image')?.getAttribute('src') || 
                         null;

            if (cover && !cover.startsWith('http')) {
                const basePath = fileName.substring(0, fileName.lastIndexOf('/'));
                if (basePath) {
                    cover = `novels/${basePath}/${cover}`;
                } else {
                    cover = `novels/${cover}`;
                }
            }
            
            // 解析章節
            const chapterElements = doc.querySelectorAll('.chapter');
            const chapters = [];
            
            chapterElements.forEach((chapterEl, index) => {
                const chapterTitle = chapterEl.querySelector('h2')?.textContent || `第${index + 1}章`;
                const chapterContent = chapterEl.querySelector('.content')?.innerHTML || '';
                
                chapters.push({
                    id: index + 1,
                    title: chapterTitle,
                    content: chapterContent
                });
            });
            
            return {
                id: `builtin_${Date.now()}_${Math.random()}`,
                title,
                author,
                category,
                description,
                cover,
                chapters,
                isBuiltIn: true,
                fileName
            };
        } catch (error) {
            console.error('解析小說HTML失敗:', error);
            return null;
        }
    }

    // 數據管理
    loadData() {
        try {
            const savedBooks = localStorage.getItem('novel-reader-books');
            const savedSettings = localStorage.getItem('novel-reader-settings');
            const savedTheme = localStorage.getItem('novel-reader-theme');

            if (savedBooks) {
                const parsedBooks = JSON.parse(savedBooks);
                // 驗證數據結構
                if (Array.isArray(parsedBooks)) {
                    this.books = parsedBooks;
                }
            }

            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                if (typeof parsedSettings === 'object' && parsedSettings !== null) {
                    this.readerSettings = { ...this.readerSettings, ...parsedSettings };
                }
            }

            if (savedTheme) {
                const parsedTheme = JSON.parse(savedTheme);
                if (typeof parsedTheme === 'boolean') {
                    this.isDarkMode = parsedTheme;
                }
            }
        } catch (error) {
            console.warn('載入數據時發生錯誤:', error);
            this.showNotification('載入保存的數據失敗，使用默認設定', 'warning');
        }
    }

    saveData() {
        try {
            localStorage.setItem('novel-reader-books', JSON.stringify(this.books));
            localStorage.setItem('novel-reader-settings', JSON.stringify(this.readerSettings));
            localStorage.setItem('novel-reader-theme', JSON.stringify(this.isDarkMode));
        } catch (error) {
            console.warn('無法保存數據到LocalStorage:', error);
            this.showNotification('保存數據失敗，可能是存儲空間不足', 'error');
        }
    }

    // 事件綁定
    bindEvents() {
        // 主題切換
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('reader-theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 視圖切換
        const viewToggleBtn = document.getElementById('view-toggle');
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => {
                console.log('視圖切換按鈕被點擊');
                this.toggleViewMode();
            });
        } else {
            console.error('找不到視圖切換按鈕');
        }

        // 搜尋
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.renderLibrary();
        });

        // 分類篩選（只在初始化時綁定一次，避免重複綁定導致性能問題）
        const categoryFilters = document.getElementById('category-filters');
        if (categoryFilters) {
            categoryFilters.addEventListener('click', (e) => {
                const btn = e.target.closest('.category-btn');
                if (!btn) return;
                this.selectedCategory = btn.dataset.category;
                this.renderCategoryFilters();
                this.renderBooks();
            });
        }

        // 返回書庫
        document.getElementById('back-to-library').addEventListener('click', () => {
            this.showLibrary();
        });

        // 章節導航
        document.getElementById('prev-chapter').addEventListener('click', () => {
            this.prevChapter();
        });

        document.getElementById('next-chapter').addEventListener('click', () => {
            this.nextChapter();
        });

        // 添加書籍
        document.getElementById('add-book-btn').addEventListener('click', () => {
            this.showBookForm();
        });

        // 閱讀器功能按鈕
        document.getElementById('reader-settings-btn').addEventListener('click', () => {
            this.showReaderSettings();
        });

         document.getElementById('chapter-list-btn').addEventListener('click', () => {
            this.showChapterList();
        });

        document.getElementById('bookmark-btn').addEventListener('click', () => {
            this.toggleBookmark();
        });

        // 書庫容器事件代理
        const booksContainer = document.getElementById('books-container');
        if (booksContainer) {
            booksContainer.addEventListener('click', (e) => {
                const bookCard = e.target.closest('[data-book-id]');
                
                // 處理書籍點擊
                if (bookCard && !e.target.closest('.book-actions')) {
                    const bookId = bookCard.dataset.bookId;
                    const isBuiltIn = bookCard.dataset.isBuiltin === 'true';
                    
                    const allBooks = [...this.books, ...this.builtInNovels];
                    const book = allBooks.find(b => b.id == bookId);
                    
                    if (book) {
                        this.showReader(book);
                    }
                    return;
                }

                // 處理編輯按鈕
                if (e.target.closest('.edit-btn')) {
                    const bookElement = e.target.closest('[data-book-id]');
                    const bookId = bookElement.dataset.bookId;
                    const isBuiltIn = bookElement.dataset.isBuiltin === 'true';
                    
                    if (isBuiltIn) {
                        this.showNotification('內建小說無法編輯', 'warning');
                    } else {
                        const book = this.books.find(b => b.id == bookId);
                        if (book) {
                            this.showBookEditor(book);
                        }
                    }
                    return;
                }

                // 處理刪除按鈕
                if (e.target.closest('.delete-btn')) {
                    const bookElement = e.target.closest('[data-book-id]');
                    const bookId = bookElement.dataset.bookId;
                    const isBuiltIn = bookElement.dataset.isBuiltin === 'true';

                    if (isBuiltIn) {
                        this.showNotification('內建小說無法刪除', 'warning');
                    } else {
                        this.confirmAction('確認刪除', `您確定要刪除這本書嗎？此操作無法復原。`, () => {
                            this.deleteBook(bookId);
                        });
                    }
                }
            });
        }
    }

    // 主題管理
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.updateTheme();
        this.saveData();
    }

    updateTheme() {
        const body = document.body;
        const themeButtons = document.querySelectorAll('#theme-toggle, #reader-theme-toggle');
        
        if (this.isDarkMode) {
            body.setAttribute('data-theme', 'dark');
        } else {
            body.removeAttribute('data-theme');
        }

        themeButtons.forEach(btn => {
            const sunIcon = btn.querySelector('.sun-icon');
            const moonIcon = btn.querySelector('.moon-icon');
            
            if (this.isDarkMode) {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            } else {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            }
        });
    }

    // 視圖管理
    showView(viewName) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');
        this.currentView = viewName;
    }

    showLibrary() {
        this.showView('library');
        this.renderLibrary();
    }

    showReader(book, chapterIndex = 0) {
        this.selectedBook = book;
        this.currentChapter = chapterIndex;
        this.showView('reader');
        this.renderReader();
    }

    toggleViewMode() {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        console.log(`[toggleViewMode] View mode changed to: ${this.viewMode}`);
        
        // Re-render the books with the new view mode
        this.renderLibrary();
        
        // Update the toggle button icon
        const viewToggle = document.getElementById('view-toggle');
        const gridIcon = viewToggle.querySelector('.grid-icon');
        const listIcon = viewToggle.querySelector('.list-icon');
        
        if (this.viewMode === 'grid') {
            // View is now a grid, so show the list icon as the action to switch
            console.log('[toggleViewMode] Setting icon to list');
            gridIcon.classList.add('hidden');
            listIcon.classList.remove('hidden');
        } else {
            // View is now a list, so show the grid icon as the action to switch
            console.log('[toggleViewMode] Setting icon to grid');
            gridIcon.classList.remove('hidden');
            listIcon.classList.add('hidden');
        }
    }

    // 書庫渲染
    renderLibrary() {
        this.renderCategoryFilters();
        this.renderBooks();
    }

    renderCategoryFilters() {
        // 合併用戶書籍和內建小說的分類
        const allBooks = [...this.books, ...this.builtInNovels];
        const categories = ['全部', ...new Set(allBooks.map(book => book.category).filter(Boolean))];
        const container = document.getElementById('category-filters');
        container.innerHTML = categories.map(category => `
            <button class="category-btn ${category === this.selectedCategory ? 'active' : ''}" 
                    data-category="${category}">
                ${category}
            </button>
        `).join('');
    }

    renderBooks() {
        console.log(`[renderBooks] Rendering with view mode: ${this.viewMode}`);
        const container = document.getElementById('books-container');
        const filteredBooks = this.getFilteredBooks();
        const allBooks = [...this.books, ...this.builtInNovels];

        container.className = this.viewMode === 'grid' ? 'books-grid' : 'books-list';

        if (allBooks.length === 0) {
            container.innerHTML = `
                <div id="empty-state" class="empty-state" style="grid-column: 1 / -1;">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <h2>歡迎使用Lifer_Lighdow原創小說</h2>
                    <p>您還沒有添加任何書籍。點擊右下角的加號按鈕開始添加您的第一本小說吧！</p>
                </div>
            `;
            return;
        }
        
        if (filteredBooks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <p>找不到符合條件的書籍</p>
                </div>
            `;
            return;
        }
        
        if (this.viewMode === 'grid') {
            container.innerHTML = filteredBooks.map(book => this.createBookCard(book)).join('');
        } else {
            container.innerHTML = filteredBooks.map(book => this.createBookListItem(book)).join('');
        }
    }

    getFilteredBooks() {
        const allBooks = [...this.books, ...this.builtInNovels];
        
        return allBooks.filter(book => {
            const matchesSearch = book.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                                book.author.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesCategory = this.selectedCategory === '全部' || book.category === this.selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }

    createBookCard(book) {
        const defaultCover = this.generateDefaultCover(book.title);
        const isBuiltIn = book.isBuiltIn || false;
        
        return `
            <div class="book-card ${isBuiltIn ? 'builtin-book' : ''}" data-book-id="${book.id}" data-is-builtin="${isBuiltIn}">
                <div class="book-cover">
                    <img src="${book.cover || defaultCover}" alt="${book.title}" 
                         onerror="this.src='${defaultCover}'">
                    ${isBuiltIn ? '<div class="builtin-badge">內建</div>' : ''}
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                    ${book.category ? `<span class="book-category">${book.category}</span>` : ''}
                    <p class="book-chapters">${book.chapters.length} 章節</p>
                </div>
                <div class="book-actions">
                    <button class="btn btn-secondary edit-btn" ${isBuiltIn ? 'disabled title="內建小說無法編輯"' : ''}>
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        編輯
                    </button>
                    <button class="btn btn-secondary delete-btn" ${isBuiltIn ? 'disabled title="內建小說無法刪除"' : ''}>
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        刪除
                    </button>
                </div>
            </div>
        `;
    }

    createBookListItem(book) {
        const defaultCover = this.generateDefaultCover(book.title);
        const isBuiltIn = book.isBuiltIn || false;
        
        return `
            <div class="book-list-item ${isBuiltIn ? 'builtin-book' : ''}" data-book-id="${book.id}" data-is-builtin="${isBuiltIn}">
                <div class="book-list-cover">
                    <img src="${book.cover || defaultCover}" alt="${book.title}" 
                         onerror="this.src='${defaultCover}'">
                    ${isBuiltIn ? '<div class="builtin-badge">內建</div>' : ''}
                </div>
                <div class="book-list-info">
                    <h3 class="book-list-title">${book.title}</h3>
                    <p class="book-list-author">${book.author}</p>
                    <p class="book-list-description">${book.description || `共 ${book.chapters.length} 個章節`}</p>
                </div>
                <div class="book-list-meta">
                    ${book.category ? `<span class="book-category">${book.category}</span>` : ''}
                    <p class="book-chapters">${book.chapters.length} 章節</p>
                    <div class="book-list-actions">
                        <button class="btn-icon edit-btn" ${isBuiltIn ? 'disabled title="內建小說無法編輯"' : ''}>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon delete-btn" ${isBuiltIn ? 'disabled title="內建小說無法刪除"' : ''}>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 閱讀器渲染
    renderReader() {
        if (!this.selectedBook || !this.selectedBook.chapters || !this.selectedBook.chapters[this.currentChapter]) {
            this.showNotification('章節不存在', 'error');
            this.showLibrary();
            return;
        }

        const chapter = this.selectedBook.chapters[this.currentChapter];
        
        // 安全地更新標題
        const elements = {
            'current-book-title': this.selectedBook.title,
            'current-chapter-title': chapter.title,
            'chapter-title': chapter.title,
            'chapter-info': `${this.currentChapter + 1} / ${this.selectedBook.chapters.length}`
        };
        
        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });
        
        // 更新內容
        const contentElement = document.getElementById('chapter-content');
        if (contentElement) {
            contentElement.innerHTML = chapter.content || '<p>此章節內容為空</p>';
        }
        
        // 更新導航按鈕
        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');
        
        if (prevBtn) prevBtn.disabled = this.currentChapter === 0;
        if (nextBtn) nextBtn.disabled = this.currentChapter === this.selectedBook.chapters.length - 1;
        
        // 滾動到頂部
        window.scrollTo(0, 0);
    }

    applyReaderSettings() {
        const root = document.documentElement;
        root.style.setProperty('--reader-font-size', `${this.readerSettings.fontSize}px`);
        root.style.setProperty('--reader-line-height', this.readerSettings.lineHeight);
        root.style.setProperty('--reader-font-family', this.readerSettings.fontFamily);
        root.style.setProperty('--reader-max-width', `${this.readerSettings.maxWidth}px`);
    }
    // 章節導航
    prevChapter() {
        if (this.currentChapter > 0) {
            this.currentChapter--;
            this.renderReader();
        }
    }

    nextChapter() {
        if (this.currentChapter < this.selectedBook.chapters.length - 1) {
            this.currentChapter++;
            this.renderReader();
        }
    }

    goToChapter(chapterIndex) {
        this.currentChapter = chapterIndex;
        this.renderReader();
    }

    // 閱讀進度
    updateReadingProgress() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        // 防止除零錯誤
        const progress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
        const clampedProgress = Math.max(0, Math.min(100, progress));
        
        const progressElement = document.getElementById('reading-progress');
        if (progressElement) {
            progressElement.textContent = `${clampedProgress}%`;
        }
        
        // 保存進度
        if (this.selectedBook) {
            try {
                const progressKey = `progress_${this.selectedBook.id}_${this.currentChapter}`;
                localStorage.setItem(progressKey, JSON.stringify(clampedProgress));
            } catch (error) {
                console.warn('無法保存閱讀進度:', error);
            }
        }
    }

    // 書籤功能
     toggleBookmark() {
        // For now, this just adds a bookmark. A full implementation would check if a bookmark exists and remove it.
        this.addBookmark();
    }
    addBookmark() {
        if (!this.selectedBook || !this.selectedBook.chapters || !this.selectedBook.chapters[this.currentChapter]) {
            this.showNotification('無法添加書籤：章節不存在', 'error');
            return;
        }
        
        const bookmarks = this.getBookmarks(this.selectedBook.id);
        const currentChapter = this.selectedBook.chapters[this.currentChapter];
        const progressElement = document.getElementById('reading-progress');
        
        const newBookmark = {
            id: Date.now(),
            chapterId: currentChapter.id,
            chapterTitle: currentChapter.title,
            chapterIndex: this.currentChapter,
            progress: progressElement ? parseInt(progressElement.textContent) || 0 : 0,
            timestamp: new Date().toISOString()
        };
        
        bookmarks.push(newBookmark);
        
        try {
            localStorage.setItem(`bookmarks_${this.selectedBook.id}`, JSON.stringify(bookmarks));
            this.showNotification('書籤已添加');
        } catch (error) {
            this.showNotification('保存書籤失敗', 'error');
        }
    }

    getBookmarks(bookId) {
        const saved = localStorage.getItem(`bookmarks_${bookId}`);
        return saved ? JSON.parse(saved) : [];
    }

    // 書籍管理
    addBook(bookData) {
        const newBook = {
            id: Date.now(),
            ...bookData,
            chapters: bookData.chapters || []
        };
        
        this.books.push(newBook);
        this.saveData();
        this.renderLibrary();
        
        return newBook;
    }

    updateBook(updatedBook) {
        const index = this.books.findIndex(book => book.id === updatedBook.id);
        if (index !== -1) {
            this.books[index] = updatedBook;
            this.saveData();
            this.renderLibrary();
            
            // 如果正在閱讀這本書，更新當前選中的書籍
            if (this.selectedBook && this.selectedBook.id === updatedBook.id) {
                this.selectedBook = updatedBook;
                this.renderReader();
            }
        }
    }

    deleteBook(bookId) {
        this.books = this.books.filter(book => book.id != bookId);
        this.saveData();
        this.renderLibrary();
        
        // 如果刪除的是正在閱讀的書籍，返回書庫
        if (this.selectedBook && this.selectedBook.id == bookId) {
            this.showLibrary();
        }
        this.showNotification('書籍已刪除');
    }

    // 工具函數
    confirmAction(title, message, onConfirm) {
        const modalContent = `
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <div class="modal-title">${title}</div>
                    <button class="btn-icon" onclick="novelReader.closeModal()">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button id="confirm-cancel-btn" class="btn btn-secondary">取消</button>
                    <button id="confirm-action-btn" class="btn btn-danger">確認</button>
                </div>
            </div>
        `;
        this.showModal(modalContent);

        document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('confirm-action-btn').addEventListener('click', () => {
            onConfirm();
            this.closeModal();
        });
    }
    generateDefaultCover(title) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                return 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="#667eea"/><text x="150" y="200" text-anchor="middle" fill="white" font-size="20" font-family="Arial">${title}</text></svg>`);
            }
            
            // 背景漸變
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b'];
            const color1 = colors[Math.floor(Math.random() * colors.length)];
            const color2 = colors[Math.floor(Math.random() * colors.length)];
            
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 300, 400);
            
            // 添加文字
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px MyCustomFont, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 自動換行 - 修復中文字符處理
            const maxWidth = 260;
            const lineHeight = 35;
            let y = 180;
            
            // 按字符分割，但考慮中文字符
            const chars = Array.from(title);
            let line = '';
            
            for (let i = 0; i < chars.length; i++) {
                const testLine = line + chars[i];
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && line.length > 0) {
                    ctx.fillText(line, 150, y);
                    line = chars[i];
                    y += lineHeight;
                    
                    // 防止文字超出畫布
                    if (y > 350) break;
                } else {
                    line = testLine;
                }
            }
            
            if (line && y <= 350) {
                ctx.fillText(line, 150, y);
            }
            
            return canvas.toDataURL();
        } catch (error) {
            // 如果Canvas失敗，返回SVG fallback
            return 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="#667eea"/><text x="150" y="200" text-anchor="middle" fill="white" font-size="20" font-family="Arial">${title.replace(/[<>&"']/g, '')}</text></svg>`);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: var(--accent-color);
            color: white;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 模態框管理
    showModal(content) {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="modal-overlay">
                ${content}
            </div>
        `;
        
        // 點擊遮罩關閉
        container.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    }

    // 書籍上傳器
    showBookUploader() {
        const modal = `
            <div class="modal" style="width: 90vw; max-width: 800px;">
                <div class="modal-header">
                    <div class="modal-title">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10,9 9,9 8,9"></polyline>
                        </svg>
                        添加新書籍
                    </div>
                    <button class="btn-icon" onclick="novelReader.closeModal()">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <form id="book-upload-form">
                        <div class="form-group">
                            <label class="form-label">書名 *</label>
                            <input type="text" name="title" class="form-input" required placeholder="請輸入書名">
                        </div>
                        <div class="form-group">
                            <label class="form-label">作者 *</label>
                            <input type="text" name="author" class="form-input" required placeholder="請輸入作者名稱">
                        </div>
                        <div class="form-group">
                            <label class="form-label">類別</label>
                            <input type="text" name="category" class="form-input" placeholder="例如：奇幻、科幻、言情等">
                        </div>
                        <div class="form-group">
                            <label class="form-label">作者密碼 *</label>
                            <input type="password" name="password" class="form-input" required placeholder="設定編輯密碼">
                        </div>
                        <div class="form-group">
                            <label class="form-label">封面圖片網址</label>
                            <input type="url" name="cover" class="form-input" placeholder="請輸入圖片網址（可選）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">簡介</label>
                            <textarea name="description" class="form-textarea" rows="3" placeholder="請輸入書籍簡介"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">章節內容</label>
                            <div id="chapters-container">
                                <div class="chapter-input">
                                    <input type="text" placeholder="第一章標題" class="form-input chapter-title" style="margin-bottom: 8px;">
                                    <textarea placeholder="章節內容（支持HTML格式）" class="form-textarea chapter-content" rows="6"></textarea>
                                </div>
                            </div>
                            <button type="button" class="btn btn-secondary" onclick="novelReader.addChapterInput()" style="margin-top: 8px;">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                添加章節
                            </button>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="novelReader.closeModal()">取消</button>
                    <button class="btn btn-primary" onclick="novelReader.submitBookUpload()">創建書籍</button>
                </div>
            </div>
        `;
        
        this.showModal(modal);
    }

    // 舊名稱相容性包裝：部分地方呼叫 showBookForm，但實際實作為 showBookUploader
    showBookForm() {
        this.showBookUploader();
    }

    addChapterInput() {
        const container = document.getElementById('chapters-container');
        const chapterCount = container.children.length + 1;
        
        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'chapter-input';
        chapterDiv.style.marginTop = '16px';
        chapterDiv.innerHTML = `
            <input type="text" placeholder="第${chapterCount}章標題" class="form-input chapter-title" style="margin-bottom: 8px;">
            <textarea placeholder="章節內容（支持HTML格式）" class="form-textarea chapter-content" rows="6"></textarea>
            <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()" style="margin-top: 8px; background: var(--danger-color);">
                刪除章節
            </button>
        `;
        
        container.appendChild(chapterDiv);
    }

    submitBookUpload() {
        const form = document.getElementById('book-upload-form');
        const formData = new FormData(form);
        
        const bookData = {
            title: formData.get('title'),
            author: formData.get('author'),
            category: formData.get('category'),
            password: formData.get('password'),
            cover: formData.get('cover'),
            description: formData.get('description'),
            chapters: []
        };

        // 收集章節數據
        const chapterInputs = document.querySelectorAll('.chapter-input');
        chapterInputs.forEach((input, index) => {
            const title = input.querySelector('.chapter-title').value.trim();
            const content = input.querySelector('.chapter-content').value.trim();
            
            if (title && content) {
                bookData.chapters.push({
                    id: index + 1,
                    title: title,
                    content: content
                });
            }
        });

        if (!bookData.title || !bookData.author || !bookData.password) {
            this.showNotification('請填寫必填欄位', 'error');
            return;
        }

        if (bookData.chapters.length === 0) {
            this.showNotification('請至少添加一個章節', 'error');
            return;
        }

        this.addBook(bookData);
        this.closeModal();
        this.showNotification('書籍創建成功！');
    }

    // 書籍編輯器
    showBookEditor(book) {
        const modal = `
            <div class="modal" style="width: 90vw; max-width: 600px;">
                <div class="modal-header">
                    <div class="modal-title">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        作者驗證
                    </div>
                    <button class="btn-icon" onclick="novelReader.closeModal()">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="password-form">
                        <div class="form-group">
                            <label class="form-label">請輸入作者密碼</label>
                            <input type="password" id="editor-password" class="form-input" placeholder="輸入密碼以編輯此書籍" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="novelReader.closeModal()">取消</button>
                    <button class="btn btn-primary" onclick="novelReader.verifyPassword(${book.id})">確認</button>
                </div>
            </div>
        `;
        
        this.showModal(modal);
    }

    verifyPassword(bookId) {
        const book = this.books.find(b => b.id === bookId);
        const password = document.getElementById('editor-password').value;
        
        if (password === book.password) {
            this.closeModal();
            this.showBookEditForm(book);
        } else {
            this.showNotification('密碼錯誤！', 'error');
        }
    }

    showBookEditForm(book) {
        const chaptersHtml = book.chapters.map((chapter, index) => `
            <div class="chapter-edit" data-chapter-id="${chapter.id}" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <input type="text" value="${chapter.title}" class="form-input chapter-title" style="margin-bottom: 8px;">
                <textarea class="form-textarea chapter-content" rows="6">${chapter.content}</textarea>
                <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()" style="margin-top: 8px; background: var(--danger-color);">
                    刪除章節
                </button>
            </div>
        `).join('');

        const modal = `
            <div class="modal" style="width: 95vw; max-width: 1000px;">
                <div class="modal-header">
                    <div class="modal-title">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        編輯書籍
                    </div>
                    <button class="btn-icon" onclick="novelReader.closeModal()">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <form id="book-edit-form">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div class="form-group">
                                <label class="form-label">書名</label>
                                <input type="text" name="title" class="form-input" value="${book.title}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">作者</label>
                                <input type="text" name="author" class="form-input" value="${book.author}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">類別</label>
                            <input type="text" name="category" class="form-input" value="${book.category || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">封面圖片網址</label>
                            <input type="url" name="cover" class="form-input" value="${book.cover || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">簡介</label>
                            <textarea name="description" class="form-textarea" rows="3">${book.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">章節管理 (${book.chapters.length} 章)</label>
                            <div id="edit-chapters-container">
                                ${chaptersHtml}
                            </div>
                            <button type="button" class="btn btn-secondary" onclick="novelReader.addEditChapterInput()" style="margin-top: 8px;">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                添加新章節
                            </button>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="novelReader.closeModal()">取消</button>
                    <button class="btn btn-primary" onclick="novelReader.submitBookEdit(${book.id})">保存</button>
                </div>
            </div>
        `;
        
        this.showModal(modal);
    }

    addEditChapterInput() {
        const container = document.getElementById('edit-chapters-container');
        const chapterCount = container.children.length + 1;
        
        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'chapter-edit';
        chapterDiv.style.cssText = 'border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 16px;';
        chapterDiv.innerHTML = `
            <input type="text" placeholder="第${chapterCount}章標題" class="form-input chapter-title" style="margin-bottom: 8px;">
            <textarea placeholder="章節內容（支持HTML格式）" class="form-textarea chapter-content" rows="6"></textarea>
            <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()" style="margin-top: 8px; background: var(--danger-color);">
                刪除章節
            </button>
        `;
        
        container.appendChild(chapterDiv);
    }

    submitBookEdit(bookId) {
        const form = document.getElementById('book-edit-form');
        const formData = new FormData(form);
        
        const updatedBook = {
            id: bookId,
            title: formData.get('title'),
            author: formData.get('author'),
            category: formData.get('category'),
            cover: formData.get('cover'),
            description: formData.get('description'),
            password: this.books.find(b => b.id === bookId).password,
            chapters: []
        };

        // 收集章節數據
        const chapterEdits = document.querySelectorAll('.chapter-edit');
        chapterEdits.forEach((edit, index) => {
            const title = edit.querySelector('.chapter-title').value.trim();
            const content = edit.querySelector('.chapter-content').value.trim();
            
            if (title && content) {
                updatedBook.chapters.push({
                    id: index + 1,
                    title: title,
                    content: content
                });
            }
        });

        this.updateBook(updatedBook);
        this.closeModal();
        this.showNotification('書籍更新成功！');
    }

    // 章節列表
    showChapterList() {
        if (!this.selectedBook) return;
        
        const chaptersHtml = this.selectedBook.chapters.map((chapter, index) => `
            <button class="chapter-item ${index === this.currentChapter ? 'active' : ''}" 
                    onclick="novelReader.goToChapter(${index}); novelReader.closeModal();"
                    style="width: 100%; text-align: left; padding: 12px; border: none; background: ${index === this.currentChapter ? 'var(--accent-color)' : 'transparent'}; color: ${index === this.currentChapter ? 'white' : 'var(--text-primary)'}; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: var(--transition);">
                <div style="font-weight: 500;">${chapter.title}</div>
            </button>
        `).join('');

        const modal = `
            <div class="modal" style="width: 90vw; max-width: 500px;">
                <div class="modal-header">
                    <div class="modal-title">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                        章節目錄
                    </div>
                    <button class="btn-icon" onclick="novelReader.closeModal()">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                    ${chaptersHtml}
                </div>
            </div>
        `;
        
        this.showModal(modal);
    }

    // 閱讀設定
    showReaderSettings() {
        const modal = `
            <div class="modal" style="width: 90vw; max-width: 500px;">
                <div class="modal-header">
                    <div class="modal-title">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m11-7a4 4 0 0 0-8 0m8 0a4 4 0 0 1 8 0m-8 14a4 4 0 0 0-8 0m8 0a4 4 0 0 1 8 0"></path>
                        </svg>
                        閱讀設定
                    </div>
                    <button class="btn-icon" onclick="novelReader.closeModal()">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">字體大小: <span id="font-size-value">${this.readerSettings.fontSize}px</span></label>
                        <input type="range" id="font-size-slider" min="11" max="40" value="${this.readerSettings.fontSize}" 
                               oninput="novelReader.updateSetting('fontSize', this.value); document.getElementById('font-size-value').textContent = this.value + 'px'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">行高: <span id="line-height-value">${this.readerSettings.lineHeight}</span></label>
                        <input type="range" id="line-height-slider" min="0.8" max="3.2" step="0.1" value="${this.readerSettings.lineHeight}" 
                               oninput="novelReader.updateSetting('lineHeight', this.value); document.getElementById('line-height-value').textContent = this.value">
                    </div>
                    <div class="form-group">
                        <label class="form-label">字體</label>
                        <select id="font-family-select" class="form-select" onchange="novelReader.updateSetting('fontFamily', this.value)">
                            <option value="MyCustomFont" ${this.readerSettings.fontFamily === 'MyCustomFont' ? 'selected' : ''}>手寫字體</option>
                            <option value="Noto Serif TC" ${this.readerSettings.fontFamily === 'Noto Serif TC' ? 'selected' : ''}>思源宋體</option>
                            <option value="Calligraphy" ${this.readerSettings.fontFamily === 'Calligraphy' ? 'selected' : ''}>書法字體</option>
                            <option value="LXGW Marker Gothic" ${this.readerSettings.fontFamily === 'LXGW Marker Gothic' ? 'selected' : ''}>LXGW Marker Gothic</option>
                            <option value="Times New Roman" ${this.readerSettings.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                            <option value="Inter" ${this.readerSettings.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">最大寬度: <span id="max-width-value">${this.readerSettings.maxWidth}px</span></label>
                        <input type="range" id="max-width-slider" min="600" max="1800" step="50" value="${this.readerSettings.maxWidth}" 
                               oninput="novelReader.updateSetting('maxWidth', this.value); document.getElementById('max-width-value').textContent = this.value + 'px'">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="novelReader.closeModal()">完成</button>
                </div>
            </div>
        `;
        
        this.showModal(modal);
    }

    updateSetting(key, value) {
        this.readerSettings[key] = parseFloat(value) || value;
        this.saveData();
        if (this.currentView === 'reader') {
            this.applyReaderSettings();
        }
    }
}

// 初始化應用
let novelReader;
document.addEventListener('DOMContentLoaded', () => {
    novelReader = new NovelReader();
});

// 添加 CSS 動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .chapter-item:hover {
        background: var(--bg-tertiary) !important;
    }
    .chapter-item.active:hover {
        background: var(--accent-hover) !important;
    }
`;
document.head.appendChild(style);