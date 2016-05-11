import {Component} from '@angular/core';
import {Router} from '@angular/router-deprecated';
import {Authentication} from '../../services/authentication';

@Component({
  selector: 'login',
  template: require('./login.html')
})
export class LoginComponent {
  public user: string;
  public pass: string;
  public error = false;
  constructor(private auth: Authentication, private router: Router) {}
  
  login() {
    this.auth.login(this.user, this.pass).subscribe(
      () => {
        this.router.navigate(['Control']);
      },
      (err) => {
        this.pass = '';
        this.error = true;
      }
    );
  }
}

