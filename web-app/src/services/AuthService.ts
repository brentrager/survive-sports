import auth0 from 'auth0-js';
import { BehaviorSubject, noop } from 'rxjs';
import router from '../router';
import * as log from 'loglevel';
import axios, { AxiosRequestConfig } from 'axios';
import { User } from '../models/user';

class AuthService {
    public authenticatedSubject: BehaviorSubject<boolean>;
    public userProfileSubject: BehaviorSubject<User | undefined>;
    private auth0: auth0.WebAuth;
    private tokenRenewalTimeout: number | undefined;

    constructor() {
        this.authenticatedSubject = new BehaviorSubject(false);
        this.userProfileSubject = new BehaviorSubject<User | undefined>(undefined);
        this.auth0 = new auth0.WebAuth({
            domain: 'hard-g.auth0.com',
            clientID: 'rzCwuye9LrsiDmwdjI84CNiBgS7rcsty',
            redirectUri: `${window.location.protocol}//${window.location.host}/login`,
            responseType: 'token id_token',
            scope: 'openid profile email app_metadata',
        });

        this.authenticatedSubject.subscribe(async (authenticated) => {
            if (authenticated) {
                const response = await this.request('GET', '/api/user');
                this.userProfileSubject.next(response.data as User);
            }
        });

        this.checkIsAuthenticated();
        this.scheduleRenewal();
    }

    public login() {
        this.auth0.authorize();
    }

    public handleAuthentication() {
        this.auth0.parseHash((err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                this.setSession(authResult);
                router.replace('league');
            } else if (err) {
                router.replace('league');
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
            this.scheduleRenewal();
        }
    }

    public logout() {
        // Clear Access Token and ID Token from local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        this.authenticatedSubject.next(false);
        // navigate to the league route
        router.replace('league');

        clearTimeout(this.tokenRenewalTimeout);
    }

    public async request(method: string, url: string, data?: any) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated.');
        }

        const requestOptions: AxiosRequestConfig = {
            method,
            url,
            headers: {
                Authorization: `Bearer ${localStorage.getItem('id_token')}`,
            },
        };

        if (data) {
            requestOptions.data = data;
        }

        return axios.request(requestOptions);
    }

    private checkIsAuthenticated() {
        this.authenticatedSubject.next(this.isAuthenticated());
    }

    private isAuthenticated() {
        try {
            // Check whether the current time is past the
            // Access Token's expiry time
            const expiresAt = JSON.parse(localStorage.getItem('expires_at') as string);
            return new Date().getTime() < expiresAt;
        } catch (error) {
            return false;
        }
    }

    private renewToken() {
        this.auth0.checkSession({},
            (err, result) => {
                if (err) {
                    log.error(err);
                } else {
                    this.setSession(result);
                }
            },
        );
    }

    private scheduleRenewal() {
        try {
            const expiresAt = JSON.parse(localStorage.getItem('expires_at') as string);
            const delay = expiresAt - Date.now();
            if (delay > 0) {
                this.tokenRenewalTimeout = setTimeout(() => {
                    this.renewToken();
                }, delay);
            }
        } catch (error) {
            noop();
        }
    }
}

const authService = new AuthService();
(authService as any).AuthService = AuthService;

export default authService;
