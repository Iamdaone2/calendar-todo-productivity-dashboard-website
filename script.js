// Global variables
let currentDate = new Date();
let currentView = 'month';
let selectedDate = null;
let allTasks = {};

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    loadAllTasks();
    setGreeting();
    setQuote();
    setupTodoList();
    updateTotalCompletedDisplay();
    setupThemeToggle();
    setupResetTotalCompleted();
    setupPomodoro();
    setupCalendar();
    updateClock();
    setInterval(updateClock, 1000);
});

// Load all tasks from storage
function loadAllTasks() {
    const stored = localStorage.getItem('allTasks');
    if (stored) {
        allTasks = JSON.parse(stored);
    }
    
    // Load today's tasks for the main todo list
    const today = getToday();
    if (allTasks[today]) {
        const taskList = document.getElementById("task-list");
        taskList.innerHTML = "";
        allTasks[today].forEach(task => {
            addTaskToList(task.text, task.completed, task.reminderTime);
        });
    }
    updateDailyStats();
}

// Save all tasks to storage
function saveAllTasks() {
    localStorage.setItem('allTasks', JSON.stringify(allTasks));
}

// Get today's date string
function getToday() {
    return new Date().toISOString().split('T')[0];
}

// Update greeting based on time
function setGreeting() {
    const greeting = document.getElementById("greeting");
    const hour = new Date().getHours();
    if (hour < 12) {
        greeting.textContent = "Good Morning ☀️";
    } else if (hour < 18) {
        greeting.textContent = "Good Afternoon 🌤️";
    } else {
        greeting.textContent = "Good Evening 🌙";
    }
}

// Live clock
function updateClock() {
    const clock = document.getElementById("clock");
    const now = new Date();
    clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Random motivational quote
function setQuote() {
    const quotes = [
        "Don't watch the clock; do what it does. Keep going.",
        "Success is the sum of small efforts repeated day in and day out.",
        "The way to get started is to quit talking and begin doing.",
        "Stay focused, go after your dreams and keep moving toward your goals.",
        "You don't have to be great to start, but you have to start to be great."
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById("quote").textContent = quote;
}

// Setup todo list for today
function setupTodoList() {
    const addTaskBtn = document.getElementById("add-task");
    const taskInput = document.getElementById("new-task");

    addTaskBtn.addEventListener("click", () => {
        const taskText = taskInput.value.trim();
        const taskTime = document.getElementById("task-time").value;
        if (taskText === "") return;

        const today = getToday();
        let fullReminderTime = null;
        if (taskTime) {
            fullReminderTime = `${today}T${taskTime}`;
        }

        addTask(today, taskText, false, fullReminderTime);
        taskInput.value = "";
        document.getElementById("task-time").value = "";
    });
}

// Add task to a specific date
function addTask(dateStr, text, completed = false, reminderTime = null) {
    if (!allTasks[dateStr]) {
        allTasks[dateStr] = [];
    }
    
    const task = { text, completed, reminderTime };
    allTasks[dateStr].push(task);
    
    // If it's today's task, add to the main list
    if (dateStr === getToday()) {
        addTaskToList(text, completed, reminderTime);
    }
    
    saveAllTasks();
    renderCalendar();
    updateDailyStats();
}

// Add task to the DOM list
function addTaskToList(text, completed = false, reminderTime = null) {
    const taskList = document.getElementById("task-list");
    const li = document.createElement("li");
    
    if (completed) li.classList.add("completed");

    const taskSpan = document.createElement("span");
    taskSpan.textContent = text;
    taskSpan.style.cursor = "pointer";
    
    taskSpan.addEventListener("click", () => {
        li.classList.toggle("completed");
        const today = getToday();
        const taskIndex = [...taskList.children].indexOf(li);
        if (allTasks[today] && allTasks[today][taskIndex]) {
            allTasks[today][taskIndex].completed = li.classList.contains("completed");
            saveAllTasks();
            updateDailyStats();
        }
    });

    if (reminderTime) {
        const dueDateSpan = document.createElement("span");
        const date = new Date(reminderTime);
        if (!isNaN(date.getTime())) {
            dueDateSpan.textContent = ` 🕒 ${date.toLocaleTimeString([], { timeStyle: "short" })}`;
            dueDateSpan.style.fontSize = "0.85rem";
            dueDateSpan.style.color = "#777";
            dueDateSpan.style.marginLeft = "10px";
            taskSpan.appendChild(dueDateSpan);
        }
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✖";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const today = getToday();
        const taskIndex = [...taskList.children].indexOf(li);
        if (allTasks[today] && allTasks[today][taskIndex]) {
            allTasks[today].splice(taskIndex, 1);
            saveAllTasks();
        }
        taskList.removeChild(li);
        updateDailyStats();
        renderCalendar();
    });

    li.appendChild(taskSpan);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
}

// Update daily stats
function updateDailyStats() {
    const today = getToday();
    const todayTasks = allTasks[today] || [];
    const completedCount = todayTasks.filter(task => task.completed).length;
    document.getElementById("daily-stats").textContent = `Tasks completed today: ${completedCount}`;
}

// Setup calendar
function setupCalendar() {
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else {
            currentDate.setFullYear(currentDate.getFullYear() - 1);
        }
        renderCalendar();
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
            currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
        renderCalendar();
    });

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            
            if (currentView === 'month') {
                document.getElementById('month-view').style.display = 'block';
                document.getElementById('year-view').style.display = 'none';
            } else {
                document.getElementById('month-view').style.display = 'none';
                document.getElementById('year-view').style.display = 'block';
            }
            
            renderCalendar();
        });
    });

    // Modal setup
    const modal = document.getElementById('taskModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.getElementById('modal-add-task').addEventListener('click', () => {
        const taskText = document.getElementById('modal-task-input').value.trim();
        const taskTime = document.getElementById('modal-task-time').value;
        
        if (taskText && selectedDate) {
            let fullReminderTime = null;
            if (taskTime) {
                fullReminderTime = `${selectedDate}T${taskTime}`;
            }
            
            addTask(selectedDate, taskText, false, fullReminderTime);
            document.getElementById('modal-task-input').value = '';
            document.getElementById('modal-task-time').value = '';
            updateModalTaskList();
        }
    });

    renderCalendar();
}

