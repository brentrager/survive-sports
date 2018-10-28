<template>
    <div class="team-card card mt-4">
        <div class="card-header">
            <h4 class="d-inline-block align-middle">
                <img v-if="picture" v-bind:src="picture" class="rounded float-left mr-2" />
                {{ header }}
            </h4>
        </div>
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
    @Prop(String) public picture: string | undefined;
    @Prop(Array) public team: Array<Player> | undefined;
}
</script>

<style lang="scss" scoped>
img {
    height: $input-height;
}
</style>

