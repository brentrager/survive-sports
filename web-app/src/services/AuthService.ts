import auth0 from 'auth0-js';
import { BehaviorSubject } from 'rxjs';
import router from '../router';
import * as log from 'loglevel';

export default class AuthService {
    public authenticatedSubject: BehaviorSubject<boolean>;
    private auth0: auth0.WebAuth;

    constructor() {
        this.authenticatedSubject = new BehaviorSubject(false);
        this.auth0 = new auth0.WebAuth({
            domain: 'hard-g.auth0.com',
            clientID: 'rzCwuye9LrsiDmwdjI84CNiBgS7rcsty',
            redirectUri: `${window.location.protocol}//${window.location.host}/login`,
            responseType: 'token id_token',
            scope: 'openid',
        });
    }

    public login() {
        this.auth0.authorize();
    }

    public handleAuthentication() {
        this.auth0.parseHash((err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                this.setSession(authResult);
                router.replace('home');
            } else if (err) {
                router.replace('home');
                log.error(err);
            }
        });
    }

    public setSession(authResult: auth0.Auth0DecodedHash) {
        if (authResult && authResult.expiresIn && authResult.accessToken && authResult.idToken) {
            // Set the time that the Access Token will expire at
            const expiresAt = JSON.stringify(
                authResult.expiresIn * 1000 + new Date().getTime(),
            );
            localStorage.setItem('access_token', authResult.accessToken);
            localStorage.setItem('id_token', authResult.idToken);
            localStorage.setItem('expires_at', expiresAt);
            this.authenticatedSubject.next(true);
        }
    }

    public logout() {
        // Clear Access Token and ID Token from local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        this.authenticatedSubject.next(false);
        // navigate to the home route
        router.replace('home');
    }

    public isAuthenticated() {
        // Check whether the current time is past the
        // Access Token's expiry time
        const expiresAt = JSON.parse(localStorage.getItem('expires_at') as string);
        return new Date().getTime() < expiresAt;
    }
}
