#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Integrate OpenStreetMap that will show disaster alerts on map view too. Also add a feature that will allow to filter disaster alerts according to locations by selecting on map itself"

backend:
  - task: "Add /api/incidents/by-bounds endpoint for filtering by map bounds"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added new endpoint /api/incidents/by-bounds that accepts north, south, east, west coordinates and returns filtered incidents within the geographic bounds. Also enhanced /api/incidents/map endpoint to support severity and incident_type filters."

frontend:
  - task: "Install OpenStreetMap dependencies (leaflet, react-leaflet)"
    implemented: true
    working: "NA"
    file: "/app/frontend/package.json"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Installed leaflet@1.9.4, react-leaflet@5.0.0, leaflet-draw@1.0.4, and leaflet.markercluster@1.5.3"

  - task: "Create OpenStreetMap component with marker visualization"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/components/OpenStreetMap.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Created new OpenStreetMap.jsx component with real OpenStreetMap tiles, custom markers color-coded by severity, interactive popups showing incident details, and area selection tool for geographic filtering"

  - task: "Update MapView page to use OpenStreetMap"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/MapView.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Replaced custom map visualization with OpenStreetMap component. Added state management for selectedBounds, severityFilter, and typeFilter. Implemented handlers for bounds-based filtering, severity filtering, and type filtering. Updated filters panel with interactive buttons."

  - task: "Add map-based location filtering feature"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/components/OpenStreetMap.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implemented MapSelectionTool component that allows users to click and drag on the map to select a geographic area. When area is selected, it filters incidents to show only those within the selected bounds. Added 'Select Area' and 'Clear Filter' buttons. Selected area is highlighted on the map with a rectangle overlay."

  - task: "Add custom CSS for Leaflet styling"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/index.css"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added custom CSS for Leaflet markers, popups, and animations to integrate well with the Tailwind-based design system"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Add /api/incidents/by-bounds endpoint for filtering by map bounds"
    - "Create OpenStreetMap component with marker visualization"
    - "Update MapView page to use OpenStreetMap"
    - "Add map-based location filtering feature"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Implemented OpenStreetMap integration with the following features: 1) Real OpenStreetMap tiles showing actual geography, 2) Custom markers color-coded by severity (red=critical, orange=severe, yellow=moderate, blue=low), 3) Interactive map selection tool - users can click and drag to select an area and filter incidents, 4) Enhanced filtering with severity and incident type filters, 5) New backend endpoint /api/incidents/by-bounds for geographic filtering, 6) Marker popups showing full incident details. Ready for testing."