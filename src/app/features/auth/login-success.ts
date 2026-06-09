import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login-success',
  standalone: true,
  template: '<h2 style="text-align: center; margin-top: 50px;">Accesso in corso... attendere.</h2>'
})
export class LoginSuccessComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private auth   = inject(AuthService);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.auth.setToken(token);
        this.router.navigate(['/checkout']);
      } else {
        this.router.navigate(['/products']);
      }
    });
  }
}
