<template>
    <img class="mx-auto d-block" src="@/assets/loading.gif" alt="loading"/>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import authService from '../services/AuthService';

@Component({})
export default class Login extends Vue {
    private data() {
        authService.handleAuthentication();
        return {};
    }
}
</script>

<style lang="scss" scoped>
</style>
