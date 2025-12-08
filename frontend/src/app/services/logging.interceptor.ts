import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (environment.production) return next.handle(req);

    const started = performance.now();
    return next.handle(req).pipe(
      tap({
        next: () =>
          console.log(`[http] ${req.method} ${req.url} (${(performance.now() - started).toFixed(1)}ms)`,),
        error: (err) =>
          console.warn(`[http] ${req.method} ${req.url} FAILED (${(performance.now() - started).toFixed(1)}ms)`, err,),
      }),
    );
  }
}
