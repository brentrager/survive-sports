<template>
    <select class="player-select"></select>
</template>

<script lang="ts">
// tslint:disable:max-line-length no-reference
/// <reference path="../select2.d.ts" />

import { Component, Vue, Prop, Watch} from 'vue-property-decorator';
import { Player, PlayersByPosition } from '../models/league';
import { UserTeam } from '../models/league';
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
    private mySelected!: string;

    public destroyed() {
        $(this.$el).off().select2('destroy');
    }

    public data() {
        this.mySelected = this.selected;

        if (this.currentlySelectedSubject && this.playersByPositionSubject) {
            combineLatest(this.currentlySelectedSubject, this.playersByPositionSubject).subscribe((value) => {
                this.computeOptions(value[0], value[1]);
            });
        }
        return {
            options: this.options,
        };
    }

    private buildOptionTemplate(option: any) {
        const player = (option as any).player as Player;
        if (!player) {
            return option.text;
        }
        const ranking = player.ranking && this.position in player.ranking && player.ranking[this.position];
        const rankingNumber = ranking ? ranking.ranking : '';
        let gameOpp = '';
        let gameTime = '';
        let injuryStatus = '';
        if (player.matchup) {
            gameOpp = `${player.matchup.opponent.isHome ? '@' : ''}${player.matchup.opponent.id}`;
            let gameOppColor = 'rgba(72, 77, 109, 1)';

            if (this.position === 'QB' || this.position === 'TE' || this.position === 'WR' || this.position === 'DST') {
                if (player.matchup.opponent.passDefenseRank <= 10) {
                    gameOppColor = '#dc3545';
                } else if (player.matchup.opponent.passDefenseRank > 20) {
                    gameOppColor = '#28a745';
                }
            } else if (this.position === 'RB') {
                if (player.matchup.opponent.rushDefenseRank <= 10) {
                    gameOppColor = '#dc3545';
                } else if (player.matchup.opponent.rushDefenseRank > 20) {
                    gameOppColor = '#28a745';
                }
            }

            gameOpp = `<strong style="color:${gameOppColor}">${gameOpp}</strong>`;
            gameTime = `${moment(player.matchup.team.kickoff).tz('America/New_York').format('ddd h:mm A')}`;
        }
        if (player.injury) {
            injuryStatus = ` <small style="color:rgba(255, 0, 0, 1)">${player.injury.status}</small>`;
        }
        return $(`
            <div class="row">
                <div class="col-sm-1"><strong style="color:rgba(239, 100, 97, 1)">${rankingNumber}</strong></div>
                <div class="col-sm-5 mr-2">${player.name} <small style="color:rgba(8, 178, 227, 1)">${player.team}</small>${injuryStatus}</div>
                <div class="col-sm-2 mr-2">${gameOpp}</div>
                <div class="col-sm-3"><small>${gameTime}</small></div>
            </div>
        `);
    }

    private computeOptions(currentlySelected: Set<string> | undefined,  playersByPosition: PlayersByPosition | undefined) {
        if (this.position && playersByPosition && currentlySelected) {
            const rankings = playersByPosition[this.position];

            const availableRankings = rankings.filter((player) => {
                return player.id === this.mySelected || !currentlySelected.has(player.id);
            });

            if (availableRankings) {
                this.options = availableRankings.map((player) => {
                    let displayText = `${player.name} (${player.team})`;
                    if (player.ranking && this.position in player.ranking) {
                        const ranking = player.ranking[this.position];
                        displayText = `${ranking.ranking}. ${displayText}`;
                        displayText += ` ${player.matchup && player.matchup.opponent.id} on ${player.matchup && moment(player.matchup.team.kickoff).tz('America/New_York').format('MM/DD [at] hh:mm A')}`;
                    }
                    return {
                        text: displayText,
                        id: player.id,
                        player
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
                            text: `Select a ${this.position}`
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
                            const newVal = $(vm.$el).val() as string;
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

