#!/bin/bash

# Script to set up and launch the Prompt Engineering Study Guide project

# --- Constants ---
REPO_URL="https://github.com/PreistlyPython/prompt-engineering-study-guide.git"
PROJECT_DIR="prompt-engineering-study-guide"
VENV_DIR="$PROJECT_DIR/venv"
INDEX_FILE="$PROJECT_DIR/index.html"

# --- Functions ---

# Function to handle errors and exit
handle_error() {
  echo "Error: $1"
  exit 1
}

# Function to check for a command and install if missing
check_and_install() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "$1 is not installed. Installing..."
    sudo apt-get update
    sudo apt-get install -y "$2" || handle_error "Failed to install $1"
    echo "$1 has been installed."
  }
}

# --- Main Script ---

# 1. Git Pull/Clone
echo "Checking for project repository..."
if [ -d "$PROJECT_DIR" ]; then
  echo "Repository found. Pulling latest changes..."
  cd "$PROJECT_DIR" || handle_error "Failed to navigate to project directory"
  git pull origin main || handle_error "Failed to pull latest changes"
else
  echo "Repository not found. Cloning..."
  git clone "$REPO_URL" "$PROJECT_DIR" || handle_error "Failed to clone repository"
  cd "$PROJECT_DIR" || handle_error "Failed to navigate to project directory"
fi

# 2. Dependencies
echo "Checking for dependencies..."
check_and_install "python3" "python3"
check_and_install "python3-venv" "python3-venv"

# 3. Virtual Environment
echo "Setting up virtual environment..."
if [ -d "$VENV_DIR" ]; then
  echo "Virtual environment found. Skipping creation."
else
  python3 -m venv "$VENV_DIR" || handle_error "Failed to create virtual environment"
fi

# 4. # It's important to note that this script activates the virtual environment, but this activation only applies within the scope of this script. Once the script finishes, the virtual environment will be deactivated, and you'll need to activate it again in your current shell if you wish to work within it.
echo "To activate the virtual environment for your current shell, run: source $VENV_DIR/bin/activate"

# 5. Database verification
echo "Verifying if database code exists..."
if find "$PROJECT_DIR" -name "*.py" -print0 | xargs -0 grep -q "database"; then
    echo "Database code found. There is a database implementation."
else
    echo "No database code found. There is no database implementation."
fi

# 6. Launch Website
echo "Launching website..."
if [ -f "$INDEX_FILE" ]; then
  firefox "$INDEX_FILE" || handle_error "Failed to launch website"
else
    handle_error "Index file not found"
fi

echo "Script completed successfully."

# To work in the virtual environment, run: source $VENV_DIR/bin/activate