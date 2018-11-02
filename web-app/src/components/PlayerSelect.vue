<template>
    <vue-select :options="options" :model.sync="result">
    </vue-select>
</template>

<script lang="ts">
import { Component, Vue, Prop} from 'vue-property-decorator';
import { Player } from '../models/league';
import { UserTeam } from '../models/league';
import { BehaviorSubject } from 'rxjs';
const VueSelect = require('vue-select2');

interface Option {
    text: string;
    value: string;
}

@Component({
    name: 'player-select',
    components: {
        VueSelect
    }
})
export default class PlayerSelect extends Vue {
    @Prop(Array) public rankings: Array<Player> | undefined;
    @Prop(Object) public currentlySelected: BehaviorSubject<Set<string>> | undefined;
    private availableRankings: Array<Player> | undefined;
    private options: Array<Option> = [];
    private result: any;

    public data() {
        if (this.currentlySelected) {
            this.currentlySelected.subscribe((selected) => {
                this.availableRankings = this.rankings && this.rankings.filter((player) => {
                    return !selected.has(player.id);
                });

                if (this.availableRankings) {
                    this.options = this.availableRankings.map((player) => {
                        return {
                            text: player.name as string,
                            value: player.id
                        }
                    });
                }
            });
        }
        return {
            availableRankings: this.availableRankings,
            result: this.result,
        }
    }
}
</script>

<style lang="scss" scoped>
</style>

