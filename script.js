async function getMatch() {
    const response = await axios({
        method: 'get',
        url: 'https://o61ytf7t2a.execute-api.us-east-1.amazonaws.com/default/test',
    });
    // Stats I want: summonerName, teamPosition, 
    let players = response.data.info.participants;
    players.forEach(player => {
        let team = (player.teamId == 100) ? "blue" : "red";
        let row = $(document.getElementById(team + player.teamPosition));
        console.log(player, team);
        row.append(`<p class="title"> ${player.summonerName} </p>`);
        row.append(`<p class="subtitle"> ${player.championName} </p>`);
    });
}
window.onload = function() {
    getMatch();
}