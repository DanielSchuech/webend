import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Router} from '@angular/router-deprecated';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class Authentication {
  token: string;

  constructor(private http: Http, private router: Router) {
    this.token = localStorage.getItem('token');
  }

  login(username: String, password: String) {
    return this.http.post('/auth/login', JSON.stringify({
        username: username,
        password: password
      }), {
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })
      .map((res: any) => {
        let data = res.json();
        this.token = data.token;
        localStorage.setItem('token', this.token);
      });
  }

  logout() {
    this.token = undefined;
    localStorage.removeItem('token');
    this.router.navigate(['Login']);
  }
}
