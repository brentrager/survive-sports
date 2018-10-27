<template>
    <div class="team-card card mt-4">
        <h5 class="card-header">{{ header }}</h5>
        <div class="card-body" v-if="team">
            <table class="table table-sm">
                <tbody>
                    <tr v-for="player in team" v-if="player" :key="player.id">
                        <th scope="row">{{ player.position }}</th>
                        <td>{{ player.name }}</td>
                        <td>{{ player.team }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop} from 'vue-property-decorator';
import { Player } from '../models/league';

@Component({
    name: 'team-card',
})
export default class League extends Vue {
    @Prop(String) public header: string | undefined;
    @Prop(Array) public team: Array<Player> | undefined;
}
</script>