// Render calendar
function renderCalendar() {
    if (currentView === 'month') {
        renderMonthView();
    } else {
        renderYearView();
    }
}

// Render month view
function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('calendar-title').textContent = 
        new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    // Calendar days
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (date.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();

        const dayTasks = document.createElement('div');
        dayTasks.className = 'day-tasks';

        const dateStr = date.toISOString().split('T')[0];
        const tasks = allTasks[dateStr] || [];
        
        tasks.slice(0, 3).forEach(task => {
            const dot = document.createElement('span');
            dot.className = 'task-dot';
            if (task.completed) dot.classList.add('completed');
            dayTasks.appendChild(dot);
        });

        if (tasks.length > 3) {
            const more = document.createElement('span');
            more.textContent = `+${tasks.length - 3}`;
            more.style.fontSize = '0.7rem';
            more.style.color = '#666';
            dayTasks.appendChild(more);
        }

        dayElement.appendChild(dayNumber);
        dayElement.appendChild(dayTasks);

        dayElement.addEventListener('click', () => {
            selectedDate = dateStr;
            openTaskModal(date, tasks);
        });

        grid.appendChild(dayElement);
    }
}

// Render year view
function renderYearView() {
    const year = currentDate.getFullYear();
    document.getElementById('calendar-title').textContent = year;

    const yearGrid = document.getElementById('year-grid');
    yearGrid.innerHTML = '';

    for (let month = 0; month < 12; month++) {
        const monthElement = document.createElement('div');
        monthElement.className = 'month-mini';

        const monthTitle = document.createElement('div');
        monthTitle.className = 'month-mini-title';
        monthTitle.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });

        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-mini-grid';

        // Add day headers
        const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.textContent = day;
            header.style.fontWeight = 'bold';
            header.style.fontSize = '0.6rem';
            monthGrid.appendChild(header);
        });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // Generate mini calendar days
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'month-mini-day';
            
            if (date.getMonth() === month) {
                dayElement.textContent = date.getDate();
                
                const dateStr = date.toISOString().split('T')[0];
                const tasks = allTasks[dateStr] || [];
                
                if (tasks.length > 0) {
                    dayElement.classList.add('has-tasks');
                }
            }
            
            monthGrid.appendChild(dayElement);
        }

        monthElement.appendChild(monthTitle);
        monthElement.appendChild(monthGrid);

        // Click to go to month view
        monthElement.addEventListener('click', () => {
            currentDate = new Date(year, month, 1);
            currentView = 'month';
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-view="month"]').classList.add('active');
            document.getElementById('month-view').style.display = 'block';
            document.getElementById('year-view').style.display = 'none';
            renderCalendar();
        });

        yearGrid.appendChild(monthElement);
    }
}

