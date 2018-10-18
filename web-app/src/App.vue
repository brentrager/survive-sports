<template>
    <div id="app">

        <nav-bar v-bind:auth="auth"></nav-bar>

        <main role="main" class="container">

            <router-view/>

        </main><!-- /.container -->
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from 'vue-property-decorator';
    import NavBar from './components/NavBar.vue';
    import AuthService from './services/AuthService';
    const auth = new AuthService();

    @Component({
        name: 'app',
        components: {
            NavBar,
        },
    })
    export default class App extends Vue {
        private data() {
            return {
                auth,
            };
        }
    }
</script>

<style lang="scss">
    @import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

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
