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
            <button class="btn btn-outline-banner my-2 my-sm-0" v-if="!authenticated" @click="auth.login()">Sign-In</button>
        </div>
    </nav>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import AuthService from '../services/AuthService';

@Component({
    name: 'nav-bar',
})
export default class NavBar extends Vue {
    @Prop() public auth!: AuthService;
    public authenticated = false;

    private data() {
        this.auth.authNotifier.on('authChange', (authState) => {
            this.authenticated = authState.authenticated;
        });
        return {
            authenticated: this.authenticated,
        };
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
button.btn-outline-banner {
    @include button-outline-variant($banner-text-color, $text-color)
}

nav {
    background-color: $banner-color;
}

.navbar-dark a.navbar-brand {
    color: $logo-color;
    font-weight: bolder;
}
</style>
