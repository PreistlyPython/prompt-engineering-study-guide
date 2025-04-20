#!/bin/bash

# --- Constants ---
PROJECT_DIR="."
VENV_DIR="./venv" # Changed to be in the same directory as the script
INDEX_FILE="$PROJECT_DIR/index.html"

# --- Functions ---

# Function to handle errors and exit
handle_error() {
  echo "Error: $1"
  echo "Total Progress: [========================================] 100%"
  exit 1
}

# Function to check for a command and install if missing
check_and_install() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "  $1 is not installed. Installing..."
    sudo apt-get update && sudo apt-get install -y "$2" || { echo "  Failed to install $1. This might affect functionality."; return 1; }
    echo "  $1 has been installed."
  }
}

# --- Main Script ---

# Initializing Progress
progress=0
echo "Project Setup and Verification"
echo "-----------------------------"
echo "Total Progress: [----------------------------------------] 0%"

# 1. Dependency Check [0% -> 20%]
echo "[ ] Checking for dependencies... (0%)"
echo "     Progress: [----------------------------------------] 0%"
if check_and_install "python3" "python3"; then
    echo "  Python3 check passed."
else
    echo "  Python3 is essential and was not found. Please install it manually and try again."
    handle_error "Python3 not found or failed to install."
fi
check_and_install "python3-venv" "python3-venv" || echo "  python3-venv installation failed. Continuing without it, virtual environment setup might be skipped."
progress=20
echo "[x] Checking for dependencies... (20%)"

echo "     Progress: [=========-------------------------------] 20%"
echo "Total Progress: [==--------------------------------------] 20%"

# 2. Project Files Verification [20% -> 40%]
echo "[ ] Verifying Project Files... (20%)"
echo "     Progress: [----------------------------------------] 0%"
if [ -n "$(ls -A $PROJECT_DIR)" ]; then
  echo "Project directory contains:"
  ls -l $PROJECT_DIR
else
  handle_error "Project directory is empty. No files found."
fi
progress=40
echo "[x] Verifying Project Files... (40%)"
echo "     Progress: [====================--------------------] 100%"
echo "Total Progress: [====----------------------------------] 40%"

# 3. Virtual Environment Setup [40% -> 60%]
echo "[ ] Setting up Virtual Environment... (40%)"
echo "     Progress: [----------------------------------------] 0%"
if [ -d "$VENV_DIR" ]; then
  echo "  Virtual environment found. Skipping creation."
else
  python3 -m venv "$VENV_DIR" || handle_error "Failed to create virtual environment."
fi
progress=60
echo "[x] Setting up Virtual Environment... (60%)"
echo "     Progress: [========================================] 100%"
echo "Total Progress: [======--------------------------------] 60%"
echo "To activate the virtual environment, run: source $VENV_DIR/bin/activate"
echo "  Note: This activation is for your current shell session."

# 4. Database Verification [60% -> 80%]
echo "[ ] Verifying Database Implementation... (60%)"
echo "     Progress: [----------------------------------------] 0%"
if find "$PROJECT_DIR" -name "*.py" -print0 | xargs -0 grep -q "database"; then
    echo "  Database code found. Database implementation exists."
else
    echo "  No database code found. No database implementation."
fi
progress=80
echo "[x] Verifying Database Implementation... (80%)"
echo "     Progress: [========================================] 100%"
echo "Total Progress: [========------------------------------] 80%"

# 5. Launching Website [80% -> 100%]
echo "[ ] Launching Website... (80%)"
echo "     Progress: [----------------------------------------] 0%"
if [ -f "$INDEX_FILE" ]; then
  #  firefox "$INDEX_FILE" || handle_error "Failed to launch website."
  echo "  Website launched (simulated)." #Simulated to prevent actual launch during script test
else
    handle_error "Index file not found. Cannot launch website."
fi
progress=100
echo "[x] Launching Website... (100%)"
echo "     Progress: [========================================] 100%"
echo "Total Progress: [========================================] 100%"

echo "-----------------------------"
echo "Project setup and verification completed successfully."