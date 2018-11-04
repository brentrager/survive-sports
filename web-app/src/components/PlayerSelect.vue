<template>
    <select class="player-select"></select>
</template>

<script lang="ts">
// tslint:disable:max-line-length

import { Component, Vue, Prop, Watch} from 'vue-property-decorator';
import { Player, PlayersByPosition } from '../models/league';
import { UserTeam } from '../models/league';
import { BehaviorSubject, combineLatest } from 'rxjs';
import $ from 'jquery';
import 'select2';
import 'select2/dist/css/select2.css';
import { constants } from 'http2';
import * as log from 'loglevel';
import * as _ from 'lodash';
import moment from 'moment-timezone';

interface Option {
    text: string;
    id: string;
}

@Component({
    name: 'player-select',
})
export default class PlayerSelect extends Vue {
    @Prop(String) public position!: string;
    @Prop(String) public selected!: string;
    @Prop(Object) public playersByPositionSubject!: BehaviorSubject<PlayersByPosition>;
    @Prop(Object) public currentlySelectedSubject!: BehaviorSubject<Set<string>>;
    @Prop(Array) public formResults!: Array<string>;
    @Prop(Number) public formResultsIndex!: number;
    private options: Array<Option> = [];

    public mounted() {
        const vm = this;
        this.formResults[this.formResultsIndex] = _.clone(this.selected);
        $(this.$el)
            // init select2
            .select2({ data: this.options, theme: 'bootstrap' })
            .val(this.formResults[this.formResultsIndex])
            .trigger('change')
            .on('change', () => {
                const newVal = $(vm.$el).val() as string;
                if (newVal !== vm.selected) {
                    vm.selected = newVal;
                    vm.formResults[vm.formResultsIndex] = $(vm.$el).val() as string;
                    vm.$emit('selected');
                }
            });
    }

    @Watch('options')
    public onOptionshanged(val: Array<Option>, oldVal: Array<Option>) {
        const vm = this;
        $(this.$el).empty()
            .select2({ data: val, theme: 'bootstrap' })
            .val(this.formResults[this.formResultsIndex])
            .trigger('change')
            .on('change', () => {
                const newVal = $(vm.$el).val() as string;
                if (newVal !== vm.selected) {
                    vm.selected = newVal;
                    vm.formResults[vm.formResultsIndex] = $(vm.$el).val() as string;
                    vm.$emit('selected');
                }
            });
    }

    public destroyed() {
        $(this.$el).off().select2('destroy');
    }

    public data() {
        if (this.currentlySelectedSubject && this.playersByPositionSubject) {
            combineLatest(this.currentlySelectedSubject, this.playersByPositionSubject).subscribe((value) => {
                this.computeOptions(value[0], value[1]);
            });
        }
        return {
            options: this.options,
        };
    }

    private computeOptions(currentlySelected: Set<string> | undefined,  playersByPosition: PlayersByPosition | undefined) {
        if (this.position && playersByPosition && currentlySelected) {
            const rankings = playersByPosition[this.position];

            const availableRankings = rankings.filter((player) => {
                return player.id === this.selected || !currentlySelected.has(player.id);
            });

            if (availableRankings) {
                this.options = availableRankings.map((player) => {
                    let displayText = `${player.name} (${player.team})`;
                    if (player.ranking && this.position in player.ranking) {
                        const ranking = player.ranking[this.position];
                        displayText = `${ranking.ranking}. ${displayText}`;
                        displayText += ` ${ranking.opp} on ${moment(ranking.gameTime).tz('America/New_York').format('MM/DD @ hh:mm A')}`
                    }
                    return {
                        text: displayText,
                        id: player.id
                    };
                });

                this.options.unshift({
                    text: 'Select',
                    id: ''
                });
            }
        }
    }
}
</script>

<style lang="scss" scoped>
select {
    width: 100%;
}
</style>

