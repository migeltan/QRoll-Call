# Project Information

## About this Project
A QR-based event registration and check-in system for **[Event Name]**. Attendees register through an online form, and the system automatically generates a unique QR code ticket for each of them and emails it to them. On event day, staff scan the QR codes at the entrance to mark attendees as "Checked In," so we get a fast, paperless entry process and a live attendance record.

## Who will use it

| User | What they will do |
|---|---|
| Attendee | Fills out the registration form, receives a confirmation email with their QR ticket, and shows it at the entrance |
| Organizer (Lead/Admin) | Manages the registration list, monitors submissions, and reviews attendance records |
| Check-in Staff | Scans QR codes on event day and confirms attendees are marked as "Checked In" |

## Definition of Success
- An attendee can submit the form (Full Name, Email Address, Organization, Contact Number) and the data is saved accurately in our database.
- Every new entry automatically gets a unique QR code, with no manual work.
- The attendee receives a confirmation email shortly after registering, and the QR code displays correctly in it.
- Scanning a QR code on a check-in device marks that attendee as "Checked In."
- A QR code can't be used to check in twice, and a duplicate scan is flagged.
- The system is tested end to end (form → QR → email → scan) and holds up for about **[number]** attendees, with a backup plan (such as an exported attendee list) in case the internet fails on event day.

## In-scope and out-of-scope

| In scope (MVP) | Out of scope (for now) |
|---|---|
| Online registration form with required fields | Online payments or ticket sales |
| Database storage of entries | Seat or table assignments |
| Automatic unique QR code generation | Mobile app |
| Automated confirmation email with QR ticket | Event schedule or reminder emails |
| Check-in scanning and "Checked In" status | Walk-in registration on event day |
| Test submission verification at every stage | Analytics dashboards beyond the attendance list |

## The four stages

| # | Stage | Area | Verification |
|---|---|---|---|
| 1 | Create the Registration Form | Frontend | Submit a test entry and confirm every required field is stored correctly |
| 2 | Configure the Database & QR Code Script | Backend / Automation | Run a test submission and confirm a unique QR image is created for it |
| 3 | Set Up Automated Email Delivery | Messaging | The test inbox receives the email promptly and the QR image displays correctly |
| 4 | Prepare the On-Site Check-in Scanner | Event Day | Scanning the test QR code marks the attendee "Checked In" |

## Flowchart
See [flowchart.md](flowchart.md).

## Appendices
Each person works only on their own role branch. See [ROLES.md](ROLES.md).
