// Owner: Role 4 (Registration Form + App Shell).
import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  template: `
    <h1>Event Registration</h1>
    <p>TODO(role-4): reactive form with Full Name, Email Address, Organization, Contact Number.</p>
  `,
})
export class RegisterComponent {
  // TODO(role-4): FormGroup with Validators (required, email, phone pattern),
  // submit through RegistrationService, then navigate to /registered or show the error.
}
