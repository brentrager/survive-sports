<template>
    <nav class="navbar navbar-expand-md navbar-dark fixed-top">
        <router-link to="/" class="navbar-brand">Survive Sports</router-link>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault"
            aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarsExampleDefault">
            <ul class="navbar-nav mr-auto">
                <li class="nav-item">
                    <router-link active-class="active" to="/" class="nav-link" exact>League</router-link>
                </li>
                <li class="nav-item" v-if="authenticated">
                    <router-link active-class="active" to="/team" class="nav-link" exact>Team</router-link>
                </li>
            </ul>
            <button class="btn btn-outline-banner my-2 my-sm-0" v-if="!authenticated" @click="authService.login()">Sign-In</button>
            <template v-if="authenticated">
                <template v-if="user">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <router-link active-class="active" to="/team" class="nav-link" exact>{{ user.name }}</router-link>
                        </li>
                    </ul>
                    <img v-if="user.picture" v-bind:src="user.picture" class="mr-2 mr-sm-2" />
                </template>
                <button class="btn btn-outline-banner my-2 my-sm-0" v-if="authenticated" @click="authService.logout()">Sign-Out</button>
            </template>
        </div>
    </nav>
</template>

<script lang="ts">
import { Component, Watch, Vue } from 'vue-property-decorator';
import authService from '../services/AuthService';
import { User } from '@/models/user';

@Component({
    name: 'nav-bar',
})
export default class NavBar extends Vue {
    public authenticated = false;
    public user: User | undefined = undefined;

    private data() {
        authService.authenticatedSubject.subscribe((authenticated) => {
            this.authenticated = authenticated;
        });
        authService.userProfileSubject.subscribe((userProfile: User | undefined) => {
            this.user = userProfile;
        });
        return {
            authService,
            authenticated: this.authenticated,
            user: this.user,
        };
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
button.btn-outline-banner {
    @include button-outline-variant($banner-text-color, $background-color)
}

nav {
    background-color: $banner-color;
}

.navbar-dark a.navbar-brand {
    color: $logo-color;
    font-weight: bolder;
}


.navbar-dark a.navbar-brand:focus {
    color: $logo-color;
    font-weight: bolder;
}

.navbar-dark a.navbar-brand:hover {
    color: darken($logo-color, 10%);
    font-weight: bolder;
}

.nav-link {
    color: $background-color;
}

nav img {
    height: $input-height;
    width: $input-height;
}

</style>
