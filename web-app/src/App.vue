<template>
    <div id="app">

        <nav-bar></nav-bar>

        <main role="main" class="container">

            <router-view/>

        </main><!-- /.container -->
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import NavBar from './components/NavBar.vue';

@Component({
    name: 'app',
    components: {
        NavBar,
    },
})
export default class App extends Vue {}
</script>

<style lang="scss">
@import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

button.btn-banner {
    @include button-variant($banner-text-color, $background-color, $banner-color)
}

body {
    padding-top: 5rem;
    background-color: $background-color;
    color: $text-color;
}
.starter-template {
    padding: 3rem 1.5rem;
    text-align: center;
}
</style>
