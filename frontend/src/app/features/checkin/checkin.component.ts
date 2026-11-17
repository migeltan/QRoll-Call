// Owner: Role 5 (Staff Auth + Check-in Scanner).
import { Component } from '@angular/core';
// import { Html5Qrcode } from 'html5-qrcode';   // already installed

@Component({
  selector: 'app-checkin',
  template: `
    <h1>Check-in Scanner</h1>
    <p>TODO(role-5): camera scanner (html5-qrcode). On scan call CheckinService.checkIn(token)
    and show "Checked In", "Already checked in" or "Invalid ticket".</p>
  `,
})
export class CheckinComponent {}
