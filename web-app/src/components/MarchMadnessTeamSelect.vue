<template>
    <select class="march-madness-team-select"></select>
</template>

<script lang="ts">
// tslint:disable:max-line-length no-reference
/// <reference path="../select2.d.ts" />

import { Component, Vue, Prop, Watch} from 'vue-property-decorator';
import { Choice } from '../models/march-madness';
import { BehaviorSubject, combineLatest } from 'rxjs';
import $ from 'jquery';
import 'select2';
import 'select2/dist/css/select2.css';
import * as log from 'loglevel';
import * as _ from 'lodash';
import moment from 'moment-timezone';

interface Option {
    text: string;
    id: string;
}

@Component({
    name: 'march-madness-team-select',
})
export default class MarchMadnessTeamSelect extends Vue {
    @Prop(String) public selected!: string;
    @Prop(Object) public choicesSubject!: BehaviorSubject<Array<Choice>>;
    @Prop(Object) public currentlySelectedSubject!: BehaviorSubject<Set<string>>;
    @Prop(Array) public formResults!: Array<string>;
    @Prop(Number) public formResultsIndex!: number;
    private options: Array<Option> = [];
    private mySelected!: string;

    public destroyed() {
        $(this.$el).off().select2('destroy');
    }

    public data() {
        this.mySelected = this.selected;


        return {
            options: this.options,
        };
    }

    private mounted() {
        if (this.currentlySelectedSubject && this.choicesSubject) {
            combineLatest(this.currentlySelectedSubject, this.choicesSubject).subscribe((value) => {
                this.computeOptions(value[0], value[1]);
            });
        }
    }

    private buildOptionTemplate(option: any) {
        const choice = (option as any).choice as Choice;
        if (!choice) {
            return option.text;
        }

        return $(`
            <div class="row">
                <div class="col-sm-1"><strong style="color:rgba(239, 100, 97, 1)">${choice.seed}</strong></div>
                <div class="col-sm-7 mr-2">${choice.team}</div>
                <div class="col-sm-2 mr-2"><small style="color:rgba(8, 178, 227, 1)">${choice.region}</small></div>
            </div>
        `);
    }

    private computeOptions(currentlySelected: Set<string> | undefined,  choices: Array<Choice> | undefined) {
        if (choices && currentlySelected) {

            const availableChoices = choices.filter((choice) => {
                return choice.team === this.mySelected || !currentlySelected.has(choice.team);
            });

            if (availableChoices) {
                this.options = availableChoices.map((choice) => {
                    const displayText = `${choice.seed}. ${choice.team} - ${choice.region}`;
                    return {
                        text: displayText,
                        id: choice.team,
                        choice
                    };
                });

                const vm = this;
                this.formResults[this.formResultsIndex] = this.mySelected;
                $(this.$el).empty()
                    .select2({
                        data: this.options,
                        theme: 'bootstrap',
                        placeholder: {
                            id: '',
                            text: `Select a Team`
                        },
                        templateResult: (option) => {
                            return this.buildOptionTemplate(option);
                        },
                        templateSelection: (option) => {
                            return this.buildOptionTemplate(option);
                        },
                    })
                    .val(this.formResults[this.formResultsIndex])
                    .trigger('change')
                    .on('change', () => {
                        setTimeout(() => {
                            const newVal = $(vm.$el).val() as string || '';
                            if (newVal !== vm.selected) {
                                vm.mySelected = newVal;
                                vm.formResults[vm.formResultsIndex] = newVal;
                                vm.$emit('selected');
                                vm.selected = newVal;
                            }
                        });
                    });
            }
        }
    }
}
</script>

<style lang="scss" scoped>
select {
    width: 100%;
    min-width: 50%;
}

.player-team {
    color: $banner-text-color;
}
</style>

