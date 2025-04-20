document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const NOTES_STORAGE_KEY = 'studyGuideNotes';
    const HABIT_STATE_STORAGE_KEY = 'studyHabitState';
    const SECTION_TIME_STORAGE_KEY = 'sectionTimes';
    const TASK_MODULES = document.querySelectorAll('.task-module');
    const SESSION_TIME_KEY = 'sessionTime';

    // --- Timer Functionality ---
    const timerDisplay = document.getElementById('timer-display');
    const startButton = document.getElementById('start-timer');
    const pauseButton = document.getElementById('pause-timer');
    const resetButton = document.getElementById('reset-timer');

    let timerInterval = null;
    let seconds = 0;
    let isRunning = false;
    let sessionSeconds = 0; // Separate counter for session time

    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const paddedHours = String(hours).padStart(2, '0');
        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSecs = String(secs).padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}:${paddedSecs}`;
    }

    function updateTimerDisplay() {
        if (timerDisplay) { // Check if element exists
             timerDisplay.textContent = formatTime(seconds);
        }
    }

    function startTimer() {
        if (isRunning || !startButton || !pauseButton) return;
        isRunning = true;
        startButton.disabled = true;
        pauseButton.disabled = false;
        timerInterval = setInterval(() => {
            sessionSeconds++; // Increment session time
            seconds++;
            updateTimerDisplay();
        }, 1000);
    }

    function pauseTimer() {
        if (!isRunning || !startButton || !pauseButton) return;
        isRunning = false;
        startButton.disabled = false;
        pauseButton.disabled = true;
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function resetTimer() {
        pauseTimer();
        sessionSeconds = 0; // Reset session time
        seconds = 0;
        updateTimerDisplay();
        updateSessionTimeDisplay(); // Also update the session time display
        if (startButton) startButton.disabled = false;
        if (pauseButton) pauseButton.disabled = true;
    }

    // New: Update the displayed session time
    function updateSessionTimeDisplay() {
        const sessionTimeDisplay = document.getElementById('session-time');
        if (sessionTimeDisplay) {
            sessionTimeDisplay.textContent = formatTime(sessionSeconds);
        }
    }

    // Add timer listeners only if the elements exist
    if (startButton && pauseButton && resetButton) {
        startButton.addEventListener('click', startTimer);
        startButton.addEventListener('click', () => { // Also clear session time on start
            sessionSeconds = 0;
            updateSessionTimeDisplay();
        });
        pauseButton.addEventListener('click', pauseTimer);
        resetButton.addEventListener('click', resetTimer);
        updateTimerDisplay(); // Initial display
        pauseButton.disabled = true; // Initial state
    }

    // --- Notes Persistence ---
    const notesArea = document.getElementById('notes-area');
    if (notesArea) { // Check if notesArea exists
        const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
        if (savedNotes) {
            notesArea.value = savedNotes;
        }
        notesArea.addEventListener('input', () => {
            localStorage.setItem(NOTES_STORAGE_KEY, notesArea.value);
        });
    }

    // --- Section Time Tracking ---
    function getHabitState() {
        const stateString = localStorage.getItem(HABIT_STATE_STORAGE_KEY);
        try {
            return stateString ? JSON.parse(stateString) : {};
        } catch (e) {
            console.error('Error parsing habit state:', e);
            return {};
        }
    }

    function saveHabitState(state) {
        try {
            localStorage.setItem(HABIT_STATE_STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Error saving habit state:', e);
        }
    }

    function getSectionTimes() {
        const timesString = localStorage.getItem(SECTION_TIME_STORAGE_KEY);
        try {
            return timesString ? JSON.parse(timesString) : {};
        } catch (e) {
            console.error('Error parsing section times:', e);
            return {};
        }
    }

    function saveSectionTimes(times) {
        try {
            localStorage.setItem(SECTION_TIME_STORAGE_KEY, JSON.stringify(times));
        } catch (e) {
            console.error('Error saving section times:', e);
        }
    }

    function updateSectionTimeDisplay(sectionId) {
        const sectionTimes = getSectionTimes();
        const totalSeconds = sectionTimes[sectionId] || 0;
        const display = document.getElementById(`${sectionId}-total-time`);
        if (display) {
            display.textContent = formatTime(totalSeconds);
        }
    }

    function addTimeToSection(sectionId) {
        const sectionTimes = getSectionTimes();
        sectionTimes[sectionId] = (sectionTimes[sectionId] || 0) + sessionSeconds;
        saveSectionTimes(sectionTimes);
        updateSectionTimeDisplay(sectionId);
    }

    // --- Total Progress ---
    const totalProgressBarFill = document.getElementById('total-progress-bar-fill');
    const totalProgressPercentageText = document.getElementById('total-progress-percentage');

    function calculateTotalProgress() {
        let totalTasks = 0;
        let completedTasks = 0;
        const habitState = getHabitState();

        TASK_MODULES.forEach(module => {
            const taskCheckboxes = module.querySelectorAll('input[type="checkbox"][data-task-type="completed"]');
            const subtaskCheckboxes = module.querySelectorAll('.subtask-tracking input[type="checkbox"][data-task-type="completed"]');
            totalTasks += taskCheckboxes.length + subtaskCheckboxes.length;

            taskCheckboxes.forEach(checkbox => {
                const taskId = checkbox.closest('.task-module').dataset.taskId;
                if (habitState[taskId]?.completed) {
                    completedTasks++;
                }
            });

            subtaskCheckboxes.forEach(checkbox => {
                const taskId = checkbox.closest('li').dataset.taskId; // Assuming data-task-id on list items
                const isCompleted = habitState[taskId]?.completed;
                if (isCompleted) {
                    completedTasks++;
                }
            });
        });
        return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }

    function updateTotalProgress() {
        const totalProgress = calculateTotalProgress();
        if (totalProgressBarFill && totalProgressPercentageText) {
            totalProgressBarFill.style.width = `${totalProgress}%`;
            totalProgressPercentageText.textContent = `Overall Progress: ${totalProgress}%`;
        }
    }

    // --- Overall Progress ---
    const overallProgressBarFill = document.getElementById('overall-progress-bar-fill');
    const overallProgressPercentageText = document.getElementById('overall-progress-percentage');
    const overallProgressSection = document.getElementById('overall-progress-section');

    function updateOverallProgressDisplay() {
        let totalItems = 0;
        let completedItems = 0;

        TASK_MODULES.forEach(module => {
            const listItems = module.querySelectorAll('li');
            totalItems += listItems.length;

            listItems.forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    completedItems++;
                }
            });
        });

        const overallPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        if (overallProgressBarFill && overallProgressPercentageText) {
            overallProgressBarFill.style.width = `${overallPercentage}%`;
            overallProgressPercentageText.textContent = `Overall Progress: ${overallPercentage}%`;
        }
    }

    // --- Initialize ---
    function initializeSectionTimes() {
        const sectionTimes = getSectionTimes();
        document.querySelectorAll('.add-time-btn').forEach(button => {
            const sectionId = button.dataset.section;
            updateSectionTimeDisplay(sectionId);
        });
    }

    function initializeHabitTracker() {
        const state = getHabitState();

        TASK_MODULES.forEach(module => {
            const moduleStartedCheckbox = module.querySelector('.task-status[data-task-type="started"]');
            const moduleCompletedCheckbox = module.querySelector('.task-status[data-task-type="completed"]');
            const taskId = module.dataset.taskId;

            // Initialize module checkboxes
            if (moduleStartedCheckbox) {
                moduleStartedCheckbox.checked = state[taskId]?.started || false;
            }
            if (moduleCompletedCheckbox) {
                moduleCompletedCheckbox.checked = state[taskId]?.completed || false;
            }

            // Initialize task list items within the module
            module.querySelectorAll('li').forEach(listItem => {
                const itemTaskId = `${taskId}-${listItem.textContent.trim().replace(/[^a-zA-Z0-9]/g, '_')}`; // Create unique ID
                listItem.dataset.taskId = itemTaskId;
                const startedCheckbox = listItem.querySelector('.task-status[data-task-type="started"]');
                const completedCheckbox = listItem.querySelector('.task-status[data-task-type="completed"]');

                if (startedCheckbox) {
                    startedCheckbox.checked = state[itemTaskId]?.started || false;
                }
                if (completedCheckbox) {
                    completedCheckbox.checked = state[itemTaskId]?.completed || false;
                }
            });
        });
    }

    // Function to handle checkbox changes
    function handleCheckboxChange(event) {
        const checkbox = event.target;
        const state = getHabitState();
        const isSubtask = checkbox.closest('.subtask-tracking');
        let taskId;

        if (isSubtask) {
            taskId = checkbox.closest('li').dataset.taskId;
        } else {
            taskId = checkbox.closest('.task-module').dataset.taskId;
        }

        if (!taskId) return;

        const type = checkbox.dataset.taskType;

        if (!state[taskId]) {
            state[taskId] = {};
        }

        state[taskId][type] = checkbox.checked;

        // Update related checkboxes if needed (e.g., auto-check "started" when "completed")
        if (type === 'completed' && checkbox.checked) {
            const startedCheckbox = checkbox.closest(isSubtask ? 'li' : '.task-module').querySelector('.task-status[data-task-type="started"]');
            if (startedCheckbox) {
                state[taskId].started = true;
                startedCheckbox.checked = true;
            }
        }

        saveHabitState(state);
        updateTotalProgress();
        updateOverallProgressDisplay();
    }

    function updateSectionProgress(sectionId) {
        let totalTasks = 0;
        let completedTasks = 0;
        let startedTasks = 0;
        const habitState = getHabitState();

        // Select all list items within the section
        const listItems = document.querySelectorAll(`#${sectionId} .task-list li`);

        listItems.forEach(item => {
            const taskId = item.dataset.taskId;
            if (taskId && habitState[taskId]) {
                totalTasks++;
                if (habitState[taskId].completed) {
                    completedTasks++;
                }
                if (habitState[taskId].started) {
                    startedTasks++;
                }
            }
        });

        // Subtasks handling (assuming subtasks are within list items with a specific class)
        const subtaskItems = document.querySelectorAll(`#${sectionId} .subtask-tracking li`);
        subtaskItems.forEach(item => {
            const taskId = item.dataset.taskId;
            if (taskId && habitState[taskId]) {
                totalTasks++;
                if (habitState[taskId].completed) {
                    completedTasks++;
                }
                if (habitState[taskId].started) {
                    startedTasks++;
                }
            }
        });

        // Calculate progress based on started or completed tasks
        let progressPercentage;
        if (startedTasks > 0) {
            progressPercentage = Math.round((startedTasks / totalTasks) * 100);
        } else {
            progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        }

        const sectionProgressDisplay = document.querySelector(`#${sectionId} .section-progress span`);
        if (sectionProgressDisplay) {
            sectionProgressDisplay.textContent = `${progressPercentage}%`;
        }
        return { totalTasks, completedTasks };
    }

    function calculateOverallProgress() {
        let totalTasks = 0;
        let totalCompleted = 0;
        let totalStarted = 0;
        const habitState = getHabitState();

        TASK_MODULES.forEach(module => {
            const { totalTasks: sectionTotal, completedTasks: sectionCompleted } = updateSectionProgress(module.id);
            totalTasks += sectionTotal;
            totalCompleted += sectionCompleted;

            // Count started tasks for overall progress (consider subtasks as well)
            module.querySelectorAll('li').forEach(item => {
                const taskId = item.dataset.taskId;
                if (taskId && habitState[taskId] && habitState[taskId].started) {
                    totalStarted++;
                }
            });
        });

        // Use started tasks for overall progress if available, otherwise use completed tasks
        let overallPercentage;
        if (totalStarted > 0) {
            overallPercentage = Math.round((totalStarted / totalTasks) * 100);
        } else {
            overallPercentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
        }

        return overallPercentage;
    }

    // Function to handle checkbox changes
     function handleCheckboxChange(event) {
         const checkbox = event.target;
         const type = checkbox.dataset.taskType;
         // If one checkbox is checked, check the other one too
         if (type === 'started' || type === 'completed') {
             checkbox.checked = true;
         }

         const state = getHabitState();
         let taskId;
         const isSubtask = checkbox.closest('.subtask-tracking');
         if (isSubtask) {
             taskId = checkbox.closest('li').dataset.taskId;
         } else {
             taskId = checkbox.closest('.task-module').dataset.taskId;
         }

         if (!taskId) return;

         if (!state[taskId]) {
             state[taskId] = {};
         }

         state[taskId][type] = checkbox.checked;

         // If 'completed' is checked, also check 'started'
         if (type === 'completed' && checkbox.checked) {
             state[taskId].started = true;
         }

         saveHabitState(state);

         // Update the progress for the specific section and overall
         const sectionId = checkbox.closest('.task-module').id;
         updateSectionProgress(sectionId);
         updateOverallProgressDisplay();
        });
    });

    console.log("Study habit tracker initialized.");

    // New: Attach event listeners to all checkboxes for progress tracking
     const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
     allCheckboxes.forEach(checkbox => {
         checkbox.addEventListener('change', (event) => {
             const checkbox = event.target;
             const isTaskCheckbox = checkbox.classList.contains('task-started') || checkbox.classList.contains('task-completed');
             const hasTaskType = checkbox.hasAttribute('data-task-type');

             if (isTaskCheckbox || hasTaskType) {
                 handleCheckboxChange(event);
             }
         });
     });
     
     // --- Collapsible Section ---
     if (overallProgressSection) {
         const collapsibleContent = overallProgressSection.querySelector('.collapsible-content');
         overallProgressSection.addEventListener('click', () => {
             collapsibleContent.classList.toggle('collapsed');
         });
     }

     // Attach event listeners for adding time to sections
     document.querySelectorAll('.add-time-btn').forEach(button => {
         button.addEventListener('click', () => {
             addTimeToSection(button.dataset.section);
         });
     });

     // --- Initialization ---
     initializeSectionTimes();
     initializeHabitTracker();
     updateTotalProgress();
     updateOverallProgressDisplay();
     updateSessionTimeDisplay(); // Initial session time display

     // Update section and overall progress on load
     TASK_MODULES.forEach(module => {
         updateSectionProgress(module.id);
     });
     updateOverallProgressDisplay();

     console.log("Study habit tracker initialized.");

});
