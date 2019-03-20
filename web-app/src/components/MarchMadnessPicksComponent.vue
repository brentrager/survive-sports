<template>
    <div class="picks-entry mt-2">
        {{ picks.user.name }} <img v-if="picks.user.picture" v-bind:src="picks.user.picture" />
        <button v-if="!hasGameStarted" type="button" class="btn btn-danger" @click="removeEntry(picksIndex)">Remove Entry</button>
        <p v-if="picks.availableChoices">{{ picks.availableChoices.length }}</p>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop} from 'vue-property-decorator';
import { Picks, ChoiceList } from '@/models/march-madness';
import axios from 'axios';
import * as log from 'loglevel';
import marchMadnessRoundService from '../services/MarchMadnessRoundService';

@Component({
    name: 'march-madness-picks-component',
})
export default class MarchMadnessPicksComponent extends Vue {
    @Prop(Object) public picks: Picks | undefined;
    @Prop(Number) public picksIndex: number | undefined;
    @Prop(Function) public removeEntry: (() => Promise<void>) | undefined;

    private data() {
        return {
            hasGameStarted: marchMadnessRoundService.hasGameStarted(),
        };
    }
}
</script>

<style lang="scss" scoped>
img {
    height: $input-height;
}
</style>

