<template>
    <div class="results" v-if="results">
        <h1>Results</h1>

        <table class="table" v-if="results.picks && results.picks.length">
            <tbody>
                <tr v-for="(picks, index) of results.picks" v-bind:key="index">
                    <th scope="row" class="thead-dark">{{ picks.user.name}}</th>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop} from 'vue-property-decorator';
import { Results } from '@/models/march-madness';
import axios from 'axios';
import * as log from 'loglevel';

@Component({
    name: 'march-madness-results-component',
})
export default class MarchMadnessResultsComponent extends Vue {
    private results: Results | undefined;


    private data() {
        return {
            results: this.results
        };
    }

    private created() {
        this.start();
    }

    private async start() {
        try {
            const response = await axios.get('/api/march-madness/results');
            this.results = response.data;
        } catch (error) {
            log.warn(`Error getting March Madness results: ${error}`);
        }
    }
}
</script>

<style lang="scss" scoped>
img {
    height: $input-height;
}
</style>

