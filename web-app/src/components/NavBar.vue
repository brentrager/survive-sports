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
                    <router-link active-class="active" to="/" class="nav-link" exact>Home</router-link>
                </li>
                <li class="nav-item">
                    <router-link active-class="active" to="/about" class="nav-link" exact>About</router-link>
                </li>
            </ul>
            <button class="btn btn-outline-banner my-2 my-sm-0" v-if="!authenticated" @click="authService.login()">Sign-In</button>
            <button class="btn btn-outline-banner my-2 my-sm-0" v-if="authenticated" @click="authService.logout()">Sign-Out</button>
        </div>
    </nav>
</template>

<script lang="ts">
import { Component, Watch, Vue } from 'vue-property-decorator';
import authService from '../services/AuthService';

@Component({
    name: 'nav-bar',
})
export default class NavBar extends Vue {
    public authenticated = false;

    private data() {
        authService.authenticatedSubject.subscribe((authenticated) => {
            this.authenticated = authenticated;
        });
        return {
            authService,
            authenticated: this.authenticated,
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

nav-link {
    color: $background-color;
}
</style>
