# User Requirements - Workmory

## Core Features

### Activity Tracking
- The app shall automatically track which applications the user is using.
- The app shall record the title of the active window.
- The app shall detect user inactivity (no keyboard/mouse input).
- The app shall identify and log Microsoft Teams meetings.

### Time Analysis
- The app shall provide a visual timeline of daily activities.
- The app shall aggregate similar activities for better overview.
- The app shall calculate total active and inactive time.
- The app shall show which applications were used most.

### User Controls
- The user shall be able to pause/resume tracking at any time.
- The user shall be able to view data from previous days.
- The user shall be able to change the aggregation interval (5, 10, or 15 minutes).
- The user shall be able to change where activity data is stored.

### Privacy & Security
- All data shall be stored locally on the user's device.
- The app shall not transmit any tracking data over the network.
- The app shall be transparent about what data is being collected.
- The app shall automatically clean up data older than 30 days.

## User Interface Requirements

### Timeline View
- The timeline shall display activities in chronological order.
- Each activity block shall show the application name and window title.
- Inactive periods shall be clearly distinguishable.
- Teams meetings shall be highlighted with special styling.

### Navigation
- The user shall be able to navigate between days with simple controls.
- The current day shall be highlighted as "Today".
- The previous day shall be labeled as "Yesterday".
- The user shall be able to select any date from a calendar picker.

### Information Display
- The user shall see total active time for the selected day.
- The user shall see total inactive time for the selected day.
- The user shall see the current tracking status (active/paused).

## Technical Requirements

### Cross-Platform Support
- The app shall run on Windows 10 and newer.
- The app shall run on macOS Catalina (10.15) and newer.

### Installation & Updates
- The app shall provide a simple installer for each supported platform.
- The app shall check for and install updates automatically.
- The app shall support beta release channels for testing. 