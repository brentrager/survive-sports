<template>
    <div class="picks-entry mt-2 card">
        <div class="card-body">
            {{ picks.user.name }} <img v-if="picks.user.picture" v-bind:src="picks.user.picture" class="mr-2"/>
            <button v-if="!hasGameStarted" type="button" class="btn btn-primary mr-2" @click="computeAndSaveEntry()" :disabled="!isDirty">Save Entry</button>
            <button v-if="!hasGameStarted" type="button" class="btn btn-danger" @click="removeEntry(picksIndex)">Remove Entry</button>
            <div class="row">
                <div class="mt-2 col-sm-4" v-for="(choices, index1) of picks.choices" :key="index1">
                    <div class="card">
                        <h5 class="card-header">Round of {{choices.roundOf}}</h5>
                        <div class="card-body">
                            <div v-if="isAvailableRound(choices.roundOf)">
                                <div v-for="(choice, index) of choices.choices" :key="index" class="mt-2">
                                    <march-madness-team-select
                                        :selected="choice.team"
                                        :choicesSubject="choicesSubject"
                                        :currentlySelectedSubject="currentlySelectedSubject"
                                        :formResults="formResults"
                                        :formResultsIndex="index"
                                        v-on:selected="newSelection()"></march-madness-team-select>
                                </div>
                            </div>
                            <div v-else>
                                <div v-for="(choice, index) of choices.choices" :key="index" class="mt-2">
                                    <div class="row">
                                        <div class="col-sm-1"><strong style="color:rgba(239, 100, 97, 1)">${choice.seed}</strong></div>
                                        <div class="col-sm-7 mr-2">${choice.team}</div>
                                        <div class="col-sm-2 mr-2"><small style="color:rgba(8, 178, 227, 1)">${choice.region}</small></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
// tslint:disable:max-line-length

import { Component, Vue, Prop} from 'vue-property-decorator';
import { Picks, ChoiceList, Choice, Choices } from '@/models/march-madness';
import axios from 'axios';
import * as log from 'loglevel';
import marchMadnessRoundService from '../services/MarchMadnessRoundService';
import MarchMadnessTeamSelect from './MarchMadnessTeamSelect.vue';
import { BehaviorSubject } from 'rxjs';
import authService from '../services/AuthService';
import * as _ from 'lodash';

const ROUND_SELECTIONS: any = {
    64: 4,
    32: 2,
    16: 1,
    8: 1,
    4: 1,
    2: 1
};

const ROUND_INDEXES: any = {
    64: 0,
    32: 1,
    16: 2,
    8: 3,
    4: 4,
    2: 5
};

@Component({
    name: 'march-madness-picks-component',
    components: {
        MarchMadnessTeamSelect
    }
})
export default class MarchMadnessPicksComponent extends Vue {
    @Prop(Object) public picks!: Picks;
    @Prop(Number) public picksIndex!: number;
    @Prop(Function) public removeEntry!: (() => Promise<void>);
    @Prop(Function) public saveEntry!: ((pickIndex: number, choices: Choices) => Promise<void>);

    private choicesSubject!: BehaviorSubject<Array<Choice> | undefined>;
    private currentlySelectedSubject!: BehaviorSubject<Set<string>>;
    private formResults!: Array<string>;
    private isDirty!: boolean;
    private currentChoices!: Array<Choice>;

    private data() {
        this.isDirty = false;
        const currentRound = marchMadnessRoundService.availableRound();
        const roundIndex = ROUND_INDEXES[currentRound];
        const roundSelectionsCount = ROUND_SELECTIONS[currentRound];
        this.currentlySelectedSubject = new BehaviorSubject(new Set());
        this.picks.availableChoices = this.picks.availableChoices && this.picks.availableChoices.sort((a, b) => {
            return a.seed - b.seed;
        });
        this.choicesSubject = new BehaviorSubject<Array<Choice> | undefined>(this.picks.availableChoices);
        this.formResults = [];
        for (let i = 0; i < roundSelectionsCount; i++) {
            this.formResults.push('');
        }
        if (this.picks.choices.length <= roundIndex) {
            this.picks.choices.push({
                roundOf: currentRound,
                choices: []
            });

            for (let i = 0; i < roundSelectionsCount; i++) {
                this.picks.choices[roundIndex].choices.push({
                    region: '',
                    team: '',
                    seed: 0,
                    eliminated: false
                });
            }
        }

        return {
            isDirty: this.isDirty,
            hasGameStarted: marchMadnessRoundService.hasGameStarted(),
            roundSelectionsCount: ROUND_SELECTIONS[currentRound],
            currentRound,
            choicesSubject: this.choicesSubject,
            currentlySelectedSubject: this.currentlySelectedSubject
        };
    }

    private isAvailableRound(round: number) {
        return marchMadnessRoundService.isAvailableRound(round);
    }

    private newSelection() {
        const currentRound = marchMadnessRoundService.availableRound();
        const roundIndex = ROUND_INDEXES[currentRound];
        const formResultsSet = new Set(this.formResults);
        this.isDirty = (!formResultsSet.has('') && this.picks.choices.length > roundIndex && !_.isEqual(this.formResults, this.picks.choices[roundIndex].choices.map((choice) => choice.team))) as boolean;

        if (!_.isEqual(formResultsSet, this.currentlySelectedSubject.getValue())) {
            this.currentlySelectedSubject.next(new Set(this.formResults));
        }
    }

    private async computeAndSaveEntry() {
        const selections = this.currentlySelectedSubject.getValue();

        const choices: Choices = {
            roundOf: marchMadnessRoundService.availableRound(),
            choices: []
        };

        const choicesByTeam = this.picks.availableChoices!.reduce((result, choice) => {
            result.set(choice.team, choice);
            return result;
        }, new Map());

        choices.choices = Array.from(selections).map((x) => choicesByTeam.get(x));

        this.saveEntry(this.picksIndex, choices);
    }
}
</script>

<style lang="scss" scoped>
img {
    height: $input-height;
}
</style>

