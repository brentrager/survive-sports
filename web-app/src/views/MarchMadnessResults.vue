<template>
    <div class="results">
        <march-madness-results-component></march-madness-results-component>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import * as log from 'loglevel';
import authService from '../services/AuthService';
import MarchMadnessResultsComponent from '../components/MarchMadnessResultsComponent.vue';


@Component({
    components: {
        MarchMadnessResultsComponent
    }
})
export default class MarchMadnessResults extends Vue {
    public authenticated = false;

    private data() {
        authService.authenticatedSubject.subscribe((authenticated) => {
            this.authenticated = authenticated;
        });
        return {
            authService,
            authenticated: this.authenticated
        };
    }
}
</script>
