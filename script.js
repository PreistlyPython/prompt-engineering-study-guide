document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const NOTES_STORAGE_KEY = 'studyGuideNotes';
    const HABIT_STATE_STORAGE_KEY = 'studyHabitState';
    const TASK_MODULES = document.querySelectorAll('.task-module'); // Get all task modules

    // --- Timer Functionality ---
    const timerDisplay = document.getElementById('timer-display');
    const startButton = document.getElementById('start-timer');
    const pauseButton = document.getElementById('pause-timer');
    const resetButton = document.getElementById('reset-timer');

    let timerInterval = null;
    let seconds = 0;
    let isRunning = false;
    const overallProgress = document.getElementById('overall-progress');

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
        seconds = 0;
        updateTimerDisplay();
        if (startButton) startButton.disabled = false;
        if (pauseButton) pauseButton.disabled = true;
    }

    // Add timer listeners only if the elements exist
    if (startButton && pauseButton && resetButton) {
        startButton.addEventListener('click', startTimer);
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

    // --- Habit Tracking & Progress ---
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressPercentageText = document.getElementById('progress-percentage');

    function getHabitState() {
        const stateString = localStorage.getItem(HABIT_STATE_STORAGE_KEY);
        try {
            return stateString ? JSON.parse(stateString) : {};
        } catch (e) {
            console.error("Error parsing habit state:", e);
            return {}; // Return empty object on error
        }
    }

    function saveHabitState(state) {
         try {
             localStorage.setItem(HABIT_STATE_STORAGE_KEY, JSON.stringify(state));
         } catch (e) {
             console.error("Error saving habit state:", e);
         }
    }

    function updateProgress() {
        if (!progressBarFill || !progressPercentageText || TASK_MODULES.length === 0) return; // Ensure elements exist

        const state = getHabitState();
        let completedCount = 0;
        TASK_MODULES.forEach(module => {
            const taskId = module.dataset.taskId;
            if (state[taskId]?.completed) { // Check if task exists in state and is completed
                completedCount++;
            }
        });

        const totalTasks = TASK_MODULES.length;
        const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

        progressBarFill.style.width = `${percentage}%`;
        // Optional: Add text inside the bar if you want
        // progressBarFill.textContent = `${percentage}%`;
        progressPercentageText.textContent = `Progress: ${percentage}%`;
    }

    function initializeHabitTracker() {
        const state = getHabitState();

        TASK_MODULES.forEach(module => {
            const taskId = module.dataset.taskId;
            if (!taskId) return; // Skip if no task ID

            const startedCheckbox = module.querySelector('.task-started');
            const completedCheckbox = module.querySelector('.task-completed');

            // Set initial checkbox state from localStorage
            if (startedCheckbox) {
                 startedCheckbox.checked = state[taskId]?.started || false;
            }
            if (completedCheckbox) {
                 completedCheckbox.checked = state[taskId]?.completed || false;
            }

            const checkboxes = module.querySelectorAll('.task-tracking input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (event) => {
                    const currentState = getHabitState(); // Get the latest state
                    const type = event.target.dataset.taskType; // 'started' or 'completed'

                    // Ensure the task entry exists in the state object
                    if (!currentState[taskId]) {
                        currentState[taskId] = { started: false, completed: false };
                    }

                    // Update the specific state (started or completed)
                    currentState[taskId][type] = event.target.checked;

                    // Optional: Add logic like auto-checking 'started' if 'completed' is checked
                    if (type === 'completed' && event.target.checked && startedCheckbox) {
                         currentState[taskId].started = true; // Auto-set started
                         startedCheckbox.checked = true; // Update UI too
                    }

                    // Optional: Uncheck 'completed' if 'started' is unchecked
                    if (type === 'started' && !event.target.checked && completedCheckbox) {
                         currentState[taskId].completed = false; // Auto-unset completed
                         completedCheckbox.checked = false; // Update UI too
                    }


                    saveHabitState(currentState); // Save the updated state object
                    updateProgress(); // Recalculate progress
                });
            });
            updateSectionProgress(module); // Initial update for each section
        });

        updateProgress(); // Initial progress calculation
    }

    function updateSectionProgress(module) {
        const taskItems = module.querySelectorAll('.task-list li'); // Get all task list items
        let completedTasks = 0; 
        let startedTasks = 0; 

        taskItems.forEach(item => {
            const startedCheckbox = item.querySelector('.task-started');
            const completedCheckbox = item.querySelector('.task-completed');

            if (startedCheckbox && startedCheckbox.checked) {
                startedTasks++;
            }

            if (completedCheckbox && completedCheckbox.checked) {
                completedTasks++;
            }
            
        });

         // Get section progress display if exists
         const sectionProgressDisplay = module.querySelector('.section-progress span');
         const totalTasks = taskItems.length;

          // Update progress percentage if display element exists
         if (sectionProgressDisplay) {
             const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
             sectionProgressDisplay.textContent = `${progressPercentage}%`;
         }
    }

     function updateOverallProgress() {
         let totalTasks = 0;
         let totalCompleted = 0;

         TASK_MODULES.forEach(module => {
             const taskItems = module.querySelectorAll('.task-list li');
             totalTasks += taskItems.length;

             taskItems.forEach(item => {
                 const completedCheckbox = item.querySelector('.task-completed');
                 if (completedCheckbox && completedCheckbox.checked) {
                     totalCompleted++;
                 }
             });
         });

         const overallPercentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
         const overallProgressDisplay = document.getElementById('progress-percentage');

         if (overallProgressDisplay) {
             overallProgressDisplay.textContent = `Overall Study Progress: ${overallPercentage}%`;
         }
     }

    // Function to handle checkbox changes
     function handleCheckboxChange(event) {
         const checkbox = event.target;
         const type = checkbox.dataset.taskType;
         // If one checkbox is checked, check the other one too
         if (type === 'started' || type === 'completed') {
             checkbox.checked = true;
         }
         updateOverallProgress();
     }

    function updateOverallProgress() {
        const overallPercentage = calculateOverallProgress();
        if (overallProgress) {
            overallProgress.textContent = `Overall Progress: ${overallPercentage}%`;
        }
    }
    // Initialize everything
    initializeHabitTracker();
    updateOverallProgress();

    // --- Link Click Tracking ---
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (event) => {
            console.log(`Link to ${event.target.href} was clicked`);
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

    // Initial progress update
     updateOverallProgress();
});
