export interface UserTeam {
    week: number;
    QB: string;
    RB: Array<string>;
    WR: Array<string>;
    TE: string;
    K: string;
    DST: string;
}
export interface UserTeams {
    userId: string;
    teams: Array<UserTeam>;
}