// Open task modal for specific date
function openTaskModal(date, tasks) {
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('modal-title');
    
    modalTitle.textContent = `Tasks for ${date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}`;
    
    updateModalTaskList();
    modal.style.display = 'block';
}

// Update modal task list
function updateModalTaskList() {
    const taskList = document.getElementById('modal-task-list');
    taskList.innerHTML = '';
    
    if (!selectedDate || !allTasks[selectedDate]) {
        taskList.innerHTML = '<li style="color: #999; font-style: italic;">No tasks for this date</li>';
        return;
    }

    allTasks[selectedDate].forEach((task, index) => {
        const li = document.createElement('li');
        li.style.padding = '8px';
        li.style.background = '#f4f4f4';
        li.style.marginBottom = '5px';
        li.style.borderRadius = '5px';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.color = 'black';
        
        if (task.completed) {
            li.style.textDecoration = 'line-through';
            li.style.color = '#999';
        }

        const taskText = document.createElement('span');
        taskText.textContent = task.text;
        taskText.style.cursor = 'pointer';
        
        taskText.addEventListener('click', () => {
            task.completed = !task.completed;
            saveAllTasks();
            updateModalTaskList();
            renderCalendar();
            if (selectedDate === getToday()) {
                loadAllTasks(); // Refresh today's list
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✖';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = '#999';
        
        deleteBtn.addEventListener('click', () => {
            allTasks[selectedDate].splice(index, 1);
            if (allTasks[selectedDate].length === 0) {
                delete allTasks[selectedDate];
            }
            saveAllTasks();
            updateModalTaskList();
            renderCalendar();
            if (selectedDate === getToday()) {
                loadAllTasks(); // Refresh today's list
            }
        });

        li.appendChild(taskText);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
}

// Get total completed tasks
function getTotalCompletedTasks() {
    return parseInt(localStorage.getItem("totalCompletedTasks")) || 0;
}

// Set total completed tasks
function setTotalCompletedTasks(count) {
    localStorage.setItem("totalCompletedTasks", count);
}

// Update total completed display
function updateTotalCompletedDisplay() {
    const total = getTotalCompletedTasks();
    document.getElementById("total-completed-tasks").textContent = `Total tasks completed ever: ${total}`;
}

// Setup theme toggle
function setupThemeToggle() {
    const toggle = document.getElementById('darkModeToggle');
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = savedTheme === "dark";

    if (prefersDark) {
        document.body.classList.add("dark-mode");
        document.documentElement.classList.add("dark-mode");
        toggle.checked = true;
    }

    toggle.addEventListener("change", () => {
        const isDark = toggle.checked;
        document.body.classList.toggle("dark-mode", isDark);
        document.documentElement.classList.toggle("dark-mode", isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });
}

// Setup reset total completed
function setupResetTotalCompleted() {
    const resetBtn = document.getElementById("reset-total-completed");
    resetBtn.addEventListener("click", () => {
        localStorage.setItem("totalCompletedTasks", "0");
        updateTotalCompletedDisplay();
    });
}

// Setup Pomodoro timer
function setupPomodoro() {
    const timerDisplay = document.getElementById("pomodoro-timer");
    const startBtn = document.getElementById("start-pomodoro");
    const pauseBtn = document.getElementById("pause-pomodoro");
    const resetBtn = document.getElementById("reset-pomodoro");

    let timer = 25 * 60; // 25 minutes in seconds
    let interval = null;
    let isRunning = false;

    function updateDisplay() {
        const minutes = Math.floor(timer / 60).toString().padStart(2, "0");
        const seconds = (timer % 60).toString().padStart(2, "0");
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;

        interval = setInterval(() => {
            if (timer > 0) {
                timer--;
                updateDisplay();
            } else {
                clearInterval(interval);
                isRunning = false;
                alert("Time's up! Take a break 🍅");
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!isRunning) return;
        clearInterval(interval);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }

    function resetTimer() {
        clearInterval(interval);
        timer = 25 * 60;
        updateDisplay();
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = true;
    }

    startBtn.addEventListener("click", startTimer);
    pauseBtn.addEventListener("click", pauseTimer);
    resetBtn.addEventListener("click", resetTimer);

    updateDisplay();
}