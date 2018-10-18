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
            <button class="btn btn-outline-success my-2 my-sm-0" v-if="!authenticated" @click="auth.login()">Sign-In</button>
        </div>
    </nav>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({ name: 'nav-bar'})
export default class NavBar extends Vue {}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
nav {
    background-color: $banner-color;
}

a.navbar-brand {
    color: $logo-color;
    font-weight: bolder;
}

nav button.btn-outline-success {
    color: $banner-text-color;
    border-color: $banner-text-color;
}

nav button.btn-outline-success:hover {
    color: $text-color;
    background-color: $banner-text-color;
}
</style>
