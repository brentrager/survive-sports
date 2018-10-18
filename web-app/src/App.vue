<template>
    <div id="app">

        <nav-bar></nav-bar>

        <main role="main" class="container">

            <router-view/>

        </main><!-- /.container -->
    </div>
</template>

<script>
    import AuthService from './AuthService';
    import NavBar from './components/NavBar';

    const auth = new AuthService();
    const authenticated = auth.authenticated;

    export default {
        name: 'app',
        data() {
            auth.authNotifier.on('authChange', (authState) => {
                authenticated = authState.authenticated;
            });
            return {
                auth,
                authenticated,
            };
        },
        components: {
            NavBar,
        },
    };
</script>

<style lang="scss">
    @import '../node_modules/bootstrap/dist/css/bootstrap.css';

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
