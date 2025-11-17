# Request Leave

## Leave Application

### Requirements
- Leave type selection (Annual, Sick, Personal)
- Date range selection with half-day options
- Reason field with character limit
- Automatic calculation of working days requested
- Validation against available leave balance

### Implementation Details
- Users will select from predefined leave types
- Calendar interface for date selection
- Half-day options for start and end dates
- System will automatically exclude weekends and holidays from working days calculation
- Real-time validation against user's available leave balance
- Prevent submission if insufficient leave balance
- Option to save draft requests before submission

### User Interface Elements
- Leave request form
- Leave type dropdown
- Date range picker with half-day toggles
- Reason text area with character counter
- Working days calculation display
- Available balance display
- Submit and save draft buttons
